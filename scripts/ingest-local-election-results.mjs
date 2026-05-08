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
  const text = String(value || '').replace(/[-_]+/g, ' ')
  return slugify(
    text
      .replace(/^city of /i, '')
      .replace(/^borough of /i, '')
      .replace(/^district of /i, '')
      .replace(/^county of /i, '')
      .replace(/, city of$/i, '')
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

function decodeHtml(value = '') {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&ndash;/gi, '-')
    .replace(/&mdash;/gi, '-')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
}

function stripHtml(value = '') {
  return decodeHtml(String(value || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function chunkArray(values, size) {
  const chunks = []
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size))
  }
  return chunks
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Politiscope official local result importer',
    },
  }).catch((error) => {
    fail(`Failed to fetch official result source: ${url}`, error?.message || String(error))
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    fail(`Official result source fetch failed (${response.status}): ${url}`, text)
  }

  return response.text()
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

function findCouncilForResult(result, config, maps) {
  const slug = String(result?.councilSlug || config?.councilSlug || '').trim()
  if (slug && maps.councilsBySlug.has(slug)) return maps.councilsBySlug.get(slug)

  for (const key of [result?.council, result?.councilSlug, config?.councilName, config?.councilSlug]
    .map(simplifyCouncilKey)
    .filter(Boolean)) {
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

function normaliseOfficialResultParty(value = '') {
  const text = stripHtml(value)
  const key = text.toLowerCase()

  if (key === 'the conservative party candidate' || key === 'conservative party candidate' || key === 'conservative party') return 'Conservative'
  if (key === 'conservative and unionist party') return 'Conservative'
  if (key === 'green party') return 'Green'
  if (key === 'labour party') return 'Labour'
  if (key === 'labour and co-operative party') return 'Labour and Co-operative'
  if (key === 'liberal democrats') return 'Liberal Democrat'
  if (key === 'reformuk - changing politics for good') return 'Reform UK'
  return text
}

function normalizeManualRow(row, config) {
  return {
    council: pick(row, ['council', 'councilName', 'Council']) || config.councilName || '',
    councilSlug: pick(row, ['councilSlug', 'council_slug']) || config.councilSlug || '',
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
    ballotPaperId: pick(row, ['ballotPaperId', 'ballot_paper_id']),
  }
}

function extractDemocracyClubCouncilSlug(row = {}) {
  const electionId = String(row.election_id || '').trim()
  const ballotId = String(row.ballot_paper_id || '').trim()
  for (const value of [electionId, ballotId]) {
    const match = value.match(/^local\.([^.]+)(?:\.|$)/i)
    if (match?.[1]) return slugify(match[1])
  }
  return ''
}

function normaliseDemocracyClubTurnout(row = {}) {
  const percentage = String(row.turnout_percentage || '').trim()
  if (percentage) return percentage.endsWith('%') ? percentage : `${percentage}%`
  return String(row.turnout_reported || '').trim()
}

function parseDemocracyClubResultsCsv(text, config, electionDate) {
  const rows = []
  const stats = {
    source: config.sourceName || config.sourceId || 'Democracy Club local election results CSV',
    rowsFetched: 0,
    rowsReady: 0,
    skippedWrongDate: 0,
    skippedNotLocal: 0,
    skippedCancelled: 0,
    skippedNoVotes: 0,
    skippedNoSource: 0,
    skippedMissingFields: 0,
  }

  for (const row of parseCsv(text)) {
    stats.rowsFetched += 1
    const rowElectionDate = String(row.election_date || '').trim()
    const electionId = String(row.election_id || '').trim()
    const votes = String(row.votes_cast || '').trim()
    const sourceUrl = String(row.results_source || '').trim()
    const councilSlug = extractDemocracyClubCouncilSlug(row)

    if (rowElectionDate !== electionDate) {
      stats.skippedWrongDate += 1
      continue
    }
    if (!/^local(?:\.|$)/i.test(electionId)) {
      stats.skippedNotLocal += 1
      continue
    }
    if (normaliseBoolean(row.cancelled_poll)) {
      stats.skippedCancelled += 1
      continue
    }
    if (!votes) {
      stats.skippedNoVotes += 1
      continue
    }
    if (!sourceUrl) {
      stats.skippedNoSource += 1
      continue
    }
    if (!councilSlug || !row.post_label || !row.person_name) {
      stats.skippedMissingFields += 1
      continue
    }

    rows.push(
      normalizeManualRow(
        {
          council: councilSlug,
          councilSlug,
          ward: row.post_label,
          candidateName: row.person_name,
          party: normaliseOfficialResultParty(row.party_name),
          votes,
          elected: normaliseBoolean(row.elected),
          turnout: normaliseDemocracyClubTurnout(row),
          sourceUrl,
          sourceLabel: config.sourceLabel,
          lastChecked: config.lastChecked,
          verificationStatus: config.verificationStatus,
          electionDate: rowElectionDate,
          ballotPaperId: row.ballot_paper_id,
        },
        { ...config, electionDate },
      ),
    )
  }

  stats.rowsReady = rows.length
  return { rows, stats }
}

function extractSheffieldTurnout(sectionHtml = '') {
  const text = stripHtml(sectionHtml)
  const match = text.match(/\bTurnout:\s*([0-9]+(?:\.[0-9]+)?%)/i)
  return match?.[1] || ''
}

function parseSheffieldOfficialResultPage(html, config, electionDate) {
  const sourceUrl = String(config.sourceUrl || '').trim()
  const rows = []
  const warnings = []
  const sectionRegex = /<h3\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b[^>]*id="|$)/gi
  let sectionMatch = null

  while ((sectionMatch = sectionRegex.exec(html))) {
    const ward = stripHtml(sectionMatch[2])
    const sectionHtml = sectionMatch[3] || ''
    const tableMatch = sectionHtml.match(/<table\b[\s\S]*?<\/table>/i)
    if (!ward || !tableMatch) continue

    const turnout = extractSheffieldTurnout(sectionHtml)
    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
    let tableRowMatch = null
    while ((tableRowMatch = rowRegex.exec(tableMatch[0]))) {
      const cellMatches = [...tableRowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
      if (cellMatches.length < 3) continue

      const nameHtml = cellMatches[0][1] || ''
      const partyHtml = cellMatches[1][1] || ''
      const votesHtml = cellMatches[2][1] || ''
      const candidateName = stripHtml(nameHtml)
      const party = normaliseOfficialResultParty(partyHtml)
      const votes = stripHtml(votesHtml).replace(/,/g, '')
      if (!candidateName || !party) continue

      rows.push(
        normalizeManualRow(
          {
            council: config.councilName,
            ward,
            candidateName,
            party,
            votes,
            elected: /<strong\b/i.test(nameHtml) || /<strong\b/i.test(partyHtml) || /<strong\b/i.test(votesHtml),
            turnout,
            sourceUrl,
            sourceLabel: config.sourceLabel,
            lastChecked: config.lastChecked,
            verificationStatus: config.verificationStatus,
            electionDate,
          },
          { ...config, electionDate },
        ),
      )
    }
  }

  const wardCount = new Set(rows.map((row) => wardKey(row.ward))).size
  if (wardCount < 28) {
    warnings.push(`Sheffield parser found ${wardCount} wards; expected 28.`)
  }
  if (!rows.length) {
    warnings.push('Sheffield parser found no result rows.')
  }

  return { rows, warning: warnings.join(' ') }
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

  if (parserType === 'sheffield-official-html') {
    const sourceUrl = String(config.sourceUrl || '').trim()
    if (!sourceUrl) {
      return { rows: [], warning: `Missing sourceUrl for ${config.councilSlug || config.councilName}.` }
    }
    const html = await fetchText(sourceUrl)
    return parseSheffieldOfficialResultPage(html, config, electionDate)
  }

  if (parserType === 'democracy-club-results-csv') {
    const sourceUrl = String(config.sourceUrl || '').trim()
    if (!sourceUrl) {
      return { rows: [], warning: `Missing sourceUrl for ${config.sourceId || config.sourceName || 'Democracy Club results CSV'}.` }
    }
    const csvText = await fetchText(sourceUrl)
    return parseDemocracyClubResultsCsv(csvText, config, electionDate)
  }

  return { rows: [], warning: `Unsupported parser type "${parserType}" for ${config.councilSlug || config.councilName}.` }
}

async function fetchCouncilCandidateRows(apiBase, councilSlug) {
  if (!councilSlug) return []
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/local-vote/councils/${encodeURIComponent(councilSlug)}`).catch(() => null)
  if (!response?.ok) return []
  const payload = await response.json().catch(() => null)
  return (Array.isArray(payload?.wards) ? payload.wards : []).flatMap((ward) =>
    (Array.isArray(ward.candidates) ? ward.candidates : []).map((candidate) => ({
      candidateId: candidate.id,
      wardSlug: ward.slug,
      wardName: ward.name,
      candidateName: candidate.name,
      party: candidate.party,
    })),
  )
}

async function fetchExistingResultCoverage(apiBase) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/local-vote/health`).catch(() => null)
  if (!response?.ok) return new Map()
  const payload = await response.json().catch(() => null)
  const rows = Array.isArray(payload?.resultCoverageByCouncil) ? payload.resultCoverageByCouncil : []
  const map = new Map()
  for (const row of rows) {
    if (Number(row?.results || 0) <= 0) continue
    for (const key of [row.slug, row.name].map(simplifyCouncilKey).filter(Boolean)) {
      map.set(key, row)
    }
  }
  return map
}

function buildProtectedOfficialCouncilKeys(sourceConfigs) {
  const keys = new Set()
  for (const source of sourceConfigs) {
    if (!source.enabled || source.parserType === 'democracy-club-results-csv') continue
    for (const key of [source.councilSlug, source.councilName].map(simplifyCouncilKey).filter(Boolean)) {
      keys.add(key)
    }
  }
  return keys
}

function isCouncilProtectedFromBulkResults(council, existingResultCoverage, protectedOfficialCouncilKeys) {
  const keys = [council?.slug, council?.name].map(simplifyCouncilKey).filter(Boolean)
  return keys.some((key) => existingResultCoverage.has(key) || protectedOfficialCouncilKeys.has(key))
}

function summariseSkippedRows(skipped) {
  const councilNotFound = new Map()
  const wardNotFound = new Map()

  for (const row of skipped) {
    if (row.reason === 'council-not-found') {
      const key = String(row.council || '').trim() || 'unknown'
      const entry = councilNotFound.get(key) || { council: key, rows: 0, samples: [] }
      entry.rows += 1
      if (entry.samples.length < 3) {
        entry.samples.push({ ward: row.ward || '', candidateName: row.candidateName || '' })
      }
      councilNotFound.set(key, entry)
    }

    if (row.reason === 'ward-not-found') {
      const key = `${row.council || 'unknown'}|${row.ward || 'unknown'}`
      const entry = wardNotFound.get(key) || { council: row.council || 'unknown', ward: row.ward || 'unknown', rows: 0, samples: [] }
      entry.rows += 1
      if (entry.samples.length < 3) {
        entry.samples.push({ candidateName: row.candidateName || '' })
      }
      wardNotFound.set(key, entry)
    }
  }

  return {
    unmatchedCouncilsTop20: [...councilNotFound.values()]
      .sort((a, b) => b.rows - a.rows || a.council.localeCompare(b.council))
      .slice(0, 20),
    unmatchedWardsTop20: [...wardNotFound.values()]
      .sort((a, b) => b.rows - a.rows || a.council.localeCompare(b.council) || a.ward.localeCompare(b.ward))
      .slice(0, 20),
  }
}

function candidateMatchKey({ wardName = '', candidateName = '', party = '', partyName = '' } = {}) {
  return `${wardKey(wardName)}|${String(candidateName || '').trim().toLowerCase()}|${normaliseOfficialResultParty(party || partyName).toLowerCase()}`
}

async function attachCandidateIds(apiBase, rowsForImport) {
  const rowsByCouncil = new Map()
  for (const row of rowsForImport) {
    const list = rowsByCouncil.get(row.councilSlug) || []
    list.push(row)
    rowsByCouncil.set(row.councilSlug, list)
  }

  for (const [councilSlug, rows] of rowsByCouncil.entries()) {
    const candidateRows = await fetchCouncilCandidateRows(apiBase, councilSlug)
    const candidateMap = new Map(candidateRows.map((candidate) => [candidateMatchKey(candidate), candidate]))
    for (const row of rows) {
      const match = candidateMap.get(candidateMatchKey(row))
      if (match?.candidateId) row.candidateId = match.candidateId
    }
  }
}

async function buildCandidateMatchDiagnostics(apiBase, rowsForImport) {
  const rowsByCouncil = new Map()
  for (const row of rowsForImport) {
    const list = rowsByCouncil.get(row.councilSlug) || []
    list.push(row)
    rowsByCouncil.set(row.councilSlug, list)
  }

  const summaries = []
  for (const [councilSlug, rows] of rowsByCouncil.entries()) {
    const candidateRows = await fetchCouncilCandidateRows(apiBase, councilSlug)
    const candidateKeys = new Set(
      candidateRows.map((candidate) => candidateMatchKey(candidate)),
    )
    const unmatched = rows.filter((row) => {
      return !candidateKeys.has(candidateMatchKey(row))
    })

    summaries.push({
      councilSlug,
      resultRows: rows.length,
      candidateRows: candidateRows.length,
      matchedCandidates: rows.length - unmatched.length,
      unmatchedCandidates: unmatched.length,
      unmatchedSamples: unmatched.slice(0, 25).map((row) => ({
        ward: row.wardName,
        candidateName: row.candidateName,
        party: row.partyName,
      })),
    })
  }

  return summaries
}

function summariseCandidateDiagnostics(diagnostics) {
  const totals = diagnostics.reduce((summary, row) => {
    summary.councils += 1
    summary.resultRows += Number(row.resultRows || 0)
    summary.candidateRows += Number(row.candidateRows || 0)
    summary.matchedCandidates += Number(row.matchedCandidates || 0)
    summary.unmatchedCandidates += Number(row.unmatchedCandidates || 0)
    return summary
  }, {
    councils: 0,
    resultRows: 0,
    candidateRows: 0,
    matchedCandidates: 0,
    unmatchedCandidates: 0,
  })

  return {
    totals,
    councilsWithUnmatchedCandidates: diagnostics.filter((row) => Number(row.unmatchedCandidates || 0) > 0).length,
    worstUnmatchedCouncils: diagnostics
      .filter((row) => Number(row.unmatchedCandidates || 0) > 0)
      .sort((a, b) => Number(b.unmatchedCandidates || 0) - Number(a.unmatchedCandidates || 0))
      .slice(0, 10)
      .map((row) => ({
        councilSlug: row.councilSlug,
        resultRows: row.resultRows,
        matchedCandidates: row.matchedCandidates,
        unmatchedCandidates: row.unmatchedCandidates,
        unmatchedSamples: row.unmatchedSamples.slice(0, 5),
      })),
  }
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
    ballotPaperId: result.ballotPaperId || '',
    requireCandidateMatch: sourceConfig.requireCandidateMatch === true,
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
  const checkOnly = DRY_RUN || process.argv.includes('--check-only')
  if (config.testOnly && !checkOnly) {
    fail('This result source config is marked testOnly. Re-run with --dry-run or --check-only, or use the production result source config.')
  }

  const electionDate = String(config.electionDate || '2026-05-07').trim()
  const sourceConfigs = (Array.isArray(config.sources) ? config.sources : [])
    .filter((source) => {
      if (!COUNCIL_FILTER) return true
      if (source.parserType === 'democracy-club-results-csv') return true
      return slugify(source.councilSlug || source.councilName) === slugify(COUNCIL_FILTER)
    })

  if (!sourceConfigs.length) {
    fail('No result source config entries matched.')
  }

  const enabledSources = sourceConfigs.filter((source) => source.enabled)
  if (!enabledSources.length) {
    fail('No enabled result source config entries matched.')
  }

  const lookup = await fetchLookupIndex(apiBase)
  const maps = buildLookupMaps(lookup)
  const existingResultCoverage = await fetchExistingResultCoverage(apiBase)
  const protectedOfficialCouncilKeys = buildProtectedOfficialCouncilKeys(sourceConfigs)
  let rowsForImport = []
  const warnings = []
  const skipped = []
  const sourceStats = []
  const preservedOfficialCouncilSlugs = new Set()

  for (const sourceConfig of enabledSources) {
    const loaded = await loadResultsForSource(sourceConfig, electionDate)
    if (loaded.warning) warnings.push(loaded.warning)
    if (loaded.stats) sourceStats.push(loaded.stats)

    for (const result of loaded.rows || []) {
      const council = sourceConfig.parserType === 'democracy-club-results-csv'
        ? findCouncilForResult(result, sourceConfig, maps)
        : findCouncil(sourceConfig, maps)

      if (!council) {
        skipped.push({
          reason: 'council-not-found',
          council: result.councilSlug || result.council || sourceConfig.councilSlug || sourceConfig.councilName,
          candidateName: result.candidateName,
          ward: result.ward,
        })
        continue
      }

      if (COUNCIL_FILTER && slugify(council.slug) !== slugify(COUNCIL_FILTER) && simplifyCouncilKey(council.name) !== simplifyCouncilKey(COUNCIL_FILTER)) {
        continue
      }

      if (sourceConfig.parserType === 'democracy-club-results-csv' && isCouncilProtectedFromBulkResults(council, existingResultCoverage, protectedOfficialCouncilKeys)) {
        preservedOfficialCouncilSlugs.add(council.slug)
        skipped.push({
          reason: 'preserved-existing-official-results',
          council: council.slug,
          candidateName: result.candidateName,
          ward: result.ward,
        })
        continue
      }

      if (!result.candidateName || !result.ward) {
        skipped.push({ reason: 'missing-result-fields', council: council.slug, result })
        continue
      }
      if (!result.sourceUrl && !sourceConfig.sourceUrl) {
        skipped.push({ reason: 'missing-source-url', council: council.slug, candidateName: result.candidateName, ward: result.ward })
        continue
      }
      if (result.votes === '' || result.votes == null) {
        skipped.push({ reason: 'missing-votes', council: council.slug, candidateName: result.candidateName, ward: result.ward })
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

  await attachCandidateIds(apiBase, rowsForImport)
  rowsForImport = rowsForImport.filter((row) => {
    if (!row.requireCandidateMatch || row.candidateId) return true
    skipped.push({
      reason: 'candidate-not-found',
      council: row.councilSlug,
      candidateName: row.candidateName,
      ward: row.wardName,
    })
    return false
  })

  const rowsByCouncilCount = new Map()
  const matchedWardKeys = new Set()
  for (const row of rowsForImport) {
    rowsByCouncilCount.set(row.councilSlug, Number(rowsByCouncilCount.get(row.councilSlug) || 0) + 1)
    matchedWardKeys.add(`${row.councilSlug}|${row.wardSlug}`)
  }

  const summaryBase = {
    apiBase,
    electionDate,
    configPath: CONFIG_PATH,
    enabledSources: enabledSources.map((source) => source.councilSlug || source.councilName || source.sourceId || source.sourceName),
    rowsReady: rowsForImport.length,
    skipped: skipped.slice(0, 50),
    warnings,
    sourceStats,
    perCouncilResultCounts: Object.fromEntries([...rowsByCouncilCount.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
    matchedCouncils: rowsByCouncilCount.size,
    matchedWards: matchedWardKeys.size,
    skippedCounts: skipped.reduce((counts, row) => {
      counts[row.reason] = Number(counts[row.reason] || 0) + 1
      return counts
    }, {}),
    preservedOfficialCouncils: [...preservedOfficialCouncilSlugs].sort(),
    ...summariseSkippedRows(skipped),
  }

  if (!rowsForImport.length) {
    fail('No result rows were ready to import.', JSON.stringify(summaryBase, null, 2))
  }

  if (checkOnly) {
    const candidateDiagnostics = await buildCandidateMatchDiagnostics(apiBase, rowsForImport)
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      ...summaryBase,
      candidateDiagnostics: summariseCandidateDiagnostics(candidateDiagnostics),
    }, null, 2))
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
    priorityCouncils: sourceConfigs.filter((source) => source.priority).map((source) => source.councilSlug || source.councilName || source.sourceId || source.sourceName),
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
