import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import BriefingPanel from '../components/BriefingPanel'
import { POLICY_RECORDS } from '../data/policy/policyRecords'
import { derivePartyAreaPreview } from '../data/policy/policyCompareSelectors'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const POLICY_TOPICS = [
  { key: 'overview', label: 'Overview' },
  { key: 'immigration', label: 'Immigration' },
  { key: 'economy', label: 'Economy' },
  { key: 'nhs', label: 'NHS' },
  { key: 'climate', label: 'Climate' },
]

function SectionLabel({ children, T }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: T.tl,
        marginBottom: 8,
        marginTop: 6,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function PartyPicker({ T, main, slot, exclude, onPick, onCancel, swipeHandlers }) {
  return (
    <div
      {...(swipeHandlers || {})}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: T.sf,
      }}
    >
      <div style={{ padding: '18px 18px 0', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: -1,
                color: T.th,
                lineHeight: 1,
              }}
            >
              Choose Party {slot}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
              Pick a side for the comparison
            </div>
          </div>

          <motion.div
            {...TAP}
            onClick={onCancel}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.tl,
              cursor: 'pointer',
              padding: '6px 10px',
            }}
          >
            Cancel
          </motion.div>
        </div>
      </div>

      <ScrollArea>
        {main
          .filter((p) => p.name !== exclude)
          .map((p, i) => (
            <motion.div
              key={i}
              {...TAP}
              onClick={() => {
                haptic(6)
                onPick(p.name)
              }}
              style={{
                borderRadius: 14,
                padding: '13px 14px',
                marginBottom: 8,
                background: T.c0 || '#fff',
                border: `1px solid ${p.color}28`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: p.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{p.name}</div>
                <div style={{ fontSize: 13, color: T.tl }}>
                  {formatPercent(p.pct)} · {formatWholeNumber(p.seats)} seats
                </div>
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: p.color,
                }}
              >
                {formatPercent(p.pct)}
              </div>
            </motion.div>
          ))}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}

function StickyPillsBar({ T, pills, tab, setTab }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8,
        background: T.sf,
        padding: '10px 16px 12px',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}` ,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <StickyPills pills={pills} active={tab} onSelect={setTab} T={T} />
    </div>
  )
}


function hasSourcedFavourability(leader) {
  if (!leader || !Number.isFinite(Number(leader.net))) return false
  const label = String(leader.metricLabel || '').toLowerCase()
  const hasSourceMarker =
    leader.ratingSource === 'sourced' ||
    Boolean(leader.sourceUrl || leader.source || leader.publishedAt || leader.fieldworkDate)
  return hasSourceMarker && label.includes('favourability')
}

function leaderRatingDisplay(leader) {
  if (!leader) {
    return { value: '—', label: 'No leader data', sourced: false }
  }
  if (!hasSourcedFavourability(leader)) {
    return {
      value: 'Profile only',
      label: 'No sourced favourability row yet',
      sourced: false,
    }
  }
  return {
    value: formatLeaderGap(leader.net),
    label: leader.metricLabel || 'Net favourability',
    sourced: true,
  }
}

function compareLeaderLine(leaderA, leaderB, partyA, partyB) {
  if (!leaderA || !leaderB) return null
  const aSourced = hasSourcedFavourability(leaderA)
  const bSourced = hasSourcedFavourability(leaderB)

  if (!aSourced || !bSourced) {
    const missing = [!aSourced ? leaderA?.name : null, !bSourced ? leaderB?.name : null]
      .filter(Boolean)
      .map((name) => name.split(' ').slice(-1)[0])
      .join(' and ')
    return {
      title: 'Leader favourability is not directly comparable',
      body: `${missing || 'One leader'} has no sourced net favourability row yet, so Politiscope is not comparing profile-only ratings with sourced polling.`,
      accent: aSourced ? partyA?.color : bSourced ? partyB?.color : partyA?.color,
    }
  }

  const a = Number(leaderA.net ?? 0)
  const b = Number(leaderB.net ?? 0)
  const winningParty = a >= b ? partyA : partyB
  const winningLeader = a >= b ? leaderA : leaderB
  const losingLeader = a >= b ? leaderB : leaderA

  if (a < 0 && b < 0) {
    return {
      title: `${winningParty.abbr} has the less negative leader favourability`,
      body: `${winningLeader.name.split(' ').slice(-1)[0]} is ${a >= b ? formatLeaderGap(a) : formatLeaderGap(b)}; ${losingLeader.name.split(' ').slice(-1)[0]} is ${a >= b ? formatLeaderGap(b) : formatLeaderGap(a)}. Neither leader is strongly well-rated overall.`,
      accent: winningParty.color,
    }
  }

  return {
    title: `${winningParty.abbr} has the stronger sourced leader favourability`,
    body: `${winningLeader.name.split(' ').slice(-1)[0]} is ${a >= b ? formatLeaderGap(a) : formatLeaderGap(b)}; ${losingLeader.name.split(' ').slice(-1)[0]} is ${a >= b ? formatLeaderGap(b) : formatLeaderGap(a)}.`,
    accent: winningParty.color,
  }
}

function safeNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function roundForDisplay(value, decimals = 1) {
  const number = safeNumber(value)
  if (number == null) return null
  const factor = 10 ** decimals
  const rounded = Math.round((number + Number.EPSILON) * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}

function formatMetricNumber(value, decimals = 1) {
  const rounded = roundForDisplay(value, decimals)
  if (rounded == null) return '0'
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals).replace(/\.0+$/, '')
}

function formatPointGap(value) {
  return `${formatMetricNumber(value)}pt`
}

function formatSignedPoints(value) {
  const rounded = roundForDisplay(value)
  if (rounded == null) return null
  return `${rounded > 0 ? '+' : ''}${formatMetricNumber(rounded)}pt`
}

function formatWholeNumber(value) {
  const number = safeNumber(value)
  if (number == null) return '—'
  return String(Math.round(number))
}

function formatLeaderGap(value) {
  const rounded = roundForDisplay(value)
  if (rounded == null) return '—'
  return `${rounded > 0 ? '+' : ''}${formatMetricNumber(rounded)}`
}

function formatPercent(value) {
  const number = safeNumber(value)
  if (number == null) return '—'
  return `${formatMetricNumber(number)}%`
}

function seatData(leadParty, trailParty) {
  const leadSeats = safeNumber(leadParty?.seats)
  const trailSeats = safeNumber(trailParty?.seats)
  if (leadSeats == null || trailSeats == null) return null
  return {
    leadSeats,
    trailSeats,
    gap: Math.abs(leadSeats - trailSeats),
  }
}

function getTrendValue(row, party) {
  if (!row || !party) return null
  const candidates = [party.name, party.abbr, party.key].filter(Boolean)
  for (const key of candidates) {
    const value = safeNumber(row[key])
    if (value != null) return value
  }
  return null
}

function inferPairDeltaFromTrends(party, trends = []) {
  if (!party || !Array.isArray(trends) || trends.length < 2) return null
  const points = trends
    .map((row) => getTrendValue(row, party))
    .filter((value) => value != null)
  if (points.length < 2) return null
  return +(points[points.length - 1] - points[0]).toFixed(1)
}

function getPairDelta(party, trends = []) {
  if (!party) return null
  const explicit = safeNumber(party.recentDelta)
  if (explicit != null) return explicit
  const change = safeNumber(party.change)
  if (change != null) return change
  return inferPairDeltaFromTrends(party, trends)
}

function describeSeatGap(leadParty, trailParty) {
  const seats = seatData(leadParty, trailParty)
  if (!seats) return ''
  if (!seats.gap) return ', with no seat gap in the current projection'
  return `, with a ${formatWholeNumber(seats.gap)}-seat gap in the current projection`
}

// Pair comparison must not reuse global field narratives: every sentence below
// is derived only from the two selected parties and their direct metrics.
function derivePairRaceStatus(partyA, partyB) {
  if (!partyA || !partyB) return null

  const aPct = safeNumber(partyA.pct) ?? 0
  const bPct = safeNumber(partyB.pct) ?? 0
  const leadParty = aPct >= bPct ? partyA : partyB
  const trailParty = leadParty.name === partyA.name ? partyB : partyA
  const leadPct = Math.max(aPct, bPct)
  const trailPct = Math.min(aPct, bPct)
  const gap = +(leadPct - trailPct).toFixed(1)
  const gapText = `${formatMetricNumber(gap)} point${gap === 1 ? '' : 's'}`
  const seats = seatData(leadParty, trailParty)
  const seatGap = seats?.gap ?? null
  const seatClause = describeSeatGap(leadParty, trailParty)
  const leadDelta = getPairDelta(leadParty)
  const trailDelta = getPairDelta(trailParty)
  const hasMovement = leadDelta != null && trailDelta != null
  const movementGap = hasMovement ? +(leadDelta - trailDelta).toFixed(1) : null
  const trailingHasMomentum = hasMovement && trailDelta - leadDelta >= 0.8
  const leadWidening = hasMovement && movementGap >= 0.8
  const bothFlat = hasMovement && Math.abs(leadDelta) < 0.5 && Math.abs(trailDelta) < 0.5
  const seatGapLarge = seatGap != null && seatGap >= 40
  const seatGapSmall = seatGap != null && seatGap <= 10
  const seatGapAmplifies = seatGapLarge && gap >= 4
  const seatGapUnderstates = seatGapSmall && gap >= 4

  if (gap <= 1) {
    return {
      leadParty,
      trailParty,
      gap,
      title: `${partyA.name} and ${partyB.name} are effectively level`,
      body: bothFlat
        ? `${partyA.name} and ${partyB.name} are level in vote share, with little recent movement changing the matchup.`
        : `${partyA.name} and ${partyB.name} are separated by ${gapText}; recent movement matters more than the current gap.`,
      accent: leadParty.color,
    }
  }

  if (gap <= 3) {
    return {
      leadParty,
      trailParty,
      gap,
      title: `${leadParty.name} narrowly lead ${trailParty.name}`,
      body: trailingHasMomentum
        ? `${leadParty.name} lead narrowly, but ${trailParty.name} have the stronger recent movement.`
        : `${leadParty.name} hold a narrow edge over ${trailParty.name}; the matchup remains sensitive to small polling shifts.`,
      accent: leadParty.color,
    }
  }

  if (gap <= 8) {
    const body = trailingHasMomentum
      ? `${leadParty.name} lead ${trailParty.name} on vote share, though recent movement is working more in ${trailParty.name}'s favour.`
      : leadWidening
        ? `${leadParty.name} hold the vote-share lead and recent movement is modestly widening the gap.`
        : seatGapAmplifies
          ? `${leadParty.name} have a vote-share lead over ${trailParty.name}, and the seat projection makes that advantage look firmer.`
          : seatGapUnderstates
            ? `${leadParty.name} lead on vote share, but the seat projection keeps the contest closer than the headline gap suggests.`
            : `${leadParty.name} lead ${trailParty.name}, with the current gap looking stable rather than sharply changing.`

    return {
      leadParty,
      trailParty,
      gap,
      title: `${leadParty.name} lead ${trailParty.name} by ${gapText}`,
      body,
      accent: leadParty.color,
    }
  }

  const wideBody = trailingHasMomentum
    ? `${leadParty.name} lead comfortably on the headline numbers, even though ${trailParty.name} have the stronger recent uptick.`
    : leadWidening
      ? `${leadParty.name} already hold a clear advantage over ${trailParty.name}, and recent movement is reinforcing it.`
      : seatGapAmplifies
        ? `${leadParty.name} have both a clear vote-share lead and a larger seat advantage over ${trailParty.name}.`
        : `${leadParty.name} hold a clear advantage over ${trailParty.name}, but recent movement is not widening the gap.`

  return {
    leadParty,
    trailParty,
    gap,
    title: `${leadParty.name} are well ahead of ${trailParty.name}`,
    body: wideBody,
    accent: leadParty.color,
  }
}

// Movement is also pair-scoped. We prefer explicit party deltas, then infer a
// simple trend-window delta only for the selected parties if needed.
function derivePairMovementSummary(partyA, partyB, trends = []) {
  if (!partyA || !partyB) return null

  const aDelta = getPairDelta(partyA, trends)
  const bDelta = getPairDelta(partyB, trends)
  const hasA = aDelta != null
  const hasB = bDelta != null

  if (!hasA && !hasB) {
    return {
      title: 'Recent movement is not clear enough to call',
      body: `No reliable recent movement signal is available for ${partyA.name} or ${partyB.name}.`,
      accent: partyA.color,
      party: partyA,
    }
  }

  if (hasA && hasB) {
    const aText = formatSignedPoints(aDelta)
    const bText = formatSignedPoints(bDelta)
    const deltaGap = +(aDelta - bDelta).toFixed(1)

    if (Math.abs(deltaGap) < 0.5) {
      const bothFlat = Math.abs(aDelta) < 0.5 && Math.abs(bDelta) < 0.5
      return {
        title: bothFlat
          ? `${partyA.name} and ${partyB.name} are broadly static`
          : `${partyA.name} and ${partyB.name} show similar movement`,
        body: bothFlat
          ? `Neither side is changing the matchup materially on the recent measure.`
          : `${partyA.name} are ${aText} and ${partyB.name} are ${bText}, so movement is not separating them.`,
        accent: partyA.color,
        party: partyA,
      }
    }

    const stronger = deltaGap > 0 ? partyA : partyB
    const weaker = stronger.name === partyA.name ? partyB : partyA
    const strongerDelta = stronger.name === partyA.name ? aDelta : bDelta
    const weakerDelta = stronger.name === partyA.name ? bDelta : aDelta
    const isRising = strongerDelta > 0
    const strongerTrails = (safeNumber(stronger.pct) ?? 0) < (safeNumber(weaker.pct) ?? 0)
    const weakerFalling = weakerDelta < -0.5

    return {
      title: strongerTrails
        ? `${stronger.name} have momentum from behind`
        : `${stronger.name} show the stronger recent movement`,
      body: strongerTrails
        ? `${stronger.name} still trail, but their recent movement is stronger than ${weaker.name}'s.`
        : weakerFalling
          ? `${stronger.name} are firmer while ${weaker.name} are slipping on the recent measure.`
          : `${stronger.name} are ${formatSignedPoints(strongerDelta)}, compared with ${formatSignedPoints(weakerDelta)} for ${weaker.name}.`,
      accent: isRising ? stronger.color : weaker.color,
      party: stronger,
    }
  }

  const party = hasA ? partyA : partyB
  const delta = hasA ? aDelta : bDelta
  const other = hasA ? partyB : partyA

  return {
    title: `${party.name} have the clearer movement signal`,
    body: `${party.name} are ${formatSignedPoints(delta)} on the recent measure; no comparable signal is available for ${other.name}.`,
    accent: party.color,
    party,
  }
}

function derivePairComparisonBriefing({ partyA, partyB, trends = [] }) {
  const race = derivePairRaceStatus(partyA, partyB)
  const movement = derivePairMovementSummary(partyA, partyB, trends)
  if (race?.trailParty && movement?.party?.name === race.trailParty.name) {
    race.body = `${race.body.replace(/\.$/, '')}, while ${race.trailParty.name} have the stronger recent movement.`
  }
  return { race, movement }
}

function H2HRow({ T, label, valA, valB, colorA, colorB, winnerA, onClick }) {
  const clickable = typeof onClick === 'function'
  const leftWins = winnerA === true
  const rightWins = winnerA === false
  const neutral = winnerA == null
  const muted = T.tl || 'rgba(10, 35, 48, 0.64)'
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(74px, 1fr) minmax(72px, auto) minmax(74px, 1fr)',
        alignItems: 'center',
        gap: 8,
        minHeight: 48,
        padding: '9px 10px',
        marginBottom: 6,
        borderRadius: 12,
        background: T.c0 || '#fff',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
        boxShadow: '0 1px 0 rgba(255,255,255,0.54) inset',
        cursor: clickable ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          textAlign: 'left',
          fontSize: 18,
          fontWeight: leftWins ? 900 : 760,
          color: leftWins ? colorA : neutral ? T.th : muted,
          opacity: rightWins ? 0.58 : 1,
          lineHeight: 1.1,
        }}
      >
        {valA}
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.tl,
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          opacity: 0.68,
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>

      <div
        style={{
          textAlign: 'right',
          fontSize: 18,
          fontWeight: rightWins ? 900 : 760,
          color: rightWins ? colorB : neutral ? T.th : muted,
          opacity: leftWins ? 0.58 : 1,
          lineHeight: 1.1,
        }}
      >
        {valB}
      </div>
    </div>
  )
}

function topicPreview(topic, partyName, policyRecords) {
  const preview = derivePartyAreaPreview(policyRecords, partyName, topic)
  return preview?.missing ? null : preview
}

function previewText(preview) {
  if (!preview || preview.missing) return 'No structured record available yet for this issue.'
  const detail = preview.details?.[0]
  return detail ? `${preview.summary} ${detail}` : preview.summary
}

function normaliseCompareTab(tab) {
  return POLICY_TOPICS.some((item) => item.key === tab) ? tab : 'overview'
}

function isSwipeBlocked(target) {
  let node = target
  while (node && node !== document.body) {
    if (node.dataset?.noSwipe !== undefined || node.classList?.contains('no-swipe')) return true
    const style = window.getComputedStyle(node)
    if (style.overflowX === 'auto' || style.overflowX === 'scroll') return true
    node = node.parentElement
  }
  return false
}

export default function CompareScreen({
  T,
  nav,
  parties = [],
  leaders = [],
  pollContext = {},
  policyRecords = POLICY_RECORDS,
  initialTab = 'overview',
  leftParty,
  rightParty,
  fromScreen,
  fromPartyIdx,
  fromLeaderIdx,
  returnTab,
  returnPolicyArea,
  goBack,
  closeSheet,
  updateCurrentParams,
}) {
  const [selA, setSelA] = useState(leftParty || null)
  const [selB, setSelB] = useState(rightParty || null)
  const [tab, setTab] = useState(() => normaliseCompareTab(initialTab))
  const [pick, setPick] = useState(null)
  const swipeState = useRef({ startX: 0, startY: 0, startTime: 0, locked: null, blocked: false })
  const hasOriginReturn =
    (fromScreen === 'party' && fromPartyIdx !== undefined) ||
    (fromScreen === 'leader' && fromLeaderIdx !== undefined)

  const handleCompareBack = () => {
    haptic(8)
    if (hasOriginReturn) {
      goBack?.()
      return
    }
    closeSheet?.()
  }

  const onCompareTouchStart = (event) => {
    event.stopPropagation()
    const touch = event.touches?.[0]
    if (!touch) return
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      locked: null,
      blocked: isSwipeBlocked(event.target),
    }
  }

  const onCompareTouchMove = (event) => {
    event.stopPropagation()
    if (swipeState.current.blocked) return
    const touch = event.touches?.[0]
    if (!touch) return
    const dx = Math.abs(touch.clientX - swipeState.current.startX)
    const dy = Math.abs(touch.clientY - swipeState.current.startY)
    if (!swipeState.current.locked && (dx > 8 || dy > 8)) {
      swipeState.current.locked = dx > dy ? 'h' : 'v'
    }
  }

  const onCompareTouchEnd = (event) => {
    event.stopPropagation()
    const state = swipeState.current
    if (state.blocked || state.locked !== 'h') return
    const touch = event.changedTouches?.[0]
    if (!touch) return
    const dx = touch.clientX - state.startX
    const dt = Math.max(Date.now() - state.startTime, 1)
    const velocity = Math.abs(dx) / dt
    if (state.startX < 30 || state.startX > window.innerWidth - 30) return
    if (dx > 80 && velocity > 0.3) handleCompareBack()
  }

  const main = useMemo(
    () =>
      parties
        .filter((p) => p.name !== 'Other')
        .sort((a, b) => (b.pct || 0) - (a.pct || 0)),
    [parties],
  )

  useEffect(() => {
    const nextA = main.find((party) => party.name === leftParty || party.abbr === leftParty)
    const nextB = main.find((party) => party.name === rightParty || party.abbr === rightParty)
    if (nextA && nextB && nextA.name !== nextB.name) {
      setSelA(nextA.name)
      setSelB(nextB.name)
      return
    }
    if (main.length >= 2) {
      setSelA((current) => current || main[0].name)
      setSelB((current) => current || main[1].name)
    }
  }, [main, leftParty, rightParty])

  useEffect(() => {
    setTab(normaliseCompareTab(initialTab))
  }, [initialTab])

  const partyA = main.find((p) => p.name === selA)
  const partyB = main.find((p) => p.name === selB)
  const leaderA = leaders?.find((l) => l.party === selA)
  const leaderB = leaders?.find((l) => l.party === selB)
  const both = partyA && partyB

  const leadParty = both ? ((partyA.pct || 0) >= (partyB.pct || 0) ? partyA : partyB) : null
  const trailParty = both ? (leadParty?.name === partyA?.name ? partyB : partyA) : null
  const gap = both ? Math.abs((partyA.pct || 0) - (partyB.pct || 0)) : null
  const gapDisplay = gap == null ? '0pt' : formatPointGap(gap)
  const pairBriefing = useMemo(
    () =>
      both
        ? derivePairComparisonBriefing({
            partyA,
            partyB,
            trends: pollContext?.trendSeries || [],
          })
        : null,
    [
      both,
      partyA?.name,
      partyA?.pct,
      partyA?.seats,
      partyA?.change,
      partyA?.recentDelta,
      partyB?.name,
      partyB?.pct,
      partyB?.seats,
      partyB?.change,
      partyB?.recentDelta,
      pollContext?.trendSeries,
    ],
  )
  const approvalLine = compareLeaderLine(leaderA, leaderB, partyA, partyB)
  const leaderADisplay = leaderRatingDisplay(leaderA)
  const leaderBDisplay = leaderRatingDisplay(leaderB)
  const leadersComparable = Boolean(leaderA && leaderB && leaderADisplay.sourced && leaderBDisplay.sourced)
  const issueTopic = ['immigration', 'economy', 'nhs', 'climate'].find((topic) => topicPreview(topic, partyA?.name, policyRecords) || topicPreview(topic, partyB?.name, policyRecords))
  const issueA = issueTopic ? topicPreview(issueTopic, partyA?.name, policyRecords) : null
  const issueB = issueTopic ? topicPreview(issueTopic, partyB?.name, policyRecords) : null
  const activePolicyArea = tab !== 'overview' ? tab : issueTopic || 'immigration'

  const setCompareTab = (nextTab) => {
    haptic(4)
    setTab(nextTab)
    updateCurrentParams?.({ tab: nextTab })
  }

  const openPartyDetail = (party, area = activePolicyArea, openTab = 'pledges') => {
    if (!party) return
    const idx = parties.findIndex((item) => item.name === party.name)
    if (idx < 0) return
    haptic(8)
    nav('party', {
      idx,
      from: 'compare',
      fromScreen: 'compare',
      compareOpponent: party.name === partyA?.name ? partyB?.name : partyA?.name,
      openTab,
      selectedPolicyArea: area,
      policyArea: area,
    })
  }

  const briefingItems = both
    ? [
        {
          key: 'race',
          kicker: 'Race status',
          title: pairBriefing?.race?.title || (gap <= 2 ? 'This one is genuinely close' : `${leadParty?.abbr} leads in the current snapshot`),
          body: pairBriefing?.race?.body || (gap <= 2
              ? `${partyA.abbr} and ${partyB.abbr} are separated by just ${gapDisplay} in the current snapshot.`
              : `${leadParty?.name} leads ${trailParty?.name} by ${gapDisplay} in the current snapshot.`),
          accent: pairBriefing?.race?.accent || leadParty?.color,
          onClick: () => openPartyDetail(pairBriefing?.race?.leadParty || leadParty, activePolicyArea, 'trend'),
          actionLabel: 'Open party trend',
        },
        pairBriefing?.movement
          ? {
              key: 'momentum',
              kicker: 'Recent movement',
              title: pairBriefing.movement.title,
              body: pairBriefing.movement.body,
              accent: pairBriefing.movement.accent,
              onClick: () => openPartyDetail(pairBriefing.movement.party || leadParty, activePolicyArea, 'trend'),
              actionLabel: 'Open party trend',
            }
          : null,
        approvalLine
          ? {
              key: 'leaders',
              kicker: 'Leader edge',
              title: approvalLine.title,
              body: approvalLine.body,
              accent: approvalLine.accent,
            }
          : issueTopic
            ? {
                key: 'policy',
                kicker: `${POLICY_TOPICS.find((t) => t.key === issueTopic)?.label || 'Policy'} split`,
                title: 'The argument is different, not just the branding',
                body: `${partyA.abbr}: ${previewText(issueA).slice(0, 72)}${previewText(issueA).length > 72 ? '…' : ''}  ${partyB.abbr}: ${previewText(issueB).slice(0, 72)}${previewText(issueB).length > 72 ? '…' : ''}`,
                accent: leadParty?.color,
                onClick: () => setCompareTab(issueTopic),
                actionLabel: `Open ${POLICY_TOPICS.find((t) => t.key === issueTopic)?.label || 'policy'} split`,
              }
            : null,
      ].filter(Boolean)
    : []

  const availTabs = POLICY_TOPICS.filter((t) => {
    if (t.key === 'overview') return true
    if (!both) return false
    return topicPreview(t.key, partyA?.name, policyRecords) || topicPreview(t.key, partyB?.name, policyRecords)
  })

  if (pick) {
    return (
      <PartyPicker
        T={T}
        main={main}
        slot={pick}
        exclude={pick === 'A' ? selB : selA}
        onPick={(name) => {
          if (pick === 'A') {
            setSelA(name)
            updateCurrentParams?.({ leftParty: name, rightParty: selB })
          } else {
            setSelB(name)
            updateCurrentParams?.({ leftParty: selA, rightParty: name })
          }
          setPick(null)
          setCompareTab('overview')
        }}
        onCancel={() => setPick(null)}
        swipeHandlers={{
          onTouchStart: onCompareTouchStart,
          onTouchMove: onCompareTouchMove,
          onTouchEnd: onCompareTouchEnd,
          onTouchCancel: (event) => event.stopPropagation(),
        }}
      />
    )
  }

  return (
    <div
      onTouchStart={onCompareTouchStart}
      onTouchMove={onCompareTouchMove}
      onTouchEnd={onCompareTouchEnd}
      onTouchCancel={(event) => event.stopPropagation()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 56px 1fr',
          gap: 10,
          padding: '0 14px 0',
          alignItems: 'stretch',
          flexShrink: 0,
        }}
      >
        <motion.div
          {...TAP}
          onClick={() => {
            haptic(6)
            setPick('A')
          }}
          style={{
            borderRadius: 14,
            cursor: 'pointer',
            background: T.c0 || '#fff',
            border: `1px solid ${partyA?.color ? `${partyA.color}33` : T.cardBorder || 'rgba(0,0,0,0.07)'}`,
            overflow: 'hidden',
            minHeight: 92,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {partyA && <div style={{ height: 3, background: partyA.color }} />}

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 10px',
              textAlign: 'center',
            }}
          >
            {partyA ? (
              <>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: partyA.color,
                    marginBottom: 3,
                  }}
                >
                  {partyA.name}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: partyA.color,
                    lineHeight: 1,
                  }}
                >
                  {formatPercent(partyA.pct)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 2 }}>
                  {formatWholeNumber(partyA.seats)} seats
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    haptic(6)
                    setPick('A')
                  }}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: T.tl,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginTop: 7,
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Change party
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, color: T.tl, marginBottom: 4 }}>+</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>Party A</div>
              </>
            )}
          </div>
        </motion.div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            color: T.tl,
            textAlign: 'center',
            minHeight: 92,
          }}
        >
          VS
        </div>

        <motion.div
          {...TAP}
          onClick={() => {
            haptic(6)
            setPick('B')
          }}
          style={{
            borderRadius: 14,
            cursor: 'pointer',
            background: T.c0 || '#fff',
            border: `1px solid ${partyB?.color ? `${partyB.color}33` : T.cardBorder || 'rgba(0,0,0,0.07)'}`,
            overflow: 'hidden',
            minHeight: 92,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {partyB && <div style={{ height: 3, background: partyB.color }} />}

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 10px',
              textAlign: 'center',
            }}
          >
            {partyB ? (
              <>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: partyB.color,
                    marginBottom: 3,
                  }}
                >
                  {partyB.name}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: partyB.color,
                    lineHeight: 1,
                  }}
                >
                  {formatPercent(partyB.pct)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 2 }}>
                  {formatWholeNumber(partyB.seats)} seats
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    haptic(6)
                    setPick('B')
                  }}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: T.tl,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginTop: 7,
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Change party
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, color: T.tl, marginBottom: 4 }}>+</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>Party B</div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {both && <StickyPillsBar T={T} pills={availTabs} tab={tab} setTab={setCompareTab} />}

      <div style={{ padding: '12px 16px 40px' }}>
        {!both && (
          <div style={{ textAlign: 'center', padding: '44px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>⚖️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.th, marginBottom: 8 }}>
              Pick two parties above
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T.tl,
                lineHeight: 1.7,
                maxWidth: 280,
                margin: '0 auto',
              }}
            >
              Compare polling, seats, leader ratings, and policy positions side by side
            </div>
          </div>
        )}

        {both && tab === 'overview' && (
          <>
            <BriefingPanel
              T={T}
              title="Comparison briefing"
              subtitle={`${partyA.name} vs ${partyB.name} in plain English, before you get into the raw numbers.`}
              items={briefingItems}
              style={{ marginBottom: 12 }}
            />

            <div
              onClick={() => openPartyDetail(leadParty, activePolicyArea, 'trend')}
              style={{
                borderRadius: 14,
                padding: '13px 14px',
                marginBottom: 10,
                background: T.c0 || '#fff',
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: T.tl,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Poll gap
              </div>

              <div
                style={{
                  display: 'flex',
                  height: 12,
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginBottom: 7,
                }}
              >
                <div style={{ flex: safeNumber(partyA.pct) ?? 0, background: partyA.color }} />
                <div style={{ flex: safeNumber(partyB.pct) ?? 0, background: partyB.color }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: partyA.color }}>
                  {partyA.abbr} {formatPercent(partyA.pct)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.th, textAlign: 'center' }}>
                  {gapDisplay} lead in current snapshot
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: partyB.color }}>
                  {partyB.abbr} {formatPercent(partyB.pct)}
                </div>
              </div>
            </div>

            <SectionLabel T={T}>Head-to-head</SectionLabel>

            <H2HRow
              T={T}
              label="Poll %"
              valA={formatPercent(partyA.pct)}
              valB={formatPercent(partyB.pct)}
              colorA={partyA.color}
              colorB={partyB.color}
              winnerA={partyA.pct === partyB.pct ? null : partyA.pct > partyB.pct}
              onClick={() => openPartyDetail((partyA.pct || 0) >= (partyB.pct || 0) ? partyA : partyB, activePolicyArea, 'trend')}
            />
            <H2HRow
              T={T}
              label="Seats"
              valA={formatWholeNumber(partyA.seats)}
              valB={formatWholeNumber(partyB.seats)}
              colorA={partyA.color}
              colorB={partyB.color}
              winnerA={(partyA.seats || 0) === (partyB.seats || 0) ? null : (partyA.seats || 0) > (partyB.seats || 0)}
              onClick={() => openPartyDetail((partyA.seats || 0) >= (partyB.seats || 0) ? partyA : partyB, activePolicyArea, 'trend')}
            />
            <H2HRow
              T={T}
              label="Weekly Δ"
              valA={formatSignedPoints(partyA.change) || '0pt'}
              valB={formatSignedPoints(partyB.change) || '0pt'}
              colorA={partyA.color}
              colorB={partyB.color}
              winnerA={partyA.change === partyB.change ? null : partyA.change > partyB.change}
              onClick={() => openPartyDetail((partyA.change || 0) >= (partyB.change || 0) ? partyA : partyB, activePolicyArea, 'trend')}
            />

            {leaderA && leaderB && (
              <H2HRow
                T={T}
                label="Leader"
                valA={leaderADisplay.value}
                valB={leaderBDisplay.value}
                colorA={partyA.color}
                colorB={partyB.color}
                winnerA={leadersComparable ? (leaderA.net === leaderB.net ? null : leaderA.net > leaderB.net) : null}
                onClick={
                  leadersComparable
                    ? () => {
                        const leader = leaderA.net >= leaderB.net ? leaderA : leaderB
                        const leaderIdx = leaders?.indexOf(leader)
                        if (leaderIdx >= 0) {
                          haptic(8)
                          nav('leader', { lIdx: leaderIdx, from: 'compare' })
                        }
                      }
                    : undefined
                }
              />
            )}

            {(leaderA || leaderB) && (
              <>
                <SectionLabel T={T}>Leaders</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[{ leader: leaderA, party: partyA }, { leader: leaderB, party: partyB }].map(
                    ({ leader, party }, i) => {
                      const display = leaderRatingDisplay(leader)
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (!leader) return
                            const leaderIdx = leaders?.indexOf(leader)
                            if (leaderIdx >= 0) {
                              haptic(8)
                              nav('leader', { lIdx: leaderIdx, from: 'compare' })
                            }
                          }}
                          style={{
                            borderRadius: 12,
                            padding: '12px 12px',
                            background: T.c0 || '#fff',
                            border: `1px solid ${party?.color || T.cardBorder || 'rgba(0,0,0,0.07)'}28`,
                            textAlign: 'center',
                            cursor: leader ? 'pointer' : 'default',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          {leader ? (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 800, color: party?.color }}>{leader.name}</div>
                              <div
                                style={{
                                  fontSize: display.sourced ? 20 : 16,
                                  fontWeight: 800,
                                  color: display.sourced ? (leader.net >= 0 ? '#02A95B' : '#E4003B') : T.th,
                                  marginTop: 4,
                                }}
                              >
                                {display.value}
                              </div>
                              <div style={{ fontSize: 13, color: T.tl, marginTop: 3 }}>
                                {display.label}
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: 13, color: T.tl }}>No leader data</div>
                          )}
                        </div>
                      )
                    },
                  )}
                </div>
              </>
            )}

            {['immigration', 'economy', 'nhs'].map((topic) => {
              const previewA = topicPreview(topic, partyA?.name, policyRecords)
              const previewB = topicPreview(topic, partyB?.name, policyRecords)
              if (!previewA && !previewB) return null

              return (
                <div key={topic} style={{ marginBottom: 12 }}>
                  <SectionLabel T={T}>{topic} · preview</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[{ preview: previewA, party: partyA }, { preview: previewB, party: partyB }].map(({ preview, party }, i) => (
                      <div
                        key={i}
                        onClick={() => openPartyDetail(party, topic, 'pledges')}
                        style={{
                          borderRadius: 12,
                          padding: '12px 12px',
                          background: T.c0 || '#fff',
                          border: `1px solid ${party?.color || T.cardBorder || 'rgba(0,0,0,0.07)'}20`,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: party?.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 6,
                            textAlign: 'center',
                          }}
                        >
                          {party?.abbr}
                        </div>
                        {preview ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              justifyContent: 'center',
                              width: '100%',
                              fontSize: 10.5,
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              color: party?.color,
                              marginBottom: 6,
                            }}
                          >
                            {preview.stanceLabel}
                          </div>
                        ) : null}
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: T.tl,
                            lineHeight: 1.7,
                            display: '-webkit-box',
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textAlign: 'center',
                          }}
                        >
                          {previewText(preview)}
                        </div>
                        {preview?.controllingSource?.url ? (
                          <a
                            href={preview.controllingSource.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            style={{
                              display: 'block',
                              fontSize: 11,
                              fontWeight: 800,
                              color: party?.color,
                              textAlign: 'center',
                              marginTop: 8,
                              textDecoration: 'none',
                            }}
                          >
                            Official source →
                          </a>
                        ) : null}
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: party?.color,
                            textAlign: 'center',
                            marginTop: 9,
                          }}
                        >
                          Open party policy
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {both && tab !== 'overview' && (
          <>
            <SectionLabel T={T}>{POLICY_TOPICS.find((t) => t.key === tab)?.label} · side by side</SectionLabel>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[{ preview: topicPreview(tab, partyA?.name, policyRecords), party: partyA }, { preview: topicPreview(tab, partyB?.name, policyRecords), party: partyB }].map(
                ({ preview, party }, i) => (
                  <div
                    key={i}
                    onClick={() => openPartyDetail(party, tab, 'pledges')}
                    style={{
                      borderRadius: 12,
                      padding: '14px 13px',
                      background: T.c0 || '#fff',
                      border: `1px solid ${party?.color || T.cardBorder || 'rgba(0,0,0,0.07)'}28`,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: party?.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 8,
                        textAlign: 'center',
                      }}
                    >
                      {party?.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: party?.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 7,
                        textAlign: 'center',
                      }}
                    >
                      {preview?.stanceLabel || 'No record'}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: T.tl,
                        lineHeight: 1.75,
                        textAlign: 'center',
                      }}
                    >
                      {previewText(preview)}
                    </div>
                    {preview?.controllingSource ? (
                      preview.controllingSource.url ? (
                        <a
                          href={preview.controllingSource.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 800,
                            color: party?.color,
                            marginTop: 8,
                            textAlign: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          Official source →
                        </a>
                      ) : (
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: T.tl,
                            marginTop: 8,
                            textAlign: 'center',
                          }}
                        >
                          {preview.controllingSource.title || preview.controllingSource.type}
                        </div>
                      )
                    ) : null}
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: party?.color,
                        textAlign: 'center',
                        marginTop: 10,
                      }}
                    >
                      Open party policy
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
