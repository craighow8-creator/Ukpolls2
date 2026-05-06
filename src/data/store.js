import { API_BASE } from '../constants'
import DEFAULTS from './data.js'
import { POLICY_RECORDS } from './policy/policyRecords.js'
import { POLICY_TAXONOMY } from './policy/policyTaxonomy.js'
import { POLICY_DELIVERY } from './policy/policyDelivery.js'
import { buildPollContext } from './pollEngine'
import { comparePollConflictPriority, getConflictDateMs, getUsablePollDate, isDisplaySafePoll } from '../shared/pollValidation.js'
import { parseJsonResponse } from '../utils/http'

const CACHE_VERSION = 'v3'

const KEYS = {
  parties: `PS_parties_${CACHE_VERSION}`,
  trends: `PS_trends_${CACHE_VERSION}`,
  leaders: `PS_leaders_${CACHE_VERSION}`,
  meta: `PS_meta_${CACHE_VERSION}`,
  betting: `PS_betting_${CACHE_VERSION}`,
  predictionMarkets: `PS_predictionMarkets_${CACHE_VERSION}`,
  elections: `PS_elections_${CACHE_VERSION}`,
  byElections: `PS_byElections_${CACHE_VERSION}`,
  migration: `PS_migration_${CACHE_VERSION}`,
  milestones: `PS_milestones_${CACHE_VERSION}`,
  polls: `PS_polls_${CACHE_VERSION}`,
  ingestStatus: `PS_ingestStatus_${CACHE_VERSION}`,
  demographics: `PS_demographics_${CACHE_VERSION}`,
  policyRecords: `PS_policyRecords_${CACHE_VERSION}`,
  policyTaxonomy: `PS_policyTaxonomy_${CACHE_VERSION}`,
  policyDelivery: `PS_policyDelivery_${CACHE_VERSION}`,
  newsItems: `PS_newsItems_${CACHE_VERSION}`,
  councilRegistry: `PS_councilRegistry_${CACHE_VERSION}`,
  councilStatus: `PS_councilStatus_${CACHE_VERSION}`,
  councilEditorial: `PS_councilEditorial_${CACHE_VERSION}`,
  parliament: `PS_parliament_${CACHE_VERSION}`,
  councilCachePurge: `PS_councilCachePurge_${CACHE_VERSION}`,
  timestamps: `PS_timestamps_${CACHE_VERSION}`,
  pollsData: `PS_polls_${CACHE_VERSION}`,
  deletedPollIds: `PS_deletedPollIds_${CACHE_VERSION}`,
}

// legacy keys that may still contain poisoned trend/poll cache rows
const LEGACY_KEYS = [
  'PS_parties', 'PS_trends', 'PS_leaders', 'PS_meta', 'PS_betting', 'PS_predictionMarkets', 'PS_elections',
  'PS_byElections', 'PS_migration', 'PS_milestones', 'PS_polls', 'PS_demographics',
  'PS_newsItems', 'PS_policyRecords', 'PS_policyTaxonomy', 'PS_policyDelivery', 'PS_councilRegistry', 'PS_councilStatus', 'PS_councilEditorial', 'PS_timestamps',
]

const SECTION_MAP = {
  parties: 'polls',
  leaders: 'leaders',
  meta: 'meta',
  elections: 'elections',
  trends: 'trends',
  betting: 'betting',
  predictionMarkets: 'predictionMarkets',
  byElections: 'byElections',
  migration: 'migration',
  milestones: 'milestones',
  pollsData: 'pollsData',
  ingestStatus: 'ingestStatus',
  demographics: 'demographics',
  policyRecords: 'policyRecords',
  policyTaxonomy: 'policyTaxonomy',
  policyDelivery: 'policyDelivery',
  newsItems: 'newsItems',
  councilRegistry: 'councilRegistry',
  councilStatus: 'councilStatus',
  councilEditorial: 'councilEditorial',
  parliament: 'parliament',
}

const SECTION_STATE_MAP = {
  polls: { label: 'Refreshed recently', tone: 'live' },
  trends: { label: 'Derived', tone: 'derived' },
  leaders: { label: 'Maintained dataset', tone: 'maintained' },
  betting: { label: 'Archived snapshot', tone: 'static' },
  predictionMarkets: { label: 'Refreshed recently', tone: 'live' },
  elections: { label: 'Maintained dataset', tone: 'maintained' },
  byElections: { label: 'Maintained dataset', tone: 'maintained' },
  migration: { label: 'Latest official estimate', tone: 'maintained' },
  demographics: { label: 'Static', tone: 'static' },
  newsItems: { label: 'Refreshed recently', tone: 'live' },
  councilRegistry: { label: 'Maintained dataset', tone: 'maintained' },
  councilStatus: { label: 'Maintained dataset', tone: 'maintained' },
  councilEditorial: { label: 'Maintained dataset', tone: 'maintained' },
  parliament: { label: 'Refreshed recently', tone: 'semi-live' },
}

const REMOTE_FETCH_TIMEOUT_MS = 8000

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REMOTE_FETCH_TIMEOUT_MS) {
  if (typeof AbortController === 'undefined') return fetch(url, options)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function notifyDataUpdated(key) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('politiscope:data-updated', { detail: { key } }))
}

function mergeObject(base, incoming) {
  if (!base || typeof base !== 'object' || Array.isArray(base)) return incoming ?? base
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return incoming ?? base
  return { ...base, ...incoming }
}

function withFallbackArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback
}

function withFallbackObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
}

function normaliseName(value) {
  return String(value || '').trim().toLowerCase()
}

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function readDeletedPollIds() {
  return new Set(withFallbackArray(readJson(KEYS.deletedPollIds, []), []).map((id) => cleanText(id)).filter(Boolean))
}

function writeDeletedPollIds(ids) {
  writeJson(KEYS.deletedPollIds, [...ids])
}

function parseIsoDate(value) {
  const text = cleanText(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const d = new Date(`${text}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

function isImpossiblePollDates(poll) {
  const published = parseIsoDate(poll?.publishedAt)
  const fieldworkEnd = parseIsoDate(poll?.fieldworkEnd)
  const date = parseIsoDate(poll?.date)

  if (published && fieldworkEnd) {
    const diff = daysBetween(fieldworkEnd, published)
    if (diff > 7) return true
  }

  if (published && date) {
    const diff = daysBetween(date, published)
    if (diff > 7) return true
  }

  return false
}

function stampSection(key) {
  const ts = loadTimestamps()
  ts[key] = new Date().toISOString()
  writeJson(KEYS.timestamps, ts)
}

function cacheSection(key, value, options = {}) {
  const { notify = true } = options
  const storageKey = KEYS[key]
  if (!storageKey) return
  writeJson(storageKey, value)
  stampSection(key)
  if (notify) notifyDataUpdated(key)
}

function safeCacheSection(key, value, options) {
  try {
    cacheSection(key, value, options)
  } catch (e) {
    console.warn(`Store: cacheSection(${key}) failed`, e)
  }
}

function makeSectionState(section, { updatedAt = null, source = null, mode = null, fallback = false, maintained = false } = {}) {
  const base = SECTION_STATE_MAP[section] || { label: 'Needs review', tone: 'quiet' }
  return {
    section,
    label: base.label,
    tone: mode || base.tone,
    updatedAt: updatedAt || null,
    source: source || null,
    fallback: !!fallback,
    maintained: !!maintained,
  }
}

function getPredictionMarketsUpdatedAt(predictionMarkets) {
  if (!predictionMarkets || typeof predictionMarkets !== 'object') return null
  const rows = Array.isArray(predictionMarkets.rows)
    ? predictionMarkets.rows
    : Array.isArray(predictionMarkets.markets)
      ? predictionMarkets.markets
      : []
  return predictionMarkets.updatedAt ||
    predictionMarkets.generatedAt ||
    predictionMarkets.checkedAt ||
    predictionMarkets.meta?.updatedAt ||
    predictionMarkets.meta?.generatedAt ||
    predictionMarkets.meta?.checkedAt ||
    rows[0]?.checkedAt ||
    rows[0]?.updatedAt ||
    null
}

function getByElectionReviewedAt(byElections) {
  return byElections?.meta?.reviewedAt || byElections?.meta?.updatedAt || null
}

function getMigrationReviewedAt(migration) {
  return migration?.meta?.reviewedAt || migration?.meta?.updatedAt || migration?.reviewedAt || migration?.updatedAt || null
}

function getMigrationSourceLabel(migration) {
  return migration?.meta?.sourceType || migration?.sourceType || 'ONS migration statistics'
}

function normaliseNewsStatePayload(newsItems, fallback = []) {
  if (Array.isArray(newsItems)) return newsItems
  if (newsItems && typeof newsItems === 'object') {
    const items = Array.isArray(newsItems.items)
      ? newsItems.items
      : Array.isArray(newsItems.newsItems)
        ? newsItems.newsItems
        : []
    return { ...newsItems, items }
  }
  return fallback
}

function getNewsUpdatedAt(newsItems, newsFallback = null) {
  const payload = newsItems && typeof newsItems === 'object' ? newsItems : {}
  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(newsItems)
      ? newsItems
      : []
  return payload.fetchedAt ||
    payload.updatedAt ||
    payload.meta?.fetchedAt ||
    payload.meta?.updatedAt ||
    newsFallback?.fetchedAt ||
    newsFallback?.meta?.fetchedAt ||
    newsFallback?.meta?.updatedAt ||
    items[0]?.publishedAt ||
    items[0]?.updatedAt ||
    null
}

function getDefaultData() {
  return {
    meta: withFallbackObject(DEFAULTS.meta, {}),
    parties: withFallbackArray(DEFAULTS.parties, []),
    trends: withFallbackArray(DEFAULTS.trends, []),
    leaders: withFallbackArray(DEFAULTS.leaders, []),
    betting: withFallbackObject(DEFAULTS.betting, { odds: [] }),
    predictionMarkets: withFallbackObject(DEFAULTS.predictionMarkets, { markets: [] }),
    elections: withFallbackObject(DEFAULTS.elections, {}),
    byElections: withFallbackObject(DEFAULTS.byElections, { upcoming: [], recent: [] }),
    migration: withFallbackObject(DEFAULTS.migration, {}),
    milestones: withFallbackArray(DEFAULTS.milestones, []),
    polls: withFallbackArray(DEFAULTS.polls, []),
    ingestStatus: null,
    demographics: withFallbackObject(DEFAULTS.demographics, {}),
    policyRecords: POLICY_RECORDS,
    policyTaxonomy: POLICY_TAXONOMY,
    policyDelivery: POLICY_DELIVERY,
    newsItems: withFallbackArray(DEFAULTS.newsItems, []),
    councilRegistry: withFallbackArray(DEFAULTS.councilRegistry, []),
    councilStatus: withFallbackArray(DEFAULTS.councilStatus, []),
    councilEditorial: withFallbackArray(DEFAULTS.councilEditorial, []),
    parliament: withFallbackObject(DEFAULTS.parliament, {}),
    leaderRatings: null,
  }
}

function purgeLegacyCouncilCacheOnce() {
  if (typeof window === 'undefined') return

  try {
    const already = readJson(KEYS.councilCachePurge, null)
    if (already) return

    const councilKeys = [
      KEYS.councilRegistry,
      KEYS.councilStatus,
      KEYS.councilEditorial,
      'PS_councilRegistry',
      'PS_councilStatus',
      'PS_councilEditorial',
    ]

    councilKeys.forEach((key) => localStorage.removeItem(key))
    writeJson(KEYS.councilCachePurge, { doneAt: new Date().toISOString() })
  } catch (e) {
    console.warn('Store: council cache purge failed', e)
  }
}

function enrichParties(liveParties, defaultParties) {
  const defaultsByName = new Map(withFallbackArray(defaultParties, []).map((p) => [normaliseName(p.name), p]))
  const live = withFallbackArray(liveParties, [])
  if (!live.length) return withFallbackArray(defaultParties, [])

  const merged = live.map((party) => {
    const base = defaultsByName.get(normaliseName(party.name)) || {}
    return {
      ...base,
      ...party,
      name: party.name || base.name,
      abbr: party.abbr || base.abbr,
      key: party.key || base.key,
      color: party.color || base.color,
      pct: party.pct ?? base.pct ?? 0,
      change: party.change ?? base.change ?? 0,
      seats: party.seats ?? base.seats ?? null,
    }
  })

  const mergedNames = new Set(merged.map((p) => normaliseName(p.name)))
  const missingDefaults = withFallbackArray(defaultParties, []).filter((p) => !mergedNames.has(normaliseName(p.name)))
  return [...merged, ...missingDefaults]
}

function isFiniteNumericValue(value) {
  if (value === null || value === undefined || value === '') return false
  const n = Number(value)
  return Number.isFinite(n)
}

function enrichLeaders(liveLeaders, defaultLeaders) {
  const defaultsByName = new Map(withFallbackArray(defaultLeaders, []).map((l) => [normaliseName(l.name), l]))
  const live = withFallbackArray(liveLeaders, [])

  if (!live.length) {
    return withFallbackArray(defaultLeaders, []).map((leader) => ({
      ...leader,
      metricLabel: leader.metricLabel || 'Maintained profile rating',
      ratingSource: leader.ratingSource || 'maintained-profile',
      _hasFavourabilitySplit: isFiniteNumericValue(leader.favourable) && isFiniteNumericValue(leader.unfavourable) && !!(leader.sourceUrl || leader.source || leader.updatedAt),
      _hasApprovalSplit: false,
    }))
  }

  return live.map((leader) => {
    const base = defaultsByName.get(normaliseName(leader.name)) || {}
    const hasIncomingFavourable = Object.prototype.hasOwnProperty.call(leader, 'favourable') && isFiniteNumericValue(leader.favourable)
    const hasIncomingUnfavourable = Object.prototype.hasOwnProperty.call(leader, 'unfavourable') && isFiniteNumericValue(leader.unfavourable)
    const hasFavourabilitySource = !!(leader.sourceUrl || leader.source || leader.updatedAt || leader.publishedAt || leader.fieldworkDate)
    const hasFavourabilitySplit = hasIncomingFavourable && hasIncomingUnfavourable && hasFavourabilitySource
    const merged = { ...base, ...leader }

    if (!hasFavourabilitySplit) {
      delete merged.favourable
      delete merged.unfavourable
      delete merged.approve
      delete merged.disapprove
    }

    return {
      ...merged,
      metricLabel: merged.metricLabel || (merged.ratingSource === 'sourced' ? 'Net favourability' : 'Maintained profile rating'),
      _hasFavourabilitySplit: hasFavourabilitySplit,
      _hasApprovalSplit: false,
    }
  })
}

function attachLeaderRefs(parties, leaders) {
  const leadersByParty = new Map(withFallbackArray(leaders, []).map((leader) => [normaliseName(leader.party), leader]))
  return withFallbackArray(parties, []).map((party) => ({
    ...party,
    _leader: leadersByParty.get(normaliseName(party.name)) || party._leader || null,
  }))
}

function normalisePollArray(value, fallback = []) {
  const arr = withFallbackArray(value, fallback)

  return arr
    .filter((p) => p && typeof p === 'object')
    .map((p, idx) => ({
      id: p.id || `${normaliseName(p.pollster || 'poll')}-${idx}`,
      pollster: p.pollster || '',
      pollsterId: p.pollsterId || null,
      isBpcMember: !!p.isBpcMember,
      fieldworkStart: p.fieldworkStart || null,
      fieldworkEnd: p.fieldworkEnd || null,
      publishedAt: p.publishedAt || null,
      date: p.date || null,
      sample: p.sample ?? null,
      method: p.method || null,
      mode: p.mode || null,
      commissioner: p.commissioner || null,
      sourceUrl: p.sourceUrl || null,
      source: p.source || null,
      sourceType: p.sourceType || null,
      confidence: p.confidence || null,
      verificationStatus: p.verificationStatus || null,
      suspect: !!p.suspect,
      ref: p.ref ?? null,
      lab: p.lab ?? null,
      con: p.con ?? null,
      grn: p.grn ?? null,
      ld: p.ld ?? null,
      rb: p.rb ?? null,
      snp: p.snp ?? null,
      pc: p.pc ?? null,
      oth: p.oth ?? null,
    }))
    .filter((p) => !isImpossiblePollDates(p))
}

function reconcileDeletedPollIds(nextPolls) {
  const deletedIds = readDeletedPollIds()
  const previousPolls = normalisePollArray(readJson(KEYS.polls, null), [])
  const nextIds = new Set(withFallbackArray(nextPolls, []).map((poll) => cleanText(poll?.id)).filter(Boolean))

  previousPolls.forEach((poll) => {
    const id = cleanText(poll?.id)
    if (!id) return
    if (cleanText(poll?.sourceType).toLowerCase() !== 'manual') return
    if (!nextIds.has(id)) deletedIds.add(id)
  })

  withFallbackArray(nextPolls, []).forEach((poll) => {
    const id = cleanText(poll?.id)
    if (id) deletedIds.delete(id)
  })

  writeDeletedPollIds(deletedIds)
}

function filterDeletedPolls(polls) {
  const deletedIds = readDeletedPollIds()
  if (!deletedIds.size) return polls
  return withFallbackArray(polls, []).filter((poll) => !deletedIds.has(cleanText(poll?.id)))
}

function getPollDateMs(poll) {
  return getConflictDateMs(poll)
}

function buildPollMergeKey(poll) {
  const dateKey = cleanText(poll?.fieldworkEnd || poll?.publishedAt || poll?.date || '')
  const pollsterKey = cleanText(poll?.pollster).toLowerCase()
  const sampleKey = poll?.sample == null ? '' : String(poll.sample)
  return [pollsterKey, dateKey, sampleKey].join('|')
}

function mergePollHistory(...sources) {
  const merged = new Map()

  sources.forEach((source) => {
    withFallbackArray(source, []).forEach((poll) => {
      if (!poll || typeof poll !== 'object') return
      if (poll?.suspect) return
      if (cleanText(poll?.verificationStatus).toLowerCase() === 'rejected') return
      if (isImpossiblePollDates(poll)) return

      const key = buildPollMergeKey(poll)
      const ts = getPollDateMs(poll)
      const existing = merged.get(key)

      if (!existing) {
        merged.set(key, { poll, ts })
        return
      }

      if (comparePollConflictPriority(poll, existing.poll) < 0) {
        merged.set(key, { poll, ts })
      }
    })
  })

  return [...merged.values()]
    .sort((a, b) => b.ts - a.ts)
    .map((entry) => entry.poll)
}

function getLocalOverrides(defaults) {
  const localLeaders = enrichLeaders(readJson(KEYS.leaders, null), defaults.leaders)
  const localParties = attachLeaderRefs(enrichParties(readJson(KEYS.parties, null), defaults.parties), localLeaders)
  const localTrends = withFallbackArray(readJson(KEYS.trends, null), defaults.trends)
  const cachedPolls = normalisePollArray(readJson(KEYS.polls, null), [])
  const safeCachedPolls = cachedPolls.filter(isDisplaySafePoll)
  const localPolls = safeCachedPolls.length || cachedPolls.length
    ? safeCachedPolls
    : withFallbackArray(defaults.polls, [])
  const pollContext = buildPollContext({
    polls: localPolls,
    fallbackParties: localParties,
    fallbackTrends: localTrends,
  })

  return {
    meta: mergeObject(defaults.meta, readJson(KEYS.meta, null)),
    parties: localParties,
    trends: pollContext?.trendSeries || localTrends,
    leaders: localLeaders,
    betting: mergeObject(defaults.betting, readJson(KEYS.betting, null)),
    elections: mergeObject(defaults.elections, readJson(KEYS.elections, null)),
    byElections: mergeObject(defaults.byElections, readJson(KEYS.byElections, null)),
    migration: mergeObject(defaults.migration, readJson(KEYS.migration, null)),
    milestones: withFallbackArray(readJson(KEYS.milestones, null), defaults.milestones),
    polls: localPolls,
    pollsData: localPolls,
    ingestStatus: withFallbackObject(readJson(KEYS.ingestStatus, null), defaults.ingestStatus),
    pollContext,
    demographics: mergeObject(defaults.demographics, readJson(KEYS.demographics, null)),
    policyRecords: withFallbackArray(readJson(KEYS.policyRecords, null), defaults.policyRecords),
    policyTaxonomy: mergeObject(defaults.policyTaxonomy, readJson(KEYS.policyTaxonomy, null)),
    policyDelivery: withFallbackArray(readJson(KEYS.policyDelivery, null), defaults.policyDelivery),
    newsItems: withFallbackArray(readJson(KEYS.newsItems, null), defaults.newsItems),
    councilRegistry: withFallbackArray(readJson(KEYS.councilRegistry, null), defaults.councilRegistry),
    councilStatus: withFallbackArray(readJson(KEYS.councilStatus, null), defaults.councilStatus),
    councilEditorial: withFallbackArray(readJson(KEYS.councilEditorial, null), defaults.councilEditorial),
    parliament: mergeObject(defaults.parliament, readJson(KEYS.parliament, null)),
  }
}

function normaliseRemote(remote, defaults) {
  const electionsObj =
    Array.isArray(remote?.elections) && remote.elections.length > 0
      ? (remote.elections[0]?.data || {})
      : withFallbackObject(remote?.elections, {})

  const leaders = enrichLeaders(remote?.leaders, defaults.leaders)
  const parties = attachLeaderRefs(enrichParties(remote?.polls, defaults.parties), leaders)

  return {
    meta: mergeObject(defaults.meta, withFallbackObject(remote?.meta, {})),
    parties,
    trends: withFallbackArray(remote?.trends, defaults.trends),
    leaders,
    betting: mergeObject(defaults.betting, withFallbackObject(remote?.betting, {})),
    elections: mergeObject(defaults.elections, withFallbackObject(electionsObj, {})),
    byElections: mergeObject(defaults.byElections, withFallbackObject(remote?.byElections, {})),
    migration: mergeObject(defaults.migration, withFallbackObject(remote?.migration, {})),
    milestones: withFallbackArray(remote?.milestones, defaults.milestones),
    polls: normalisePollArray(remote?.pollsData || remote?.pollsArchive || remote?.polls_history, defaults.polls),
    ingestStatus: withFallbackObject(remote?.ingestStatus, defaults.ingestStatus),
    demographics: mergeObject(defaults.demographics, withFallbackObject(remote?.demographics, {})),
    policyRecords: withFallbackArray(remote?.policyRecords, defaults.policyRecords),
    policyTaxonomy: mergeObject(defaults.policyTaxonomy, withFallbackObject(remote?.policyTaxonomy, {})),
    policyDelivery: withFallbackArray(remote?.policyDelivery, defaults.policyDelivery),
    newsItems: normaliseNewsStatePayload(remote?.newsItems || remote?.news, defaults.newsItems),
    councilRegistry: withFallbackArray(remote?.councilRegistry, defaults.councilRegistry),
    councilStatus: withFallbackArray(remote?.councilStatus, defaults.councilStatus),
    councilEditorial: withFallbackArray(remote?.councilEditorial, defaults.councilEditorial),
    parliament: mergeObject(defaults.parliament, withFallbackObject(remote?.parliament, {})),
    leaderRatings: withFallbackObject(remote?.leaderRatings, null),
  }
}

async function fetchLatestPolls() {
  const res = await fetchWithTimeout(`${API_BASE}/api/polls/latest`, { cache: 'no-store' })
  const data = await parseJsonResponse(res, 'Live polls')
  return normalisePollArray(data?.polls, [])
}

function buildDefaultSectionState(defaults) {
  return {
    polls: makeSectionState('polls', { updatedAt: defaults?.meta?.fetchDate || null, source: 'Cron ingest to D1', fallback: true }),
    trends: makeSectionState('trends', { updatedAt: defaults?.meta?.fetchDate || null, source: 'Derived from polls', fallback: true }),
    leaders: makeSectionState('leaders', { source: 'Maintained editorial data', maintained: true, fallback: true }),
    betting: makeSectionState('betting', { source: 'Maintained editorial data', maintained: true, fallback: true }),
    predictionMarkets: makeSectionState('predictionMarkets', {
      updatedAt: getPredictionMarketsUpdatedAt(defaults?.predictionMarkets),
      source: 'Polymarket',
      fallback: true,
    }),
    elections: makeSectionState('elections', { source: 'Maintained election intelligence', maintained: true, fallback: true }),
    byElections: makeSectionState('byElections', { source: 'Maintained tracker', maintained: true, fallback: true }),
    migration: makeSectionState('migration', {
      updatedAt: getMigrationReviewedAt(defaults?.migration),
      source: getMigrationSourceLabel(defaults?.migration),
      maintained: true,
      fallback: true,
    }),
    demographics: makeSectionState('demographics', { source: 'Static reference data', fallback: true }),
    newsItems: makeSectionState('newsItems', {
      updatedAt: getNewsUpdatedAt(defaults?.newsItems),
      source: 'News feed cache',
      fallback: true,
    }),
    councilRegistry: makeSectionState('councilRegistry', { source: 'Maintained council registry', maintained: true, fallback: true }),
    councilStatus: makeSectionState('councilStatus', { source: 'Maintained council status', maintained: true, fallback: true }),
    councilEditorial: makeSectionState('councilEditorial', { source: 'Maintained council editorial', maintained: true, fallback: true }),
    parliament: makeSectionState('parliament', { source: 'Official Parliament / YouTube', fallback: true }),
  }
}

function buildRemoteSectionState(remote) {
  const ingestState = remote?.ingestStatus && typeof remote.ingestStatus === 'object' ? remote.ingestStatus : {}
  const electionsIntelligence = remote?.elections?.intelligence && typeof remote.elections.intelligence === 'object' ? remote.elections.intelligence : {}
  const parliament = remote?.parliament && typeof remote.parliament === 'object' ? remote.parliament : {}

  return {
    polls: makeSectionState('polls', {
      updatedAt: ingestState.lastRunAt || ingestState.updatedAt || remote?.meta?.fetchDate || null,
      source: ingestState.status === 'success' ? 'Polling feed' : 'Polling data',
      fallback: ingestState.status !== 'success',
    }),
    trends: makeSectionState('trends', {
      updatedAt: remote?.meta?.fetchDate || ingestState.lastRunAt || null,
      source: 'Polling trend model',
      fallback: false,
    }),
    leaders: makeSectionState('leaders', {
      updatedAt: remote?.leaderRatings?.updatedAt || remote?.leaderRatings?.publishedAt || null,
      source: remote?.leaderRatings?.source || 'Maintained leader profiles',
      mode: remote?.leaderRatings?.count ? 'live' : 'maintained',
      maintained: !remote?.leaderRatings?.count,
      fallback: !remote?.leaderRatings?.count,
    }),
    betting: makeSectionState('betting', { source: remote?.betting?.source || 'Maintained editorial odds', maintained: true }),
    predictionMarkets: makeSectionState('predictionMarkets', {
      updatedAt: getPredictionMarketsUpdatedAt(remote?.predictionMarkets),
      source: remote?.predictionMarkets?.source || 'Polymarket',
      fallback: false,
    }),
    elections: makeSectionState('elections', { source: 'Election intelligence', maintained: true }),
    byElections: makeSectionState('byElections', { updatedAt: getByElectionReviewedAt(remote?.byElections), source: 'By-election tracker', maintained: true }),
    migration: makeSectionState('migration', {
      updatedAt: getMigrationReviewedAt(remote?.migration),
      source: getMigrationSourceLabel(remote?.migration),
      maintained: true,
    }),
    demographics: makeSectionState('demographics', { source: 'Static reference data', fallback: true }),
    newsItems: makeSectionState('newsItems', {
      updatedAt: getNewsUpdatedAt(remote?.newsItems, remote?.news),
      source: 'News feed cache',
      fallback: false,
    }),
    councilRegistry: makeSectionState('councilRegistry', { updatedAt: remote?.councilRegistry?.meta?.updatedAt || null, source: 'Council registry', maintained: true }),
    councilStatus: makeSectionState('councilStatus', { updatedAt: remote?.councilStatus?.meta?.updatedAt || null, source: 'Council status', maintained: true }),
    councilEditorial: makeSectionState('councilEditorial', { updatedAt: remote?.councilEditorial?.meta?.updatedAt || null, source: 'Council intelligence', maintained: true }),
    parliament: makeSectionState('parliament', {
      updatedAt: parliament.updatedAt || parliament.facts?.verifiedAt || null,
      source: 'Official Parliament / YouTube',
      fallback: false,
    }),
    electionsIntelligence: makeSectionState('electionsIntelligence', {
      updatedAt: electionsIntelligence?.mayors?.meta?.updatedAt || electionsIntelligence?.devolved?.meta?.updatedAt || null,
      source: 'Election intelligence',
      maintained: true,
    }),
  }
}

export function loadTimestamps() {
  return readJson(KEYS.timestamps, {})
}

export function formatTs(isoString) {
  if (!isoString) return null

  try {
    const d = new Date(isoString)
    const now = new Date()
    const diff = Math.floor((now - d) / 60000)

    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`

    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

export function clearAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
}

export function installDevResetHelpers() {
  if (typeof window === 'undefined') return

  window.__PS_RESET = async function __PS_RESET() {
    clearAll()

    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key.startsWith('politiscope-')).map((key) => caches.delete(key)))
    }

    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)))
    }

    window.location.reload()
  }
}

async function postSection(section, payload) {
  const res = await fetch(`${API_BASE}/api/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, payload }),
  })
  return parseJsonResponse(res, 'Save request', { allowEmpty: true })
}

function buildPayloadForKey(key, value) {
  if (key === 'elections') {
    return [{ id: 1, name: 'main', date: '', data: value }]
  }
  return value
}

export async function saveSection(key, value) {
  const section = SECTION_MAP[key]

  if (key === 'pollsData') {
    reconcileDeletedPollIds(value)
  }

  if (!section) {
    console.warn(`Store: saveSection(${key}) is not mapped; caching locally only`)
    cacheSection(key, value)
    return true
  }

  const payload = buildPayloadForKey(key, value)

  try {
    await postSection(section, payload)
    cacheSection(key, value)
    return true
  } catch (e) {
    console.error('Store: remote save failed, caching locally', key, e)
    cacheSection(key, value)
    return false
  }
}

export async function getData() {
  const defaults = getDefaultData()
  const local = getLocalOverrides(defaults)
  installDevResetHelpers()
  purgeLegacyCouncilCacheOnce()

  let remote
  let livePolls = []

  try {
    const [remoteRes, latest] = await Promise.all([
      fetchWithTimeout(`${API_BASE}/api/data`, { cache: 'no-store' }),
      fetchLatestPolls().catch((e) => {
        if (import.meta.env.DEV) {
          console.warn('Store: live polls fetch failed, falling back', e)
        }
        return []
      }),
    ])

    remote = await parseJsonResponse(remoteRes, 'Data load')
    livePolls = normalisePollArray(latest, []).filter(isDisplaySafePoll)
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('Store: remote load failed, using local/default fallback', e)
    }
    return {
      ...local,
      dataState: buildDefaultSectionState(defaults),
    }
  }

  const normalised = normaliseRemote(remote, defaults)

  const finalLeaders = enrichLeaders(readJson(KEYS.leaders, null), normalised.leaders)
  const finalParties = attachLeaderRefs(enrichParties(readJson(KEYS.parties, null), normalised.parties), finalLeaders)

  const remotePollHistory = normalisePollArray(normalised.polls, []).filter(isDisplaySafePoll)
  const localCachedPolls = normalisePollArray(readJson(KEYS.polls, null), []).filter(isDisplaySafePoll)
  const mergedPolls = filterDeletedPolls(mergePollHistory(livePolls, remotePollHistory, localCachedPolls))

  if (mergedPolls.length) safeCacheSection('polls', mergedPolls, { notify: false })

  let pollContext
  try {
    pollContext = buildPollContext({
      polls: mergedPolls,
      fallbackParties: finalParties,
      fallbackTrends: normalised.trends,
    })
  } catch (e) {
    console.warn('Store: buildPollContext failed, using raw poll fallback', e)
    pollContext = {
      allPollsSorted: mergedPolls,
      latestPollsByPollster: [],
      pollAverage: finalParties,
      partyPollSnapshot: finalParties,
      trendSeries: withFallbackArray(normalised.trends, []),
    }
  }

  const finalTrends = pollContext?.trendSeries || withFallbackArray(normalised.trends, [])
  if (finalTrends.length) safeCacheSection('trends', finalTrends, { notify: false })
  if (withFallbackArray(normalised.councilRegistry, []).length) {
    safeCacheSection('councilRegistry', normalised.councilRegistry, { notify: false })
  }
  if (withFallbackArray(normalised.councilStatus, []).length) {
    safeCacheSection('councilStatus', normalised.councilStatus, { notify: false })
  }
  if (withFallbackArray(normalised.councilEditorial, []).length) {
    safeCacheSection('councilEditorial', normalised.councilEditorial, { notify: false })
  }

  return {
    meta: mergeObject(normalised.meta, readJson(KEYS.meta, null)),
    parties: finalParties,
    trends: finalTrends,
    leaders: finalLeaders,
    betting: mergeObject(normalised.betting, readJson(KEYS.betting, null)),
    predictionMarkets: mergeObject(normalised.predictionMarkets, readJson(KEYS.predictionMarkets, null)),
    elections: mergeObject(normalised.elections, readJson(KEYS.elections, null)),
    byElections: mergeObject(normalised.byElections, readJson(KEYS.byElections, null)),
    migration: mergeObject(normalised.migration, readJson(KEYS.migration, null)),
    milestones: withFallbackArray(readJson(KEYS.milestones, null), normalised.milestones),
    polls: mergedPolls,
    pollsData: mergedPolls,
    ingestStatus: mergeObject(normalised.ingestStatus, readJson(KEYS.ingestStatus, null)),
    pollContext,
    demographics: mergeObject(normalised.demographics, readJson(KEYS.demographics, null)),
    policyRecords: withFallbackArray(readJson(KEYS.policyRecords, null), normalised.policyRecords),
    policyTaxonomy: mergeObject(normalised.policyTaxonomy, readJson(KEYS.policyTaxonomy, null)),
    policyDelivery: withFallbackArray(readJson(KEYS.policyDelivery, null), normalised.policyDelivery),
    newsItems: readJson(KEYS.newsItems, null) || normalised.newsItems,
    councilRegistry: withFallbackArray(normalised.councilRegistry, readJson(KEYS.councilRegistry, null)),
    councilStatus: withFallbackArray(normalised.councilStatus, readJson(KEYS.councilStatus, null)),
    councilEditorial: withFallbackArray(normalised.councilEditorial, readJson(KEYS.councilEditorial, null)),
    parliament: mergeObject(normalised.parliament, readJson(KEYS.parliament, null)),
    leaderRatings: normalised.leaderRatings || null,
    dataState: {
      ...buildDefaultSectionState(defaults),
      ...buildRemoteSectionState(remote),
      polls: makeSectionState('polls', {
        updatedAt: normalised.ingestStatus?.lastRunAt || normalised.ingestStatus?.updatedAt || remote?.meta?.fetchDate || null,
        source: normalised.ingestStatus?.status === 'success' ? 'Polling feed' : 'Polling data',
        fallback: normalised.ingestStatus?.status !== 'success' && !mergedPolls.length,
      }),
      trends: makeSectionState('trends', {
        updatedAt: normalised.ingestStatus?.lastRunAt || remote?.meta?.fetchDate || null,
        source: 'Polling trend model',
      }),
      newsItems: makeSectionState('newsItems', {
        updatedAt: getNewsUpdatedAt(normalised.newsItems, remote?.news),
        source: 'News feed cache',
      }),
      byElections: makeSectionState('byElections', {
        updatedAt: getByElectionReviewedAt(normalised.byElections),
        source: 'By-election tracker',
        maintained: true,
      }),
      councilRegistry: makeSectionState('councilRegistry', {
        updatedAt: normalised.councilRegistry?.meta?.updatedAt || null,
        source: 'Council registry',
        maintained: true,
      }),
      councilStatus: makeSectionState('councilStatus', {
        updatedAt: normalised.councilStatus?.meta?.updatedAt || null,
        source: 'Council status',
        maintained: true,
      }),
      councilEditorial: makeSectionState('councilEditorial', {
        updatedAt: normalised.councilEditorial?.meta?.updatedAt || null,
        source: 'Council intelligence',
        maintained: true,
      }),
      parliament: makeSectionState('parliament', {
        updatedAt: normalised.parliament?.updatedAt || normalised.parliament?.facts?.verifiedAt || null,
        source: 'Official Parliament / YouTube',
      }),
      electionsIntelligence: makeSectionState('electionsIntelligence', {
        updatedAt: remote?.elections?.intelligence?.mayors?.meta?.updatedAt || remote?.elections?.intelligence?.devolved?.meta?.updatedAt || null,
        source: 'Election intelligence',
        maintained: true,
      }),
      betting: makeSectionState('betting', { source: 'Maintained editorial odds', maintained: true }),
      predictionMarkets: makeSectionState('predictionMarkets', {
        updatedAt: getPredictionMarketsUpdatedAt(normalised.predictionMarkets),
        source: 'Polymarket',
      }),
      migration: makeSectionState('migration', {
        updatedAt: getMigrationReviewedAt(normalised.migration),
        source: getMigrationSourceLabel(normalised.migration),
        maintained: true,
      }),
      demographics: makeSectionState('demographics', { source: 'Static reference data', fallback: true }),
    },
  }
}

export default getData
