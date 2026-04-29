#!/usr/bin/env node
import process from 'node:process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

const CONFIG_PATH =
  process.env.PARTY_POLICY_SOURCES_CONFIG ||
  process.argv.find((arg) => arg.startsWith('--config='))?.split('=')[1] ||
  'scripts/config/party-policy-sources.json'

const OUTPUT_PATH =
  process.env.PARTY_POLICY_OUTPUT ||
  process.argv.find((arg) => arg.startsWith('--output='))?.split('=')[1] ||
  'src/data/policy/officialPolicyRecords.generated.json'

const DRY_RUN = process.argv.includes('--dry-run')
const WRITE_JSON = process.argv.includes('--write-json')
const FETCH_SOURCES = process.argv.includes('--fetch-sources')

const SOURCE_PRIORITY = {
  official_policy_paper: 100,
  manifesto: 90,
  official_policy_page: 80,
  official_pledge_page: 70,
}

const SOURCE_TYPE_ALIASES = {
  'policy-paper': 'official_policy_paper',
  policy: 'official_policy_page',
  official_policy_paper: 'official_policy_paper',
  official_policy_page: 'official_policy_page',
  official_pledge_page: 'official_pledge_page',
  manifesto: 'manifesto',
}

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeSourceType(value) {
  const key = cleanText(value || 'official_policy_page').toLowerCase().replace(/\s+/g, '_')
  return SOURCE_TYPE_ALIASES[key] || key || 'official_policy_page'
}

function parseList(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean)
  const text = cleanText(value)
  if (!text) return []
  return text
    .split(/\s*\|\s*|\s*;\s*/)
    .map(cleanText)
    .filter(Boolean)
}

function normalizeSource(row, fallback = {}) {
  const sourceType = normalizeSourceType(row.sourceType || fallback.sourceType)
  return {
    type: sourceType,
    title: cleanText(row.sourceTitle || fallback.sourceTitle || 'Official party source'),
    url: cleanText(row.sourceUrl || fallback.sourceUrl),
    priority: SOURCE_PRIORITY[sourceType] || 80,
    lastChecked: cleanText(row.lastChecked || fallback.lastChecked),
    verificationStatus: cleanText(row.verificationStatus || fallback.verificationStatus || 'verified'),
  }
}

function buildSourceIndex(sources = []) {
  const byParty = new Map()
  for (const source of sources) {
    const party = cleanText(source.party)
    if (!party) continue
    if (!byParty.has(party)) byParty.set(party, [])
    byParty.get(party).push(source)
  }
  return byParty
}

function normalizePolicyRow(row, sourceIndex) {
  const party = cleanText(row.party)
  const area = cleanText(row.policyArea || row.area)
  const headline = cleanText(row.headline || row.title || row.topic)
  const partySource = sourceIndex.get(party)?.[0] || {}
  const source = normalizeSource(row, partySource)
  const shortSummary = cleanText(row.shortSummary || row.summary)
  const detailedSummary = cleanText(row.detailedSummary)

  return {
    id: cleanText(row.id) || `official-${slugify(party)}-${slugify(area)}-${slugify(headline)}`,
    party,
    area,
    topic: headline,
    title: headline,
    stanceScore: Number.isFinite(Number(row.stanceScore)) ? Number(row.stanceScore) : 0,
    stanceLabel: cleanText(row.stanceTag) || undefined,
    pledgeType: 'policy',
    status: 'active',
    summary: shortSummary,
    details: parseList(row.details || detailedSummary),
    officialPosition: {
      headline,
      shortSummary,
      detailedSummary,
      sourceTitle: source.title,
      sourceUrl: source.url,
      sourceType: source.type,
      lastChecked: source.lastChecked,
      verificationStatus: source.verificationStatus,
    },
    politiscopeAnalysis: cleanText(row.politiscopeAnalysis),
    sources: [source],
    controllingSource: source,
    confidence: cleanText(row.confidence) || 'high',
    coverage: 'official-source',
    updatedAt: cleanText(row.updatedAt) || cleanText(row.lastChecked) || new Date().toISOString(),
  }
}

function validateRows(rows = []) {
  const errors = []
  const seen = new Set()

  for (const row of rows) {
    const label = `${row.party || 'unknown party'} / ${row.policyArea || row.area || 'unknown area'} / ${row.headline || row.title || 'unknown headline'}`
    for (const field of ['party', 'area', 'title', 'summary']) {
      if (!cleanText(row[field])) errors.push(`${label} is missing ${field}.`)
    }
    const source = Array.isArray(row.sources) ? row.sources[0] : row.controllingSource
    if (!cleanText(source?.url)) errors.push(`${label} is missing sourceUrl.`)
    if (!cleanText(source?.title)) errors.push(`${label} is missing sourceTitle.`)
    if (!cleanText(source?.lastChecked)) errors.push(`${label} is missing lastChecked.`)
    if (!cleanText(source?.verificationStatus)) errors.push(`${label} is missing verificationStatus.`)
    if (seen.has(row.id)) errors.push(`Duplicate generated policy id: ${row.id}`)
    seen.add(row.id)
  }

  return errors
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`).catch((error) => {
    fail(`Failed to fetch ${path}.`, error?.message || String(error))
  })
  const text = await response.text().catch(() => '')
  if (!response.ok) fail(`Policy data fetch failed (${response.status}).`, text)
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`Policy data response from ${path} was not JSON.`, error?.message || String(error))
  }
}

async function postJson(path, body) {
  const response = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((error) => fail(`Failed to post ${path}.`, error?.message || String(error)))

  const text = await response.text().catch(() => '')
  if (!response.ok) fail(`Policy ingest failed (${response.status}).`, text)
  return text
}

async function checkFetchableSources(sources = []) {
  const results = []
  for (const source of sources.filter((entry) => cleanText(entry.sourceUrl))) {
    const response = await fetch(source.sourceUrl, { redirect: 'follow' }).catch((error) => ({ error }))
    if (response?.error) {
      results.push({ party: source.party, sourceUrl: source.sourceUrl, ok: false, error: response.error.message })
      continue
    }
    const text = await response.text().catch(() => '')
    results.push({
      party: source.party,
      sourceUrl: source.sourceUrl,
      ok: response.ok,
      status: response.status,
      bytes: text.length,
      sample: cleanText(text.replace(/<[^>]+>/g, ' ')).slice(0, 220),
    })
  }
  return results
}

export async function ingestPartyPolicies() {
  const configPath = resolve(process.cwd(), CONFIG_PATH)
  const raw = JSON.parse(await readFile(configPath, 'utf8'))
  const sources = Array.isArray(raw.sources) ? raw.sources : []
  const rows = Array.isArray(raw.rows) ? raw.rows : []
  const sourceIndex = buildSourceIndex(sources)
  const generatedRows = rows.map((row) => normalizePolicyRow(row, sourceIndex))
  const errors = validateRows(generatedRows)

  if (errors.length) {
    fail('Party policy source config failed validation.', errors.map((error) => `- ${error}`).join('\n'))
  }

  const fetchChecks = FETCH_SOURCES ? await checkFetchableSources(sources) : []

  if (WRITE_JSON) {
    await writeFile(resolve(process.cwd(), OUTPUT_PATH), `${JSON.stringify(generatedRows, null, 2)}\n`, 'utf8')
  }

  if (DRY_RUN) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      configPath: CONFIG_PATH,
      outputPath: OUTPUT_PATH,
      sourceCount: sources.length,
      generatedRows: generatedRows.length,
      fetchChecks,
      rows: generatedRows,
    }, null, 2))
    return
  }

  const data = await fetchJson('/api/data')
  const existingRecords = Array.isArray(data?.policyRecords) ? data.policyRecords : []
  const generatedIds = new Set(generatedRows.map((row) => row.id))
  const merged = [
    ...existingRecords.filter((record) => !generatedIds.has(record?.id)),
    ...generatedRows,
  ]

  await postJson('/api/save', { section: 'policyRecords', payload: merged })
  console.log(JSON.stringify({
    ok: true,
    apiBase: API_BASE,
    generatedRows: generatedRows.length,
    totalPolicyRecords: merged.length,
    wroteJson: WRITE_JSON,
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestPartyPolicies().catch((error) => fail('Unexpected party policy ingest failure.', error?.stack || error?.message || String(error)))
}
