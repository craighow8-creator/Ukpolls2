import { useState } from 'react'
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

            {tooltip !== null && (
              <line
                x1={xPos(tooltip)}
                y1={PT}
                x2={xPos(tooltip)}
                y2={H - PB}
                stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
                strokeWidth={1}
                strokeDasharray="4,3"
              />
            )}
          </svg>
        </div>
      </div>

      {tooltip !== null && trends[tooltip] && (
        <div
          style={{
            borderRadius: 12,
            padding: '10px 14px',
            background: T.c1 || 'rgba(0,0,0,0.05)',
            margin: '6px 0 10px',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 8 }}>
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
      )}

      <div style={{ borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`, marginTop: 4 }}>
        {PARTY_KEYS.map((p, i) => {
          const vals = trends.map((d) => d[p.key]).filter((v) => v != null)
          if (!vals.length) return null

          const current = vals[vals.length - 1]
          const first = vals[0]
          const delta = +(current - first).toFixed(1)
          const isNew = vals.length <= 3

          return (
            <div
              key={i}
              onClick={() => {
                haptic(4)
                onToggle(p.key)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < PARTY_KEYS.length - 1 ? `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` : 'none',
                opacity: hidden[p.key] ? 0.35 : 1,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: T.th }}>{p.key}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: p.color }}>
                {current}
                <span style={{ fontSize: 12 }}>%</span>
              </div>
              <div
                style={{
                  width: 38,
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 800,
                  color: isNew ? T.pr : delta > 0 ? '#02A95B' : delta < 0 ? '#C8102E' : T.tl,
                }}
              >
                {isNew ? 'NEW' : delta > 0 ? `+${delta}` : `${delta}`}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 12, color: T.tl, padding: '8px 2px', lineHeight: 1.5 }}>
        Apr 2025 – Mar 2026 · Tap any dot for details · Tap party name to hide · Restore Britain: prompted polls only
      </div>
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
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: -0.8,
            color: T.th,
            lineHeight: 1,
          }}
        >
          Trends
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
          National polling movement · timeline
        </div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'chart' && (
          <div
            style={{
              borderRadius: 14,
              padding: '14px',
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <InteractiveTrendChart trends={trends} hidden={hidden} onToggle={toggle} T={T} />
          </div>
        )}

        {tab === 'milestones' && (
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
        )}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}