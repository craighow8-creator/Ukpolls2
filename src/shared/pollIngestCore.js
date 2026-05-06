import { comparePollConflictPriority, getUsablePollDate, validatePollRow } from './pollValidation.js'
import fetchWikipediaPolls from '../../scripts/sources/wikipedia.mjs'
import fetchYouGovPoll from '../../scripts/sources/yougov.mjs'
import fetchMoreInCommonPolls from '../../scripts/sources/moreInCommon.mjs'
import fetchOpiniumPolls from '../../scripts/sources/opinium.mjs'
import fetchIpsosPolls from '../../scripts/sources/ipsos.mjs'
import fetchFindOutNowPolls from '../../scripts/sources/findoutnow.mjs'
import fetchFocaldataPolls from '../../scripts/sources/focaldata.mjs'

const RELEASE_POLLSTERS = new Set([
  'yougov',
  'more in common',
  'opinium',
  'ipsos',
  'find out now',
  'focaldata',
])

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
    date: poll.date || poll.fieldworkEnd || poll.publishedAt || poll.fieldworkStart || null,
    publishedAt: poll.publishedAt || null,
    fieldworkStart: poll.fieldworkStart || null,
    fieldworkEnd: poll.fieldworkEnd || null,
    sourceUrl: normalizeUrl(poll.sourceUrl || poll.url || poll.link || null) || null,
    sample,
  }
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
    const aScore = getUsablePollDate(a) || ''
    const bScore = getUsablePollDate(b) || ''
    return bScore.localeCompare(aScore)
  })
}

function logFreshnessCheck(polls, logger = console) {
  const pollsters = ['YouGov', 'More in Common', 'Find Out Now', 'Opinium', 'Ipsos', 'Focaldata']

  logger.log('[ingest-polls] Freshness check:')

  for (const pollster of pollsters) {
    const latest = (polls || []).find(
      (poll) => String(poll?.pollster || '').trim().toLowerCase() === pollster.toLowerCase()
    )
    const latestDate = getUsablePollDate(latest) || null

    if (!latestDate) {
      logger.log(`- ${pollster}: latest = missing`)
      logger.warn(`[ingest-polls] WARNING: ${pollster} missing (no polls found)`)
      continue
    }

    const ageDays = Math.max(
      0,
      Math.floor((Date.now() - new Date(`${latestDate}T00:00:00Z`).getTime()) / 86400000)
    )

    logger.log(`- ${pollster}: latest = ${latestDate} (${ageDays} day${ageDays === 1 ? '' : 's'} old)`)

    if (ageDays > 7) {
      logger.warn(`[ingest-polls] WARNING: ${pollster} looks stale`)
    }
  }
}

async function fetchSource(label, fetcher, logger = console) {
  const startedAt = Date.now()
  try {
    logger.log(`Fetching ${label}...`)
    const result = await fetcher()
    const rows = Array.isArray(result) ? result.filter(Boolean) : result ? [result] : []
    return {
      source: label,
      rows,
      status: rows.length ? 'ok' : 'empty',
      durationMs: Date.now() - startedAt,
      warnings: rows.length ? [] : ['Source returned zero rows'],
      zeroRows: rows.length === 0,
    }
  } catch (err) {
    const message = err?.message || String(err)
    logger.warn(`[ingest-polls] WARNING: ${label} failed`, message)
    return {
      source: label,
      rows: [],
      status: 'failed',
      durationMs: Date.now() - startedAt,
      warnings: [message],
      zeroRows: true,
    }
  }
}

function buildSourceSpecs() {
  return [
    ['Wikipedia', fetchWikipediaPolls],
    ['YouGov', fetchYouGovPoll],
    ['More in Common', fetchMoreInCommonPolls],
    ['Opinium', fetchOpiniumPolls],
    ['Ipsos', fetchIpsosPolls],
    ['Find Out Now', fetchFindOutNowPolls],
    ['Focaldata', fetchFocaldataPolls],
  ]
}

async function defaultSaveIngestStatus({ env, statusPayload }) {
  if (!env?.DB) return null
  const payload = JSON.stringify(statusPayload)
  await env.DB.prepare(
    `INSERT INTO content (section, data, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(section) DO UPDATE SET
       data = excluded.data,
       updated_at = excluded.updated_at`
  ).bind('ingestStatus', payload, new Date().toISOString()).run()
  return { ok: true }
}

async function defaultOverwritePolls({ env, polls }) {
  if (!env?.DB) {
    throw new Error('Missing DB binding')
  }

  await env.DB.prepare(
    `INSERT INTO content (section, data, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(section) DO UPDATE SET
       data = excluded.data,
       updated_at = excluded.updated_at`
  ).bind('pollsData', JSON.stringify(polls), new Date().toISOString()).run()

  return { ok: true }
}

function countPollsterRows(polls, pollsterName) {
  const wanted = String(pollsterName || '').trim().toLowerCase()
  return (Array.isArray(polls) ? polls : []).filter(
    (poll) => String(poll?.pollster || '').trim().toLowerCase() === wanted
  ).length
}

function buildPartialOverwriteGuard({ existingPolls, polls, sourceStatus }) {
  const existingRows = Array.isArray(existingPolls) ? existingPolls.length : 0
  const newRows = Array.isArray(polls) ? polls.length : 0
  const warnings = []

  if (existingRows >= 150 && newRows < existingRows * 0.75) {
    warnings.push(`New poll ingest returned ${newRows} rows, below 75% of existing ${existingRows} rows`)
  }

  if (newRows < 150) {
    warnings.push(`New poll ingest returned ${newRows} rows, below the Worker full-ingest safety floor of 150`)
  }

  const existingMoreInCommonRows = countPollsterRows(existingPolls, 'More in Common')
  const newMoreInCommonRows = countPollsterRows(polls, 'More in Common')
  const moreInCommonSource = (sourceStatus || []).find(
    (source) => String(source?.source || '').trim().toLowerCase() === 'more in common'
  )
  if (existingMoreInCommonRows > 0 && (newMoreInCommonRows === 0 || moreInCommonSource?.zeroRows)) {
    warnings.push('More in Common returned zero rows while existing data has More in Common coverage')
  }

  return {
    partial: warnings.length > 0,
    existingRows,
    newRows,
    warnings,
  }
}

async function guardedWorkerOverwritePolls({ env, polls, sourceStatus }) {
  if (!env?.DB) {
    throw new Error('Missing DB binding')
  }

  const existingResult = await env.DB.prepare('SELECT data FROM content WHERE section = ?').bind('pollsData').first()
  let existingPolls = []
  if (existingResult?.data) {
    try {
      const parsed = JSON.parse(existingResult.data)
      existingPolls = Array.isArray(parsed) ? parsed : []
    } catch {
      existingPolls = []
    }
  }

  const guard = buildPartialOverwriteGuard({ existingPolls, polls, sourceStatus })
  if (guard.partial) {
    return {
      ok: false,
      preserved: true,
      partial: true,
      existingRows: guard.existingRows,
      newRows: guard.newRows,
      warnings: [
        'Worker ingest produced partial coverage; existing pollsData was preserved.',
        ...guard.warnings,
      ],
    }
  }

  return defaultOverwritePolls({ env, polls })
}

export async function runPollIngest({
  env = null,
  logger = console,
  persistCanonicalOutputs = null,
  sourceSpecs = buildSourceSpecs(),
  now = new Date(),
  overwritePolls = defaultOverwritePolls,
  saveIngestStatus = defaultSaveIngestStatus,
} = {}) {
  const apiBase = env?.POLITISCOPE_API_BASE || 'https://politiscope-api.craighow8.workers.dev'

  logger.log(`[ingest-polls] Using API base: ${apiBase}`)
  if (String(apiBase).includes('workers.dev')) {
    logger.warn(`[ingest-polls] WARNING: API base is a workers.dev host; this is the remote target.`)
  }

  const sourceResults = await Promise.all(
    sourceSpecs.map(([label, fetcher]) => fetchSource(label, fetcher, logger))
  )
  const sourceStatus = sourceResults.map(({ source, status, rows, durationMs, warnings, zeroRows }) => ({
    source,
    status,
    rows: Array.isArray(rows) ? rows.length : 0,
    durationMs,
    warnings: Array.isArray(warnings) ? warnings : [],
    zeroRows: Boolean(zeroRows),
  }))

  const deduped = dedupePolls(sourceResults.flatMap((result) => result.rows || []))
  const releaseOnly = deduped.filter((poll) =>
    RELEASE_POLLSTERS.has(String(poll?.pollster || '').trim().toLowerCase())
  )
  const { kept, dropped } = filterInvalidPolls(releaseOnly)
  const polls = sortNewestFirst(kept)

  logFreshnessCheck(polls, logger)

  const counts = {}
  for (const poll of polls) {
    const name = poll?.pollster || 'Unknown'
    counts[name] = (counts[name] || 0) + 1
  }

  logger.log('Poll counts by pollster:')
  logger.log(JSON.stringify(counts, null, 2))

  if (dropped.length) {
    logger.log('[ingest-polls] Dropped invalid rows:')
    dropped.slice(0, 20).forEach((row) => {
      logger.log(`- ${row.pollster || 'Unknown'} ${row.id || ''}: ${row.errors.join('; ')}`)
    })
    if (dropped.length > 20) {
      logger.log(`- ... ${dropped.length - 20} more dropped rows`)
    }
  }

  if (persistCanonicalOutputs) {
    await persistCanonicalOutputs({ polls, counts, dropped, now })
  }

  logger.log(`Fetched ${polls.length} poll record(s) after filtering + dedupe.`)
  if (env?.POLITISCOPE_DEBUG_INGEST === '1') {
    logger.log(JSON.stringify(polls, null, 2))
  }

  logger.log('Overwriting Worker pollsData...')
  const overwriteResult = await overwritePolls({ env, polls, sourceStatus, counts, dropped })
  const preserved = Boolean(overwriteResult?.preserved)
  const statusWarnings = Array.isArray(overwriteResult?.warnings) ? overwriteResult.warnings : []

  const statusPayload = {
    lastRunAt: now.toISOString(),
    status: preserved ? 'partial' : 'success',
    apiBase,
    totalFetched: polls.length,
    droppedInvalidRows: dropped.length,
    overwriteOk: Boolean(overwriteResult?.ok) && !preserved,
    preserved,
    overwriteResult,
    countsByPollster: counts,
    sourceStatus,
    warnings: statusWarnings,
    error: null,
  }

  await saveIngestStatus({ env, statusPayload }).catch((statusError) => {
    logger.warn('[ingest-polls] WARNING: failed to persist ingest status', statusError)
  })

  logger.log('Overwrite result:')
  logger.log(JSON.stringify(overwriteResult, null, 2))
  logger.log('[ingest-polls] Summary:')
  logger.log(`- API base: ${apiBase}`)
  logger.log(`- Total fetched polls: ${polls.length}`)
  logger.log(`- Counts by pollster: ${JSON.stringify(counts)}`)
  logger.log(`- Dropped invalid rows: ${dropped.length}`)
  logger.log(`- Overwrite result: ${JSON.stringify(overwriteResult)}`)
  logger.log(`- Finished at: ${new Date().toISOString()}`)

  return { ok: !preserved, polls, counts, dropped, sourceStatus, overwriteResult, statusPayload }
}

export async function runPollIngestForWorker(env, ctx, logger = console) {
  const result = await runPollIngest({ env, logger, overwritePolls: guardedWorkerOverwritePolls })
  if (ctx?.waitUntil) {
    ctx.waitUntil(Promise.resolve(result))
  }
  return result
}
