import { useMemo, useState } from 'react'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'

const TABS = [
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'trends', label: 'Trends' },
  { key: 'latest', label: 'Latest Polls' },
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
  rb: '#1a4a9e',
  snp: '#C4922A',
}

const PARTY_NAMES = {
  ref: 'Reform UK',
  lab: 'Labour',
  con: 'Conservative',
  grn: 'Green',
  ld: 'Lib Dem',
  rb: 'Restore Britain',
  snp: 'SNP',
}

function SectionLabel({ children, T }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.06em',
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
        borderRadius: 999,
        padding: '3px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function MiniBar({ value, max, color, T, height = 7 }) {
  const pct = Math.max(2, Math.min(100, ((value || 0) / (max || 1)) * 100))
  return (
    <div style={{ flex: 1, height, borderRadius: 999, background: T.c1 || 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  )
}

function SparkLine({ data = [], color = '#888', width = 120, height = 34, filled = false }) {
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

function getPollResults(poll) {
  return PARTY_KEYS
    .filter((k) => poll?.[k] != null)
    .map((k) => ({
      key: k,
      pct: poll[k],
      color: PARTY_COLORS[k],
      name: PARTY_NAMES[k],
    }))
    .sort((a, b) => b.pct - a.pct)
}

function PollCard({ T, poll, nav, compact = false }) {
  const results = getPollResults(poll)
  const max = results[0]?.pct || 30
  const leader = results[0]

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollDetail', { poll })
      }}
      style={{
        borderRadius: 14,
        padding: compact ? '13px 14px' : '16px 18px',
        marginBottom: 10,
        background: T.c0,
        border: `1px solid ${leader?.color || T.pr}33`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div>
          <div
            onClick={(e) => {
              e.stopPropagation()
              if (poll.pollster) {
                haptic(6)
                nav('pollster', { pollster: poll.pollster })
              }
            }}
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: T.th,
              cursor: poll.pollster ? 'pointer' : 'default',
            }}
          >
            {poll.pollster}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 2 }}>{poll.date}</div>
          {(poll.sample || poll.method || poll.mode) && (
            <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, opacity: 0.8, marginTop: 4 }}>
              {[poll.sample ? `Sample ${poll.sample}` : null, poll.method || null, poll.mode || null].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {leader && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 999,
              background: `${leader.color}22`,
              color: leader.color,
              flexShrink: 0,
            }}
          >
            {leader.name.split(' ')[0]} leads
          </div>
        )}
      </div>

      {results.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: i === results.length - 1 ? 0 : 6,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: r.color,
              width: 30,
              flexShrink: 0,
            }}
          >
            {r.name.split(' ')[0].slice(0, 3).toUpperCase()}
          </div>

          <MiniBar value={r.pct} max={max} color={r.color} T={T} />

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: r.color,
              width: 28,
              textAlign: 'right',
            }}
          >
            {r.pct}%
          </div>
        </div>
      ))}

      <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 8, textAlign: 'center' }}>
        Open poll detail →
      </div>
    </div>
  )
}

function SnapshotStrip({ T, parties }) {
  const main = (parties || []).filter((p) => p.name !== 'Other').sort((a, b) => b.pct - a.pct)

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        paddingBottom: 4,
        marginBottom: 16,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {main.map((p, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12,
            padding: '14px 16px',
            minWidth: 110,
            flexShrink: 0,
            textAlign: 'center',
            background: T.c0,
            border: `1px solid ${p.color}44`,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: p.color,
              marginBottom: 6,
            }}
          >
            {p.abbr}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: p.color,
              lineHeight: 1,
            }}
          >
            {p.pct}%
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: p.change > 0 ? '#02A95B' : p.change < 0 ? '#C8102E' : T.tl,
              marginTop: 6,
            }}
          >
            {p.change > 0 ? '▲' : p.change < 0 ? '▼' : '—'} {Math.abs(p.change || 0)}pt
          </div>

          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.07)',
              marginTop: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(p.pct / 35) * 100}%`,
                height: '100%',
                background: p.color,
                borderRadius: 999,
              }}
            />
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.tl,
              marginTop: 4,
            }}
          >
            {p.seats || 0} seats
          </div>
        </div>
      ))}
    </div>
  )
}

function TrendCards({ T, polls, parties }) {
  const main = (parties || []).filter((p) => p.name !== 'Other').sort((a, b) => b.pct - a.pct).slice(0, 5)

  const seriesFor = (key) => polls.map((p) => p?.[key]).filter((v) => v != null && !isNaN(v)).slice(-12)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {main.map((p, i) => {
        const key = PARTY_KEYS.find((k) => PARTY_NAMES[k] === p.name)
        const series = key ? seriesFor(key) : []
        const delta = series.length >= 2 ? +(series[series.length - 1] - series[0]).toFixed(1) : null

        return (
          <div
            key={i}
            style={{
              borderRadius: 14,
              padding: '14px 16px',
              background: T.c0,
              border: `1px solid ${p.color}28`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ width: 48, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.abbr}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: p.color, lineHeight: 1, marginTop: 2 }}>
                  {p.pct}%
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {series.length >= 2 ? (
                  <SparkLine data={series} color={p.color} width={140} height={32} filled />
                ) : (
                  <div style={{ fontSize: 13, color: T.tl }}>Not enough polling points yet</div>
                )}
              </div>

              <div
                style={{
                  width: 42,
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 800,
                  color: delta == null ? T.tl : delta > 0 ? '#02A95B' : delta < 0 ? '#C8102E' : T.tl,
                  flexShrink: 0,
                }}
              >
                {delta == null ? '—' : delta > 0 ? `+${delta}` : `${delta}`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PollsterCard({ T, name, polls, nav }) {
  const latest = polls[0]
  const count = polls.length

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollster', { pollster: name })
      }}
      style={{
        borderRadius: 12,
        padding: '12px 16px',
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
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{name}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 3 }}>
            {count} poll{count === 1 ? '' : 's'} in database
          </div>
        </div>

        {latest && (
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
            {latest.date}
          </div>
        )}
      </div>

      {latest && (
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          {PARTY_KEYS.filter((k) => latest[k] != null).map((k, j) => (
            <div
              key={j}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: PARTY_COLORS[k],
              }}
            >
              {k.toUpperCase()} {latest[k]}%
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 8, textAlign: 'center' }}>
        Open pollster profile →
      </div>
    </div>
  )
}

export default function PollsScreen({ T, parties, polls, meta, nav }) {
  const [tab, setTab] = useState('snapshot')

  const mainParties = useMemo(
    () => (parties || []).filter((p) => p.name !== 'Other').sort((a, b) => b.pct - a.pct),
    [parties]
  )

  const allPolls = useMemo(() => polls || [], [polls])
  const recentPolls = allPolls.slice(0, 10)

  const topTwo = mainParties.slice(0, 2)
  const gap = topTwo.length === 2 ? +((topTwo[0].pct || 0) - (topTwo[1].pct || 0)).toFixed(1) : null

  const pollsterGroups = useMemo(() => {
    const map = new Map()
    allPolls.forEach((poll) => {
      if (!poll?.pollster) return
      if (!map.has(poll.pollster)) map.set(poll.pollster, [])
      map.get(poll.pollster).push(poll)
    })
    return [...map.entries()]
      .map(([name, list]) => ({ name, polls: list }))
      .sort((a, b) => b.polls.length - a.polls.length || a.name.localeCompare(b.name))
  }, [allPolls])

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
            marginTop: 4,
            width: '100%',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl }}>
            BPC member polls · 7-poll average
          </div>
          <InfoButton id="poll_average" T={T} size={18} />
        </div>

        {meta?.fetchDate && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: T.tl,
              marginTop: 4,
              opacity: 0.7,
              textAlign: 'center',
            }}
          >
            Updated {meta.fetchDate} · BPC pollsters
          </div>
        )}
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'snapshot' && (
          <>
            <SnapshotStrip T={T} parties={mainParties} />

            {topTwo.length === 2 && (
              <div
                style={{
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 12,
                  background: T.c0,
                  border: `1px solid ${topTwo[0].color}28`,
                }}
              >
                <SectionLabel T={T}>Polling picture</SectionLabel>

                <div style={{ fontSize: 22, fontWeight: 800, color: T.th, textAlign: 'center', lineHeight: 1.15 }}>
                  {topTwo[0].name} lead by {gap}pt
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <Chip color={topTwo[0].color}>
                    {topTwo[0].abbr} {topTwo[0].pct}%
                  </Chip>
                  <Chip color={topTwo[1].color}>
                    {topTwo[1].abbr} {topTwo[1].pct}%
                  </Chip>
                </div>
              </div>
            )}

            {recentPolls[0] && (
              <>
                <SectionLabel T={T}>Latest published poll</SectionLabel>
                <PollCard T={T} poll={recentPolls[0]} nav={nav} />
              </>
            )}

            <SectionLabel T={T}>Most active pollsters</SectionLabel>
            {pollsterGroups.slice(0, 5).map((g, i) => (
              <PollsterCard key={i} T={T} name={g.name} polls={g.polls} nav={nav} />
            ))}
          </>
        )}

        {tab === 'trends' && (
          <>
            <SectionLabel T={T}>Polling trends</SectionLabel>
            <TrendCards T={T} polls={allPolls} parties={mainParties} />

            <div
              style={{
                borderRadius: 12,
                padding: '12px 14px',
                marginTop: 12,
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: T.th, marginBottom: 5, textAlign: 'center' }}>
                About trends
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6, textAlign: 'center' }}>
                This first pass uses poll results already in the database to show directional movement. Later this should be upgraded to a cleaner rolling-average trend system.
              </div>
            </div>
          </>
        )}

        {tab === 'latest' && (
          <>
            <SectionLabel T={T}>Latest polls</SectionLabel>
            {recentPolls.map((poll, i) => (
              <PollCard key={i} T={T} poll={poll} nav={nav} />
            ))}

            {recentPolls.length === 0 && (
              <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, textAlign: 'center' }}>
                No polls loaded yet.
              </div>
            )}
          </>
        )}

        {tab === 'pollsters' && (
          <>
            <SectionLabel T={T}>Pollsters</SectionLabel>

            {pollsterGroups.map((g, i) => (
              <PollsterCard key={i} T={T} name={g.name} polls={g.polls} nav={nav} />
            ))}

            <div
              style={{
                borderRadius: 12,
                padding: '12px 14px',
                marginTop: 12,
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: T.th, marginBottom: 5, textAlign: 'center' }}>
                Pollster transparency
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6, textAlign: 'center' }}>
                Pollsters are now first-pass entities. Next stage should deepen this with methodology, BPC status, commissioner notes and historical comparison.
              </div>
            </div>
          </>
        )}

        {tab === 'methodology' && (
          <>
            <SectionLabel T={T}>How polls are shown</SectionLabel>

            {[
              {
                title: 'BPC member polls',
                body: 'The topline polling view should prioritise British Polling Council members where possible, because they publish methodology standards and tables more consistently.',
              },
              {
                title: 'Fieldwork date',
                body: 'Fieldwork dates matter more than publish date. A poll released today may reflect interviews done several days earlier.',
              },
              {
                title: 'Sample size',
                body: 'Larger samples usually reduce random error, but sample quality and weighting matter too. A big bad sample can still mislead.',
              },
              {
                title: 'Why pollsters differ',
                body: 'Different turnout models, weighting assumptions, question wording and treatment of undecided voters can produce different results even at the same time.',
              },
              {
                title: 'Rolling averages',
                body: 'Averages smooth out noisy one-off polls. They are useful for direction of travel, but they can lag behind fast-moving political events.',
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 12,
                  padding: '13px 14px',
                  marginBottom: 8,
                  background: T.c0,
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: T.th, marginBottom: 5, textAlign: 'center' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, lineHeight: 1.7, textAlign: 'center' }}>
                  {item.body}
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}