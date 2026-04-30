import process from 'node:process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')

const CONFIG_PATH =
  process.argv.find((arg) => arg.startsWith('--config='))?.split('=')[1] ||
  'scripts/config/political-market-sources.json'

const OUTPUT_PATH =
  process.argv.find((arg) => arg.startsWith('--output='))?.split('=')[1] ||
  'src/data/politicalMarkets.generated.json'

const DRY_RUN = process.argv.includes('--dry-run')
const WRITE_JSON = process.argv.includes('--write-json')

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function parseJsonMaybe(value, fallback = []) {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function toNumber(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function roundPct(probability) {
  if (!Number.isFinite(probability)) return null
  return Math.round(probability * 1000) / 10
}

function probabilityToDecimal(probability) {
  if (!Number.isFinite(probability) || probability <= 0) return null
  return Math.round((1 / probability) * 100) / 100
}

function daysSince(dateValue, now = new Date()) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return null
  return Math.floor((now.getTime() - parsed.getTime()) / 86400000)
}

function marketUrl(event, market) {
  if (event?.slug) return `https://polymarket.com/event/${event.slug}`
  if (market?.slug) return `https://polymarket.com/market/${market.slug}`
  return 'https://polymarket.com'
}

async function readJson(relativePath) {
  const text = await readFile(resolve(REPO_ROOT, relativePath), 'utf8')
  return JSON.parse(text)
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Politiscope/1.0 (+https://politiscope.co.uk)',
    },
  }).catch((error) => {
    throw new Error(error?.message || String(error))
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 250)}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from ${url}`)
  }
}

function normalizeMarketRows({ sourceConfig, event, market, checkedAt, freshnessThresholdDays }) {
  const outcomes = parseJsonMaybe(market?.outcomes, [])
  const prices = parseJsonMaybe(market?.outcomePrices, []).map(toNumber)
  const updatedAt = market?.updatedAt || event?.updatedAt || checkedAt
  const ageDays = daysSince(updatedAt, new Date(checkedAt))
  const freshnessStatus = ageDays == null || ageDays > freshnessThresholdDays ? 'stale' : 'fresh'
  const url = marketUrl(event, market)

  return outcomes
    .map((outcome, index) => {
      const probability = prices[index]
      const runner = cleanText(outcome)
      if (!runner || !Number.isFinite(probability)) return null

      return {
        marketId: `polymarket-${market.id || slugify(market.slug)}-${slugify(runner)}`,
        marketName: cleanText(market.question || event.title || event.slug),
        electionType: sourceConfig.electionType || 'general-election',
        runner,
        party: '',
        oddsFractional: '',
        oddsDecimal: probabilityToDecimal(probability),
        impliedProbability: roundPct(probability),
        source: sourceConfig.source || 'Polymarket',
        sourceUrl: url,
        checkedAt,
        freshnessStatus,
        marketType: sourceConfig.marketType || 'prediction-market',
        notes: sourceConfig.notes || 'Public market data. Informational signal only, not a forecast or betting advice.',
      }
    })
    .filter(Boolean)
}

async function loadRows(config) {
  const checkedAt = new Date().toISOString()
  const rows = []
  const failedSources = []
  const freshnessThresholdDays = Number(config.freshnessThresholdDays || 3)

  for (const sourceConfig of Array.isArray(config.sources) ? config.sources : []) {
    if (!sourceConfig.enabled) continue

    if (sourceConfig.sourceType !== 'polymarket-gamma-event') {
      failedSources.push({ id: sourceConfig.id || '', reason: `Unsupported sourceType ${sourceConfig.sourceType || ''}` })
      continue
    }

    try {
      const event = await fetchJson(sourceConfig.sourceUrl)
      const include = new Set((sourceConfig.includeMarketSlugs || []).map(String))
      const markets = (Array.isArray(event?.markets) ? event.markets : []).filter((market) => {
        if (market?.active === false || market?.closed || market?.archived) return false
        if (!include.size) return true
        return include.has(String(market.slug || ''))
      })

      if (!markets.length) {
        failedSources.push({ id: sourceConfig.id || sourceConfig.eventSlug || '', reason: 'No active configured markets found' })
        continue
      }

      for (const market of markets) {
        rows.push(...normalizeMarketRows({ sourceConfig, event, market, checkedAt, freshnessThresholdDays }))
      }
    } catch (error) {
      failedSources.push({
        id: sourceConfig.id || sourceConfig.eventSlug || '',
        reason: error?.message || String(error),
      })
    }
  }

  return {
    generatedAt: checkedAt,
    source: 'Polymarket Gamma public API',
    rows,
    failedSources,
  }
}

export async function ingestPoliticalMarkets() {
  const config = await readJson(CONFIG_PATH)
  const result = await loadRows(config)

  const summary = {
    ok: result.failedSources.length === 0,
    dryRun: DRY_RUN,
    writeJson: WRITE_JSON,
    outputPath: OUTPUT_PATH,
    generatedAt: result.generatedAt,
    rowsImported: result.rows.length,
    failedSources: result.failedSources,
    rows: result.rows,
  }

  if (WRITE_JSON) {
    const output = resolve(REPO_ROOT, OUTPUT_PATH)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  }

  console.log(JSON.stringify(summary, null, 2))
  if (result.failedSources.length) process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestPoliticalMarkets().catch((error) => {
    fail('Unexpected political markets import failure.', error?.stack || error?.message || String(error))
  })
}
