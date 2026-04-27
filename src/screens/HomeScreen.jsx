import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { haptic } from '../components/ui'
import { impliedProb } from '../utils/helpers'
import { useResponsive } from '../utils/responsive'
import BriefingPanel from '../components/BriefingPanel'
import { buildSmartSummary } from '../utils/intelligence'
import { buildDisplayTrendRows } from '../components/charts/SharedTrendChart'
import { buildHomeElectionsBriefing } from '../utils/homeElectionsBriefing'
import { buildHomeNewsBriefing } from '../utils/news'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

function MiniBar({ value, max, color, height = 8, T }) {
  const pct = Math.max(2, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div style={{ flex: 1, height, borderRadius: 999, background: T.c1, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  )
}

function Chip({ children, color, style }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color,
        background: `${color}1e`,
        borderRadius: 4,
        padding: '2px 7px',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

const Divider = ({ T }) => (
  <div style={{ height: 1, background: T.cardBorder || 'rgba(0,0,0,0.07)', margin: '11px 0' }} />
)

const G = 14

function LargeCard({ T, onClick, children, style }) {
  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const bg = isDark ? '#0d1a24' : '#ffffff'
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <motion.div
      {...TAP}
      onClick={() => {
        if (onClick) {
          haptic(6)
          onClick()
        }
      }}
      style={{
        gridColumn: 'span 2',
        background: bg,
        border: `1px solid ${borderCol}`,
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

function SmallPair({ children }) {
  return (
    <div
      style={{
        gridColumn: 'span 2',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: G,
      }}
    >
      {children}
    </div>
  )
}

function SmallCard({ T, onClick, children }) {
  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const bg = isDark ? '#0d1a24' : '#ffffff'
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <motion.div
      {...TAP}
      onClick={() => {
        if (onClick) {
          haptic(6)
          onClick()
        }
      }}
      style={{
        background: bg,
        border: `1px solid ${borderCol}`,
        borderRadius: 14,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 160,
      }}
    >
      {children}
    </motion.div>
  )
}

const Lbl = ({ children, T }) => (
  <div
    style={{
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: T.tl,
      marginBottom: 8,
      textAlign: 'center',
    }}
  >
    {children}
  </div>
)

const BigStat = ({ children, color, T, size = 56 }) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 800,
      letterSpacing: '-0.03em',
      lineHeight: 1,
      color: color || T.th,
      textAlign: 'center',
    }}
  >
    {children}
  </div>
)

const Stat = ({ children, color, T, size = 34 }) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      color: color || T.th,
      textAlign: 'center',
    }}
  >
    {children}
  </div>
)

const Sub = ({ children, T, size = 14 }) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 500,
      color: T.tm,
      lineHeight: 1.4,
      marginTop: 6,
      textAlign: 'center',
    }}
  >
    {children}
  </div>
)

const Cta = ({ children, T }) => (
  <div
    style={{
      fontSize: 14,
      fontWeight: 600,
      color: T.tl,
      marginTop: 'auto',
      paddingTop: 10,
      textAlign: 'center',
    }}
  >
    {children}
  </div>
)

const pL = {
  display: 'flex',
  flexDirection: 'column',
  padding: '20px 20px 20px 20px',
  position: 'relative',
  zIndex: 1,
}
const pS = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: '16px 16px 14px',
  position: 'relative',
  zIndex: 1,
}

function Logo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <defs>
        <radialGradient id="lg" cx="32%" cy="26%" r="72%">
          <stop offset="0%" stopColor="#0d4a5c" />
          <stop offset="100%" stopColor="#020c12" />
        </radialGradient>
        <clipPath id="lc">
          <circle cx="40" cy="40" r="38" />
        </clipPath>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#lg)" />
      <g clipPath="url(#lc)">
        <line x1="2" y1="2" x2="78" y2="78" stroke="white" strokeWidth="14" />
        <line x1="78" y1="2" x2="2" y2="78" stroke="white" strokeWidth="14" />
        <line x1="2" y1="2" x2="78" y2="78" stroke="#C8102E" strokeWidth="8" />
        <line x1="78" y1="2" x2="2" y2="78" stroke="#C8102E" strokeWidth="8" />
        <line x1="2" y1="40" x2="78" y2="40" stroke="white" strokeWidth="5" />
        <line x1="2" y1="40" x2="78" y2="40" stroke="#C8102E" strokeWidth="3" />
        <line x1="40" y1="2" x2="40" y2="78" stroke="white" strokeWidth="5" />
        <line x1="40" y1="2" x2="40" y2="78" stroke="#C8102E" strokeWidth="3" />
      </g>
      <circle cx="40" cy="40" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
  )
}

export default function HomeScreen({
  T,
  nav,
  onMenu,
  parties = [],
  trends = [],
  byElections = {},
  migration = {},
  betting = {},
  news = {},
  meta = {},
  pollContext = {},
}) {
  const { isMobile } = useResponsive()
  const safe = Array.isArray(parties) ? parties : []
  const safeTr = Array.isArray(trends) ? trends : []
  const engineSnapshot = Array.isArray(pollContext?.partyPollSnapshot) ? pollContext.partyPollSnapshot : []
  const displayTrends = buildDisplayTrendRows(safeTr, pollContext)
  const intelligenceSource = engineSnapshot.length ? engineSnapshot : safe

  if (!intelligenceSource.length) {
    return (
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: T.sf,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: T.tm }}>Loading…</div>
      </div>
    )
  }

  const sorted = [...intelligenceSource].sort((a, b) => (b.pct || 0) - (a.pct || 0))
  const leader = sorted[0] || {}
  const second = sorted[1] || {}
  const third = sorted[2] || {}
  const gap = +((leader.pct || 0) - (second.pct || 0)).toFixed(1)
  const main = intelligenceSource.filter((p) => p.name !== 'Other').sort((a, b) => (b.pct || 0) - (a.pct || 0))
  const allLeaders = safe.map((p) => p._leader).filter(Boolean)

  const smartSummary = buildSmartSummary({
    parties: main.map((p) => ({ ...p, pct: p.pct })),
    leaders: allLeaders,
    trends: displayTrends,
    pollContext,
  })

  const tr12 = (name) => displayTrends.map((t) => t[name]).filter((v) => v != null && !isNaN(v)).slice(-12)

  const trendDelta = (name) => {
    const d = tr12(name)
    return d.length < 2 ? null : +(d[d.length - 1] - d[0]).toFixed(1)
  }

  const recentDeltaFor = (party) =>
    typeof party?.recentDelta === 'number'
      ? party.recentDelta
      : typeof party?.trendDelta === 'number'
        ? party.trendDelta
        : trendDelta(party?.name)

  const confidenceFor = (party) =>
    party?.confidenceLabel || 'No clear break yet'

  const topBet = betting?.odds?.[0]
  const sortedLeaders = [...allLeaders].sort((a, b) => (b.net ?? -999) - (a.net ?? -999))
  const topLeader = sortedLeaders[0] || null
  const upBE = (byElections?.upcoming || []).filter((b) => b.status !== 'skip')
  const recBE = byElections?.recent || []
  const electionsBriefing = React.useMemo(
    () => buildHomeElectionsBriefing({ meta, byElections }),
    [meta, byElections],
  )
  const [electionSignalIndex, setElectionSignalIndex] = React.useState(0)
  const newsBriefing = React.useMemo(() => buildHomeNewsBriefing(news), [news])

  React.useEffect(() => {
    setElectionSignalIndex(0)
  }, [electionsBriefing.signals.length, electionsBriefing.label, electionsBriefing.dateLabel])

  React.useEffect(() => {
    if ((electionsBriefing.signals || []).length <= 1) return undefined
    const timer = window.setInterval(() => {
      setElectionSignalIndex((current) => (current + 1) % electionsBriefing.signals.length)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [electionsBriefing.signals])

  const winProb = topBet?.odds ? impliedProb(topBet.odds) : null
  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const newsLiveColor =
    newsBriefing.statusTone === 'live'
      ? '#E4003B'
      : newsBriefing.statusTone === 'stale'
        ? T.tl
        : T.pr
  const leaderWeeklyChange = Number(leader.change || 0)
  const secondWeeklyChange = Number(second.change || 0)
  const homeElectionBriefing = React.useMemo(() => ({
    headline: 'The next political test is approaching',
    summary: '136 English councils, Scotland, Wales, mayoralties and by-election watchpoints are in play.',
    chips: [
      { id: 'english-councils', label: '136 English councils', color: '#12B7D4' },
      { id: 'council-seats', label: '~5,000 seats', color: '#0087DC' },
      { id: 'scotland', label: 'Scottish Parliament', color: '#C4922A' },
      { id: 'senedd', label: 'Senedd', color: '#C8102E' },
      { id: 'mayoral-contests', label: 'Mayoral contests', color: '#FAA61A' },
    ],
    signals: [
      {
        id: 'english-local-footprint',
        text: 'The homepage is showing the national election event: English local contests, Holyrood, the Senedd and mayoralties on the same day.',
      },
      {
        id: 'tracked-versus-event',
        text: 'The Locals tab can stay narrower as Politiscope’s tracked council intelligence; this card is the wider 7 May election footprint.',
      },
      {
        id: 'seats-up-footprint',
        text: 'Around 5,000 English council seats are due, alongside devolved elections that could reshape the wider UK political story.',
      },
    ],
  }), [])

  const activeElectionSignal =
    homeElectionBriefing.signals[electionSignalIndex % homeElectionBriefing.signals.length] || homeElectionBriefing.signals[0] || null
  const electionsHeadline = homeElectionBriefing.headline

  const risingParty = [...main]
    .map((p) => ({ ...p, _recentDelta: recentDeltaFor(p) }))
    .filter((p) => p._recentDelta != null && p._recentDelta > 0)
    .sort((a, b) => b._recentDelta - a._recentDelta)[0] || null

  const fallingParty = [...main]
    .map((p) => ({ ...p, _recentDelta: recentDeltaFor(p) }))
    .filter((p) => p._recentDelta != null && p._recentDelta < 0)
    .sort((a, b) => a._recentDelta - b._recentDelta)[0] || null

  const raceTitle = smartSummary?.headline || (gap <= 2
      ? `${leader.abbr} leads a tight race`
      : gap <= 5
        ? `${leader.abbr} holds a modest lead`
        : `${leader.abbr} leads the current snapshot`)

  const raceBody = smartSummary?.subhead || (gap <= 2
      ? `${leader.name} is ${gap}pt ahead of ${second.name} in the current picture, so the order is still live.`
      : gap <= 5
        ? `${leader.name} is ${gap}pt ahead of ${second.name} in the latest reading, but that is still a catchable margin.`
        : `${leader.name} is ${gap}pt ahead of ${second.name} in the latest reading. ${confidenceFor(leader)}.`)

  const movementItem = risingParty
    ? {
        key: 'momentum',
        kicker: 'Pressure point',
        title: `${risingParty.name} are carrying the clearest upward pressure`,
        body: `${risingParty.abbr} is up ${Math.abs(risingParty._recentDelta)}pt in the visible trend window${fallingParty ? ` while ${fallingParty.abbr} is down ${Math.abs(fallingParty._recentDelta)}pt.` : '.'} ${confidenceFor(risingParty)}.`,
        accent: risingParty.color,
      }
    : fallingParty
      ? {
          key: 'pressure',
          kicker: 'Pressure point',
          title: `${fallingParty.name} are facing the sharpest recent drift`,
          body: `${fallingParty.abbr} is down ${Math.abs(fallingParty._recentDelta)}pt in the visible trend window. ${confidenceFor(fallingParty)}.`,
          accent: fallingParty.color,
        }
      : {
          key: 'movement',
          kicker: 'Pressure point',
          title: 'The trend signal is still thin',
          body: 'The app needs more visible poll history before it can make a stronger momentum call here.',
          accent: T.pr,
        }

  const qualitativeGap =
    gap <= 2 ? 'neck and neck' : gap <= 5 ? 'still competitive' : 'clearer than it was'

  const hasClearLeader = gap > 5
  const hasRisingNonLeader = risingParty && risingParty.name !== leader.name
  const thirdWithinTouchingDistance = third?.name && third?.pct >= (second?.pct || 0) - 2

  const topLineItem = {
    key: 'top-line',
    kicker: 'Top line',
    title:
      gap <= 2
        ? `${leader.name} and ${second.name} are still in a tight race`
        : gap <= 5
          ? `${leader.name} lead, but not by enough to settle the race`
          : `${leader.name} remain the clearest national leader`,
    body:
      gap <= 2
        ? `${leader.name} are only ${gap}pt ahead of ${second.name}, so the national picture is still open and sensitive to fresh polling.`
        : gap <= 5
          ? `${leader.name} are ${gap}pt ahead of ${second.name}. That is a real lead, but still close enough for movement elsewhere to change the shape of the contest.`
          : `${leader.name} lead the current national picture by ${gap}pt over ${second.name}. That makes them the party setting the race, while ${second.name}${thirdWithinTouchingDistance ? ` and ${third.name}` : ''} fight to become the clearest alternative.`,
    accent: leader.color,
  }

  const pressureItem = hasRisingNonLeader
    ? {
        key: 'pressure-point',
        kicker: 'Pressure point',
        title: `${risingParty.name} are the main challenger signal`,
        body:
          hasClearLeader
            ? `${leader.name} still lead the race, but ${risingParty.name}'s rise matters because it changes who benefits from voter dissatisfaction. The test is whether that rise becomes a durable bloc, or stays as pressure around the edges of a ${leader.name}-led contest.`
            : `${risingParty.name} are the clearest riser in a race that is not fully settled. The test is whether that movement consolidates into a durable bloc or simply makes the field more fragmented.`,
        accent: risingParty.color,
      }
    : risingParty
      ? {
          key: 'pressure-point',
          kicker: 'Pressure point',
          title: `${leader.name} need to turn polling into durability`,
          body: `${leader.name} are not just leading; they are also carrying the clearest upward pressure. The next test is organisational: whether that polling position turns into candidates, ground game and real election results.`,
          accent: risingParty.color,
        }
      : fallingParty
        ? {
            key: 'pressure-point',
            kicker: 'Pressure point',
            title: `${fallingParty.name} are the weak point in the picture`,
            body: `${fallingParty.name} are the softest mover in the visible trend picture. The question is whether that drift stabilises, or whether voters keep moving to more credible alternatives.`,
            accent: fallingParty.color,
          }
        : {
            key: 'pressure-point',
            kicker: 'Pressure point',
            title: 'The picture is stable, not settled',
            body: `The race looks ${qualitativeGap}, but the visible trend picture is not producing one dominant new mover. That makes the next round of polling more important than any single reading.`,
            accent: T.pr,
          }

  const briefingItems = [topLineItem, pressureItem].filter(Boolean)

  return (
    <div style={{ position: 'relative', minHeight: '100%', background: T.sf }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${isMobile ? 48 : 20}px ${G + 4}px 0`,
          position: 'relative',
          zIndex: 3,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Logo size={isMobile ? 42 : 50} />
          <div>
            <div
              style={{
                fontSize: isMobile ? 20 : 24,
                fontWeight: 800,
                color: T.th,
                letterSpacing: -0.5,
                lineHeight: 1,
              }}
            >
              Politiscope
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.tl,
                marginTop: 2,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              The Full Picture of British Politics
            </div>
          </div>
        </div>

        <motion.button
          {...TAP}
          onClick={onMenu}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={T.th}>
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
          </svg>
        </motion.button>
      </div>

      <div style={{ position: 'relative', zIndex: 3, padding: `14px ${G}px 110px` }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: G,
            gridAutoFlow: 'row',
          }}
        >
          <LargeCard T={T} onClick={() => nav('polls')}>
            <div style={pL}>
              <Lbl T={T}>State of Play</Lbl>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: isMobile ? 22 : 40,
                  marginBottom: 14,
                }}
              >
                <div style={{ flex: 1, maxWidth: 180, textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: leader.color, marginTop: 2 }}>{leader.name}</div>
                  <BigStat color={leader.color} T={T} size={isMobile ? 48 : 56}>
                    {leader.pct}
                    <span style={{ fontSize: '0.4em', fontWeight: 600, verticalAlign: 'super' }}>%</span>
                  </BigStat>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: leaderWeeklyChange > 0 ? '#02A95B' : leaderWeeklyChange < 0 ? '#E4003B' : T.tl,
                      marginTop: 2,
                    }}
                  >
                    {leaderWeeklyChange > 0
                      ? `▲ ${Math.abs(leaderWeeklyChange)}pt`
                      : leaderWeeklyChange < 0
                        ? `▼ ${Math.abs(leaderWeeklyChange)}pt`
                        : '— 0pt'}
                  </div>
                </div>

                <div
                  style={{
                    width: 1,
                    alignSelf: 'stretch',
                    background: T.cardBorder || 'rgba(0,0,0,0.07)',
                    opacity: 0.8,
                  }}
                />

                <div style={{ flex: 1, maxWidth: 180, textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: second.color, marginTop: 2 }}>{second.name}</div>
                  <BigStat color={second.color} T={T} size={isMobile ? 48 : 56}>
                    {second.pct}
                    <span style={{ fontSize: '0.4em', fontWeight: 600, verticalAlign: 'super' }}>%</span>
                  </BigStat>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: secondWeeklyChange > 0 ? '#02A95B' : secondWeeklyChange < 0 ? '#E4003B' : T.tl,
                      marginTop: 2,
                    }}
                  >
                    {secondWeeklyChange > 0
                      ? `▲ ${Math.abs(secondWeeklyChange)}pt`
                      : secondWeeklyChange < 0
                        ? `▼ ${Math.abs(secondWeeklyChange)}pt`
                        : '— 0pt'}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 2 }}>
                <Chip color={leader.color}>{gap}pt gap</Chip>
              </div>

              <Divider T={T} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {main.slice(0, 6).map((p, i) => {
                  const d = trendDelta(p.name)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: p.color, width: 28, flexShrink: 0 }}>
                        {p.abbr}
                      </div>
                      <MiniBar value={p.pct} max={(main[0]?.pct || 1) + 4} color={p.color} T={T} />
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: p.color,
                          width: 38,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {p.pct}%
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          width: 36,
                          textAlign: 'right',
                          flexShrink: 0,
                          color: d === null ? T.tl : d > 0 ? '#02A95B' : d < 0 ? '#E4003B' : T.tl,
                        }}
                      >
                        {d === null ? '' : d > 0 ? `+${d}` : `${d}`}
                      </div>
                    </div>
                  )
                })}
              </div>

              <Divider T={T} />

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: T.tl,
                  marginBottom: 7,
                  textAlign: 'center',
                }}
              >
                MRP Seat Projection · 650
              </div>

              <div style={{ height: 10, borderRadius: 999, background: T.c1, overflow: 'hidden', display: 'flex' }}>
                {main
                  .filter((p) => p.seats)
                  .map((p, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${Math.round((p.seats / 650) * 100)}%`,
                        height: '100%',
                        background: p.color,
                      }}
                    />
                  ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
                {main
                  .filter((p) => p.seats)
                  .map((p, i) => (
                    <div key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
                      {p.abbr} {p.seats}
                    </div>
                  ))}
              </div>

              <Cta T={T}>Open the full race →</Cta>
            </div>
          </LargeCard>

          <div style={{ gridColumn: 'span 2' }}>
            <BriefingPanel
              T={T}
              title="Top line briefing"
              subtitle="The national political picture in plain English, with the main pressure points surfaced first."
              items={briefingItems}
            />
          </div>

          <LargeCard
            T={T}
            onClick={() => nav('elections')}
            style={{
              minHeight: isMobile ? 320 : 360,
            }}
          >
            <div
              style={{
                ...pL,
                minHeight: '100%',
                justifyContent: 'space-between',
                padding: isMobile ? '22px 20px 20px' : '26px 22px 22px',
              }}
            >
              <Lbl T={T}>
                {electionsBriefing.label}
                {electionsBriefing.dateLabel ? ` · ${electionsBriefing.dateLabel}` : ''}
              </Lbl>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                <BigStat color={T.th} T={T} size={isMobile ? 76 : 84}>
                  {electionsBriefing.countdown.value}
                </BigStat>
                <div style={{ paddingBottom: 8, textAlign: 'left' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.th }}>{electionsBriefing.countdown.unitPrimary}</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: T.tm }}>{electionsBriefing.countdown.unitSecondary}</div>
                </div>
              </div>

              <div style={{ height: 8, borderRadius: 999, background: T.c1, overflow: 'hidden', marginBottom: 16 }}>
                <motion.div
                  animate={{ width: `${electionsBriefing.countdown.progressPct}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: T.th,
                    borderRadius: 999,
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: T.th,
                  lineHeight: 1.35,
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                {electionsHeadline}
              </div>

              <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.55, textAlign: 'center', marginBottom: 14 }}>
                {homeElectionBriefing.summary}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                {homeElectionBriefing.chips.map((chip) => (
                  <Chip
                    key={chip.id}
                    color={chip.color}
                    style={{
                      background: `${chip.color}24`,
                      border: `1px solid ${chip.color}2e`,
                      borderRadius: 999,
                      padding: '4px 9px',
                    }}
                  >
                    {chip.label}
                  </Chip>
                ))}
              </div>

              <div style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeElectionSignal?.id || 'empty'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.26, ease: 'easeOut' }}
                    style={{ fontSize: 15, fontWeight: 600, color: T.th, lineHeight: 1.45, textAlign: 'center' }}
                  >
                    {activeElectionSignal?.text || 'Election signals update as the tracker changes.'}
                  </motion.div>
                </AnimatePresence>
              </div>

              <Cta T={T}>Explore elections →</Cta>
            </div>
          </LargeCard>

          <SmallPair>
            <SmallCard T={T} onClick={() => nav('parties')}>
              <div style={pS}>
                <Lbl T={T}>Parties</Lbl>
                <Stat color={leader.color} T={T}>
                  {leader.pct}%
                </Stat>
                <Sub T={T}>{leader.abbr} currently setting the pace</Sub>
                {(leader.change || 0) !== 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: (leader.change || 0) > 0 ? '#02A95B' : '#E4003B',
                      }}
                    >
                      {(leader.change || 0) > 0 ? '▲' : '▼'} {Math.abs(leader.change || 0)}pt
                    </span>
                    <span style={{ fontSize: 13, color: T.tl }}>this week</span>
                  </div>
                )}
                <Cta T={T}>View all parties →</Cta>
              </div>
            </SmallCard>

            <SmallCard T={T} onClick={() => nav('leaders')}>
              <div style={pS}>
                <Lbl T={T}>Leaders</Lbl>
                <Stat color={topLeader?.net >= 0 ? '#02A95B' : '#E4003B'} T={T}>
                  {topLeader ? `${(topLeader.net ?? 0) >= 0 ? '+' : ''}${topLeader.net ?? '—'}` : '—'}
                </Stat>
                <Sub T={T}>Highest rated leader · {topLeader?.name?.split(' ').pop() || '—'}</Sub>
                <Cta T={T}>Compare leaders →</Cta>
              </div>
            </SmallCard>
          </SmallPair>

          <SmallPair>
            <SmallCard T={T} onClick={() => nav('demographics')}>
              <div style={pS}>
                <Lbl T={T}>Demographics</Lbl>
                <Stat color="#02A95B" T={T}>
                  32%
                </Stat>
                <Sub T={T}>Green · 18–24 age group</Sub>
                <Cta T={T}>Age breakdown →</Cta>
              </div>
            </SmallCard>

            <SmallCard T={T} onClick={() => nav('trends')}>
              <div style={pS}>
                <Lbl T={T}>Trends</Lbl>
                <Stat color={leader.color} T={T}>
                  {leader.abbr}
                </Stat>
                <Sub T={T}>Pressure, momentum and direction of travel</Sub>
                <Cta T={T}>Open trends →</Cta>
              </div>
            </SmallCard>
          </SmallPair>

          <SmallPair>
            <SmallCard T={T} onClick={() => nav('betting')}>
              <div style={pS}>
                <Lbl T={T}>Betting</Lbl>
                <Stat color={topBet?.color || T.pr} T={T}>
                  {topBet?.odds || '6/4'}
                </Stat>
                <Sub T={T}>{(topBet?.name || 'Reform').split(' ')[0]} priced as current market favourite</Sub>
                {winProb != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <MiniBar value={winProb} max={100} color={topBet?.color || T.pr} height={5} T={T} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: topBet?.color || T.pr, flexShrink: 0 }}>
                      {winProb}%
                    </span>
                  </div>
                )}
                <Cta T={T}>View odds →</Cta>
              </div>
            </SmallCard>

            <SmallCard T={T} onClick={() => nav('migration')}>
              <div style={pS}>
                <Lbl T={T}>Migration</Lbl>
                <Stat color={T.hero} T={T}>
                  {migration?.netTotal ? `${Math.round(migration.netTotal / 1000)}k` : '685k'}
                </Stat>
                <Sub T={T}>
                  Net migration ·{' '}
                  {migration?.netPeak
                    ? `↓ ${Math.round((1 - migration.netTotal / migration.netPeak) * 100)}% from peak`
                    : '↓ 78% from peak'}
                </Sub>
                <Cta T={T}>View migration data →</Cta>
              </div>
            </SmallCard>
          </SmallPair>

          <LargeCard T={T} onClick={() => nav('news')}>
            <div
              style={{
                ...pL,
                padding: isMobile ? '20px 18px 18px' : '22px 22px 20px',
                gap: 14,
                minHeight: isMobile ? 244 : 256,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    newsBriefing.statusTone === 'live'
                      ? 'radial-gradient(circle at top right, rgba(228,0,59,0.16), transparent 38%)'
                      : 'radial-gradient(circle at top right, rgba(18,183,212,0.12), transparent 38%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: newsLiveColor,
                      boxShadow: `0 0 0 5px ${newsLiveColor}18`,
                      animation: newsBriefing.statusTone === 'live' ? 'livePulse 1.8s ease-out infinite' : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <Chip
                    color={newsLiveColor}
                    style={{
                      borderRadius: 999,
                      padding: '4px 10px',
                      background: `${newsLiveColor}16`,
                      border: `1px solid ${newsLiveColor}26`,
                    }}
                  >
                    {newsBriefing.statusLabel}
                  </Chip>
                </div>

                {newsBriefing.freshnessLabel ? (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.tl,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      textAlign: 'right',
                    }}
                  >
                    {newsBriefing.freshnessLabel}
                  </div>
                ) : null}
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl }}>
                UK politics wire
              </div>

              <div
                style={{
                  fontSize: isMobile ? 24 : 28,
                  fontWeight: 800,
                  color: T.th,
                  lineHeight: 1.16,
                  letterSpacing: '-0.03em',
                  maxWidth: 560,
                }}
              >
                {newsBriefing.headline}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.tm,
                  lineHeight: 1.55,
                  maxWidth: 560,
                }}
              >
                {newsBriefing.teaser}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {newsBriefing.storyCount ? (
                  <Chip
                    color={T.pr}
                    style={{
                      borderRadius: 999,
                      padding: '4px 10px',
                      background: `${T.pr}12`,
                      border: `1px solid ${T.pr}24`,
                    }}
                  >
                    {newsBriefing.storyCount} stories
                  </Chip>
                ) : null}
                {newsBriefing.sourceCount ? (
                  <Chip
                    color={T.tl}
                    style={{
                      borderRadius: 999,
                      padding: '4px 10px',
                      background: 'rgba(127,127,127,0.08)',
                      border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                    }}
                  >
                    {newsBriefing.sourceCount} sources
                  </Chip>
                ) : null}
              </div>

              {newsBriefing.supportingLine ? (
                <div
                  style={{
                    fontSize: 13,
                    color: T.tl,
                    fontWeight: 650,
                    lineHeight: 1.45,
                    maxWidth: 560,
                  }}
                >
                  {newsBriefing.supportingLine}
                </div>
              ) : null}

              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.45, maxWidth: 430 }}>
                  {newsBriefing.statusTone === 'live'
                    ? 'Follow the newest Westminster and campaign reporting in one place.'
                    : 'See the latest available reporting, source breadth and story order at a glance.'}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: T.th,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {newsBriefing.ctaLabel} →
                </div>
              </div>
            </div>
          </LargeCard>

          <SmallPair>
            <SmallCard T={T} onClick={() => nav('vote')}>
              <div style={pS}>
                <Lbl T={T}>Your Vote</Lbl>
                <Stat color={T.pr} T={T} size={36}>
                  →
                </Stat>
                <Sub T={T}>Who would you vote for today?</Sub>
                <Cta T={T}>Join community poll →</Cta>
              </div>
            </SmallCard>

            <SmallCard T={T} onClick={() => nav('compare')}>
              <div style={pS}>
                <Lbl T={T}>Compare</Lbl>
                <Stat color={leader.color} T={T}>
                  +{gap}pt
                </Stat>
                <Sub T={T}>
                  {leader.abbr} ahead of {second.abbr}
                </Sub>
                <div style={{ fontSize: 13, color: T.tl, marginTop: 5, textAlign: 'center' }}>
                  {third?.abbr ? `${third.abbr} at ${third.pct}%` : ''}
                </div>
                <Cta T={T}>Full comparison →</Cta>
              </div>
            </SmallCard>
          </SmallPair>

          <LargeCard T={T} onClick={() => nav('swingcalc')}>
            <div style={pL}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Lbl T={T}>Swing Calculator</Lbl>
                <Chip color={leader.color}>Interactive</Chip>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                <BigStat color={leader.color} T={T} size={64}>
                  +{gap}pt
                </BigStat>
                <div style={{ paddingBottom: 6, textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.th }}>{leader.abbr} lead</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.tm }}>over {second.abbr}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: leader.color, width: 30 }}>{leader.abbr}</div>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    borderRadius: 999,
                    background: T.c1,
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      width: `${(leader.pct / ((leader.pct + second.pct) || 1)) * 100}%`,
                      height: '100%',
                      background: leader.color,
                    }}
                  />
                  <div
                    style={{
                      width: `${(second.pct / ((leader.pct + second.pct) || 1)) * 100}%`,
                      height: '100%',
                      background: second.color,
                    }}
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: second.color, width: 30, textAlign: 'right' }}>
                  {second.abbr}
                </div>
              </div>

              <Divider T={T} />
              <Cta T={T}>How many points to flip a seat? →</Cta>
            </div>
          </LargeCard>

          <LargeCard T={T} onClick={() => nav('simulator')}>
            <div style={pL}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Lbl T={T}>The Mandate</Lbl>
                <Chip color="#36d6cf">Simulator</Chip>
              </div>

              <div
                style={{
                  background: 'linear-gradient(180deg, #111b42 0%, #071026 100%)',
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 14,
                  padding: '18px 16px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    letterSpacing: '-0.06em',
                    color: '#F0C956',
                    textTransform: 'uppercase',
                    lineHeight: 0.95,
                    textShadow: '2px 2px rgba(2,4,11,0.8)',
                  }}
                >
                  The Mandate
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    color: '#8BE9DD',
                    textTransform: 'uppercase',
                    marginTop: 8,
                  }}
                >
                  Government Simulator
                </div>
              </div>

              <Sub T={T} size={15}>
                Run the country for ten turns. Make policy choices, manage voters, survive Parliament.
              </Sub>

              <Divider T={T} />
              <Cta T={T}>Open simulator →</Cta>
            </div>
          </LargeCard>

          <SmallPair>
            <SmallCard T={T} onClick={() => nav('quotematch')}>
              <div style={pS}>
                <Lbl T={T}>Daily Game</Lbl>
                <Stat color={T.pr} T={T} size={32}>
                  🎯
                </Stat>
                <Sub T={T}>Guess who said it</Sub>
                <Cta T={T}>Play · resets midnight →</Cta>
              </div>
            </SmallCard>

            <SmallCard T={T} onClick={() => nav('parliament')}>
              <div style={pS}>
                <Lbl T={T}>Parliament</Lbl>
                <Stat color="#C8102E" T={T} size={32}>
                  📺
                </Stat>
                <Sub T={T}>Commons · Lords · PMQs</Sub>
                <Cta T={T}>Open live coverage →</Cta>
              </div>
            </SmallCard>
          </SmallPair>
        </div>
      </div>
    </div>
  )
}
