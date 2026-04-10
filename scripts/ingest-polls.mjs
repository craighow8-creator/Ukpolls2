import process from 'node:process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { comparePollConflictPriority, getUsablePollDate, validatePollRow } from '../src/shared/pollValidation.js'
import fetchWikipediaPolls from './sources/wikipedia.mjs'
import fetchYouGovPoll from './sources/yougov.mjs'
import fetchMoreInCommonPolls from './sources/moreincommon.mjs'
import fetchOpiniumPolls from './sources/opinium.mjs'
import fetchIpsosPolls from './sources/ipsos.mjs'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  (process.env.NODE_ENV === 'production'
    ? 'https://politiscope-api.craighow8.workers.dev'
    : 'http://127.0.0.1:8787')

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data', 'polls')
const SCRIPTS_DIR = path.join(ROOT, 'scripts', 'sources')
const DEFAULT_INGEST_NOTIFIER_PATH = path.join(ROOT, 'scripts', 'notifiers', 'ingestNotifier.mjs')
const CANONICAL_JSON_PATH =
  process.env.POLITISCOPE_POLLS_JSON ||
  path.join(DATA_DIR, 'canonical.json')
const LEGACY_MERGED_JSON_PATH =
  process.env.POLITISCOPE_LEGACY_MERGED_JSON ||
  path.join(DATA_DIR, 'merged.json')

const RELEASE_POLLSTERS = new Set([
  'yougov',
  'more in common',
  'opinium',
  'ipsos',
  'find out now',
  'focaldata',
])

let ingestNotifierPromise = null

async function overwritePolls(polls) {
  const res = await fetch(`${API_BASE}/api/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      section: 'pollsData',
      payload: polls,
    }),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Overwrite failed ${res.status}: ${text}`)
  }

  return { ok: true, raw: text }
}

async function saveIngestStatus(status) {
  const res = await fetch(`${API_BASE}/api/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      section: 'ingestStatus',
      payload: status,
    }),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Ingest status save failed ${res.status}: ${text}`)
  }

  return { ok: true, raw: text }
}

async function loadIngestNotifier() {
  if (!ingestNotifierPromise) {
    ingestNotifierPromise = (async () => {
      const configuredPath = String(process.env.POLITISCOPE_INGEST_NOTIFIER || '').trim()
      const fullPath = configuredPath
        ? (path.isAbsolute(configuredPath) ? configuredPath : path.join(ROOT, configuredPath))
        : DEFAULT_INGEST_NOTIFIER_PATH

      try {
        await fs.access(fullPath)
      } catch {
        return null
      }

      const mod = await import(pathToFileURL(fullPath).href)
      return mod.default || mod.notifyIngestEvent || null
    })()
  }

  return ingestNotifierPromise
}

async function emitIngestNotification(payload) {
  const notifier = await loadIngestNotifier()
  if (!notifier) return false
  await notifier(payload)
  return true
}

function stableToplineFingerprint(poll) {
  const toplines = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp', 'pc', 'oth']
    .map((key) => `${key}:${poll?.[key] ?? ''}`)
    .join('|')

  return [
    String(poll?.pollster || '').trim().toLowerCase(),
    String(poll?.publishedAt || '').trim(),
    String(poll?.fieldworkEnd || '').trim(),
    String(poll?.fieldworkStart || '').trim(),
    toplines,
  ].join('||')
}

function normalizeUrl(url) {
  return String(url || '')
    .trim()
    .replace(/#.*$/, '')
    .replace(/[?&]utm_[^=&]+=[^&#]+/gi, '')
    .replace(/[?&]fbclid=[^&#]+/gi, '')
    .replace(/[?&]gclid=[^&#]+/gi, '')
    .replace(/[?&]$/g, '')
    .replace(/\/$/, '')
}

function normalizePollRecord(poll) {
  if (!poll || typeof poll !== 'object') return null

  const sample =
    poll.sample == null || poll.sample === ''
      ? null
      : Number.isFinite(Number(poll.sample))
        ? Number(poll.sample)
        : null

  return {
    ...poll,
    pollster: String(poll.pollster || '').trim(),
    id: String(poll.id || '').trim(),
    publishedAt: poll.publishedAt || null,
    fieldworkStart: poll.fieldworkStart || null,
    fieldworkEnd: poll.fieldworkEnd || null,
    sourceUrl: normalizeUrl(poll.sourceUrl || poll.url || poll.link || null) || null,
    sample,
  }
}

function keepReleasePollsters(polls) {
  return (polls || []).filter((poll) => RELEASE_POLLSTERS.has(String(poll?.pollster || '').trim().toLowerCase()))
}

function dedupePolls(polls) {
  const byId = new Map()
  const byFingerprint = new Map()

  for (const rawPoll of polls || []) {
    const poll = normalizePollRecord(rawPoll)
    if (!poll || !poll.pollster) continue

    const id = String(poll?.id || '').trim()
    const fingerprint = stableToplineFingerprint(poll)

    const currentById = id ? byId.get(id) : null
    const currentByFingerprint = byFingerprint.get(fingerprint)
    const current = currentById || currentByFingerprint || null

    if (!current || comparePollConflictPriority(poll, current) < 0) {
      if (current) {
        const currentFingerprint = stableToplineFingerprint(current)
        byFingerprint.delete(currentFingerprint)
        if (current.id) byId.delete(String(current.id).trim())
      }
      if (id) byId.set(id, poll)
      byFingerprint.set(fingerprint, poll)
    }
  }

  return [...new Set(byFingerprint.values())]
}

function validatePoll(record) {
  const shared = validatePollRow(record)
  const errors = [...shared.errors]

  if (!record.id) errors.unshift('missing id')

  return { valid: errors.length === 0, errors, warnings: shared.warnings }
}

function filterInvalidPolls(records) {
  const kept = []
  const dropped = []

  for (const record of records || []) {
    const verdict = validatePoll(record)
    if (verdict.valid) kept.push(record)
    else dropped.push({ id: record?.id || null, pollster: record?.pollster || null, errors: verdict.errors })
  }

  return { kept, dropped }
}

function sortNewestFirst(records) {
  return [...records].sort((a, b) => {
    const aScore = a.publishedAt || a.fieldworkEnd || a.fieldworkStart || ''
    const bScore = b.publishedAt || b.fieldworkEnd || b.fieldworkStart || ''
    return bScore.localeCompare(aScore)
  })
}

function logFreshnessCheck(polls, now = new Date()) {
  const pollsters = [
    'YouGov',
    'More in Common',
    'Find Out Now',
    'Opinium',
    'Focaldata',
  ]

  console.log('[ingest-polls] Freshness check:')

  for (const pollster of pollsters) {
    const latest = (polls || []).find(
      (poll) => String(poll?.pollster || '').trim().toLowerCase() === pollster.toLowerCase()
    )
    const latestDate = getUsablePollDate(latest) || null

    if (!latestDate) {
      console.log(`- ${pollster}: latest = missing`)
      console.warn(`[ingest-polls] WARNING: ${pollster} missing (no polls found)`)
      continue
    }

    const ageDays = Math.max(
      0,
      Math.floor((now.getTime() - new Date(`${latestDate}T00:00:00Z`).getTime()) / 86400000)
    )

    console.log(`- ${pollster}: latest = ${latestDate} (${ageDays} day${ageDays === 1 ? '' : 's'} old)`)

    if (ageDays > 7) {
      console.warn(`[ingest-polls] WARNING: ${pollster} looks stale`)
    }
  }
}

async function writeCanonicalOutputs(polls, counts, dropped) {
  await fs.mkdir(DATA_DIR, { recursive: true })

  const payload = JSON.stringify(polls, null, 2)
  await fs.writeFile(CANONICAL_JSON_PATH, payload, 'utf-8')
  await fs.writeFile(LEGACY_MERGED_JSON_PATH, payload, 'utf-8')

  const meta = {
    generatedAt: new Date().toISOString(),
    totalPolls: polls.length,
    counts,
    droppedCount: dropped.length,
    canonicalJsonPath: CANONICAL_JSON_PATH,
    legacyMergedJsonPath: LEGACY_MERGED_JSON_PATH,
    primaryDiscoverySource: 'Wikipedia',
  }

  await fs.writeFile(
    path.join(DATA_DIR, 'canonical.meta.json'),
    JSON.stringify(meta, null, 2),
    'utf-8',
  )
}

function logSuccessSummary({ polls, counts, dropped, overwriteResult }) {
  const finishedAt = new Date().toISOString()
  console.log('[ingest-polls] Summary:')
  console.log(`- API base: ${API_BASE}`)
  console.log(`- Total fetched polls: ${polls.length}`)
  console.log(`- Counts by pollster: ${JSON.stringify(counts)}`)
  console.log(`- Dropped invalid rows: ${dropped.length}`)
  console.log(`- Overwrite result: ${JSON.stringify(overwriteResult)}`)
  console.log(`- Finished at: ${finishedAt}`)
}

function logErrorSummary(error) {
  const finishedAt = new Date().toISOString()
  console.error('[ingest-polls] ERROR:')
  console.error(`- API base: ${API_BASE}`)
  console.error(`- Error: ${error instanceof Error ? error.message : error}`)
  console.error(`- Timestamp: ${finishedAt}`)
}

function buildIngestStatusPayload({ status, polls = [], counts = {}, dropped = [], overwriteResult = null, error = null }) {
  return {
    lastRunAt: new Date().toISOString(),
    status,
    apiBase: API_BASE,
    totalFetched: polls.length,
    droppedInvalidRows: dropped.length,
    overwriteOk: Boolean(overwriteResult?.ok),
    overwriteResult,
    countsByPollster: counts,
    error: error ? String(error instanceof Error ? error.message : error) : null,
  }
}

function buildIngestNotificationPayload({ status, polls = [], dropped = [], overwriteResult = null, error = null }) {
  return {
    status,
    timestamp: new Date().toISOString(),
    apiBase: API_BASE,
    totalFetched: polls.length,
    droppedInvalidRows: dropped.length,
    overwriteResult,
    error: error ? String(error instanceof Error ? error.message : error) : null,
  }
}

async function fetchSource(label, fetcher) {
  console.log(`Fetching ${label}...`)
  const result = await fetcher()

  if (Array.isArray(result)) {
    return result.filter(Boolean)
  }

  return result ? [result] : []
}

async function loadOptionalFetcher(moduleFilename) {
  const fullPath = path.join(SCRIPTS_DIR, moduleFilename)
  try {
    await fs.access(fullPath)
  } catch {
    return null
  }

  const mod = await import(pathToFileURL(fullPath).href)
  return mod.default || mod.fetchPolls || mod.fetchSourcePolls || null
}

async function main() {
  console.log(`[ingest-polls] Using API base: ${API_BASE}`)
  if (API_BASE.includes('workers.dev')) {
    console.warn(`[ingest-polls] WARNING: API base is a workers.dev host; this is the remote target.`)
  }

  const sourceSpecs = [
    ['Wikipedia', fetchWikipediaPolls],
    ['YouGov', fetchYouGovPoll],
    ['More in Common', fetchMoreInCommonPolls],
    ['Opinium', fetchOpiniumPolls],
    ['Ipsos', fetchIpsosPolls],
  ]

  const optionalModules = [
    ['Find Out Now', 'findoutnow.mjs'],
    ['Good Growth Foundation', 'goodgrowthfoundation.mjs'],
    ['Focaldata', 'focaldata.mjs'],
    ['JL Partners', 'jlpartners.mjs'],
    ['Lord Ashcroft Polls', 'lordAshcroft.mjs'],
  ]

  for (const [label, moduleFilename] of optionalModules) {
    const fetcher = await loadOptionalFetcher(moduleFilename)
    if (fetcher) {
      sourceSpecs.push([label, fetcher])
    } else {
      console.log(`Skipping ${label} (module not present: scripts/sources/${moduleFilename})`)
    }
  }

  const sourceResults = await Promise.all(
    sourceSpecs.map(([label, fetcher]) => fetchSource(label, fetcher))
  )

  const deduped = dedupePolls(sourceResults.flat())
  const releaseOnly = deduped
  const { kept, dropped } = filterInvalidPolls(releaseOnly)
  const polls = sortNewestFirst(kept)
  logFreshnessCheck(polls)

  const counts = {}
  polls.forEach((p) => {
    const name = p?.pollster || 'Unknown'
    counts[name] = (counts[name] || 0) + 1
  })

  console.log('Poll counts by pollster:')
  console.log(JSON.stringify(counts, null, 2))

  if (dropped.length) {
    console.log('[ingest-polls] Dropped invalid rows:')
    dropped.slice(0, 20).forEach((row) => {
      console.log(`- ${row.pollster || 'Unknown'} ${row.id || ''}: ${row.errors.join('; ')}`)
    })
    if (dropped.length > 20) {
      console.log(`- ... ${dropped.length - 20} more dropped rows`)
    }
  }

  await writeCanonicalOutputs(polls, counts, dropped)

  console.log(`Fetched ${polls.length} poll record(s) after filtering + dedupe:`)
  console.log(JSON.stringify(polls, null, 2))

  console.log('Overwriting Worker pollsData...')
  const result = await overwritePolls(polls)
  const ingestStatus = buildIngestStatusPayload({
    status: 'success',
    polls,
    counts,
    dropped,
    overwriteResult: result,
  })

  try {
    await saveIngestStatus(ingestStatus)
  } catch (statusError) {
    console.warn('[ingest-polls] WARNING: failed to persist ingest status', statusError)
  }

  await emitIngestNotification(buildIngestNotificationPayload({
    status: 'success',
    polls,
    dropped,
    overwriteResult: result,
  })).catch((notifyError) => {
    console.warn('[ingest-polls] WARNING: notifier hook failed', notifyError)
  })

  console.log('Overwrite result:')
  console.log(JSON.stringify(result, null, 2))
  logSuccessSummary({ polls, counts, dropped, overwriteResult: result })
}

main().catch(async (err) => {
  const ingestStatus = buildIngestStatusPayload({
    status: 'error',
    error: err,
  })
  await saveIngestStatus(ingestStatus).catch((statusError) => {
    console.warn('[ingest-polls] WARNING: failed to persist ingest status', statusError)
  })
  await emitIngestNotification(buildIngestNotificationPayload({
    status: 'error',
    error: err,
  })).catch((notifyError) => {
    console.warn('[ingest-polls] WARNING: notifier hook failed', notifyError)
  })
  logErrorSummary(err)
  console.error('Ingest failed:')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
