import process from 'node:process'
import { pathToFileURL } from 'node:url'

const DEFAULT_API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

const DEFAULT_ELECTION_DATE =
  process.env.DEMOCRACY_CLUB_ELECTION_DATE ||
  process.argv.find((arg) => arg.startsWith('--election-date='))?.split('=')[1] ||
  '2026-05-07'

const DEFAULT_CHUNK_SIZE = Number(
  process.argv.find((arg) => arg.startsWith('--chunk-size='))?.split('=')[1] || '5',
)

const DEFAULT_RETRY_COUNT = Number(
  process.argv.find((arg) => arg.startsWith('--retries='))?.split('=')[1] || '3',
)

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function buildCsvUrl(electionDate) {
  const url = new URL('https://candidates.democracyclub.org.uk/data/export_csv/')
  url.searchParams.set('election_date', electionDate)
  url.searchParams.append('field_group', 'election')
  url.searchParams.append('field_group', 'candidacy')
  url.searchParams.append('extra_fields', 'gss')
  url.searchParams.append('extra_fields', 'post_id')
  url.searchParams.append('extra_fields', 'organisation_name')
  url.searchParams.append('extra_fields', 'person_url')
  url.searchParams.append('extra_fields', 'person_last_updated')
  url.searchParams.append('extra_fields', 'statement_last_updated')
  return url.toString()
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

function isLocalElectionRow(row = {}) {
  const ballotId = String(row.ballot_paper_id || '').trim().toLowerCase()
  const electionId = String(row.election_id || '').trim().toLowerCase()
  return /(^|[.])local([.:-]|$)/.test(ballotId) || /(^|[.])local([.:-]|$)/.test(electionId)
}

function mapCandidateRow(row = {}) {
  return {
    person_id: String(row.person_id || '').trim(),
    person_name: String(row.person_name || row.sopn_first_names || '').trim(),
    party_name: String(row.party_name || row.party_description_text || '').trim(),
    election_id: String(row.election_id || '').trim(),
    ballot_paper_id: String(row.ballot_paper_id || '').trim(),
    election_date: String(row.election_date || '').trim(),
    election_current: String(row.election_current || '').trim(),
    post_label: String(row.post_label || '').trim(),
    cancelled_poll: String(row.cancelled_poll || '').trim(),
    seats_contested: String(row.seats_contested || '').trim(),
    gss: String(row.gss || '').trim(),
    post_id: String(row.post_id || '').trim(),
    organisation_name: String(row.organisation_name || '').trim(),
    person_url: String(row.person_url || '').trim(),
    person_last_updated: String(row.person_last_updated || '').trim(),
    statement_last_updated: String(row.statement_last_updated || '').trim(),
  }
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildCouncilLookupKeys(value) {
  const source = slugify(value)
  const keys = new Set()
  if (!source) return keys

  keys.add(source)
  keys.add(source.replace(/-city-council$/i, ''))
  keys.add(source.replace(/-metropolitan-borough-council$/i, ''))
  keys.add(source.replace(/-borough-council$/i, ''))
  keys.add(source.replace(/-district-council$/i, ''))
  keys.add(source.replace(/-county-council$/i, ''))
  keys.add(source.replace(/-council$/i, ''))
  return new Set([...keys].filter(Boolean))
}

function buildWardLookupKeys(value) {
  const key = slugify(String(value || '').replace(/\bward\b/gi, ''))
  return new Set(key ? [key] : [])
}

function chunkArray(values, size) {
  const chunks = []
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size))
  }
  return chunks
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postJson(apiBase, body, options = {}) {
  const retries = Number.isFinite(options.retries) && options.retries >= 0 ? options.retries : DEFAULT_RETRY_COUNT
  const action = String(body?.action || 'request')
  const chunkIndex = Number(body?.chunkIndex || 0)
  const totalChunks = Number(body?.totalChunks || 0)
  const endpoint = `${apiBase.replace(/\/$/, '')}/api/local-vote/ingest/democracy-club-candidates`

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).catch((error) => {
      if (attempt < retries) return null
      fail('Failed to reach Democracy Club local vote ingest endpoint.', error?.message || String(error))
    })

    if (!response) {
      await sleep(500 * 2 ** attempt)
      continue
    }

    const responseText = await response.text().catch(() => '')
    let payload = null
    try {
      payload = responseText ? JSON.parse(responseText) : null
    } catch {
      payload = null
    }

    if (response.ok) {
      return payload
    }

    const isTransient = [502, 503, 504].includes(response.status)
    if (isTransient && attempt < retries) {
      console.warn(
        `[DemocracyClubIngest] ${action}${chunkIndex ? ` chunk ${chunkIndex}/${totalChunks || '?'}` : ''} returned ${response.status}. Retrying...`,
      )
      await sleep(750 * 2 ** attempt)
      continue
    }

    const error = new Error(
      `Democracy Club candidate ingest failed during ${action}${chunkIndex ? ` chunk ${chunkIndex}/${totalChunks || '?'}` : ''} (${response.status}).`,
    )
    error.status = response.status
    error.responseText = responseText
    error.payload = payload
    error.action = action
    error.chunkIndex = chunkIndex
    error.totalChunks = totalChunks
    throw error
  }

  fail(`Democracy Club candidate ingest failed during ${action}.`)
}

async function importChunkWithFallback(apiBase, body) {
  try {
    return await postJson(apiBase, body)
  } catch (error) {
    const rows = Array.isArray(body?.rows) ? body.rows : []
    const canSplit =
      [502, 503, 504].includes(Number(error?.status || 0)) &&
      body?.action === 'chunk' &&
      rows.length > 1

    if (!canSplit) {
      fail(
        error?.message || 'Democracy Club candidate ingest failed.',
        error?.responseText || (error?.payload ? JSON.stringify(error.payload, null, 2) : ''),
      )
    }

    const midpoint = Math.ceil(rows.length / 2)
    const firstHalf = rows.slice(0, midpoint)
    const secondHalf = rows.slice(midpoint)

    console.warn(
      `[DemocracyClubIngest] Splitting failing chunk ${body.chunkIndex}/${body.totalChunks} from ${rows.length} rows to ${firstHalf.length}+${secondHalf.length}.`,
    )

    const firstResult = await importChunkWithFallback(apiBase, {
      ...body,
      rows: firstHalf,
    })

    const secondResult = await importChunkWithFallback(apiBase, {
      ...body,
      rows: secondHalf,
    })

    return {
      ok: true,
      matchedRows: Number(firstResult?.matchedRows || 0) + Number(secondResult?.matchedRows || 0),
      insertedBallots: Number(firstResult?.insertedBallots || 0) + Number(secondResult?.insertedBallots || 0),
      insertedCandidates: Number(firstResult?.insertedCandidates || 0) + Number(secondResult?.insertedCandidates || 0),
      candidateBallotLinks:
        Number(firstResult?.candidateBallotLinks || 0) + Number(secondResult?.candidateBallotLinks || 0),
      rowsUpserted: Number(firstResult?.rowsUpserted || 0) + Number(secondResult?.rowsUpserted || 0),
      unmatchedCouncils: [
        ...(firstResult?.unmatchedCouncils || []),
        ...(secondResult?.unmatchedCouncils || []),
      ],
      unmatchedWards: [
        ...(firstResult?.unmatchedWards || []),
        ...(secondResult?.unmatchedWards || []),
      ],
    }
  }
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
  const councilsById = new Map()
  const councilsByNameKey = new Map()
  const wardsByGss = new Map()
  const wardsByMapit = new Map()
  const wardsByCouncilAndNameKey = new Map()

  for (const council of payload.councils || []) {
    councilsById.set(council.id, council)
    for (const key of [
      ...buildCouncilLookupKeys(council.slug),
      ...buildCouncilLookupKeys(council.name),
      ...buildCouncilLookupKeys(council.supportedAreaLabel),
    ]) {
      councilsByNameKey.set(key, council)
    }
  }

  for (const ward of payload.wards || []) {
    if (ward.gssCode) wardsByGss.set(String(ward.gssCode).trim().toUpperCase(), ward)
    if (ward.mapitAreaId) wardsByMapit.set(String(ward.mapitAreaId).trim(), ward)

    const keys = new Set([
      ...buildWardLookupKeys(ward.name),
      ...buildWardLookupKeys(ward.slug),
      ...((Array.isArray(ward.aliases) ? ward.aliases : []).flatMap((alias) => [...buildWardLookupKeys(alias)])),
    ])

    for (const key of keys) {
      wardsByCouncilAndNameKey.set(`${ward.councilId}:${key}`, ward)
    }
  }

  return {
    councilsById,
    councilsByNameKey,
    wardsByGss,
    wardsByMapit,
    wardsByCouncilAndNameKey,
  }
}

function matchCandidateRowLocally(row, lookupMaps) {
  const rawGss = String(row.gss || '').trim()
  const postId = String(row.post_id || '').trim()
  const organisationName = String(row.organisation_name || '').trim()
  const postLabel = String(row.post_label || '').trim()

  let ward = null
  let council = null
  let matchMethod = ''

  const gssCandidates = [rawGss, rawGss.replace(/^gss:/i, ''), postId.replace(/^gss:/i, '')]
    .map((value) => String(value || '').trim().toUpperCase())
    .filter(Boolean)

  for (const gssCode of gssCandidates) {
    ward = lookupMaps.wardsByGss.get(gssCode) || null
    if (ward) {
      council = lookupMaps.councilsById.get(ward.councilId) || null
      matchMethod = rawGss ? 'gss' : 'post_id:gss'
      break
    }
  }

  if (!ward && postId) {
    ward = lookupMaps.wardsByMapit.get(postId) || null
    if (ward) {
      council = lookupMaps.councilsById.get(ward.councilId) || null
      matchMethod = 'post_id'
    }
  }

  if (!council && organisationName) {
    for (const key of buildCouncilLookupKeys(organisationName)) {
      council = lookupMaps.councilsByNameKey.get(key) || null
      if (council) {
        matchMethod = matchMethod || 'organisation_name'
        break
      }
    }
  }

  if (!ward && council && postLabel) {
    for (const wardKey of buildWardLookupKeys(postLabel)) {
      ward = lookupMaps.wardsByCouncilAndNameKey.get(`${council.id}:${wardKey}`) || null
      if (ward) {
        matchMethod = matchMethod ? `${matchMethod}+post_label` : 'organisation_name+post_label'
        break
      }
    }
  }

  if (!council && ward) {
    council = lookupMaps.councilsById.get(ward.councilId) || null
  }

  return { council, ward, matchMethod }
}

function normalizeMatchedRow(row, council, ward, electionDate, matchMethod) {
  return {
    councilId: council.id,
    councilSlug: council.slug,
    councilName: council.name,
    wardId: ward.id,
    wardSlug: ward.slug,
    wardName: ward.name,
    electionDate,
    ballotPaperId: row.ballot_paper_id,
    personName: row.person_name,
    partyName: row.party_name,
    personUrl: row.person_url,
    personLastUpdated: row.person_last_updated,
    statementLastUpdated: row.statement_last_updated,
    updatedAt: row.person_last_updated || row.statement_last_updated || electionDate,
    postLabel: row.post_label,
    organisationName: row.organisation_name,
    cancelledPoll: row.cancelled_poll,
    gss: row.gss,
    postId: row.post_id,
    matchMethod,
  }
}

function mergeUnmatchedLists(existing = [], incoming = []) {
  const merged = new Map(existing.map((item) => [item.key, { ...item }]))

  for (const item of incoming) {
    const current = merged.get(item.key) || { ...item, count: 0 }
    current.count += Number(item.count || 0)
    if (!current.sample && item.sample) current.sample = item.sample
    merged.set(item.key, current)
  }

  return [...merged.values()].sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
}

function validateImportSummary(summary) {
  const errors = []

  if ((summary.validation?.ballotCount || 0) <= 0) {
    errors.push('Expected ballot count > 0 after import.')
  }

  if ((summary.validation?.candidateCount || 0) <= 0) {
    errors.push('Expected candidate count > 0 after import.')
  }

  if ((summary.validation?.linkedCandidateCount || 0) !== (summary.validation?.candidateCount || 0)) {
    errors.push('Every imported candidate should have ballot linkage.')
  }

  return errors
}

export async function ingestDemocracyClubCandidates() {
  const electionDate = DEFAULT_ELECTION_DATE
  const chunkSize = Number.isFinite(DEFAULT_CHUNK_SIZE) && DEFAULT_CHUNK_SIZE > 0 ? DEFAULT_CHUNK_SIZE : 25
  const apiBase = DEFAULT_API_BASE
  const csvUrl =
    process.argv.find((arg) => arg.startsWith('--csv-url='))?.split('=')[1] || buildCsvUrl(electionDate)

  const csvResponse = await fetch(csvUrl).catch((error) => {
    fail('Failed to fetch Democracy Club CSV export.', error?.message || String(error))
  })

  if (!csvResponse.ok) {
    fail(`Democracy Club CSV fetch failed (${csvResponse.status}).`, csvUrl)
  }

  const csvText = await csvResponse.text()
  const parsedRows = parseCsv(csvText)
  const localRows = parsedRows.filter(isLocalElectionRow).map(mapCandidateRow)
  const validRows = localRows.filter(
    (row) => row.person_name && row.ballot_paper_id && row.election_date === electionDate,
  )

  const lookupPayload = await fetchLookupIndex(apiBase)
  const lookupMaps = buildLookupMaps(lookupPayload)

  const matchedRowsForImport = []
  const unmatchedCouncilsLocal = new Map()
  const unmatchedWardsLocal = new Map()

  const noteUnmatched = (map, key, sample) => {
    if (!key) return
    const current = map.get(key) || { count: 0, sample }
    current.count += 1
    if (!current.sample && sample) current.sample = sample
    map.set(key, current)
  }

  for (const row of validRows) {
    const { council, ward, matchMethod } = matchCandidateRowLocally(row, lookupMaps)

    if (!council) {
      noteUnmatched(unmatchedCouncilsLocal, String(row.organisation_name || '(unknown council)').trim(), {
        organisationName: row.organisation_name || '',
        postLabel: row.post_label || '',
        gss: row.gss || '',
        postId: row.post_id || '',
      })
      continue
    }

    if (!ward) {
      noteUnmatched(
        unmatchedWardsLocal,
        `${council.slug}:${String(row.post_label || '(unknown ward)').trim()}`,
        {
          councilSlug: council.slug,
          organisationName: row.organisation_name || '',
          postLabel: row.post_label || '',
          gss: row.gss || '',
          postId: row.post_id || '',
        },
      )
      continue
    }

    matchedRowsForImport.push(normalizeMatchedRow(row, council, ward, electionDate, matchMethod))
  }

  if (!validRows.length) {
    fail('No valid local election candidate rows found for the target election date.', electionDate)
  }

  const localUnmatchedCouncils = [...unmatchedCouncilsLocal.entries()].map(([key, value]) => ({
    key,
    count: value.count,
    sample: value.sample,
  }))
  const localUnmatchedWards = [...unmatchedWardsLocal.entries()].map(([key, value]) => ({
    key,
    count: value.count,
    sample: value.sample,
  }))

  if (!matchedRowsForImport.length) {
    fail(
      'No Democracy Club candidate rows matched the local vote lookup index.',
      JSON.stringify(
        {
          validRows: validRows.length,
          unmatchedCouncils: localUnmatchedCouncils.slice(0, 25),
          unmatchedWards: localUnmatchedWards.slice(0, 25),
        },
        null,
        2,
      ),
    )
  }

  const runId = `local_vote_ingest_democracy_club_${Date.now()}`
  const started = await postJson(apiBase, {
    action: 'start',
    runId,
    electionDate,
    csvUrl,
    totalRows: matchedRowsForImport.length,
  })

  const chunks = chunkArray(matchedRowsForImport, chunkSize)
  let matchedRows = 0
  let insertedBallots = 0
  let insertedCandidates = 0
  let candidateBallotLinks = 0
  let rowsUpserted = 0
  let unmatchedCouncils = localUnmatchedCouncils
  let unmatchedWards = localUnmatchedWards

  for (let index = 0; index < chunks.length; index += 1) {
    console.log(`[DemocracyClubIngest] Importing chunk ${index + 1}/${chunks.length} (${chunks[index].length} rows)`)
    const payload = await importChunkWithFallback(apiBase, {
      action: 'chunk',
      runId: started.runId,
      electionDate,
      csvUrl,
      rows: chunks[index],
      chunkIndex: index + 1,
      totalChunks: chunks.length,
    })

    matchedRows += Number(payload.matchedRows || 0)
    insertedBallots += Number(payload.insertedBallots || 0)
    insertedCandidates += Number(payload.insertedCandidates || 0)
    candidateBallotLinks += Number(payload.candidateBallotLinks || 0)
    rowsUpserted += Number(payload.rowsUpserted || 0)
    unmatchedCouncils = mergeUnmatchedLists(unmatchedCouncils, payload.unmatchedCouncils || [])
    unmatchedWards = mergeUnmatchedLists(unmatchedWards, payload.unmatchedWards || [])
  }

  const finished = await postJson(apiBase, {
    action: 'finish',
    runId: started.runId,
    electionDate,
    csvUrl,
    unmatchedCouncils: unmatchedCouncils.slice(0, 50),
    unmatchedWards: unmatchedWards.slice(0, 50),
  })

  const summary = {
    ok: finished.ok,
    runId: started.runId,
    csvUrl,
    electionDate,
    parsedRowCount: parsedRows.length,
    localRowCount: localRows.length,
    importedRowCount: validRows.length,
    matchedRows,
    locallyMatchedRows: matchedRowsForImport.length,
    locallySkippedRows: validRows.length - matchedRowsForImport.length,
    insertedBallots,
    insertedCandidates,
    candidateBallotLinks,
    rowsUpserted,
    unmatchedCouncils: unmatchedCouncils.slice(0, 25),
    unmatchedWards: unmatchedWards.slice(0, 25),
    validation: finished.validation || {},
  }

  const validationErrors = validateImportSummary(summary)
  if (validationErrors.length) {
    fail('Democracy Club candidate import validation failed.', JSON.stringify({ ...summary, validationErrors }, null, 2))
  }

  console.log(JSON.stringify(summary, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestDemocracyClubCandidates().catch((error) => {
    fail('Unexpected Democracy Club candidate import failure.', error?.stack || error?.message || String(error))
  })
}
