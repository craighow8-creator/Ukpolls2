import { API_BASE } from '../constants'
import DEFAULTS from './data.js'

const KEYS = {
  parties: 'PS_parties',
  trends: 'PS_trends',
  leaders: 'PS_leaders',
  meta: 'PS_meta',
  betting: 'PS_betting',
  elections: 'PS_elections',
  byElections: 'PS_byElections',
  migration: 'PS_migration',
  milestones: 'PS_milestones',
  polls: 'PS_polls',
  demographics: 'PS_demographics',
  newsItems: 'PS_newsItems',
  timestamps: 'PS_timestamps',
}

const SECTION_MAP = {
  parties: 'polls',
  leaders: 'leaders',
  meta: 'meta',
  elections: 'elections',
  trends: 'trends',
  betting: 'betting',
  byElections: 'byElections',
  migration: 'migration',
  milestones: 'milestones',
  pollsData: 'pollsData',
  demographics: 'demographics',
  newsItems: 'newsItems',
}

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

function stampSection(key) {
  const ts = loadTimestamps()
  ts[key] = new Date().toISOString()
  writeJson(KEYS.timestamps, ts)
}

function cacheSection(key, value) {
  const storageKey = KEYS[key]
  if (!storageKey) return
  writeJson(storageKey, value)
  stampSection(key)
}

function getDefaultData() {
  return {
    meta: withFallbackObject(DEFAULTS.meta, {}),
    parties: withFallbackArray(DEFAULTS.parties, []),
    trends: withFallbackArray(DEFAULTS.trends, []),
    leaders: withFallbackArray(DEFAULTS.leaders, []),
    betting: withFallbackObject(DEFAULTS.betting, { odds: [] }),
    elections: withFallbackObject(DEFAULTS.elections, {}),
    byElections: withFallbackObject(DEFAULTS.byElections, { upcoming: [], recent: [] }),
    migration: withFallbackObject(DEFAULTS.migration, {}),
    milestones: withFallbackArray(DEFAULTS.milestones, []),
    polls: withFallbackArray(DEFAULTS.polls, []),
    demographics: withFallbackObject(DEFAULTS.demographics, {}),
    newsItems: withFallbackArray(DEFAULTS.newsItems, []),
  }
}

function enrichParties(liveParties, defaultParties) {
  const defaultsByName = new Map(
    withFallbackArray(defaultParties, []).map((p) => [normaliseName(p.name), p])
  )

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
  const missingDefaults = withFallbackArray(defaultParties, []).filter(
    (p) => !mergedNames.has(normaliseName(p.name))
  )

  return [...merged, ...missingDefaults]
}

function enrichLeaders(liveLeaders, defaultLeaders) {
  const defaultsByName = new Map(
    withFallbackArray(defaultLeaders, []).map((l) => [normaliseName(l.name), l])
  )

  const live = withFallbackArray(liveLeaders, [])
  if (!live.length) return withFallbackArray(defaultLeaders, [])

  return live.map((leader) => {
    const base = defaultsByName.get(normaliseName(leader.name)) || {}
    return { ...base, ...leader }
  })
}

function attachLeaderRefs(parties, leaders) {
  const leadersByParty = new Map(
    withFallbackArray(leaders, []).map((leader) => [normaliseName(leader.party), leader])
  )

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
      ref: p.ref ?? null,
      lab: p.lab ?? null,
      con: p.con ?? null,
      grn: p.grn ?? null,
      ld: p.ld ?? null,
      rb: p.rb ?? null,
      snp: p.snp ?? null,
    }))
}

function getLocalOverrides(defaults) {
  const localLeaders = enrichLeaders(readJson(KEYS.leaders, null), defaults.leaders)
  const localParties = attachLeaderRefs(
    enrichParties(readJson(KEYS.parties, null), defaults.parties),
    localLeaders
  )

  return {
    meta: mergeObject(defaults.meta, readJson(KEYS.meta, null)),
    parties: localParties,
    trends: withFallbackArray(readJson(KEYS.trends, null), defaults.trends),
    leaders: localLeaders,
    betting: mergeObject(defaults.betting, readJson(KEYS.betting, null)),
    elections: mergeObject(defaults.elections, readJson(KEYS.elections, null)),
    byElections: mergeObject(defaults.byElections, readJson(KEYS.byElections, null)),
    migration: mergeObject(defaults.migration, readJson(KEYS.migration, null)),
    milestones: withFallbackArray(readJson(KEYS.milestones, null), defaults.milestones),
    polls: normalisePollArray(readJson(KEYS.polls, null), defaults.polls),
    demographics: mergeObject(defaults.demographics, readJson(KEYS.demographics, null)),
    newsItems: withFallbackArray(readJson(KEYS.newsItems, null), defaults.newsItems),
  }
}

function normaliseRemote(remote, defaults) {
  const electionsObj =
    Array.isArray(remote?.elections) && remote.elections.length > 0
      ? (remote.elections[0]?.data || {})
      : withFallbackObject(remote?.elections, {})

  const leaders = enrichLeaders(remote?.leaders, defaults.leaders)
  const parties = attachLeaderRefs(
    enrichParties(remote?.polls, defaults.parties),
    leaders
  )

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
    demographics: mergeObject(defaults.demographics, withFallbackObject(remote?.demographics, {})),
    newsItems: withFallbackArray(remote?.newsItems || remote?.news, defaults.newsItems),
  }
}

async function fetchLatestPolls() {
  const res = await fetch(`${API_BASE}/api/polls/latest`, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Live polls failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return normalisePollArray(data?.polls, [])
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
}

async function postSection(section, payload) {
  const res = await fetch(`${API_BASE}/api/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, payload }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Save failed: ${res.status} ${text}`)
  }

  return res.json().catch(() => ({}))
}

function buildPayloadForKey(key, value) {
  if (key === 'elections') {
    return [
      {
        id: 1,
        name: 'main',
        date: '',
        data: value,
      },
    ]
  }

  return value
}

export async function saveSection(key, value) {
  const section = SECTION_MAP[key]

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

  try {
    const [remoteRes, livePolls] = await Promise.all([
      fetch(`${API_BASE}/api/data`, { cache: 'no-store' }),
      fetchLatestPolls().catch((e) => {
        console.warn('Store: live polls fetch failed, falling back', e)
        return null
      }),
    ])

    if (!remoteRes.ok) {
      const text = await remoteRes.text()
      throw new Error(`Load failed: ${remoteRes.status} ${text}`)
    }

    const remote = await remoteRes.json()
    const normalised = normaliseRemote(remote, defaults)

    const finalLeaders = enrichLeaders(readJson(KEYS.leaders, null), normalised.leaders)
    const finalParties = attachLeaderRefs(
      enrichParties(readJson(KEYS.parties, null), normalised.parties),
      finalLeaders
    )

    const mergedPolls =
      livePolls && livePolls.length
        ? livePolls
        : normalisePollArray(readJson(KEYS.polls, null), normalised.polls)

    if (livePolls && livePolls.length) {
      cacheSection('polls', livePolls)
    }

    return {
      meta: mergeObject(normalised.meta, readJson(KEYS.meta, null)),
      parties: finalParties,
      trends: withFallbackArray(readJson(KEYS.trends, null), normalised.trends),
      leaders: finalLeaders,
      betting: mergeObject(normalised.betting, readJson(KEYS.betting, null)),
      elections: mergeObject(normalised.elections, readJson(KEYS.elections, null)),
      byElections: mergeObject(normalised.byElections, readJson(KEYS.byElections, null)),
      migration: mergeObject(normalised.migration, readJson(KEYS.migration, null)),
      milestones: withFallbackArray(readJson(KEYS.milestones, null), normalised.milestones),
      polls: mergedPolls,
      demographics: mergeObject(normalised.demographics, readJson(KEYS.demographics, null)),
      newsItems: withFallbackArray(readJson(KEYS.newsItems, null), normalised.newsItems),
    }
  } catch (e) {
    console.warn('Store: remote load failed, using local/default fallback', e)
    return local
  }
}

export default getData