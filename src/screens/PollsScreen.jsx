import { useMemo, useState } from 'react'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'

const TABS = [
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'latest', label: 'Latest Polls' },
  { key: 'trends', label: 'Trends' },
  { key: 'pollsters', label: 'Pollsters' },
  { key: 'methodology', label: 'Methodology' },
]

const PARTY_KEYS = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp']

const PARTY_COLORS = {
  ref: '#12B7D4',
  lab: '#E4003B',
  con: '#0087DC',
  grn: '#02A95B',
  ld: '#FAA61A',
  rb: '#1A4A9E',
  snp: '#C4922A',
}

const PARTY_NAMES = {
  ref: 'Reform UK',
  lab: 'Labour',
  con: 'Conservative',
  grn: 'Green',
  ld: 'Liberal Democrat',
  rb: 'Restore Britain',
  snp: 'SNP',
}

function cleanText(value) {
  if (value == null) return ''
  return String(value)
    .replace(/Â·/g, '·')
    .replace(/\s+/g, ' ')
    .trim()
}

function norm(value) {
  return cleanText(value).toLowerCase()
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const raw = String(value).replace(/%/g, '').replace(/,/g, '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function displayDate(poll) {
  return (
    cleanText(poll?.publishedAt) ||
    cleanText(poll?.fieldworkEnd) ||
    cleanText(poll?.date) ||
    'Date unavailable'
  )
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
  return hasLiveSource(poll)
}

function getPollResults(poll) {
  return PARTY_KEYS
    .map((key) => {
      const pct = safeNumber(poll?.[key])
      if (pct == null) return null
      return {
        key,
        pct,
        color: PARTY_COLORS[key],
        name: PARTY_NAMES[key],
        short:
          key === 'ld'
            ? 'LD'
            : key === 'snp'
              ? 'SNP'
              : key === 'rb'
                ? 'RB'
                : key.toUpperCase(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct)
}

function buildSeries(polls, partyKey) {
  return polls
    .map((poll) => safeNumber(poll?.[partyKey]))
    .filter((v) => v != null)
    .slice(-12)
}

function pollSortScore(poll) {
  return (
    cleanText(poll?.publishedAt) ||
    cleanText(poll?.fieldworkEnd) ||
    cleanText(poll?.fieldworkStart) ||
    cleanText(poll?.date) ||
    ''
  )
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
      polls: [...list].sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a))),
      latestPoll: [...list].sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a)))[0],
    }))
    .sort((a, b) => {
      if (b.polls.length !== a.polls.length) return b.polls.length - a.polls.length
      return a.name.localeCompare(b.name)
    })
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

function SparkLine({ data = [], color = '#888', width = 132, height = 34, filled = false }) {
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
      {filled ? <polygon points={fill} fill={color} fillOpacity="0.14" /> : null}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  )
}

function HeroSnapshot({ T, parties, latestLivePoll, nav }) {
  const main = (parties || []).filter((p) => p.name !== 'Other').sort((a, b) => (b.pct || 0) - (a.pct || 0))
  const topFive = main.slice(0, 5)
  const leader = main[0]
  const runnerUp = main[1]
  const gap =
    leader && runnerUp ? +((safeNumber(leader.pct) || 0) - (safeNumber(runnerUp.pct) || 0)).toFixed(1) : null

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
        {latestLivePoll ? <Badge color={T.pr} subtle>Latest live poll</Badge> : null}
      </div>

      <div
        style={{
          fontSize: 30,
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
          Latest live poll: {cleanText(latestLivePoll.pollster)} · {displayDate(latestLivePoll)}
        </div>
      ) : (
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
          Snapshot built from current polling view
        </div>
      )}

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
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: party.color,
                textAlign: 'left',
              }}
            >
              {party.abbr}
            </div>
            <MiniBar value={party.pct} max={leader.pct || 1} color={party.color} T={T} height={9} />
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: party.color,
                textAlign: 'right',
              }}
            >
              {party.pct}%
            </div>
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
          Open latest live poll →
        </div>
      ) : null}
    </div>
  )
}

function PollCard({ T, poll, nav, compact = false }) {
  const results = getPollResults(poll)
  const leader = results[0]
  const max = leader?.pct || 30
  const subMeta = displaySubMeta(poll)
  const live = isImportedPoll(poll)
  const sourceText = cleanText(poll?.source)
  const sourceUrl = cleanText(poll?.sourceUrl)

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollDetail', { poll })
      }}
      style={{
        borderRadius: 16,
        padding: compact ? '14px 14px' : '16px 16px',
        marginBottom: 10,
        background: T.c0,
        border: `1px solid ${live ? (leader?.color || T.pr) + '33' : T.cardBorder || 'rgba(0,0,0,0.08)'}`,
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
            {displayDate(poll)}
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
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {live ? <Badge color={T.pr}>Live import</Badge> : <Badge color={T.tl} subtle>Archive</Badge>}
          {leader ? <Badge color={leader.color} subtle>{leader.name} leads</Badge> : null}
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
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: r.color,
                textAlign: 'left',
              }}
            >
              {r.short}
            </div>

            <MiniBar value={r.pct} max={max} color={r.color} T={T} />

            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: r.color,
                textAlign: 'right',
              }}
            >
              {r.pct}%
            </div>
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

function PollsterCard({ T, group, nav }) {
  const latest = group.latestPoll
  const latestResults = getPollResults(latest).slice(0, 5)
  const liveCount = group.polls.filter((p) => isImportedPoll(p)).length

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollster', { pollster: group.name })
      }}
      style={{
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
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
            {liveCount ? ` · ${liveCount} live` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge color={latest?.isBpcMember ? T.pr : T.tl} subtle>
            {latest?.isBpcMember ? 'BPC member' : 'Pollster'}
          </Badge>
        </div>
      </div>

      {latest ? (
        <>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: T.tl,
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            Latest: {displayDate(latest)}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 8,
            }}
          >
            {latestResults.map((r) => (
              <div key={r.key} style={{ fontSize: 13, fontWeight: 800, color: r.color }}>
                {r.short} {r.pct}%
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: T.tl,
          marginTop: 10,
          textAlign: 'center',
        }}
      >
        Open pollster profile →
      </div>
    </div>
  )
}

function getTrendValuesFromParties(parties) {
  return (parties || [])
    .filter((p) => p.name !== 'Other')
    .map((p) => {
      const key = PARTY_KEYS.find((k) => PARTY_NAMES[k] === p.name || p.abbr?.toLowerCase() === k)
      return {
        key,
        name: p.name,
        abbr: p.abbr,
        color: p.color,
        current: safeNumber(p.pct),
      }
    })
    .filter((p) => p.key && p.current != null)
    .sort((a, b) => b.current - a.current)
}

function buildTrendStory(polls, parties) {
  const vals = getTrendValuesFromParties(parties)
  const leader = vals[0]
  const second = vals[1]

  const movers = vals.map((p) => {
    const series = buildSeries(polls, p.key)
    const delta = series.length >= 2 ? +(series[series.length - 1] - series[0]).toFixed(1) : null
    return { ...p, delta, series }
  })

  const rising = [...movers]
    .filter((p) => p.delta != null)
    .sort((a, b) => (b.delta || 0) - (a.delta || 0))[0]

  const falling = [...movers]
    .filter((p) => p.delta != null)
    .sort((a, b) => (a.delta || 0) - (b.delta || 0))[0]

  const gap =
    leader && second ? +((leader.current || 0) - (second.current || 0)).toFixed(1) : null

  let subhead = leader && second ? `${leader.name} lead by ${gap}pt.` : 'Polling movement view.'

  if (rising && (rising.delta || 0) > 0.4) {
    subhead += ` ${rising.name} are up ${rising.delta}pt over the visible period.`
  }

  if (falling && (falling.delta || 0) < -0.4) {
    subhead += ` ${falling.name} are down ${Math.abs(falling.delta)}pt.`
  }

  return {
    leader,
    second,
    rising,
    falling,
    gap,
    headline: leader ? `${leader.name} still lead the trend picture` : 'Polling movement view',
    subhead,
    movers,
  }
}

function TrendHero({ T, polls, parties }) {
  const story = buildTrendStory(polls, parties)

  return (
    <div
      style={{
        borderRadius: 18,
        padding: '18px 18px 16px',
        marginBottom: 12,
        background: T.c0,
        border: `1px solid ${(story.leader?.color || T.pr)}30`,
      }}
    >
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

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14, marginBottom: 12 }}>
        <Badge color={story.leader?.color || T.pr}>Trend Hero</Badge>
        {story.rising && (story.rising.delta || 0) > 0.4 ? (
          <Badge color="#02A95B" subtle>Rising: {story.rising.abbr}</Badge>
        ) : null}
        {story.falling && (story.falling.delta || 0) < -0.4 ? (
          <Badge color="#C8102E" subtle>Falling: {story.falling.abbr}</Badge>
        ) : null}
      </div>

      <div
        style={{
          fontSize: 24,
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

function RaceShapeCard({ T, polls, parties }) {
  const story = buildTrendStory(polls, parties)
  const { leader, second, gap } = story
  if (!leader || !second) return null

  const leaderSeries = buildSeries(polls, leader.key)
  const secondSeries = buildSeries(polls, second.key)

  const firstGap =
    leaderSeries.length && secondSeries.length
      ? +((leaderSeries[0] || 0) - (secondSeries[0] || 0)).toFixed(1)
      : null

  const gapDelta = firstGap != null ? +(gap - firstGap).toFixed(1) : null

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
        {gap}pt gap
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
        {leader.name} vs {second.name}
        {gapDelta != null ? ` · change of ${gapDelta > 0 ? '+' : ''}${gapDelta}pt across the visible range` : ''}
      </div>
    </div>
  )
}

function InteractiveTrendChart({ polls, parties, hidden, onToggle, T }) {
  const [tooltip, setTooltip] = useState(null)

  const series = PARTY_KEYS.map((key) => {
    const party = (parties || []).find((p) => PARTY_NAMES[key] === p.name || p.abbr?.toLowerCase() === key)
    return {
      key,
      label: PARTY_NAMES[key],
      abbr: party?.abbr || key.toUpperCase(),
      color: PARTY_COLORS[key],
      values: buildSeries(polls, key),
    }
  }).filter((item) => item.values.length >= 2)

  if (series.length < 2) return null

  const length = Math.max(...series.map((s) => s.values.length))
  const points = Array.from({ length }, (_, index) => index)

  const allVals = series.flatMap((s) => s.values)
  const minV = Math.max(0, Math.min(...allVals) - 3)
  const maxV = Math.min(100, Math.max(...allVals) + 4)

  const COL = 42
  const PT = 10
  const PB = 26
  const H = 210
  const CH = H - PT - PB
  const W = COL * Math.max(length - 1, 1) + 24

  const xPos = (i) => i * COL + 12
  const yPos = (v) => PT + CH - ((v - minV) / Math.max(maxV - minV, 1)) * CH

  const gridVals = []
  for (let v = Math.ceil(minV / 5) * 5; v <= maxV; v += 5) gridVals.push(v)

  const isDark = T.th === '#ffffff'
  const gridColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const textColor = isDark ? 'rgba(255,255,255,0.45)' : '#999'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <svg width={28} height={H} style={{ flexShrink: 0, overflow: 'visible' }}>
          {gridVals.map((v) => (
            <text key={v} x={26} y={yPos(v) + 4} textAnchor="end" fontSize={10} fill={textColor} fontFamily="Outfit,sans-serif">
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

            {points.map((_, i) => (
              <text
                key={i}
                x={xPos(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize={10}
                fill={textColor}
                fontFamily="Outfit,sans-serif"
              >
                {i + 1}
              </text>
            ))}

            {series.map((s) => {
              if (hidden[s.key]) return null

              const pts = s.values.map((v, i) => ({
                x: xPos(i),
                y: yPos(v),
                v,
                i,
              }))

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
                <g key={s.key}>
                  <path d={`${pathD} L${last.x},${H - PB} L${pts[0].x},${H - PB} Z`} fill={s.color} opacity={0.09} />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
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
                        fill={idx === pts.length - 1 ? s.color : 'transparent'}
                        stroke={s.color}
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

                  <text x={last.x + 6} y={last.y + 4} fontSize={10} fontWeight={800} fill={s.color}>
                    {last.v}%
                  </text>
                </g>
              )
            })}

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

      {tooltip !== null ? (
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
            Poll point {tooltip + 1}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {series
              .filter((s) => !hidden[s.key] && s.values[tooltip] != null)
              .sort((a, b) => (b.values[tooltip] || 0) - (a.values[tooltip] || 0))
              .map((s) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.tm, flex: 1 }}>
                    {s.label.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>
                    {s.values[tooltip]}%
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

function MovementCards({ polls, parties, hidden, onToggle, T }) {
  const movers = buildTrendStory(polls, parties).movers

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {movers.map((p) => {
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
                <div style={{ fontSize: 14, fontWeight: 700, color: T.th }}>{p.name}</div>
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

function MethodologyCard({ T, title, body }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '14px 15px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800, color: T.th, marginBottom: 5, textAlign: 'center' }}>
        {title}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, lineHeight: 1.65, textAlign: 'center' }}>
        {body}
      </div>
    </div>
  )
}

export default function PollsScreen({ T, parties, polls, meta, nav }) {
  const [tab, setTab] = useState('snapshot')
  const [trendHidden, setTrendHidden] = useState({})

  const allPolls = useMemo(() => {
    const raw = Array.isArray(polls) ? polls : []
    return [...raw].sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a)))
  }, [polls])

  const importedPolls = useMemo(() => allPolls.filter((poll) => isImportedPoll(poll)), [allPolls])
  const latestPolls = useMemo(() => (importedPolls.length ? importedPolls : allPolls).slice(0, 12), [allPolls, importedPolls])
  const latestLivePoll = importedPolls[0] || null

  const mainParties = useMemo(
    () => (Array.isArray(parties) ? parties : []).filter((p) => p.name !== 'Other').sort((a, b) => (b.pct || 0) - (a.pct || 0)),
    [parties],
  )

  const pollsterGroups = useMemo(() => groupPollsByPollster(allPolls), [allPolls])

  const topTwo = mainParties.slice(0, 2)
  const gap =
    topTwo.length === 2 ? +((safeNumber(topTwo[0].pct) || 0) - (safeNumber(topTwo[1].pct) || 0)).toFixed(1) : null

  const toggleTrendParty = (key) => {
    setTrendHidden((h) => ({ ...h, [key]: !h[key] }))
  }

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
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        {tab === 'trends' ? null : (
          <>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: -1,
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
                gap: 8,
                flexWrap: 'wrap',
                width: '100%',
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
                Polling journey · latest race · pollsters · trends
              </div>
              <InfoButton id="poll_average" T={T} size={18} />
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: T.tl,
                marginTop: 4,
                opacity: 0.8,
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              {meta?.fetchDate ? `Updated ${meta.fetchDate}` : 'Polling data view'}
              {latestLivePoll ? ` · latest live import ${latestLivePoll.pollster} ${displayDate(latestLivePoll)}` : ''}
            </div>
          </>
        )}
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'snapshot' ? (
          <>
            <HeroSnapshot T={T} parties={mainParties} latestLivePoll={latestLivePoll} nav={nav} />

            {topTwo.length === 2 ? (
              <div
                style={{
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 12,
                  background: T.c0,
                  border: `1px solid ${(topTwo[0].color || T.pr)}22`,
                }}
              >
                <SectionLabel T={T}>Race state</SectionLabel>

                <div
                  style={{
                    fontSize: 23,
                    fontWeight: 800,
                    color: T.th,
                    textAlign: 'center',
                    lineHeight: 1.15,
                  }}
                >
                  {topTwo[0].name} lead by {gap}pt
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 10,
                  }}
                >
                  <Badge color={topTwo[0].color}>{topTwo[0].abbr} {topTwo[0].pct}%</Badge>
                  <Badge color={topTwo[1].color} subtle>{topTwo[1].abbr} {topTwo[1].pct}%</Badge>
                </div>
              </div>
            ) : null}

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
                padding: '12px 14px',
                marginBottom: 12,
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge color={T.pr}>{importedPolls.length ? 'Live-first ordering' : 'Archive view'}</Badge>
                <Badge color={T.tl} subtle>
                  {latestPolls.length} shown
                </Badge>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: T.tl,
                  lineHeight: 1.55,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                Live-imported polls are prioritised when available. Older legacy rows stay visible below until the archive is fully cleaned.
              </div>
            </div>

            {latestPolls.map((poll) => (
              <PollCard key={poll.id || `${poll.pollster}-${displayDate(poll)}`} T={T} poll={poll} nav={nav} />
            ))}

            {latestPolls.length === 0 ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: T.tl, textAlign: 'center' }}>
                No polls loaded yet.
              </div>
            ) : null}
          </>
        ) : null}

        {tab === 'trends' ? (
          <>
            <TrendHero T={T} polls={allPolls} parties={mainParties} />
            <RaceShapeCard T={T} polls={allPolls} parties={mainParties} />

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
              <InteractiveTrendChart
                polls={allPolls}
                parties={mainParties}
                hidden={trendHidden}
                onToggle={toggleTrendParty}
                T={T}
              />
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
              <MovementCards
                polls={allPolls}
                parties={mainParties}
                hidden={trendHidden}
                onToggle={toggleTrendParty}
                T={T}
              />
              <div
                style={{
                  fontSize: 12,
                  color: T.tl,
                  paddingTop: 10,
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                {allPolls.length} stored polls in view · tap any party row to hide or show it on the chart
              </div>
            </div>
          </>
        ) : null}

        {tab === 'pollsters' ? (
          <>
            <SectionLabel T={T}>Pollsters</SectionLabel>

            {pollsterGroups.map((group) => (
              <PollsterCard key={group.name} T={T} group={group} nav={nav} />
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
            <SectionLabel T={T}>How polls are shown</SectionLabel>

            <MethodologyCard
              T={T}
              title="Live imports first"
              body="When a poll has a real source link and imported metadata, it is treated as a live-imported poll and shown ahead of older legacy archive rows."
            />

            <MethodologyCard
              T={T}
              title="Fieldwork matters"
              body="Polling dates can mean different things. Where possible, fieldwork and published dates should both be stored, because a poll released today may reflect interviews done earlier."
            />

            <MethodologyCard
              T={T}
              title="Sample size is useful, not magic"
              body="Larger samples usually reduce random error, but weighting, turnout modelling and panel quality still matter. Bigger does not automatically mean better."
            />

            <MethodologyCard
              T={T}
              title="Why pollsters differ"
              body="Different turnout assumptions, house effects, weighting models and undecided-voter treatment can produce different results even in the same week."
            />

            <MethodologyCard
              T={T}
              title="Trends are directional"
              body="Trend views smooth noise and help show movement, but they are not predictions. They should be read as direction of travel, not certainty."
            />
          </>
        ) : null}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}