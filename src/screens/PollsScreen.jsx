import React, { useState, useMemo } from 'react'
import { StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import SectionDataMeta from '../components/SectionDataMeta'
import { getPartyByName } from '../data/partyRegistry'
import { buildPollSpreadInsights } from '../utils/pollSpread'
import { buildPollHouseEffectsInsights } from '../utils/pollHouseEffects'
import { buildPollingIntelligence } from '../utils/pollIntelligence'
import { formatUKDate } from '../utils/date'
import SharedTrendChart, { buildDisplayTrendRows } from '../components/charts/SharedTrendChart'
import { canWinPollConflict, comparePollConflictPriority, sourceTier } from '../shared/pollValidation'

const TABS = [
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'latest', label: 'Latest Polls' },
  { key: 'trends', label: 'Trends' },
  { key: 'pollsters', label: 'Pollsters' },
  { key: 'methodology', label: 'Methodology' },
]

const POLL_PARTIES = [
  { key: 'ref', name: 'Reform UK' },
  { key: 'lab', name: 'Labour' },
  { key: 'con', name: 'Conservative' },
  { key: 'grn', name: 'Green' },
  { key: 'ld', name: 'Lib Dem' },
  { key: 'rb', name: 'Restore Britain' },
  { key: 'snp', name: 'SNP' },
]

const POLL_PARTY_KEYS = POLL_PARTIES.map((party) => party.key)

function getPollPartyMeta(key) {
  const match = POLL_PARTIES.find((party) => party.key === key)
  const registry = getPartyByName(match?.name || key)
  return {
    key,
    name: registry.name,
    short: registry.abbr || key.toUpperCase(),
    color: registry.color,
  }
}



function parseDateish(value) {
  const text = cleanText(value)
  if (!text) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [yyyy, mm, dd] = text.split('-').map(Number)
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [dd, mm, yyyy] = text.split('-').map(Number)
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  return null
}

function keepLatestPollPerPollster(polls) {
  const latest = new Map()

  for (const poll of polls || []) {
    const name = cleanText(poll?.pollster)
    if (!name) continue
    if (!isWinningPollRow(poll)) continue
    const current = latest.get(name)
    if (!current || compareLatestPollRows(poll, current) < 0) {
      latest.set(name, poll)
    }
  }

  return [...latest.values()].sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a)))
}

function getVisibleTrendPolls(polls, months = 3) {
  const sorted = [...(polls || [])].sort((a, b) => {
    const ad = parseDateish(displayDate(a))
    const bd = parseDateish(displayDate(b))
    return (ad?.getTime() || 0) - (bd?.getTime() || 0)
  })

  const latest = sorted[sorted.length - 1]
  const latestDate = parseDateish(displayDate(latest))
  if (!latestDate) return sorted

  const start = new Date(latestDate)
  start.setUTCMonth(start.getUTCMonth() - months)

  const filtered = sorted.filter((poll) => {
    const d = parseDateish(displayDate(poll))
    return d ? d >= start : true
  })

  return filtered.length ? filtered : sorted
}

function formatMonthLabel(value) {
  const d = parseDateish(value)
  if (!d) return cleanText(value)
  return d.toLocaleDateString('en-GB', { month: 'short' })
}

function formatRangeLabel(polls) {
  if (!polls?.length) return ''
  const first = displayDate(polls[0])
  const last = displayDate(polls[polls.length - 1])
  return `${formatUKDate(first)} – ${formatUKDate(last)}`
}

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/Â·/g, '·').replace(/\s+/g, ' ').trim()
}

function shortPartyName(value) {
  const text = cleanText(value)
  if (text === 'Reform UK') return 'Reform'
  if (text === 'Conservative') return 'Conservatives'
  if (text === 'Green') return 'Greens'
  return text
}

function formatGap(value) {
  if (value == null) return '0'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatPartyList(names = []) {
  const clean = names.filter(Boolean)
  if (clean.length <= 1) return clean[0] || ''
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`
  return `${clean[0]}, ${clean[1]} and ${clean[2]}`
}

function average(values = []) {
  const usable = values.filter((value) => Number.isFinite(value))
  if (!usable.length) return null
  return usable.reduce((sum, value) => sum + value, 0) / usable.length
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const raw = String(value).replace(/%/g, '').replace(/,/g, '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function getTrendValuesForParty(party, trendSeries = []) {
  const name = cleanText(party?.name)
  if (!name) return []

  return (Array.isArray(trendSeries) ? trendSeries : [])
    .map((row) => safeNumber(row?.[name]))
    .filter((value) => value != null)
}

function getPartyTrendSignal(party, trendSeries = []) {
  const explicit =
    typeof party?.recentDelta === 'number'
      ? party.recentDelta
      : typeof party?.trendDelta === 'number'
        ? party.trendDelta
        : null

  const values = getTrendValuesForParty(party, trendSeries)
  const baseline = average(values.slice(-5, -1))
  const latest = values.length ? values[values.length - 1] : safeNumber(party?.pct)
  const derived =
    latest != null && baseline != null
      ? +(latest - baseline).toFixed(1)
      : values.length >= 2
        ? +(values[values.length - 1] - values[values.length - 2]).toFixed(1)
        : null

  const change = explicit != null ? explicit : derived
  const effectiveBaseline =
    baseline != null ? baseline
      : latest != null && change != null ? +(latest - change).toFixed(1)
        : null

  let movement = 'stable'
  if (change != null) {
    if (change >= 1.5) movement = 'rising'
    else if (change <= -1.5) movement = 'falling'
  }

  return {
    change,
    movement,
    baseline: effectiveBaseline,
    reliable: change != null,
  }
}

function buildRaceStateSummary(parties = [], trendSeries = []) {
  const ranked = [...(Array.isArray(parties) ? parties : [])]
    .filter((party) => safeNumber(party?.pct) != null)
    .sort((a, b) => (safeNumber(b?.pct) || 0) - (safeNumber(a?.pct) || 0))

  const leader = ranked[0]
  const second = ranked[1]
  const third = ranked[2]
  if (!leader || !second) return null

  const leadMargin = +((safeNumber(leader?.pct) || 0) - (safeNumber(second?.pct) || 0)).toFixed(1)
  const secondGap = third ? +((safeNumber(second?.pct) || 0) - (safeNumber(third?.pct) || 0)).toFixed(1) : null
  const clusteredBehind = ranked
    .slice(1, 4)
    .filter((party) => Math.abs((safeNumber(second?.pct) || 0) - (safeNumber(party?.pct) || 0)) <= 3)
  const fragmented = leadMargin >= 6 && clusteredBehind.length >= 2

  let headline = 'Race is tight at the top'
  if (fragmented) {
    headline = `${shortPartyName(leader?.name)} ahead, with a fragmented field behind`
  } else if (leadMargin >= 8) {
    headline = `${shortPartyName(leader?.name)} firmly ahead`
  } else if (leadMargin >= 4) {
    headline = `${shortPartyName(leader?.name)} ahead, with margins still open`
  }

  let subline = `${shortPartyName(leader?.name)} lead ${shortPartyName(second?.name)} by ${formatGap(leadMargin)} points.`
  if (fragmented) {
    subline = `${formatPartyList(clusteredBehind.map((party) => shortPartyName(party?.name)))} are clustered behind.`
  } else if (second && third && secondGap != null && secondGap <= 3) {
    subline = `${shortPartyName(second?.name)} and ${shortPartyName(third?.name)} are separated by ${formatGap(secondGap)} points.`
  }

  const leaderSignal = getPartyTrendSignal(leader, trendSeries)
  const secondSignal = getPartyTrendSignal(second, trendSeries)
  const thirdSignal = third ? getPartyTrendSignal(third, trendSeries) : null
  const fourth = ranked[3] || null
  const fourthSignal = fourth ? getPartyTrendSignal(fourth, trendSeries) : null
  const reliableTrend = leaderSignal.reliable || secondSignal.reliable || thirdSignal?.reliable || fourthSignal?.reliable
  const previousLeadMargin =
    leaderSignal.baseline != null && secondSignal.baseline != null
      ? +(leaderSignal.baseline - secondSignal.baseline).toFixed(1)
      : null
  const leadNarrowing = leaderSignal.movement === 'falling' && previousLeadMargin != null && leadMargin < previousLeadMargin
  const trailingCluster = ranked
    .slice(1, 4)
    .filter((party) => Math.abs((safeNumber(second?.pct) || 0) - (safeNumber(party?.pct) || 0)) <= 3)
  const trailingSignals = trailingCluster.map((party) => ({
    party,
    signal: getPartyTrendSignal(party, trendSeries),
  }))
  const risingTrailer = trailingSignals.find((entry) => entry.signal.movement === 'rising') || null
  const tighteningBehind = trailingCluster.length >= 2 && !!risingTrailer

  if (reliableTrend) {
    if (leadNarrowing) {
      headline = `${shortPartyName(leader?.name)} ahead, with the lead narrowing`
      subline = `${shortPartyName(second?.name)} are narrowing the gap.`
    } else if (secondSignal.movement === 'rising') {
      headline = leadMargin < 4
        ? `Race is tight at the top, with ${shortPartyName(second?.name)} rising`
        : `${shortPartyName(leader?.name)} ahead, with ${shortPartyName(second?.name)} closing`
      subline = `${shortPartyName(second?.name)} are edging higher in recent polling.`
    } else if (tighteningBehind) {
      headline = `${shortPartyName(leader?.name)} ahead, with the field behind tightening`
      subline = `${formatPartyList(trailingCluster.map((party) => shortPartyName(party?.name)))} are closely grouped.`
    } else if (leaderSignal.movement === 'stable' && secondSignal.movement === 'stable') {
      if (leadMargin >= 4) headline = `${shortPartyName(leader?.name)} lead holds steady`
      subline = 'Little movement across recent polls.'
    } else if (leaderSignal.movement === 'falling') {
      subline = `${shortPartyName(leader?.name)} are slightly lower in recent polling.`
    } else if (secondSignal.movement === 'falling') {
      subline = `${shortPartyName(second?.name)} are slightly lower in recent polling.`
    }
  }

  return { headline, subline }
}

function findPreviousPollForPollster(poll, polls = []) {
  const pollster = cleanText(poll?.pollster).toLowerCase()
  if (!pollster) return null

  return [...(polls || [])]
    .sort((a, b) => pollSortTime(b) - pollSortTime(a))
    .find((candidate) => {
      if (candidate === poll) return false
      if (cleanText(candidate?.id) && cleanText(candidate?.id) === cleanText(poll?.id)) return false
      return cleanText(candidate?.pollster).toLowerCase() === pollster
    }) || null
}

function getPartyDelta(currentPoll, previousPoll, key) {
  const current = safeNumber(currentPoll?.[key])
  const previous = safeNumber(previousPoll?.[key])
  if (current == null || previous == null) return null
  return +(current - previous).toFixed(1)
}

function buildPollTakeaway(poll, polls = [], pollContext = null) {
  const results = getPollResults(poll)
  const leader = results[0]
  const second = results[1]
  if (!leader) return null

  const previousSamePollster = findPreviousPollForPollster(poll, polls)
  if (previousSamePollster) {
    const deltas = POLL_PARTY_KEYS
      .map((key) => getPartyDelta(poll, previousSamePollster, key))
      .filter((value) => value != null)
    const biggestMove = deltas.length ? Math.max(...deltas.map((value) => Math.abs(value))) : 0
    const secondDelta = second ? getPartyDelta(poll, previousSamePollster, second.key) : null
    const leaderDelta = getPartyDelta(poll, previousSamePollster, leader.key)

    if (biggestMove < 1.5) {
      return `Little change from previous ${cleanText(poll?.pollster)} poll`
    }
    if (second && secondDelta != null && secondDelta >= 1.5) {
      return `${second.short} stronger than previous ${cleanText(poll?.pollster)} poll`
    }
    if (leaderDelta != null && leaderDelta >= 1.5) {
      return `Stronger for ${leader.short} than previous ${cleanText(poll?.pollster)} poll`
    }
    if (leaderDelta != null && leaderDelta <= -1.5) {
      return `Softer for ${leader.short} than previous ${cleanText(poll?.pollster)} poll`
    }
  }

  const snapshot = Array.isArray(pollContext?.partyPollSnapshot) ? pollContext.partyPollSnapshot : []
  const snapshotLeader = snapshot.find((party) => cleanText(party?.abbr).toUpperCase() === cleanText(leader?.short).toUpperCase()) || null
  const snapshotLeaderPct = safeNumber(snapshotLeader?.pct)
  if (snapshotLeaderPct != null && leader.pct != null) {
    const diff = +(leader.pct - snapshotLeaderPct).toFixed(1)
    if (diff >= 2) return `Stronger for ${leader.short} than recent trend`
    if (diff <= -2) return `Softer for ${leader.short} than recent trend`
  }

  if (second) {
    const gap = +((leader.pct || 0) - (second.pct || 0)).toFixed(1)
    return `${leader.short} leads by ${formatGap(gap)} points`
  }

  return `${leader.short} remains ahead`
}

function displayDate(poll) {
  return cleanText(poll?.publishedAt) || cleanText(poll?.fieldworkEnd) || cleanText(poll?.fieldworkStart) || cleanText(poll?.date) || 'Date unavailable'
}

function displaySubMeta(poll) {
  const parts = [
    poll?.sample ? `Sample ${poll.sample}` : null,
    cleanText(poll?.method),
    cleanText(poll?.mode),
  ].filter(Boolean)

  return parts.join(' · ')
}

function hasLiveSource(poll) {
  return !!cleanText(poll?.sourceUrl)
}

function isImportedPoll(poll) {
  return hasLiveSource(poll) || cleanText(poll?.sourceType) === 'manual'
}

function getSourceBadge(poll, T) {
  const tier = sourceTier(poll)

  if (tier === 'manual') return { label: 'Manual', color: T.pr, subtle: false }
  if (tier === 'direct') return { label: 'Verified Source', color: T.pr, subtle: true }
  if (hasLiveSource(poll)) return { label: 'Verified Source', color: T.pr, subtle: true }
  return { label: 'Estimated', color: T.tl, subtle: true }
}

function getConfidenceBadge(poll, T) {
  const confidence = cleanText(poll?.confidence).toLowerCase()
  if (confidence === 'high') return { label: 'High confidence', color: T.ok || T.pr, subtle: true }
  if (confidence === 'medium') return { label: 'Medium confidence', color: T.warn || T.pr, subtle: true }
  if (confidence === 'low') return { label: 'Low confidence', color: T.tl, subtle: true }
  return null
}

function getPollResults(poll) {
  return POLL_PARTY_KEYS
    .map((key) => {
      const pct = safeNumber(poll?.[key])
      if (pct == null) return null
      return {
        key,
        pct,
        ...getPollPartyMeta(key),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct)
}

function buildSeries(polls, partyKey) {
  const namedKey = getPollPartyMeta(partyKey)?.name || partyKey
  return polls
    .map((poll) => safeNumber(poll?.[partyKey] ?? poll?.[namedKey]))
    .filter((v) => v != null)
    .slice(-12)
}

function pollSortScore(poll) {
  const raw = cleanText(poll?.publishedAt) || cleanText(poll?.fieldworkEnd) || cleanText(poll?.fieldworkStart) || cleanText(poll?.date) || ''
  const parsed = parseDateish(raw)
  if (parsed) return parsed.toISOString().slice(0, 10)
  return raw
}

function pollSortTime(poll) {
  const raw = cleanText(poll?.publishedAt) || cleanText(poll?.fieldworkEnd) || cleanText(poll?.fieldworkStart) || cleanText(poll?.date) || ''
  return parseDateish(raw)?.getTime() || 0
}

function isWinningPollRow(poll) {
  return canWinPollConflict(poll)
}

function compareLatestPollRows(a, b) {
  const priorityDiff = comparePollConflictPriority(a, b)
  if (priorityDiff !== 0) return priorityDiff

  const dateDiff = pollSortTime(b) - pollSortTime(a)
  if (dateDiff !== 0) return dateDiff

  const dateTextDiff = pollSortScore(b).localeCompare(pollSortScore(a))
  if (dateTextDiff !== 0) return dateTextDiff

  return cleanText(a?.id || '').localeCompare(cleanText(b?.id || ''))
}

function groupPollsByPollster(polls) {
  const map = new Map()

  for (const poll of polls || []) {
    const name = cleanText(poll?.pollster)
    if (!name) continue
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(poll)
  }

  return [...map.entries()]
    .map(([name, list]) => ({
      name,
      polls: [...list].sort(compareLatestPollRows),
      latestPoll: [...list].filter(isWinningPollRow).sort(compareLatestPollRows)[0] || [...list].sort(compareLatestPollRows)[0],
    }))
    .sort((a, b) => {
      const latestDiff = pollSortTime(b.latestPoll) - pollSortTime(a.latestPoll)
      if (latestDiff !== 0) return latestDiff
      const latestTextDiff = pollSortScore(b.latestPoll).localeCompare(pollSortScore(a.latestPoll))
      if (latestTextDiff !== 0) return latestTextDiff
      if (b.polls.length !== a.polls.length) return b.polls.length - a.polls.length
      return a.name.localeCompare(b.name)
      })
}

function pollAgeDays(poll, now = new Date()) {
  const date = parseDateish(displayDate(poll))
  if (!date) return null
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return Math.max(0, Math.round((utcNow.getTime() - date.getTime()) / 86400000))
}

function getPollsterDescriptor(group) {
  const latest = group?.latestPoll || null
  const importedCount = (group?.polls || []).filter((poll) => isImportedPoll(poll)).length
  const ageDays = pollAgeDays(latest)
  const avgSample = Math.round(
    ((group?.polls || [])
      .map((poll) => safeNumber(poll?.sample))
      .filter((value) => value && value > 0)
      .reduce((sum, value, _, arr) => sum + value / arr.length, 0)) || 0,
  )

  if (ageDays != null && ageDays <= 7 && group.polls.length >= 20) return 'Active recently · regular tracker'
  if (ageDays != null && ageDays <= 7 && importedCount >= 5) return 'Active recently · direct source'
  if (avgSample >= 1800) return 'Large samples · less frequent'
  if (group.polls.length >= 40) return 'Deep archive · regular polling'
  if (importedCount >= 3) return 'Direct-source polling in archive'
  return 'Less frequent national polling'
}

function SectionLabel({ children, T, action }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: action ? 'space-between' : 'center',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
      }}
    >
      {action ? <div style={{ width: 80 }} /> : null}
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.tl,
          textAlign: 'center',
        }}
      >
        {children}
      </div>
      {action ? (
        <div
          style={{
            width: 80,
            fontSize: 12,
            fontWeight: 700,
            color: T.pr,
            textAlign: 'right',
            cursor: 'pointer',
          }}
          onClick={action.onClick}
        >
          {action.label}
        </div>
      ) : null}
    </div>
  )
}

function Badge({ children, color, subtle = false, compact = false }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: compact ? 9.5 : 12,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color,
        background: subtle ? `${color}12` : `${color}1F`,
        border: `1px solid ${color}2B`,
        borderRadius: 999,
        padding: compact ? '2.5px 6px' : '4px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function MiniBar({ value, max, color, T, height = 8 }) {
  const pct = Math.max(2, Math.min(100, ((value || 0) / Math.max(max || 1, 1)) * 100))
  return (
    <div
      style={{
        flex: 1,
        height,
        borderRadius: 999,
        background: T.c1 || 'rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 999,
        }}
      />
    </div>
  )
}

function HeroSnapshot({ T, parties, latestLivePoll, nav }) {
  const main = (parties || []).filter((p) => p.name !== 'Other').sort((a, b) => (b.pct || 0) - (a.pct || 0))
  const topFive = main.slice(0, 5)
  const leader = main[0]
  const runnerUp = main[1]
  const gap = leader && runnerUp ? +((safeNumber(leader.pct) || 0) - (safeNumber(runnerUp.pct) || 0)).toFixed(1) : null

  if (!leader) return null

  return (
    <div
      style={{
        borderRadius: 18,
        padding: '18px 18px 16px',
        marginBottom: 14,
        background: T.c0,
        border: `1px solid ${(leader.color || T.pr)}30`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Badge color={leader.color || T.pr}>Polling snapshot</Badge>
        {latestLivePoll ? <Badge color={T.pr} subtle>Latest imported poll</Badge> : null}
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: leader.color || T.th,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        {leader.abbr || leader.name}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: T.th,
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        {leader.pct}% {gap != null && runnerUp ? `· leads ${runnerUp.abbr || runnerUp.name} by ${gap}pt` : ''}
      </div>

      {latestLivePoll ? (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.tl,
            textAlign: 'center',
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          Latest imported poll: {cleanText(latestLivePoll.pollster)} · {formatUKDate(displayDate(latestLivePoll))}
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topFive.map((party, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr 40px',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: party.color, textAlign: 'left' }}>{party.abbr}</div>
            <MiniBar value={party.pct} max={leader.pct || 1} color={party.color} T={T} height={9} />
            <div style={{ fontSize: 13, fontWeight: 800, color: party.color, textAlign: 'right' }}>{party.pct}%</div>
          </div>
        ))}
      </div>

      {latestLivePoll ? (
        <div
          onClick={() => {
            haptic(6)
            nav('pollDetail', { poll: latestLivePoll })
          }}
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: 700,
            color: T.pr,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          Open latest imported poll →
        </div>
      ) : null}
    </div>
  )
}

function PollCard({ T, poll, nav, polls = [], pollContext = null, isFeatured = false }) {
  const results = getPollResults(poll)
  const leader = results[0]
  const max = leader?.pct || 30
  const subMeta = displaySubMeta(poll)
  const imported = isImportedPoll(poll)
  const sourceBadge = getSourceBadge(poll, T)
  const confidenceBadge = getConfidenceBadge(poll, T)
  const sourceText = cleanText(poll?.source)
  const sourceUrl = cleanText(poll?.sourceUrl)
  const takeaway = buildPollTakeaway(poll, polls, pollContext)

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollDetail', { poll })
      }}
      style={{
        borderRadius: 16,
        padding: '14px',
        marginBottom: 8,
        background: isFeatured ? (T.c1 || 'rgba(0,0,0,0.025)') : T.c0,
        border: `1px solid ${isFeatured ? (leader?.color || T.pr) + '55' : imported ? (leader?.color || T.pr) + '33' : T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            onClick={(e) => {
              e.stopPropagation()
              if (poll?.pollster) {
                haptic(6)
                nav('pollster', { pollster: poll.pollster })
              }
            }}
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: T.th,
              cursor: poll?.pollster ? 'pointer' : 'default',
              textAlign: 'left',
            }}
          >
            {cleanText(poll?.pollster) || 'Unknown pollster'}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.tl,
              marginTop: 3,
              textAlign: 'left',
            }}
          >
            {formatUKDate(displayDate(poll))}
          </div>

          {subMeta ? (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: T.tl,
                opacity: 0.85,
                marginTop: 4,
                textAlign: 'left',
                lineHeight: 1.4,
              }}
            >
              {subMeta}
            </div>
          ) : null}

          {takeaway ? (
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.th,
                marginTop: 6,
                textAlign: 'left',
                lineHeight: 1.35,
              }}
            >
              {takeaway}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 4, rowGap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '62%' }}>
          {isFeatured ? <Badge compact color={leader?.color || T.pr}>Latest</Badge> : null}
          {sourceBadge ? <Badge compact color={sourceBadge.color} subtle={sourceBadge.subtle}>{sourceBadge.label}</Badge> : null}
          {confidenceBadge ? <Badge compact color={confidenceBadge.color} subtle={confidenceBadge.subtle}>{confidenceBadge.label}</Badge> : null}
          {leader ? <Badge compact color={leader.color} subtle>{leader.short || leader.name} leads</Badge> : null}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {results.map((r) => (
          <div
            key={r.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '44px 1fr 34px',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: r.color, textAlign: 'left' }}>{r.short}</div>
            <MiniBar value={r.pct} max={max} color={r.color} T={T} />
            <div style={{ fontSize: 13, fontWeight: 800, color: r.color, textAlign: 'right' }}>{r.pct}%</div>
          </div>
        ))}
      </div>

      {sourceText || sourceUrl ? (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            fontSize: 12,
            fontWeight: 600,
            color: T.tl,
            lineHeight: 1.45,
            textAlign: 'center',
          }}
        >
          {sourceText || 'Source available'}
        </div>
      ) : null}

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: T.tl,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        Open poll detail →
      </div>
    </div>
  )
}

function PollsterCard({ T, group, nav, featured = false, mostActive = false }) {
  const latest = group.latestPoll
  const latestResults = getPollResults(latest).slice(0, 5)
  const importedCount = group.polls.filter((p) => isImportedPoll(p)).length
  const descriptor = getPollsterDescriptor(group)
  const latestAge = pollAgeDays(latest)

  function CompactPill({ children, color, subtle = true }) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color,
          background: subtle ? `${color}12` : `${color}20`,
          border: `1px solid ${color}24`,
          borderRadius: 999,
          padding: '4px 8px',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    )
  }

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollster', { pollster: group.name })
      }}
      style={{
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 7,
        background: featured ? (T.c1 || T.c0) : T.c0,
        border: `1px solid ${featured ? `${T.pr}32` : (T.cardBorder || 'rgba(0,0,0,0.08)')}`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{group.name}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 4 }}>
            {group.polls.length} poll{group.polls.length === 1 ? '' : 's'} stored
            {importedCount ? ` · ${importedCount} imported` : ''}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 4 }}>
            {descriptor}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {featured ? <CompactPill color={T.pr} subtle={false}>Latest</CompactPill> : null}
          {mostActive ? <CompactPill color={T.pr}>Most active</CompactPill> : null}
          {latestAge != null && latestAge <= 7 ? <CompactPill color="#02A95B">Active recently</CompactPill> : null}
          <CompactPill color={latest?.isBpcMember ? T.pr : T.tl}>
            {latest?.isBpcMember ? 'BPC member' : 'Pollster'}
          </CompactPill>
        </div>
      </div>

      {latest ? (
        <>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.tl, marginTop: 8, textAlign: 'center' }}>
            Latest: {formatUKDate(displayDate(latest))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: 8,
              marginTop: 7,
              alignItems: 'center',
            }}
          >
            {latestResults.map((r) => (
              <div key={r.key} style={{ fontSize: 13.5, fontWeight: 800, color: r.color, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {r.short} {r.pct}%
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.tl, marginTop: 8, textAlign: 'center' }}>
        Open pollster profile →
      </div>
    </div>
  )
}

function BriefingSection({ T, label, headline, bullets = [], first = false }) {
  if (!headline) return null

  return (
    <div
      style={{
        padding: '10px 0',
        borderTop: first ? 'none' : `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 9px',
          borderRadius: 999,
          background: T.c1 || 'rgba(0,0,0,0.04)',
          color: T.pr,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: 700,
          color: T.th,
          lineHeight: 1.45,
        }}
      >
        {headline}
      </div>

      {bullets.length ? (
        <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {bullets.map((bullet) => (
            <div
              key={`${label}-${bullet}`}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: T.tl,
                lineHeight: 1.45,
              }}
            >
              • {bullet}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function IntelligenceLine({ T, label, text, subtle = false }) {
  if (!text) return null

  return (
    <div
        style={{
          display: 'grid',
          gridTemplateColumns: '90px minmax(0, 1fr)',
          gap: 10,
          alignItems: 'start',
        paddingTop: 8,
        borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.35,
          textTransform: 'uppercase',
          color: subtle ? `${T.tl}cc` : `${T.tl}cc`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: subtle ? 600 : 700,
          color: subtle ? T.tl : T.th,
          lineHeight: 1.45,
        }}
      >
        {text}
      </div>
    </div>
  )
}

function PollBriefingCard({ T, raceState, topTwo = [], intelligence, whyItMatters = '' }) {
  if (!intelligence) return null
  const fallbackHeadline = topTwo.length >= 1 ? `${topTwo[0].name} lead the current picture` : 'Current polling picture'
  const fallbackSubline = topTwo.length >= 2 ? `${topTwo[0].name} remain ahead of ${topTwo[1].name}.` : 'Limited recent polling reduces certainty.'

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 12,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <SectionLabel T={T}>Polling intelligence</SectionLabel>

      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: T.th,
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        {raceState?.headline || fallbackHeadline}
      </div>

      {raceState?.subline ? (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: T.tl,
            lineHeight: 1.5,
            textAlign: 'center',
            marginTop: 6,
            maxWidth: 680,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {raceState.subline}
        </div>
      ) : (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: T.tl,
            lineHeight: 1.5,
            textAlign: 'center',
            marginTop: 6,
            maxWidth: 680,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {fallbackSubline}
        </div>
      )}

      {topTwo.length === 2 ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <Badge color={topTwo[0].color}>{topTwo[0].abbr} {topTwo[0].pct}%</Badge>
          <Badge color={topTwo[1].color} subtle>{topTwo[1].abbr} {topTwo[1].pct}%</Badge>
        </div>
      ) : null}

      <IntelligenceLine T={T} label="Confidence" text={intelligence.confidenceLine} />
      <IntelligenceLine T={T} label="What changed" text={intelligence.whatChangedLine} />
      {intelligence.disagreementNote ? <IntelligenceLine T={T} label="Disagreement" text={intelligence.disagreementNote} subtle /> : null}
      {whyItMatters ? <IntelligenceLine T={T} label="Why it matters" text={whyItMatters} subtle /> : null}
    </div>
  )
}

function buildWhyThisMattersBullets(parties = [], trendSeries = []) {
  const ranked = [...(Array.isArray(parties) ? parties : [])]
    .filter((party) => safeNumber(party?.pct) != null)
    .sort((a, b) => (safeNumber(b?.pct) || 0) - (safeNumber(a?.pct) || 0))

  const leader = ranked[0]
  const second = ranked[1]
  const trailing = ranked.slice(1, 4)
  const bullets = []

    if (leader && second) {
      const leadMargin = +((safeNumber(leader?.pct) || 0) - (safeNumber(second?.pct) || 0)).toFixed(1)
      if (leadMargin > 5) bullets.push('The lead is clearer than the race for second')
      else if (leadMargin < 4) bullets.push('The contest at the top remains finely balanced')
    }

  if (trailing.length >= 3) {
    const trailingValues = trailing.map((party) => safeNumber(party?.pct) || 0)
    const trailingSpread = Math.max(...trailingValues) - Math.min(...trailingValues)
      if (trailingSpread <= 3) bullets.push('The contest for second remains more open than the lead')
    }

  const rising = ranked
    .map((party) => ({ party, signal: getPartyTrendSignal(party, trendSeries) }))
    .filter((entry) => entry.signal?.movement === 'rising')
    .sort((a, b) => (b.signal?.change || 0) - (a.signal?.change || 0))[0]
    if (rising) bullets.push(`${shortPartyName(rising.party?.name)} look increasingly central to the contest`)

  const stableSignals = ranked
    .slice(0, 4)
    .map((party) => getPartyTrendSignal(party, trendSeries))
    .filter(Boolean)
  if (stableSignals.length && stableSignals.every((signal) => signal.movement === 'stable')) {
      bullets.push('The overall picture remains broadly settled')
    }

    if (!bullets.length) bullets.push('Recent polling still leaves the wider picture uncertain')

  return [...new Set(bullets)].slice(0, 4)
}


function getTrendValuesFromParties(parties, polls) {
  return (parties || [])
    .filter((p) => p.name !== 'Other')
    .map((p) => {
      const key = POLL_PARTIES.find((party) => {
        const partyMeta = getPollPartyMeta(party.key)
        return partyMeta.name === getPartyByName(p.name).name || p.abbr === partyMeta.short
      })?.key
      const series = key ? buildSeries(polls, key) : []
      const delta = series.length >= 2 ? +(series[series.length - 1] - series[0]).toFixed(1) : 0
      return {
        key,
        name: p.name,
        abbr: p.abbr,
        color: p.color,
        current: safeNumber(p.pct),
        delta,
        series,
      }
    })
    .filter((p) => p.key && p.current != null)
    .sort((a, b) => b.current - a.current)
}

function formatDelta(delta) {
  const value = typeof delta === 'number' ? delta : 0
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`
}

function ordinalWord(n) {
  if (n === 1) return 'first'
  if (n === 2) return 'second'
  if (n === 3) return 'third'
  if (n === 4) return 'fourth'
  if (n === 5) return 'fifth'
  return `${n}th`
}

function buildTrendTakeaway({ parties, polls, focusedKey, hidden }) {
  const trendPolls = getVisibleTrendPolls(polls, 3)
  const values = getTrendValuesFromParties(parties, trendPolls)
  const visible = values.filter((p) => !hidden?.[p.key])

  if (!visible.length) {
    return {
      headline: 'No visible trend lines',
      subhead: 'Bring a party back into view to rebuild the race picture.',
    }
  }

  const leader = visible[0]
  const challenger = visible[1]
  const gap = leader && challenger ? +((leader.current || 0) - (challenger.current || 0)).toFixed(1) : null

  let headline = leader ? `${leader.name} lead the race on ${leader.current}%` : 'Trend picture remains active'
  if (leader && challenger && gap != null) {
    headline = Math.abs(gap) < 0.5
      ? `${leader.name} and ${challenger.name} are effectively level`
      : `${leader.name} lead ${challenger.name} by ${gap}pt`
  }

  const focused = focusedKey ? visible.find((p) => p.key === focusedKey) : null
  if (focused) {
    const rank = visible.findIndex((p) => p.key === focused.key) + 1
    const rankText = rank ? ordinalWord(rank) : null
    const absDelta = Math.abs(focused.delta || 0)
    const movement = absDelta > 0.4
      ? `${focused.delta > 0 ? 'up' : 'down'} ${absDelta.toFixed(1)}pt`
      : 'broadly flat'

    if (focused.key !== leader.key && focused.key !== challenger?.key && leader && challenger) {
      return {
        headline,
        subhead: `${leader.name} remain ahead of ${challenger.name}, while ${focused.name} sit ${rankText} on ${focused.current}% and are ${movement}.`,
      }
    }

    return {
      headline,
      subhead: `${focused.name} sit ${rankText} on ${focused.current}% and are ${movement}.`,
    }
  }

  const rising = [...visible].sort((a, b) => (b.delta || 0) - (a.delta || 0)).find((p) => (p.delta || 0) > 0.4)
  const falling = [...visible].sort((a, b) => (a.delta || 0) - (b.delta || 0)).find((p) => (p.delta || 0) < -0.4)

  const parts = []
  if (leader && challenger) parts.push(`${leader.name} remain ahead of ${challenger.name}.`)
  if (rising) {
    parts.push(rising.key === leader.key || rising.key === challenger?.key
      ? `${rising.name} are still edging higher.`
      : `${rising.name} are the clearest risers.`)
  }
  if (
    falling &&
    falling.key !== leader.key &&
    falling.key !== challenger?.key &&
    (!rising || rising.key !== falling.key) &&
    parts.length < 2
  ) {
    parts.push(`${falling.name} have softened most.`)
  }
  if (!parts.length) parts.push('Recent movement remains fairly contained across the visible trend window.')

  return {
    headline,
    subhead: parts.slice(0, 2).join(' '),
  }
}

function CompactMovers({ movers, hidden, focused, onPress, T }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {movers.map((p) => {
        const hiddenNow = !!hidden[p.key]
        const focusedNow = focused === p.key && !hiddenNow
        const dimmed = !hiddenNow && focused && focused !== p.key

        return (
          <div
            key={p.key}
            onClick={() => {
              haptic(4)
              onPress(p.key)
            }}
            style={{
              position: 'relative',
              borderRadius: 14,
              padding: '9px 12px 9px 16px',
              background: focusedNow ? (T.c1 || 'rgba(0,0,0,0.04)') : (T.c0 || '#fff'),
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              alignItems: 'start',
              cursor: 'pointer',
              opacity: hiddenNow ? 0.28 : dimmed ? 0.5 : 1,
              transform: focusedNow ? 'translateY(-1px)' : 'none',
              boxShadow: focusedNow ? '0 4px 14px rgba(0,0,0,0.05)' : 'none',
              transition: 'opacity 0.2s ease, transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 8,
                bottom: 8,
                width: 4,
                borderRadius: 999,
                background: p.color,
              }}
            />

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: T.th,
                  lineHeight: 1.2,
                  textAlign: 'left',
                }}
              >
                {p.name}
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: 56 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: p.color,
                  lineHeight: 1,
                }}
              >
                {p.current}%
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.tl,
                  marginTop: 4,
                  lineHeight: 1.15,
                }}
              >
                {formatDelta(p.delta)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TrendSelectionStrip({ activeDate, rows, T }) {
  return (
    <div
      style={{
        marginTop: 10,
        position: 'relative',
        borderRadius: 14,
        padding: '8px 10px',
        background: T.c1 || 'rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 800,
            color: T.th,
            textAlign: 'left',
          }}
        >
          {activeDate}
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, paddingRight: 16 }}>
            {rows.map((row) => (
              <div
                key={row.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 9px',
                  borderRadius: 999,
                  background: `${row.color}14`,
                  color: row.color,
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{row.short}</span>
                <span>{row.selectedValue}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 26,
          pointerEvents: 'none',
          borderRadius: '0 14px 14px 0',
          background: `linear-gradient(270deg, ${T.c1 || 'rgba(255,255,255,0.98)'} 0%, ${T.c1 || 'rgba(255,255,255,0.98)'} 45%, transparent 100%)`,
        }}
      />
    </div>
  )
}


function nudgeFloatingLabels(items, minGap = 18, minTop = 14, maxTop = 322) {
  const adjusted = items.map((item) => ({ ...item }))

  for (let i = 1; i < adjusted.length; i += 1) {
    if (adjusted[i].top - adjusted[i - 1].top < minGap) {
      adjusted[i].top = adjusted[i - 1].top + minGap
    }
  }

  for (let i = adjusted.length - 2; i >= 0; i -= 1) {
    if (adjusted[i + 1].top - adjusted[i].top < minGap) {
      adjusted[i].top = adjusted[i + 1].top - minGap
    }
  }

  return adjusted.map((item) => ({
    ...item,
    top: Math.max(minTop, Math.min(maxTop, item.top)),
  }))
}

function PremiumTrendChart({
  polls,
  hidden,
  focused,
  setFocused,
  selectedIndex,
  setSelectedIndex,
  resetToAll,
  T,
}) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const trendPolls = getVisibleTrendPolls(polls, 3)

  const baseKeys = ['ref', 'lab', 'con', 'grn', 'ld']
  const optionalKeys = []
  if (trendPolls.some((poll) => safeNumber(poll?.rb) != null)) optionalKeys.push('rb')
  if (trendPolls.some((poll) => safeNumber(poll?.snp) != null)) optionalKeys.push('snp')

  const orderedKeys = [...baseKeys, ...optionalKeys]

  const series = orderedKeys
    .map((key) => {
      const points = trendPolls
        .map((poll, i) => {
          const value = safeNumber(poll?.[key])
          return value == null ? null : {
            i,
            value,
            date: displayDate(poll),
            poll,
          }
        })
        .filter(Boolean)

      return {
        key,
        label: getPollPartyMeta(key).name,
        short: getPollPartyMeta(key).short,
        color: getPollPartyMeta(key).color,
        points,
        latest: points[points.length - 1]?.value ?? null,
      }
    })
    .filter((item) => item.points.length >= 2)

  const visibleSeries = series.filter((item) => !hidden[item.key])
  if (!visibleSeries.length) return null

  const activeFocus = hoveredKey || focused
  const allVals = visibleSeries.flatMap((s) => s.points.map((p) => p.value))
  const minV = Math.max(0, Math.floor((Math.min(...allVals) - 2) / 5) * 5)
  const maxV = Math.min(100, Math.ceil((Math.max(...allVals) + 2) / 5) * 5)
  const yRange = Math.max(maxV - minV, 5)

  const pointCount = trendPolls.length
  const COL = 84
  const LEFT_RAIL = 44
  const TOP = 20
  const BOTTOM = 38
  const H = 340
  const INNER_H = H - TOP - BOTTOM
  const plotWidth = Math.max(520, Math.max(pointCount - 1, 1) * COL + 80)

  const xPos = (i) => 12 + i * COL
  const yPos = (value) => TOP + INNER_H - ((value - minV) / yRange) * INNER_H

  const selected = selectedIndex == null ? pointCount - 1 : selectedIndex

  const months = []
  let lastMonth = ''
  trendPolls.forEach((poll, i) => {
    const label = formatMonthLabel(displayDate(poll))
    if (label !== lastMonth) {
      months.push({ i, label })
      lastMonth = label
    }
  })

  const gridVals = []
  for (let v = minV; v <= maxV; v += 5) gridVals.push(v)

  const selectedRows = visibleSeries
    .map((s) => {
      const point = s.points.find((p) => p.i === selected)
      if (!point) return null
      return {
        ...s,
        selectedValue: point.value,
        top: yPos(point.value),
      }
    })
    .filter(Boolean)

  const activeDate = trendPolls[selected]
    ? displayDate(trendPolls[selected])
    : displayDate(trendPolls[trendPolls.length - 1])

  const selectedLineX = xPos(selected)
  const visiblePlotWidth = Math.max(plotWidth, 1)
  const stackWidth = 74
  const wantsLeftSide = selectedLineX > visiblePlotWidth - 110
  const stackLeft = wantsLeftSide
    ? Math.max(8, selectedLineX - stackWidth - 12)
    : Math.min(visiblePlotWidth - stackWidth - 6, selectedLineX + 10)

  const floatingRows = nudgeFloatingLabels(
    orderedKeys
      .map((key) => selectedRows.find((row) => row.key === key))
      .filter(Boolean),
    18,
    TOP + 2,
    H - BOTTOM - 8,
  )

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${LEFT_RAIL}px minmax(0, 1fr)`,
        columnGap: 0,
        alignItems: 'start',
      }}
    >
      <div
        style={{
          height: H,
          background: T.c1 || 'rgba(0,0,0,0.025)',
          position: 'relative',
          boxShadow: 'inset -8px 0 10px -10px rgba(0,0,0,0.18)',
          zIndex: 2,
        }}
      >
        <svg width={LEFT_RAIL} height={H} viewBox={`0 0 ${LEFT_RAIL} ${H}`} style={{ display: 'block' }}>
          {gridVals.map((v) => (
            <text
              key={v}
              x={LEFT_RAIL - 8}
              y={yPos(v) + 4}
              textAnchor="end"
              fontSize="10.5"
              fontWeight="700"
              fill={T.tl}
              opacity="0.82"
            >
              {v}
            </text>
          ))}
        </svg>
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            position: 'relative',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            paddingBottom: 8,
          }}
        >
          <svg
            viewBox={`0 0 ${plotWidth} ${H}`}
            width={plotWidth}
            height={H}
            style={{ display: 'block', overflow: 'visible' }}
            onClick={() => {
              resetToAll()
            }}
          >
            {gridVals.map((v) => (
              <line
                key={v}
                x1={0}
                y1={yPos(v)}
                x2={plotWidth}
                y2={yPos(v)}
                stroke="rgba(0,0,0,0.07)"
                strokeWidth="1"
              />
            ))}

            {months.map((m) => (
              <text key={m.i} x={xPos(m.i)} y={H - 10} textAnchor="middle" fontSize="11" fill={T.tl} fontWeight="700">
                {m.label}
              </text>
            ))}

            <line
              x1={selectedLineX}
              y1={TOP}
              x2={selectedLineX}
              y2={H - BOTTOM}
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {visibleSeries.map((s) => {
              const pts = s.points.map((p) => ({ ...p, x: xPos(p.i), y: yPos(p.value) }))
              const pathD = pts
                .map((pt, idx) => {
                  if (idx === 0) return `M${pt.x},${pt.y}`
                  const prev = pts[idx - 1]
                  const cpx = (prev.x + pt.x) / 2
                  return `C${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`
                })
                .join(' ')

              const selectedSeries = activeFocus ? activeFocus === s.key : false
              const dim = activeFocus ? activeFocus !== s.key : false

              return (
                <g key={s.key}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={selectedSeries ? 4 : 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={dim ? 0.18 : 1}
                    style={{ transition: 'opacity 0.2s ease, stroke-width 0.2s ease' }}
                  />

                  {pts.map((pt, idx) => {
                    const selectedPoint = idx === pts.length - 1 || pt.i === selected
                    return (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={selectedPoint ? 5 : 3.5}
                          fill={selectedPoint ? s.color : T.c0}
                          stroke={s.color}
                          strokeWidth={2}
                          opacity={dim ? 0.18 : 1}
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={18}
                          fill="transparent"
                          onMouseEnter={() => setHoveredKey(s.key)}
                          onMouseLeave={() => setHoveredKey(null)}
                          onClick={(e) => {
                            e.stopPropagation()
                            haptic(4)
                            setFocused(s.key)
                            setSelectedIndex(pt.i)
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </g>
                    )
                  })}
                </g>
              )
            })}

            {floatingRows.map((row) => {
              const focusedNow = focused === row.key
              const dim = activeFocus && activeFocus !== row.key
              return (
                <text
                  key={row.key}
                  x={stackLeft}
                  y={row.top + 4}
                  fontSize="12"
                  fontWeight={focusedNow ? 800 : 700}
                  fill={row.color}
                  opacity={dim ? 0.32 : focusedNow ? 1 : 0.82}
                  textAnchor="start"
                  style={{ transition: 'opacity 0.2s ease, font-weight 0.2s ease' }}
                >
                  {row.short} {row.selectedValue}%
                </text>
              )
            })}
          </svg>
        </div>

        <TrendSelectionStrip activeDate={activeDate} rows={selectedRows} T={T} />
      </div>
    </div>
  )
}

function CombinedTrendCard({
  T,
  polls,
  parties,
  pollContext,
  nav,
  hidden,
  focused,
  setFocused,
  setHidden,
}) {
  const displayTrends = buildDisplayTrendRows(polls, pollContext)
  const findPollById = (id) => (polls || []).find((poll) => String(poll?.id || '') === String(id || '')) || null
  const story = buildTrendTakeaway({
    parties,
    polls: displayTrends,
    focusedKey: focused,
    hidden,
  })

  const movers = getTrendValuesFromParties(parties, displayTrends).filter((m) => POLL_PARTY_KEYS.includes(m.key))

  const handleMoverPress = (key) => {
    const currentlyHidden = !!hidden[key]
    const currentlyFocused = focused === key
    const visibleCount = movers.filter((m) => !hidden[m.key]).length

    if (currentlyHidden) {
      setHidden((prev) => ({ ...prev, [key]: false }))
      setFocused(key)
      return
    }

    if (!currentlyFocused) {
      setFocused(key)
      return
    }

    if (visibleCount <= 1) return

    setHidden((prev) => ({ ...prev, [key]: true }))
    setFocused(null)
  }

  const resetToAll = () => {
    setFocused(null)
    setHidden({})
  }

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        background: T.c0,
        marginBottom: 12,
      }}
    >
      <div style={{ padding: '14px 16px 10px' }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: T.th,
            textAlign: 'left',
            lineHeight: 1.2,
            transition: 'opacity 0.18s ease',
          }}
        >
          {story.headline}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.tl,
            textAlign: 'left',
            lineHeight: 1.5,
            marginTop: 5,
            transition: 'opacity 0.18s ease',
          }}
        >
          {story.subhead}
        </div>

        <div style={{ marginTop: 12 }}>
          <SharedTrendChart
            trends={displayTrends}
            rawPolls={pollContext?.allPollsSorted || []}
            hidden={Object.fromEntries(Object.entries(hidden || {}).map(([key, value]) => [getPollPartyMeta(key)?.name || key, value]))}
            T={T}
            findPollById={findPollById}
            onOpenPoll={(poll) => nav('pollDetail', { poll })}
          />
        </div>
      </div>

      <div
        style={{
          background: T.sf,
          padding: '10px 12px 12px',
        }}
      >
        <CompactMovers
          movers={movers}
          hidden={hidden}
          focused={focused}
          onPress={handleMoverPress}
          T={T}
        />
      </div>
    </div>
  )
}


function MethodologyCard({ T, title, body }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '11px 13px',
        marginBottom: 6,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 800, color: T.th, marginBottom: 4, textAlign: 'center' }}>
        {title}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.55, textAlign: 'center' }}>
        {body}
      </div>
    </div>
  )
}

function MethodologyGroup({ T, title, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.tl,
          marginBottom: 7,
          textAlign: 'center',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function ScrollAwayHeader({ T, latestLivePoll }) {
  return (
    <div style={{ padding: '10px 16px 12px' }}>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: -1.1,
          color: T.th,
          textAlign: 'center',
        }}
      >
        Polls
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
          width: '100%',
          marginTop: 6,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
          Polling journey · latest race · pollsters · trends
        </div>
        <InfoButton id="poll_average" T={T} size={20} />
      </div>

      {latestLivePoll ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.tl,
            marginTop: 6,
            opacity: 0.85,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Latest imported poll in feed: {latestLivePoll.pollster} · {formatUKDate(displayDate(latestLivePoll))}
        </div>
      ) : null}
    </div>
  )
}

function StickyPillsBar({ T, tab, setTab }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8,
        background: T.sf,
        padding: '10px 16px 12px',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />
    </div>
  )
}

export default function PollsScreen({ T, parties, polls, meta, nav, pollContext = {}, dataState = {} }) {
  const [tab, setTab] = useState('snapshot')
  const [trendHidden, setTrendHidden] = useState({})
  const [trendFocused, setTrendFocused] = useState(null)

  const allPolls = useMemo(() => {
    const raw = Array.isArray(polls) ? polls : []
    return [...raw].sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a)))
  }, [polls])

  const importedPolls = useMemo(() => allPolls.filter((poll) => isImportedPoll(poll)), [allPolls])
  const latestPolls = useMemo(() => keepLatestPollPerPollster(importedPolls.length ? importedPolls : allPolls), [allPolls, importedPolls])
  const latestLivePoll = latestPolls[0] || importedPolls[0] || null

  const mainParties = useMemo(
    () => (Array.isArray(parties) ? parties : []).filter((p) => p.name !== 'Other').sort((a, b) => (b.pct || 0) - (a.pct || 0)),
    [parties],
  )

  const pollsterGroups = useMemo(() => groupPollsByPollster(allPolls), [allPolls])
  const maxPollsterCount = useMemo(
    () => pollsterGroups.reduce((max, group) => Math.max(max, group?.polls?.length || 0), 0),
    [pollsterGroups],
  )
  const pollSpread = useMemo(() => buildPollSpreadInsights({ polls: allPolls }), [allPolls])
  const pollHouseEffects = useMemo(() => buildPollHouseEffectsInsights({ polls: allPolls }), [allPolls])
  const raceState = useMemo(() => buildRaceStateSummary(mainParties, pollContext?.trendSeries || []), [mainParties, pollContext])
  const whyThisMatters = useMemo(
    () => buildWhyThisMattersBullets(mainParties, pollContext?.trendSeries || []),
    [mainParties, pollContext],
  )
  const pollingIntelligence = useMemo(
    () => buildPollingIntelligence({
      polls: allPolls,
      parties: mainParties,
      latestPoll: latestLivePoll || latestPolls[0] || null,
      pollContext,
      raceState,
      spread: pollSpread,
      houseEffects: pollHouseEffects,
    }),
    [allPolls, mainParties, latestLivePoll, latestPolls, pollContext, raceState, pollSpread, pollHouseEffects],
  )

  const topTwo = mainParties.slice(0, 2)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} latestLivePoll={latestLivePoll} />
      <StickyPillsBar T={T} tab={tab} setTab={setTab} />

        <div style={{ padding: '12px 16px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <SectionDataMeta T={T} section={dataState.polls || dataState.trends || null} />
          </div>
            {tab === 'snapshot' ? (
              <>
                <PollBriefingCard
                  T={T}
                  raceState={raceState}
                  topTwo={topTwo}
                  intelligence={pollingIntelligence}
                  whyItMatters={whyThisMatters[0] || ''}
                />

                <HeroSnapshot T={T} parties={mainParties} latestLivePoll={latestLivePoll} nav={nav} />

            {latestPolls[0] ? (
              <>
                <SectionLabel
                  T={T}
                  action={{
                    label: 'See all',
                    onClick: () => {
                      haptic(6)
                      setTab('latest')
                    },
                  }}
                >
                  Latest poll
                </SectionLabel>
                <PollCard T={T} poll={latestPolls[0]} nav={nav} />
              </>
            ) : null}

            <SectionLabel
              T={T}
              action={{
                label: 'See all',
                onClick: () => {
                  haptic(6)
                  setTab('pollsters')
                },
              }}
            >
              Pollster directory
            </SectionLabel>

            {pollsterGroups.slice(0, 5).map((group) => (
              <PollsterCard key={group.name} T={T} group={group} nav={nav} />
            ))}
          </>
        ) : null}

          {tab === 'latest' ? (
            <>
              <SectionLabel T={T}>Latest polls</SectionLabel>

              <div
                style={{
                  borderRadius: 14,
                  padding: '8px 12px',
                  marginBottom: 10,
                  background: T.c0,
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge color={T.pr}>{importedPolls.length ? 'Imported-first ordering' : 'Archive view'}</Badge>
                  <Badge color={T.tl} subtle>{latestPolls.length} shown</Badge>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: T.tl,
                    lineHeight: 1.4,
                    textAlign: 'center',
                    marginTop: 6,
                  }}
                >
                  Direct-source polls are prioritised when available.
                </div>
              </div>

              {latestPolls.map((poll, index) => (
                <PollCard
                  key={poll.id || `${poll.pollster}-${formatUKDate(displayDate(poll))}`}
                  T={T}
                  poll={poll}
                  nav={nav}
                  polls={allPolls}
                  pollContext={pollContext}
                  isFeatured={index === 0}
                />
              ))}

            {latestPolls.length === 0 ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: T.tl, textAlign: 'center' }}>
                No polls loaded yet.
              </div>
            ) : null}
          </>
        ) : null}

        {tab === 'trends' ? (
          <CombinedTrendCard
            T={T}
            polls={allPolls}
            parties={mainParties}
            pollContext={pollContext}
            nav={nav}
            hidden={trendHidden}
            focused={trendFocused}
            setFocused={setTrendFocused}
            setHidden={setTrendHidden}
          />
        ) : null}

        {tab === 'pollsters' ? (
          <>
            <SectionLabel T={T}>Pollsters</SectionLabel>

              {pollsterGroups.map((group, index) => (
                <PollsterCard
                  key={group.name}
                  T={T}
                  group={group}
                  nav={nav}
                  featured={index === 0}
                  mostActive={(group?.polls?.length || 0) === maxPollsterCount && maxPollsterCount > 1}
                />
              ))}

            <div
              style={{
                borderRadius: 14,
                padding: '13px 14px',
                marginTop: 12,
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 5, textAlign: 'center' }}>
                Pollster transparency
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6, textAlign: 'center' }}>
                Pollsters are now treated as real entities. Next stage should deepen this with methodology notes, BPC status, commissioner context and house-effect comparison.
              </div>
            </div>
          </>
        ) : null}

          {tab === 'methodology' ? (
            <>
              <SectionLabel T={T}>Methodology</SectionLabel>

              <MethodologyGroup T={T} title="How we rank polls">
                <MethodologyCard
                  T={T}
                  title="Direct-source polls are prioritised"
                  body="Polls with a direct source link and verified import metadata are shown ahead of older archive-only rows."
                />

                <MethodologyCard
                  T={T}
                  title="Trend views are directional"
                  body="Trend charts show the broader direction of travel over time, rather than a prediction or a single definitive number."
                />
              </MethodologyGroup>

              <MethodologyGroup T={T} title="How to read a poll">
                <MethodologyCard
                  T={T}
                  title="Fieldwork dates matter"
                  body="A poll released today may reflect interviews done earlier, so fieldwork dates often tell you more than the publish date alone."
                />

                <MethodologyCard
                  T={T}
                  title="Sample size helps, but it is not everything"
                  body="Larger samples can reduce random error, but weighting, turnout models and panel quality still shape the final result."
                />
              </MethodologyGroup>

              <MethodologyGroup T={T} title="Why polls differ">
                <MethodologyCard
                  T={T}
                  title="Polling firms can show different pictures"
                  body="House effects, turnout assumptions and different handling of undecided voters can all shift the topline, even in the same week."
                />
              </MethodologyGroup>
            </>
          ) : null}
      </div>
    </div>
  )
}
