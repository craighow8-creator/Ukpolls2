#!/usr/bin/env node
import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

const CONFIG_PATH =
  process.env.LOCAL_RESULT_SOURCES_CONFIG ||
  process.argv.find((arg) => arg.startsWith('--config='))?.split('=')[1] ||
  'scripts/config/local-election-result-sources.json'

const COUNCIL_FILTER =
  process.argv.find((arg) => arg.startsWith('--council='))?.split('=')[1] ||
  ''

const CHUNK_SIZE = Number(
  process.env.LOCAL_RESULT_SOURCE_CHUNK_SIZE ||
    process.argv.find((arg) => arg.startsWith('--chunk-size='))?.split('=')[1] ||
    '25',
)

const DRY_RUN = process.argv.includes('--dry-run')

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function simplifyCouncilKey(value = '') {
  return slugify(
    String(value || '')
      .replace(/^city of /i, '')
      .replace(/\b(city council|county council|district council|borough council|metropolitan borough council|london borough|council)\b/gi, '')
      .replace(/\s+/g, ' '),
  )
}

function wardKey(value = '') {
  return slugify(String(value || '').replace(/\bward\b/gi, ''))
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        value += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(value)
      value = ''
      continue
    }

    if (char === '\n') {
      row.push(value)
      rows.push(row)
      row = []
      value = ''
      continue
    }

    if (char === '\r') continue
    value += char
  }

  if (value.length || row.length) {
    row.push(value)
    rows.push(row)
  }

  if (!rows.length) return []
  const headers = rows[0].map((header) => String(header || '').trim())
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, String(values[index] || '').trim()])),
  )
}

function pick(row, keys) {
  for (const key of keys) {
    const value = String(row?.[key] || '').trim()
    if (value) return value
  }
  return ''
}

function chunkArray(values, size) {
  const chunks = []
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size))
  }
  return chunks
}

function resolveRepoPath(pathValue) {
  const clean = String(pathValue || '').trim()
  if (!clean) return ''
  return resolve(REPO_ROOT, clean)
}

async function readJsonFile(pathValue) {
  const filePath = resolveRepoPath(pathValue)
  const text = await readFile(filePath, 'utf8')
  return JSON.parse(text)
}

async function fetchLookupIndex(apiBase) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/local-vote/lookup-index`).catch((error) => {
    fail('Failed to fetch local vote lookup index.', error?.message || String(error))
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    fail(`Local vote lookup index fetch failed (${response.status}).`, text)
  }

  const payload = await response.json().catch(() => null)
  if (!payload || !Array.isArray(payload.councils) || !Array.isArray(payload.wards)) {
    fail('Local vote lookup index payload was invalid.')
  }

  return payload
}

function buildLookupMaps(payload) {
  const councilsBySlug = new Map()
  const councilsBySimpleName = new Map()
  const wardsByCouncil = new Map()

  for (const council of payload.councils || []) {
    if (council.slug) councilsBySlug.set(String(council.slug).trim(), council)
    const keys = [council.name, council.supportedAreaLabel, council.slug].map(simplifyCouncilKey).filter(Boolean)
    for (const key of keys) {
      if (!councilsBySimpleName.has(key)) councilsBySimpleName.set(key, council)
    }
  }

  for (const ward of payload.wards || []) {
    if (!ward.councilId) continue
    const map = wardsByCouncil.get(ward.councilId) || new Map()
    const keys = [ward.name, ward.slug, ...(Array.isArray(ward.aliases) ? ward.aliases : [])].map(wardKey).filter(Boolean)
    for (const key of keys) {
      if (!map.has(key)) map.set(key, ward)
    }
    wardsByCouncil.set(ward.councilId, map)
  }

  return {
    councilsBySlug,
    councilsBySimpleName,
    wardsByCouncil,
  }
}

function findCouncil(config, maps) {
  const slug = String(config.councilSlug || '').trim()
  if (slug && maps.councilsBySlug.has(slug)) return maps.councilsBySlug.get(slug)

  for (const key of [config.councilName, config.councilSlug].map(simplifyCouncilKey).filter(Boolean)) {
    const council = maps.councilsBySimpleName.get(key)
    if (council) return council
  }

  return null
}

function findWard(council, wardName, maps) {
  const map = maps.wardsByCouncil.get(council?.id)
  if (!map) return null
  return map.get(wardKey(wardName)) || null
}

function normaliseBoolean(value) {
  const text = String(value || '').trim().toLowerCase()
  return ['1', 'true', 'yes', 'y', 'elected', 'winner', 'won'].includes(text)
}

function normalizeManualRow(row, config) {
  return {
    council: pick(row, ['council', 'councilName', 'Council']) || config.councilName || '',
    ward: pick(row, ['ward', 'wardName', 'Ward', 'WARD']),
    candidateName: pick(row, ['candidateName', 'candidate', 'name', 'Candidate', 'CANDIDATE']),
    party: pick(row, ['party', 'partyName', 'Party', 'PARTY']),
    votes: pick(row, ['votes', 'Votes', 'VOTES']),
    elected: normaliseBoolean(pick(row, ['elected', 'winner', 'Elected', 'ELECTED'])),
    turnout: pick(row, ['turnout', 'Turnout', 'TURNOUT']),
    electionDate: pick(row, ['electionDate', 'election_date', 'Election Date']) || config.electionDate || '',
    sourceUrl: pick(row, ['sourceUrl', 'source_url', 'Source URL']) || config.sourceUrl || '',
    sourceLabel: pick(row, ['sourceLabel', 'source_label', 'Source Label']) || config.sourceLabel || 'Official local election results',
    lastChecked: pick(row, ['lastChecked', 'last_checked', 'Last Checked']) || config.lastChecked || '',
    verificationStatus: pick(row, ['verificationStatus', 'verification_status', 'Verification Status']) || config.verificationStatus || 'verified',
  }
}

async function loadResultsForSource(config, globalElectionDate) {
  const parserType = String(config.parserType || '').trim()
  const electionDate = config.electionDate || globalElectionDate

  if (parserType === 'manual-csv') {
    const csvPath = resolveRepoPath(config.csvPath)
    if (!config.csvPath || !existsSync(csvPath)) {
      return { rows: [], warning: `CSV not present for ${config.councilSlug || config.councilName}.` }
    }
    const csvText = await readFile(csvPath, 'utf8')
    return {
      rows: parseCsv(csvText).map((row) => normalizeManualRow(row, { ...config, electionDate })),
    }
  }

  if (parserType === 'manual-rows') {
    return {
      rows: (Array.isArray(config.results) ? config.results : []).map((row) =>
        normalizeManualRow(row, { ...config, electionDate }),
      ),
    }
  }

  return { rows: [], warning: `Unsupported parser type "${parserType}" for ${config.councilSlug || config.councilName}.` }
}

function normalizeImportRow({ council, ward, result, sourceConfig, electionDate }) {
  return {
    councilId: council.id,
    councilSlug: council.slug,
    councilName: council.name,
    wardId: ward.id,
    wardSlug: ward.slug,
    wardName: ward.name,
    electionDate: result.electionDate || electionDate,
    candidateName: result.candidateName,
    partyName: result.party,
    votes: result.votes,
    elected: result.elected,
    turnout: result.turnout,
    sourceUrl: result.sourceUrl || sourceConfig.sourceUrl || '',
    sourceLabel: result.sourceLabel || sourceConfig.sourceLabel || 'Official local election results',
    lastChecked: result.lastChecked || sourceConfig.lastChecked || '',
    verificationStatus: result.verificationStatus || sourceConfig.verificationStatus || 'verified',
    sourceAttribution: 'official-result-source',
    sourceType: 'official-election-result',
    parserType: sourceConfig.parserType,
  }
}

async function postJson(apiBase, body) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/local-vote/ingest/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch((error) => {
    fail('Failed to reach local result source ingest endpoint.', error?.message || String(error))
  })

  const text = await response.text().catch(() => '')
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    fail(
      `Local result source ingest failed (${response.status}).`,
      payload ? JSON.stringify(payload, null, 2) : text,
    )
  }

  return payload
}

export async function ingestLocalElectionResults() {
  const apiBase = API_BASE
  const config = await readJsonFile(CONFIG_PATH)
  const electionDate = String(config.electionDate || '2026-05-07').trim()
  const sourceConfigs = (Array.isArray(config.sources) ? config.sources : [])
    .filter((source) => !COUNCIL_FILTER || slugify(source.councilSlug || source.councilName) === slugify(COUNCIL_FILTER))

  if (!sourceConfigs.length) {
    fail('No result source config entries matched.')
  }

  const enabledSources = sourceConfigs.filter((source) => source.enabled)
  if (!enabledSources.length) {
    fail('No enabled result source config entries matched.')
  }

  const lookup = await fetchLookupIndex(apiBase)
  const maps = buildLookupMaps(lookup)
  const rowsForImport = []
  const warnings = []
  const skipped = []

  for (const sourceConfig of enabledSources) {
    const council = findCouncil(sourceConfig, maps)
    if (!council) {
      warnings.push(`Council not found in lookup index: ${sourceConfig.councilSlug || sourceConfig.councilName}`)
      continue
    }

    const loaded = await loadResultsForSource(sourceConfig, electionDate)
    if (loaded.warning) warnings.push(loaded.warning)

    for (const result of loaded.rows || []) {
      if (!result.candidateName || !result.ward) {
        skipped.push({ reason: 'missing-result-fields', council: council.slug, result })
        continue
      }
      if (!result.sourceUrl && !sourceConfig.sourceUrl) {
        skipped.push({ reason: 'missing-source-url', council: council.slug, candidateName: result.candidateName, ward: result.ward })
        continue
      }

      const ward = findWard(council, result.ward, maps)
      if (!ward) {
        skipped.push({ reason: 'ward-not-found', council: council.slug, candidateName: result.candidateName, ward: result.ward })
        continue
      }

      rowsForImport.push(normalizeImportRow({ council, ward, result, sourceConfig, electionDate }))
    }
  }

  const summaryBase = {
    apiBase,
    electionDate,
    configPath: CONFIG_PATH,
    enabledSources: enabledSources.map((source) => source.councilSlug || source.councilName),
    rowsReady: rowsForImport.length,
    skipped: skipped.slice(0, 50),
    warnings,
  }

  if (!rowsForImport.length) {
    fail('No result rows were ready to import.', JSON.stringify(summaryBase, null, 2))
  }

  if (DRY_RUN || process.argv.includes('--check-only')) {
    console.log(JSON.stringify({ ok: true, dryRun: true, ...summaryBase }, null, 2))
    return
  }

  const runId = `local_vote_ingest_results_${Date.now()}`
  const sourceLabel = 'Official Local Authority election results'
  const started = await postJson(apiBase, {
    action: 'start',
    runId,
    electionDate,
    sourceLabel,
    sourceUrl: '',
    totalRows: rowsForImport.length,
    priorityCouncils: sourceConfigs.filter((source) => source.priority).map((source) => source.councilSlug || source.councilName),
  })

  const chunkSize = Number.isFinite(CHUNK_SIZE) && CHUNK_SIZE > 0 ? CHUNK_SIZE : 25
  const chunks = chunkArray(rowsForImport, chunkSize)
  let matchedRows = 0
  let insertedResults = 0
  let unmatchedCandidates = 0
  let rowsUpserted = 0
  let skippedSamples = [...skipped]
  let unmatchedCandidateSamples = []

  for (let index = 0; index < chunks.length; index += 1) {
    console.log(`[LocalElectionResults] Importing chunk ${index + 1}/${chunks.length} (${chunks[index].length} rows)`)
    const payload = await postJson(apiBase, {
      action: 'chunk',
      runId: started.runId,
      electionDate,
      sourceLabel,
      rows: chunks[index],
      chunkIndex: index + 1,
      totalChunks: chunks.length,
    })

    matchedRows += Number(payload.matchedRows || 0)
    insertedResults += Number(payload.insertedResults || 0)
    unmatchedCandidates += Number(payload.unmatchedCandidates || 0)
    rowsUpserted += Number(payload.rowsUpserted || 0)
    skippedSamples = [...skippedSamples, ...(payload.skippedSamples || [])]
    unmatchedCandidateSamples = [...unmatchedCandidateSamples, ...(payload.unmatchedCandidateSamples || [])]
  }

  const finished = await postJson(apiBase, {
    action: 'finish',
    runId: started.runId,
    electionDate,
    sourceLabel,
    skippedSamples: skippedSamples.slice(0, 50),
    unmatchedCandidateSamples: unmatchedCandidateSamples.slice(0, 50),
  })

  console.log(JSON.stringify({
    ok: finished.ok,
    runId: started.runId,
    ...summaryBase,
    matchedRows,
    insertedResults,
    unmatchedCandidates,
    rowsUpserted,
    validation: finished.validation || {},
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestLocalElectionResults().catch((error) => {
    fail('Unexpected local result source import failure.', error?.stack || error?.message || String(error))
  })
}
