#!/usr/bin/env node
import process from 'node:process'
import * as XLSX from 'xlsx'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

const CONFIG_PATH =
  process.argv.find((arg) => arg.startsWith('--config='))?.split('=')[1] ||
  'scripts/config/migration-sources.json'

const OUTPUT_PATH =
  process.argv.find((arg) => arg.startsWith('--output='))?.split('=')[1] ||
  'src/data/migration.generated.json'

const DRY_RUN = process.argv.includes('--dry-run')
const WRITE_JSON = process.argv.includes('--write-json')
const NO_POST = process.argv.includes('--no-post')

const MONTHS = {
  jan: 'January',
  feb: 'February',
  mar: 'March',
  apr: 'April',
  may: 'May',
  jun: 'June',
  jul: 'July',
  aug: 'August',
  sep: 'September',
  oct: 'October',
  nov: 'November',
  dec: 'December',
}

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function toNumber(value) {
  if (value == null || value === '') return null
  const text = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '')
  if (!text || text === '-' || text === '.') return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

function periodKey(value) {
  return cleanText(value)
    .replace(/\b[PR]\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function periodYear(value) {
  const match = periodKey(value).match(/\b(\d{2}|\d{4})\b/)
  if (!match) return null
  const raw = Number(match[1])
  return raw < 100 ? 2000 + raw : raw
}

function periodMonthName(value) {
  const match = periodKey(value).match(/\b([A-Za-z]{3})\b/)
  if (!match) return null
  return MONTHS[match[1].toLowerCase()] || null
}

function periodLabel(value) {
  const month = periodMonthName(value)
  const year = periodYear(value)
  if (!month || !year) return cleanText(value)
  return `Year ending ${month} ${year}`
}

function slugify(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function readJson(relativePath) {
  const text = await readFile(resolve(REPO_ROOT, relativePath), 'utf8')
  return JSON.parse(text)
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Politiscope/1.0 (+https://politiscope.co.uk)',
    },
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 240)}`)
  return text
}

async function fetchWorkbook(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,*/*',
      'User-Agent': 'Politiscope/1.0 (+https://politiscope.co.uk)',
    },
  })
  const buffer = Buffer.from(await response.arrayBuffer())
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${buffer.toString('utf8', 0, 240)}`)
  return XLSX.read(buffer, { type: 'buffer' })
}

function sheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
}

function extractDownloadLinks(html, baseUrl, matcher) {
  const links = []
  for (const match of html.matchAll(/href="([^"]+)"/gi)) {
    const href = new URL(match[1], baseUrl).href
    if (matcher(href, html.slice(Math.max(0, match.index - 300), match.index + 500))) {
      links.push(href)
    }
  }
  return [...new Set(links)]
}

function parseOnsMainTable(workbook) {
  const rows = sheetRows(workbook, '1')
  const records = rows
    .map((row) => ({
      flow: cleanText(row[0]),
      period: cleanText(row[1]),
      all: toNumber(row[2]),
      british: toNumber(row[3]),
      eu: toNumber(row[4]),
      nonEu: toNumber(row[5]),
    }))
    .filter((row) => row.flow && row.period && row.all != null)

  const periods = new Map()
  for (const row of records) {
    const key = periodKey(row.period)
    if (!periods.has(key)) periods.set(key, { rawPeriod: row.period, period: periodLabel(row.period), year: periodYear(row.period) })
    const bucket = periods.get(key)
    if (/^immigration$/i.test(row.flow)) bucket.immigration = row.all
    if (/^emigration$/i.test(row.flow)) bucket.emigration = row.all
    if (/^net migration$/i.test(row.flow)) {
      bucket.net = row.all
      bucket.britishNet = row.british
      bucket.euNet = row.eu
      bucket.nonEuNet = row.nonEu
    }
    if (/^immigration$/i.test(row.flow)) {
      bucket.britishInflow = row.british
      bucket.euInflow = row.eu
      bucket.nonEuInflow = row.nonEu
    }
    if (/^emigration$/i.test(row.flow)) {
      bucket.britishOutflow = row.british
      bucket.euOutflow = row.eu
      bucket.nonEuOutflow = row.nonEu
    }
  }

  const trend = [...periods.values()]
    .filter((row) => row.year && /Jun/i.test(row.rawPeriod) && row.net != null)
    .sort((a, b) => a.year - b.year)
  const allNetPeriods = [...periods.values()]
    .filter((row) => row.year && row.net != null)

  const current = trend.at(-1)
  const previous = trend.at(-2)
  const peak = allNetPeriods.reduce((best, row) => (row.net > (best?.net ?? -Infinity) ? row : best), null)
  if (!current || !previous || !peak) throw new Error('ONS main table did not contain current, previous and peak June net migration rows.')

  return {
    current,
    previous,
    peak,
    trend: trend.map((row) => ({
      period: row.period,
      year: String(row.year),
      immigration: row.immigration,
      emigration: row.emigration,
      net: row.net,
      sourceId: 'ons-ltim',
    })),
  }
}

function dominantReason(row) {
  const options = [
    ['work/study', (row.work || 0) + (row.study || 0)],
    ['work', row.work || 0],
    ['study', row.study || 0],
    ['other', row.other || 0],
  ].sort((a, b) => b[1] - a[1])
  return options[0]?.[1] > 0 ? options[0][0] : 'ONS top non-EU+ nationality'
}

function parseOnsTopNationalities(workbook) {
  const immigrationRows = sheetRows(workbook, '3e')
  const emigrationRows = sheetRows(workbook, '3f')
  const currentRe = /YE Jun 25/i

  const byName = new Map()
  for (const row of immigrationRows) {
    if (!currentRe.test(String(row[2] || '')) || !/^immigration$/i.test(cleanText(row[1]))) continue
    const name = cleanText(row[0])
    if (!name) continue
    byName.set(name, {
      name,
      inflow: toNumber(row[3]),
      work: toNumber(row[4]),
      study: toNumber(row[5]),
      other: toNumber(row[6]),
      sourceId: 'ons-ltim',
    })
  }

  for (const row of emigrationRows) {
    if (!currentRe.test(String(row[2] || '')) || !/^emigration$/i.test(cleanText(row[1]))) continue
    const name = cleanText(row[0])
    if (!name || !byName.has(name)) continue
    byName.get(name).outflow = toNumber(row[3])
  }

  return [...byName.values()]
    .map((row) => ({
      name: row.name,
      inflow: row.inflow,
      outflow: row.outflow ?? null,
      net: row.inflow != null && row.outflow != null ? row.inflow - row.outflow : null,
      type: `${dominantReason(row)} (ONS top non-EU+ nationality)`,
      sourceId: row.sourceId,
    }))
    .filter((row) => row.inflow != null)
    .sort((a, b) => (b.inflow || 0) - (a.inflow || 0))
}

function parseOnsNationalityGroups(main) {
  const current = main.current
  return [
    {
      name: 'British',
      inflow: current.britishInflow,
      outflow: current.britishOutflow,
      net: current.britishNet,
      type: 'ONS nationality group',
      sourceId: 'ons-ltim',
    },
    {
      name: 'EU nationals',
      inflow: current.euInflow,
      outflow: current.euOutflow,
      net: current.euNet,
      type: 'ONS nationality group',
      sourceId: 'ons-ltim',
    },
    {
      name: 'Non-EU+ nationals',
      inflow: current.nonEuInflow,
      outflow: current.nonEuOutflow,
      net: current.nonEuNet,
      type: 'ONS nationality group',
      sourceId: 'ons-ltim',
    },
  ].filter((row) => row.inflow != null || row.outflow != null || row.net != null)
}

function parseOnsReasonRows(workbook) {
  const currentRe = /YE Jun 25/i
  const totals = {
    Work: 0,
    Study: 0,
    Family: 0,
    Humanitarian: 0,
    Asylum: 0,
    Other: 0,
  }

  for (const sheetName of ['4a', '4b']) {
    for (const row of sheetRows(workbook, sheetName)) {
      if (!currentRe.test(String(row[1] || '')) || !/^immigration$/i.test(cleanText(row[0]))) continue
      totals.Work += toNumber(row[3]) || 0
      totals.Study += toNumber(row[6]) || 0
      totals.Family += toNumber(row[9]) || 0
      totals.Humanitarian += toNumber(row[10]) || 0
      totals.Asylum += toNumber(row[14]) || 0
      totals.Other += toNumber(row[15]) || 0
    }
  }

  return Object.entries(totals)
    .filter(([, n]) => n > 0)
    .map(([type, n]) => ({
      type,
      n,
      period: 'Year ending June 2025',
      sourceId: 'ons-ltim',
    }))
}

function parseHomeOfficeSmallBoats(workbook) {
  const rows = sheetRows(workbook, 'IER_01')
  const total2025 = rows.find((row) => /^2025 Total$/i.test(cleanText(row[0])))
  const total2024 = rows.find((row) => /^2024 Total$/i.test(cleanText(row[0])))
  if (!total2025) throw new Error('Home Office illegal-entry summary table did not contain 2025 Total.')

  const nationalityRows = sheetRows(workbook, 'IER_02b')
  const header = nationalityRows.find((row) => cleanText(row[0]) === 'Nationality')
  const latestYearIndex = header ? header.findIndex((cell) => cleanText(cell) === '2025') : -1
  const topNationalities = latestYearIndex >= 0
    ? nationalityRows
        .filter((row) => {
          const name = cleanText(row[0])
          return name && !/^Total$/i.test(name) && !/not currently recorded|all other/i.test(name) && toNumber(row[latestYearIndex]) != null
        })
        .map((row) => ({ name: cleanText(row[0]), n: toNumber(row[latestYearIndex]) }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 5)
        .map((row) => row.name)
    : []

  return {
    period: 'Year ending December 2025',
    total2025: toNumber(total2025[1]),
    total2024: total2024 ? toNumber(total2024[1]) : null,
    topNationalities,
    sourceId: 'home-office-illegal-entry-routes',
  }
}

async function buildMigrationPayload(config) {
  const warnings = []
  const sources = config.sources || {}
  const onsDatasetHtml = await fetchText(sources.onsDataset.url)
  const onsLinks = extractDownloadLinks(
    onsDatasetHtml,
    sources.onsDataset.url,
    (href) => /\.xlsx(?:$|[?#])/i.test(href) && /yearendingjune2025|ltimnov25/i.test(href)
  )
  if (!onsLinks.length) throw new Error('Could not find the current ONS XLSX download link.')

  const onsWorkbook = await fetchWorkbook(onsLinks[0])
  const main = parseOnsMainTable(onsWorkbook)
  const byNationality = [...parseOnsTopNationalities(onsWorkbook), ...parseOnsNationalityGroups(main)]
  const byVisa = parseOnsReasonRows(onsWorkbook)

  let smallBoats = null
  let homeOfficeDownloadUrl = null
  try {
    const homeOfficeHtml = await fetchText(sources.homeOfficeDataTables.url)
    const homeOfficeLinks = extractDownloadLinks(
      homeOfficeHtml,
      sources.homeOfficeDataTables.url,
      (href, nearby) => /illegal-entry-routes-to-the-uk-summary/i.test(href) || /Illegal entry routes to the UK summary tables/i.test(nearby)
    )
    homeOfficeDownloadUrl = homeOfficeLinks[0] || null
    if (!homeOfficeDownloadUrl) throw new Error('Could not find Home Office illegal-entry summary ODS link.')
    const homeOfficeWorkbook = await fetchWorkbook(homeOfficeDownloadUrl)
    smallBoats = parseHomeOfficeSmallBoats(homeOfficeWorkbook)
  } catch (error) {
    warnings.push(`Home Office small-boats enrichment skipped: ${error?.message || String(error)}`)
  }

  const payload = {
    fetchYear: `${main.current.period} · ONS estimate`,
    netTotal: main.current.net,
    netPrev: main.previous.net,
    netPrev2: main.peak.net,
    byNationality,
    byVisa,
    trend: main.trend,
    smallBoats,
    meta: {
      reviewedAt: cleanText(config.reviewedAt) || new Date().toISOString().slice(0, 10),
      sourceType: 'Official ONS / Home Office statistics',
      label: 'latest official estimate',
      provenanceLabel: 'maintained dataset',
      onsSourceUrl: sources.onsDataset.url,
      onsBulletinUrl: sources.onsBulletin.url,
      onsDownloadUrl: onsLinks[0],
      homeOfficeSourceUrl: sources.homeOfficeDataTables.url,
      homeOfficeLatestReleaseUrl: sources.homeOfficeLatestRelease.url,
      homeOfficeDownloadUrl,
      latestOnsPeriod: main.current.period,
      latestHomeOfficePeriod: smallBoats?.period || null,
      sourceIds: ['ons-ltim', smallBoats ? 'home-office-illegal-entry-routes' : null].filter(Boolean),
      warnings,
    },
  }

  return payload
}

function validatePayload(payload) {
  const errors = []
  const warnings = Array.isArray(payload?.meta?.warnings) ? [...payload.meta.warnings] : []

  if (!payload || typeof payload !== 'object') errors.push('Migration payload is missing.')
  if (!payload?.fetchYear) errors.push('Migration payload is missing fetchYear.')
  if (!payload?.meta?.reviewedAt) errors.push('Migration payload is missing meta.reviewedAt.')
  if (!payload?.meta?.onsSourceUrl) errors.push('Migration payload is missing meta.onsSourceUrl.')

  for (const field of ['netTotal', 'netPrev', 'netPrev2']) {
    if (!Number.isFinite(Number(payload?.[field])) || Number(payload?.[field]) <= 0) {
      errors.push(`Migration payload has invalid ${field}.`)
    }
  }

  if (!Array.isArray(payload?.trend) || payload.trend.length < 2) {
    errors.push('Migration payload trend must contain the current ONS period and at least one prior comparison.')
  } else {
    const hasCurrent = payload.trend.some((row) => row.period === payload.meta?.latestOnsPeriod && Number(row.net) === Number(payload.netTotal))
    if (!hasCurrent) errors.push('Migration payload trend does not include the current ONS period.')
  }

  if (!Array.isArray(payload?.byNationality) || !payload.byNationality.length) warnings.push('No ONS nationality rows were parsed.')
  if (!Array.isArray(payload?.byVisa) || !payload.byVisa.length) warnings.push('No ONS reason/visa-style rows were parsed.')
  if (!payload?.smallBoats) warnings.push('Home Office small-boats enrichment is not present.')

  return { errors, warnings }
}

async function fetchExistingMigration(apiBase) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/data`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Politiscope/1.0 (+https://politiscope.co.uk)' },
  }).catch(() => null)
  if (!response?.ok) return null
  const data = await response.json().catch(() => null)
  return data?.migration && typeof data.migration === 'object' ? data.migration : null
}

function preserveExistingEnrichment(candidate, existing) {
  if (!existing || typeof existing !== 'object') return candidate
  const preserved = []
  const merged = { ...candidate, meta: { ...candidate.meta, warnings: [...(candidate.meta?.warnings || [])] } }

  for (const key of ['byNationality', 'byVisa']) {
    if ((!Array.isArray(merged[key]) || !merged[key].length) && Array.isArray(existing[key]) && existing[key].length) {
      merged[key] = existing[key]
      preserved.push(key)
    }
  }
  if (!merged.smallBoats && existing.smallBoats) {
    merged.smallBoats = existing.smallBoats
    preserved.push('smallBoats')
  }
  if (preserved.length) {
    merged.meta.preservedExistingFields = preserved
    merged.meta.warnings.push(`Preserved existing remote enrichment fields: ${preserved.join(', ')}`)
  }
  return merged
}

async function postJson(apiBase, body) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Politiscope/1.0 (+https://politiscope.co.uk)' },
    body: JSON.stringify(body),
  }).catch((error) => fail('Failed to reach /api/save.', error?.message || String(error)))

  const text = await response.text().catch(() => '')
  if (!response.ok) fail(`Migration import failed (${response.status}).`, text)
  return text
}

async function maybeWriteJson(payload) {
  if (!WRITE_JSON) return
  const outputPath = resolve(REPO_ROOT, OUTPUT_PATH)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

export async function ingestMigration() {
  const config = await readJson(CONFIG_PATH)
  const candidate = await buildMigrationPayload(config)
  const validation = validatePayload(candidate)
  if (validation.errors.length) {
    fail('Migration candidate failed validation.', validation.errors.map((error) => `- ${error}`).join('\n'))
  }

  const existing = DRY_RUN || NO_POST ? null : await fetchExistingMigration(API_BASE)
  const payload = preserveExistingEnrichment(candidate, existing)
  const finalValidation = validatePayload(payload)
  if (finalValidation.errors.length) {
    fail('Migration payload failed final validation.', finalValidation.errors.map((error) => `- ${error}`).join('\n'))
  }

  await maybeWriteJson(payload)

  if (DRY_RUN || NO_POST) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: DRY_RUN,
      wroteJson: WRITE_JSON,
      wouldPost: !NO_POST && !DRY_RUN,
      apiBase: API_BASE,
      configPath: CONFIG_PATH,
      outputPath: OUTPUT_PATH,
      validation: finalValidation,
      summary: {
        fetchYear: payload.fetchYear,
        netTotal: payload.netTotal,
        netPrev: payload.netPrev,
        netPrev2: payload.netPrev2,
        trendRows: payload.trend?.length || 0,
        nationalityRows: payload.byNationality?.length || 0,
        visaRows: payload.byVisa?.length || 0,
        hasSmallBoats: !!payload.smallBoats,
      },
      payload,
    }, null, 2))
    return
  }

  await postJson(API_BASE, { section: 'migration', payload })
  console.log(JSON.stringify({
    ok: true,
    apiBase: API_BASE,
    imported: true,
    validation: finalValidation,
    summary: {
      fetchYear: payload.fetchYear,
      netTotal: payload.netTotal,
      netPrev: payload.netPrev,
      netPrev2: payload.netPrev2,
      trendRows: payload.trend?.length || 0,
      nationalityRows: payload.byNationality?.length || 0,
      visaRows: payload.byVisa?.length || 0,
      hasSmallBoats: !!payload.smallBoats,
    },
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestMigration().catch((error) => fail('Unexpected migration ingest failure.', error?.stack || error?.message || String(error)))
}
