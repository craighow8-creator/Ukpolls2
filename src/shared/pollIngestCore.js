import { comparePollConflictPriority, getUsablePollDate, validatePollRow } from './pollValidation.js'
import fetchWikipediaPolls from '../../scripts/sources/wikipedia.mjs'
import fetchYouGovPoll from '../../scripts/sources/yougov.mjs'
import fetchMoreInCommonPolls from '../../scripts/sources/moreInCommon.mjs'
import fetchOpiniumPolls from '../../scripts/sources/opinium.mjs'
import fetchIpsosPolls from '../../scripts/sources/ipsos.mjs'
import fetchFindOutNowPolls from '../../scripts/sources/findoutnow.mjs'
import fetchGoodGrowthFoundationPolls from '../../scripts/sources/goodgrowthfoundation.mjs'
import fetchFocaldataPolls from '../../scripts/sources/focaldata.mjs'
import fetchJLPartnersPolls from '../../scripts/sources/jlpartners.mjs'

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
    date: poll.date || poll.fieldworkEnd || poll.publishedAt || null,
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
    const aScore = a.publishedAt || a.fieldworkEnd || a.fieldworkStart || ''
    const bScore = b.publishedAt || b.fieldworkEnd || b.fieldworkStart || ''
    return bScore.localeCompare(aScore)
  })
}

function logFreshnessCheck(polls, logger = console) {
  const pollsters = ['YouGov', 'More in Common', 'Find Out Now', 'Opinium', 'Focaldata']

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
  try {
    logger.log(`Fetching ${label}...`)
    const result = await fetcher()
    if (Array.isArray(result)) return result.filter(Boolean)
    return result ? [result] : []
  } catch (err) {
    logger.warn(`[ingest-polls] WARNING: ${label} failed`, err?.message || err)
    return []
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
    ['Good Growth Foundation', fetchGoodGrowthFoundationPolls],
    ['Focaldata', fetchFocaldataPolls],
    ['JL Partners', fetchJLPartnersPolls],
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

  const deduped = dedupePolls(sourceResults.flat())
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

  logger.log(`Fetched ${polls.length} poll record(s) after filtering + dedupe:`)
  logger.log(JSON.stringify(polls, null, 2))

  logger.log('Overwriting Worker pollsData...')
  const overwriteResult = await overwritePolls({ env, polls })

  const statusPayload = {
    lastRunAt: now.toISOString(),
    status: 'success',
    apiBase,
    totalFetched: polls.length,
    droppedInvalidRows: dropped.length,
    overwriteOk: Boolean(overwriteResult?.ok),
    overwriteResult,
    countsByPollster: counts,
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

  return { ok: true, polls, counts, dropped, overwriteResult, statusPayload }
}

export async function runPollIngestForWorker(env, ctx, logger = console) {
  const result = await runPollIngest({ env, logger })
  if (ctx?.waitUntil) {
    ctx.waitUntil(Promise.resolve(result))
  }
  return result
}
