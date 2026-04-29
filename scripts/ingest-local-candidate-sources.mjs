import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { getLocalVoteGuideCouncil } from '../src/data/localVoteGuide.js'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

const CONFIG_PATH =
  process.env.LOCAL_CANDIDATE_SOURCES_CONFIG ||
  process.argv.find((arg) => arg.startsWith('--config='))?.split('=')[1] ||
  'scripts/config/local-candidate-sources.json'

const COUNCIL_FILTER =
  process.argv.find((arg) => arg.startsWith('--council='))?.split('=')[1] ||
  ''

const CHUNK_SIZE = Number(
  process.env.LOCAL_CANDIDATE_SOURCE_CHUNK_SIZE ||
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

function readArgBool(name) {
  return process.argv.includes(`--${name}`)
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

function normalizeManualRow(row, config) {
  return {
    ward: pick(row, ['ward', 'wardName', 'Ward', 'WARD']),
    name: pick(row, ['name', 'candidate', 'candidateName', 'Candidate', 'CANDIDATE']),
    party: pick(row, ['party', 'partyName', 'Party', 'PARTY']),
    electionDate: pick(row, ['electionDate', 'election_date', 'Election Date']) || config.electionDate || '',
    sourceUrl: pick(row, ['sourceUrl', 'source_url', 'Source URL']) || config.sourceUrl || '',
    sourceLabel: pick(row, ['sourceLabel', 'source_label', 'Source Label']) || config.sourceLabel || 'Official statement of persons nominated',
    lastChecked: pick(row, ['lastChecked', 'last_checked', 'Last Checked']) || config.lastChecked || '',
    verificationStatus: pick(row, ['verificationStatus', 'verification_status', 'Verification Status']) || config.verificationStatus || 'verified',
  }
}

async function loadCandidatesForSource(config, globalElectionDate) {
  const parserType = String(config.parserType || '').trim()
  const electionDate = config.electionDate || globalElectionDate

  if (parserType === 'existing-local-guide') {
    const council = getLocalVoteGuideCouncil(config.councilSlug)
    if (!council) {
      return { rows: [], warning: `No existing local guide found for ${config.councilSlug}.` }
    }

    return {
      rows: (council.wards || []).flatMap((ward) =>
        (ward.candidates || []).map((candidate) => ({
          ward: ward.name,
          name: candidate.name,
          party: candidate.party,
          electionDate: candidate.electionDate || electionDate,
          sourceUrl: config.sourceUrl || candidate.sourceUrl,
          sourceLabel: config.sourceLabel || candidate.sourceLabel,
          lastChecked: config.lastChecked || candidate.lastChecked,
          verificationStatus: config.verificationStatus || candidate.verificationStatus || 'verified',
        })),
      ),
    }
  }

  if (parserType === 'manual-rows') {
    return {
      rows: (Array.isArray(config.candidates) ? config.candidates : []).map((row) =>
        normalizeManualRow(row, { ...config, electionDate }),
      ),
    }
  }

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

  return { rows: [], warning: `Unsupported parser type "${parserType}" for ${config.councilSlug || config.councilName}.` }
}

function normalizeImportRow({ council, ward, candidate, sourceConfig, electionDate }) {
  return {
    councilId: council.id,
    councilSlug: council.slug,
    councilName: council.name,
    wardId: ward.id,
    wardSlug: ward.slug,
    wardName: ward.name,
    electionDate: candidate.electionDate || electionDate,
    candidateName: candidate.name,
    partyName: candidate.party,
    sourceUrl: candidate.sourceUrl || sourceConfig.sourceUrl || '',
    sourceLabel: candidate.sourceLabel || sourceConfig.sourceLabel || 'Official statement of persons nominated',
    lastChecked: candidate.lastChecked || sourceConfig.lastChecked || '',
    verificationStatus: candidate.verificationStatus || sourceConfig.verificationStatus || 'verified',
    sourceAttribution: 'official-candidate-source',
    sourceType: 'official-candidate-source',
    parserType: sourceConfig.parserType,
  }
}

async function postJson(apiBase, body) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/local-vote/ingest/candidate-sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch((error) => {
    fail('Failed to reach local candidate source ingest endpoint.', error?.message || String(error))
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
      `Local candidate source ingest failed (${response.status}).`,
      payload ? JSON.stringify(payload, null, 2) : text,
    )
  }

  return payload
}

export async function ingestLocalCandidateSources() {
  const apiBase = API_BASE
  const config = await readJsonFile(CONFIG_PATH)
  const electionDate = String(config.electionDate || '2026-05-07').trim()
  const sourceConfigs = (Array.isArray(config.sources) ? config.sources : [])
    .filter((source) => !COUNCIL_FILTER || slugify(source.councilSlug || source.councilName) === slugify(COUNCIL_FILTER))

  if (!sourceConfigs.length) {
    fail('No candidate source config entries matched.')
  }

  const enabledSources = sourceConfigs.filter((source) => source.enabled)
  if (!enabledSources.length) {
    fail('No enabled candidate source config entries matched.')
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

    const loaded = await loadCandidatesForSource(sourceConfig, electionDate)
    if (loaded.warning) warnings.push(loaded.warning)

    for (const candidate of loaded.rows || []) {
      if (!candidate.name || !candidate.party || !candidate.ward) {
        skipped.push({ reason: 'missing-candidate-fields', council: council.slug, candidate })
        continue
      }
      if (!candidate.sourceUrl && !sourceConfig.sourceUrl) {
        skipped.push({ reason: 'missing-source-url', council: council.slug, candidateName: candidate.name, ward: candidate.ward })
        continue
      }

      const ward = findWard(council, candidate.ward, maps)
      if (!ward) {
        skipped.push({ reason: 'ward-not-found', council: council.slug, candidateName: candidate.name, ward: candidate.ward })
        continue
      }

      rowsForImport.push(normalizeImportRow({ council, ward, candidate, sourceConfig, electionDate }))
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
    fail('No candidate rows were ready to import.', JSON.stringify(summaryBase, null, 2))
  }

  if (DRY_RUN || readArgBool('check-only')) {
    console.log(JSON.stringify({ ok: true, dryRun: true, ...summaryBase }, null, 2))
    return
  }

  const runId = `local_vote_ingest_candidate_sources_${Date.now()}`
  const sourceLabel = 'Official Local Authority candidate sources'
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
  let insertedBallots = 0
  let insertedCandidates = 0
  let candidateBallotLinks = 0
  let rowsUpserted = 0
  let skippedSamples = [...skipped]

  for (let index = 0; index < chunks.length; index += 1) {
    console.log(`[LocalCandidateSources] Importing chunk ${index + 1}/${chunks.length} (${chunks[index].length} rows)`)
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
    insertedBallots += Number(payload.insertedBallots || 0)
    insertedCandidates += Number(payload.insertedCandidates || 0)
    candidateBallotLinks += Number(payload.candidateBallotLinks || 0)
    rowsUpserted += Number(payload.rowsUpserted || 0)
    skippedSamples = [...skippedSamples, ...(payload.skippedSamples || [])]
  }

  const finished = await postJson(apiBase, {
    action: 'finish',
    runId: started.runId,
    electionDate,
    sourceLabel,
    skippedSamples: skippedSamples.slice(0, 50),
  })

  console.log(JSON.stringify({
    ok: finished.ok,
    runId: started.runId,
    ...summaryBase,
    matchedRows,
    insertedBallots,
    insertedCandidates,
    candidateBallotLinks,
    rowsUpserted,
    validation: finished.validation || {},
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestLocalCandidateSources().catch((error) => {
    fail('Unexpected local candidate source import failure.', error?.stack || error?.message || String(error))
  })
}
