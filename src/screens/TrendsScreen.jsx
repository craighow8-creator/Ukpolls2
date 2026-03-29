import { useMemo, useState } from 'react'
import { ScrollArea, StickyPills, haptic } from '../components/ui'

const PARTY_KEYS = [
  { key: 'Reform UK', abbr: 'REF', color: '#12B7D4' },
  { key: 'Labour', abbr: 'LAB', color: '#E4003B' },
  { key: 'Green', abbr: 'GRN', color: '#02A95B' },
  { key: 'Conservative', abbr: 'CON', color: '#0087DC' },
  { key: 'Lib Dem', abbr: 'LD', color: '#FAA61A' },
  { key: 'Restore Britain', abbr: 'RB', color: '#1a4a9e' },
]

const TABS = [
  { key: 'chart', label: 'Chart' },
  { key: 'milestones', label: 'Timeline' },
]

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

function SectionLabel({ children, T }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.tl,
        marginBottom: 10,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function Badge({ children, color, subtle = false }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color,
        background: subtle ? `${color}12` : `${color}1F`,
        border: `1px solid ${color}2B`,
        borderRadius: 999,
        padding: '4px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function getLatestValues(trends) {
  if (!trends?.length) return []

  const latest = trends[trends.length - 1]
  const first = trends[0]

  return PARTY_KEYS.map((p) => {
    const current = latest?.[p.key]
    const start = first?.[p.key]
    const delta =
      current != null && start != null ? +(current - start).toFixed(1) : null

    return {
      ...p,
      current,
      start,
      delta,
    }
  })
    .filter((p) => p.current != null)
    .sort((a, b) => b.current - a.current)
}

function buildTrendStory(trends) {
  const vals = getLatestValues(trends)
  if (vals.length < 2) {
    return {
      headline: 'Polling movement view',
      subhead: 'Not enough trend data yet to describe the race clearly.',
    }
  }

  const leader = vals[0]
  const second = vals[1]
  const rising = [...vals]
    .filter((p) => p.delta != null)
    .sort((a, b) => (b.delta || 0) - (a.delta || 0))[0]
  const falling = [...vals]
    .filter((p) => p.delta != null)
    .sort((a, b) => (a.delta || 0) - (b.delta || 0))[0]

  const gap = +((leader.current || 0) - (second.current || 0)).toFixed(1)

  let subhead = `${leader.key} lead by ${gap}pt.`

  if (rising && (rising.delta || 0) > 0) {
    subhead += ` ${rising.key} are up ${rising.delta}pt over the visible period.`
  }

  if (falling && (falling.delta || 0) < 0) {
    subhead += ` ${falling.key} are down ${Math.abs(falling.delta)}pt.`
  }

  return {
    headline: `${leader.key} still lead the trend picture`,
    subhead,
    leader,
    second,
    rising,
    falling,
    gap,
  }
}

function TrendHero({ T, trends }) {
  const story = buildTrendStory(trends)

  return (
    <div
      style={{
        borderRadius: 18,
        padding: '18px 18px 16px',
        marginBottom: 14,
        background: T.c0,
        border: `1px solid ${(story.leader?.color || T.pr)}30`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Badge color={story.leader?.color || T.pr}>Trend Hero</Badge>
        {story.rising && (story.rising.delta || 0) > 0 ? (
          <Badge color="#02A95B" subtle>Rising: {story.rising.abbr}</Badge>
        ) : null}
        {story.falling && (story.falling.delta || 0) < 0 ? (
          <Badge color="#C8102E" subtle>Falling: {story.falling.abbr}</Badge>
        ) : null}
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {story.headline}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: T.tl,
          textAlign: 'center',
          lineHeight: 1.6,
          marginTop: 10,
        }}
      >
        {story.subhead}
      </div>

      {story.leader && story.second ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 12,
          }}
        >
          <Badge color={story.leader.color}>
            {story.leader.abbr} {story.leader.current}%
          </Badge>
          <Badge color={story.second.color} subtle>
            {story.second.abbr} {story.second.current}%
          </Badge>
        </div>
      ) : null}
    </div>
  )
}

function RaceShapeCard({ T, trends }) {
  const vals = getLatestValues(trends)
  if (vals.length < 2) return null

  const leader = vals[0]
  const second = vals[1]
  const latestGap = +((leader.current || 0) - (second.current || 0)).toFixed(1)
  const firstGap =
    leader.start != null && second.start != null
      ? +((leader.start || 0) - (second.start || 0)).toFixed(1)
      : null

  const gapDelta =
    firstGap != null ? +(latestGap - firstGap).toFixed(1) : null

  let label = 'Stable race'
  let color = T.tl

  if (gapDelta != null) {
    if (gapDelta > 0.4) {
      label = 'Lead widening'
      color = '#02A95B'
    } else if (gapDelta < -0.4) {
      label = 'Race tightening'
      color = '#C8102E'
    }
  }

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 12,
        background: T.c0,
        border: `1px solid ${color}26`,
      }}
    >
      <SectionLabel T={T}>Race shape</SectionLabel>

      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {latestGap}pt gap
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color,
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: T.tl,
          textAlign: 'center',
          lineHeight: 1.6,
          marginTop: 6,
        }}
      >
        {leader.key} vs {second.key}
        {gapDelta != null ? ` · change of ${gapDelta > 0 ? '+' : ''}${gapDelta}pt across the visible range` : ''}
      </div>
    </div>
  )
}

function InteractiveTrendChart({ trends, hidden, onToggle, T }) {
  const [tooltip, setTooltip] = useState(null)
  if (!trends || trends.length < 2) return null

  const allVals = []
  PARTY_KEYS.forEach((p) =>
    trends.forEach((d) => {
      if (d[p.key] != null) allVals.push(d[p.key])
    }),
  )

  const minV = Math.max(0, Math.min(...allVals) - 3)
  const maxV = Math.min(100, Math.max(...allVals) + 4)

  const COL = 54
  const PT = 10
  const PB = 26
  const PL = 0
  const H = 210
  const CH = H - PT - PB
  const W = COL * (trends.length - 1) + 24

  const xPos = (i) => PL + i * COL + 12
  const yPos = (v) => PT + CH - ((v - minV) / (maxV - minV)) * CH

  const gridVals = []
  for (let v = Math.ceil(minV / 5) * 5; v <= maxV; v += 5) gridVals.push(v)

  const lines = PARTY_KEYS.map((p) => {
    if (hidden[p.key]) return null

    const pts = trends
      .map((d, i) => (d[p.key] != null ? { x: xPos(i), y: yPos(d[p.key]), v: d[p.key], i } : null))
      .filter(Boolean)

    if (pts.length < 2) return null

    const pathD = pts
      .map((pt, idx) => {
        if (idx === 0) return `M${pt.x},${pt.y.toFixed(1)}`
        const prev = pts[idx - 1]
        const cpx = (prev.x + pt.x) / 2
        return `C${cpx},${prev.y.toFixed(1)} ${cpx},${pt.y.toFixed(1)} ${pt.x},${pt.y.toFixed(1)}`
      })
      .join(' ')

    const last = pts[pts.length - 1]

    return (
      <g key={p.key}>
        <path d={`${pathD} L${last.x},${H - PB} L${pts[0].x},${H - PB} Z`} fill={p.color} opacity={0.09} />
        <path
          d={pathD}
          fill="none"
          stroke={p.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pts.map((pt, idx) => (
          <g key={idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={idx === pts.length - 1 ? 5 : 3.5}
              fill={idx === pts.length - 1 ? p.color : 'transparent'}
              stroke={p.color}
              strokeWidth={2}
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={16}
              fill="transparent"
              onClick={() => {
                haptic(4)
                setTooltip((t) => (t === pt.i ? null : pt.i))
              }}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}

        <text x={last.x + 6} y={last.y + 4} fontSize={10} fontWeight={800} fill={p.color}>
          {last.v}%
        </text>
      </g>
    )
  }).filter(Boolean)

  const isDark = T.th === '#ffffff'
  const gridColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const textColor = isDark ? 'rgba(255,255,255,0.45)' : '#999'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <svg width={28} height={H} style={{ flexShrink: 0, overflow: 'visible' }}>
          {gridVals.map((v) => (
            <text
              key={v}
              x={26}
              y={yPos(v) + 4}
              textAnchor="end"
              fontSize={10}
              fill={textColor}
              fontFamily="Outfit,sans-serif"
            >
              {v}
            </text>
          ))}
        </svg>

        <div
          style={{
            overflowX: 'auto',
            flex: 1,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
            {gridVals.map((v) => (
              <line key={v} x1={0} y1={yPos(v)} x2={W} y2={yPos(v)} stroke={gridColor} strokeWidth={0.8} />
            ))}

            {trends.map((d, i) => (
              <text
                key={i}
                x={xPos(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize={10}
                fill={textColor}
                fontFamily="Outfit,sans-serif"
              >
                {d.month}
              </text>
            ))}

            {lines}

            {tooltip !== null ? (
              <line
                x1={xPos(tooltip)}
                y1={PT}
                x2={xPos(tooltip)}
                y2={H - PB}
                stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
                strokeWidth={1}
                strokeDasharray="4,3"
              />
            ) : null}
          </svg>
        </div>
      </div>

      {tooltip !== null && trends[tooltip] ? (
        <div
          style={{
            borderRadius: 12,
            padding: '10px 14px',
            background: T.c1 || 'rgba(0,0,0,0.05)',
            margin: '6px 0 10px',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 8, textAlign: 'center' }}>
            {trends[tooltip].month} {tooltip <= 8 ? '2025' : '2026'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PARTY_KEYS.filter((p) => trends[tooltip][p.key] != null && !hidden[p.key])
              .sort((a, b) => (trends[tooltip][b.key] || 0) - (trends[tooltip][a.key] || 0))
              .map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.tm, flex: 1 }}>
                    {p.key.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: p.color }}>
                    {trends[tooltip][p.key]}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <div style={{ fontSize: 12, color: T.tl, padding: '8px 2px 0', lineHeight: 1.5, textAlign: 'center' }}>
        Tap any dot for details · Tap a party row below to hide it
      </div>
    </div>
  )
}

function MovementCards({ trends, hidden, onToggle, T }) {
  const latest = getLatestValues(trends)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {latest.map((p) => {
        const hiddenNow = !!hidden[p.key]
        let label = 'Flat'
        let labelColor = T.tl

        if (p.delta != null) {
          if (p.delta > 0.4) {
            label = 'Rising'
            labelColor = '#02A95B'
          } else if (p.delta < -0.4) {
            label = 'Slipping'
            labelColor = '#C8102E'
          }
        }

        return (
          <div
            key={p.key}
            onClick={() => {
              haptic(4)
              onToggle(p.key)
            }}
            style={{
              borderRadius: 14,
              padding: '12px 14px',
              background: T.c0,
              border: `1px solid ${p.color}24`,
              opacity: hiddenNow ? 0.4 : 1,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 54px',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.abbr}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: p.color, lineHeight: 1, marginTop: 2 }}>
                  {p.current}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.th }}>{p.key}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: labelColor, marginTop: 4 }}>
                  {label}
                  {p.delta != null ? ` · ${p.delta > 0 ? '+' : ''}${p.delta}pt` : ''}
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: T.tl, textAlign: 'right' }}>
                {hiddenNow ? 'Hidden' : 'Visible'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MilestoneCard({ T, m }) {
  const mentioned = PARTY_KEYS.find((pk) => (m.text || '').toLowerCase().includes(pk.key.toLowerCase()))
  const color = mentioned?.color || T.pr

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 3,
            borderRadius: 99,
            alignSelf: 'stretch',
            background: color,
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {m.date}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.65 }}>{m.text}</div>
        </div>
      </div>
    </div>
  )
}

export default function TrendsScreen({ T, trends = [], milestones = [] }) {
  const [tab, setTab] = useState('chart')
  const [hidden, setHidden] = useState({})

  const toggle = (key) => setHidden((h) => ({ ...h, [key]: !h[key] }))

  const totalPoints = useMemo(() => trends?.length || 0, [trends])

  return (
    <div
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
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: -1,
            color: T.th,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          Politiscope
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.tl,
            marginTop: 4,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          The full picture of British politics
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: -0.8,
            color: T.th,
            lineHeight: 1,
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          Trends
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4, textAlign: 'center' }}>
          National polling movement · race shape · timeline
        </div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'chart' ? (
          <>
            <TrendHero T={T} trends={trends} />
            <RaceShapeCard T={T} trends={trends} />

            <div
              style={{
                borderRadius: 14,
                padding: '14px',
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                marginBottom: 12,
              }}
            >
              <SectionLabel T={T}>Trend chart</SectionLabel>
              <InteractiveTrendChart trends={trends} hidden={hidden} onToggle={toggle} T={T} />
            </div>

            <div
              style={{
                borderRadius: 14,
                padding: '14px',
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <SectionLabel T={T}>Party movers</SectionLabel>
              <MovementCards trends={trends} hidden={hidden} onToggle={toggle} T={T} />
              <div
                style={{
                  fontSize: 12,
                  color: T.tl,
                  paddingTop: 10,
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                {totalPoints} polling points in view · tap any party row to hide or show it on the chart
              </div>
            </div>
          </>
        ) : null}

        {tab === 'milestones' ? (
          <>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.tl,
                marginBottom: 12,
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              {milestones.length} key events · most recent first
            </div>
            {milestones.map((m, i) => (
              <MilestoneCard key={i} T={T} m={m} />
            ))}
          </>
        ) : null}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}