import { motion } from 'framer-motion'
import { haptic } from '../components/ui'
import { daysTo, impliedProb } from '../utils/helpers'
import { useResponsive } from '../utils/responsive'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

function SparkLine({ data = [], color = '#888', width = 80, height = 28, filled = false }) {
  const vals = (data || []).filter((v) => v != null && !isNaN(v))
  if (vals.length < 2) return null

  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1

  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width
    const y = height - 3 - ((v - min) / range) * (height - 6)
    return [+x.toFixed(1), +y.toFixed(1)]
  })

  const line = pts.map((p) => p.join(',')).join(' ')
  const fill = filled ? `${pts[0][0]},${height} ${line} ${pts[pts.length - 1][0]},${height}` : null

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block', flexShrink: 0 }}>
      {filled && <polygon points={fill} fill={color} fillOpacity="0.14" />}
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  )
}

function MiniBar({ value, max, color, height = 8, T }) {
  const pct = Math.max(2, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div style={{ flex: 1, height, borderRadius: 999, background: T.c1, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  )
}

function Chip({ children, color }) {
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

function LargeCard({ T, onClick, children }) {
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
  meta = {},
}) {
  const { isMobile } = useResponsive()
  const safe = Array.isArray(parties) ? parties : []
  const safeTr = Array.isArray(trends) ? trends : []

  if (!safe.length) {
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

  const sorted = [...safe].sort((a, b) => b.pct - a.pct)
  const leader = sorted[0] || {}
  const second = sorted[1] || {}
  const third = sorted[2] || {}
  const gap = +((leader.pct || 0) - (second.pct || 0)).toFixed(1)
  const days7May = daysTo('2026-05-07')
  const main = safe.filter((p) => p.name !== 'Other').sort((a, b) => b.pct - a.pct)

  const tr12 = (name) => safeTr.map((t) => t[name]).filter((v) => v != null && !isNaN(v)).slice(-12)

  const trendDelta = (name) => {
    const d = tr12(name)
    return d.length < 2 ? null : +(d[d.length - 1] - d[0]).toFixed(1)
  }

  const topBet = betting?.odds?.[0]
  const allLeaders = safe.map((p) => p._leader).filter(Boolean)
  const sortedLeaders = [...allLeaders].sort((a, b) => (b.net ?? -999) - (a.net ?? -999))
  const topLeader = sortedLeaders[0] || null
  const upBE = (byElections?.upcoming || []).filter((b) => b.status !== 'skip')
  const recBE = byElections?.recent || []

  const alertParty = (() => {
    if (safeTr.length < 2) return null
    const f = safeTr[0]
    const l = safeTr[safeTr.length - 1]
    let worst = null
    let drop = 0
    main.forEach((p) => {
      const d = (f[p.name] || 0) - (l[p.name] || 0)
      if (d > drop) {
        drop = d
        worst = { ...p, drop: +d.toFixed(1), start: f[p.name], end: l[p.name] }
      }
    })
    return worst
  })()

  const winProb = topBet?.odds ? impliedProb(topBet.odds) : null
  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const leaderWeeklyChange = Number(leader.change || 0)
  const secondWeeklyChange = Number(second.change || 0)

  const electionSummary = recBE[0]
    ? `${recBE[0].winner?.split(' ')[0] || 'Latest result'} · ${recBE[0].gainLoss || 'recent by-election'}`
    : upBE[0]
      ? `By-election next up · ${upBE[0].name}`
      : 'Councils · devolved elections · by-elections'

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
              <Lbl T={T}>UK Polling Snapshot</Lbl>

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

              <Cta T={T}>View full polling →</Cta>
            </div>
          </LargeCard>

          <SmallPair>
            <SmallCard T={T} onClick={() => nav('parties')}>
              <div style={pS}>
                <Lbl T={T}>Parties</Lbl>
                <Stat color={leader.color} T={T}>
                  {leader.pct}%
                </Stat>
                <Sub T={T}>{leader.abbr} leading UK polls</Sub>
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

          <LargeCard T={T} onClick={() => nav('elections')}>
            <div style={pL}>
              <Lbl T={T}>May Elections · 7 May 2026</Lbl>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
                <BigStat color={T.th} T={T} size={72}>
                  {days7May}
                </BigStat>
                <div style={{ paddingBottom: 6, textAlign: 'left' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.th }}>days</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: T.tm }}>remaining</div>
                </div>
              </div>

              <div style={{ height: 8, borderRadius: 999, background: T.c1, overflow: 'hidden', marginBottom: 14 }}>
                <div
                  style={{
                    width: `${Math.max(3, Math.min(100, 100 - Math.round((days7May / 365) * 100)))}%`,
                    height: '100%',
                    background: T.th,
                    borderRadius: 999,
                  }}
                />
              </div>

              <Divider T={T} />

              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: '136 Councils', color: T.pr },
                  { label: 'Scottish Parliament', color: '#005EB8' },
                  { label: 'Senedd', color: '#C8102E' },
                  { label: 'Mayoral', color: '#FAA61A' },
                ].map((c, i) => (
                  <Chip key={i} color={c.color}>
                    {c.label}
                  </Chip>
                ))}
              </div>

              <Divider T={T} />

              <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.6, textAlign: 'center' }}>
                {electionSummary}
              </div>

              <Cta T={T}>Explore elections →</Cta>
            </div>
          </LargeCard>

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
                <Sub T={T}>12-month movement and rolling averages</Sub>
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
                <Sub T={T}>{(topBet?.name || 'Reform').split(' ')[0]} to win next election</Sub>
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
            <div style={pL}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Lbl T={T}>News</Lbl>
                <Chip color={T.pr}>Live</Chip>
              </div>

              <div style={{ fontSize: 20, fontWeight: 700, color: T.th, lineHeight: 1.3, textAlign: 'center' }}>
                {meta?.latestHeadline || (alertParty ? `${alertParty.name} down ${alertParty.drop}pt over 12 months` : 'Top UK political headlines')}
              </div>

              <Divider T={T} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {alertParty && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <SparkLine data={tr12(alertParty.name)} color="#E4003B" width={isMobile ? 110 : 160} height={26} filled />
                    <span style={{ fontSize: 13, color: T.tl, fontWeight: 600 }}>{alertParty.name} trajectory</span>
                  </div>
                )}

                {(meta?.headlines || []).slice(0, 2).map((h, i) => (
                  <div key={i} style={{ fontSize: 14, color: T.tm, fontWeight: 500, lineHeight: 1.35 }}>
                    · {h}
                  </div>
                ))}

                {!meta?.headlines?.length && (
                  <div style={{ fontSize: 13, color: T.tl, textAlign: 'center' }}>
                    Open the news feed for the latest political coverage
                  </div>
                )}
              </div>

              <Cta T={T}>Open news →</Cta>
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
                  {leader.abbr} lead over {second.abbr}
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