import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import { LOCAL_ELECTIONS, LOCAL_REGIONS } from '../data/elections'
import { daysTo } from '../utils/helpers'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'byelections', label: 'By-elections' },
  { key: 'councils', label: 'Councils' },
  { key: 'regions', label: 'Regions' },
  { key: 'scotland', label: 'Scotland' },
  { key: 'wales', label: 'Wales' },
]

const CONTROL_COLORS = {
  Con: '#0087DC',
  Lab: '#E4003B',
  LD: '#FAA61A',
  Grn: '#02A95B',
  Reform: '#12B7D4',
  NOC: '#6b7280',
  SNP: '#C4922A',
  PC: '#3F8428',
  Ind: '#9CA3AF',
}

const DIFF_COLORS = {
  'very hard': '#E4003B',
  hard: '#F97316',
  medium: '#EAB308',
  safe: '#02A95B',
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

function ControlBadge({ control, T }) {
  const c = CONTROL_COLORS[control] || T.tl
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 800,
        padding: '2px 8px',
        borderRadius: 999,
        background: `${c}1e`,
        color: c,
        flexShrink: 0,
      }}
    >
      {control}
    </span>
  )
}

function DiffDot({ d }) {
  const c = DIFF_COLORS[d] || '#888'
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
}

function DevolvedPollGrid({ T, polls }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
      {polls.map((p, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            background: `${p.color}0e`,
            border: `1px solid ${p.color}28`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.party}</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: T.th,
              lineHeight: 1,
            }}
          >
            {p.pct}%
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 2 }}>{p.trend}</div>
        </div>
      ))}
    </div>
  )
}

export default function ElectionsScreen({ T, nav, meta, byElections = { upcoming: [], recent: [] } }) {
  const [tab, setTab] = useState('overview')
  const [search, setSearch] = useState('')

  const nextDate = meta?.nextElectionDate || '2026-05-07'
  const nextLabel = meta?.nextElectionLabel || 'Local & Devolved Elections'
  const days = daysTo(nextDate)
  const councils = LOCAL_ELECTIONS?.councils || []
  const regions = LOCAL_REGIONS || []
  const upcomingByElections = (byElections?.upcoming || []).filter((b) => b.status !== 'skip')
  const recentByElections = byElections?.recent || []

  const allSearchableCouncils = useMemo(() => {
    const flat = [...councils]
    regions.forEach((r) => {
      if (r.councils_list) {
        r.councils_list.forEach((c) => {
          if (!flat.find((x) => x.name === c.name)) {
            flat.push({ ...c, region: r.name, type: r.type || 'Metropolitan' })
          }
        })
      }
    })
    return flat
  }, [councils, regions])

  const filtered = useMemo(() => {
    if (!search.trim()) return councils
    const q = search.toLowerCase()
    return allSearchableCouncils.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.region?.toLowerCase().includes(q) ||
        c.control?.toLowerCase().includes(q) ||
        (c.verdict || '').toLowerCase().includes(q) ||
        (c.note || '').toLowerCase().includes(q),
    )
  }, [allSearchableCouncils, councils, search])

  const openCouncil = (name) => {
    haptic(6)
    nav('council', { name })
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
      <div style={{ padding: '18px 18px 0', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: -0.8,
            color: T.th,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          Elections
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4, textAlign: 'center' }}>
          {new Date(nextDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {nextLabel}
        </div>
      </div>

      <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 10,
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: T.pr,
              }}
            >
              {days}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.tl }}>days away</div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {['136 English councils', 'Scottish Parliament', 'Senedd', 'Mayoral'].map((s, i) => (
              <Chip key={i} color={T.pr || '#12B7D4'}>
                {s}
              </Chip>
            ))}
          </div>
        </div>

        {meta?.fetchDate && (
          <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, opacity: 0.65, marginBottom: 4, textAlign: 'center' }}>
            Last updated {meta.fetchDate} · Electoral Commission
          </div>
        )}
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Total councils', value: '136', color: T.pr || '#12B7D4' },
                { label: 'Total seats', value: '1,641+', color: T.pr || '#12B7D4' },
                { label: 'Very contested', value: councils.filter((c) => c.difficulty === 'very hard').length, color: '#E4003B' },
                { label: 'Hard to call', value: councils.filter((c) => c.difficulty === 'hard').length, color: '#F97316' },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 12,
                    padding: '11px 12px',
                    textAlign: 'center',
                    background: T.c0 || '#fff',
                    border: `1px solid ${s.color}28`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: T.tl,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 4,
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            <SectionLabel T={T}>Key contests to watch</SectionLabel>

            {councils
              .filter((c) => c.difficulty === 'very hard')
              .slice(0, 6)
              .map((c, i) => (
                <motion.div
                  key={i}
                  {...TAP}
                  onClick={() => openCouncil(c.name)}
                  style={{
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 8,
                    background: T.c0 || '#fff',
                    border: `1px solid ${(CONTROL_COLORS[c.control] || '#888')}28`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <DiffDot d={c.difficulty} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.th, marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: T.tl, marginBottom: 5 }}>
                      {c.region} · {c.seats} seats
                    </div>
                    {c.watchFor && (
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: T.tm,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {c.watchFor}
                      </div>
                    )}
                    {c.verdict && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: DIFF_COLORS[c.difficulty] || T.tl, marginTop: 4 }}>
                        {c.verdict}
                      </div>
                    )}
                  </div>
                  <ControlBadge control={c.control} T={T} />
                </motion.div>
              ))}
          </>
        )}

        {tab === 'byelections' && (
          <>
            <SectionLabel T={T}>Upcoming by-elections</SectionLabel>

            {upcomingByElections.length > 0 ? (
              upcomingByElections.map((b, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 14,
                    padding: '13px 14px',
                    marginBottom: 8,
                    background: T.c0 || '#fff',
                    border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{b.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.pr, marginTop: 3 }}>
                        {b.date || 'Date TBC'}
                      </div>
                    </div>
                    {b.defending && <ControlBadge control={b.defending} T={T} />}
                  </div>

                  {b.note && (
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.65, marginTop: 8 }}>
                      {b.note}
                    </div>
                  )}

                  {(b.majority || b.turnout) && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {b.majority && <Chip color={T.pr}>Majority {b.majority}</Chip>}
                      {b.turnout && <Chip color={T.pr}>Turnout {b.turnout}</Chip>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  borderRadius: 14,
                  padding: '14px',
                  marginBottom: 10,
                  background: T.c0 || '#fff',
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                  textAlign: 'center',
                  fontSize: 14,
                  color: T.tl,
                }}
              >
                No upcoming by-elections loaded yet.
              </div>
            )}

            <SectionLabel T={T}>Recent results</SectionLabel>

            {recentByElections.length > 0 ? (
              recentByElections.map((b, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 14,
                    padding: '13px 14px',
                    marginBottom: 8,
                    background: T.c0 || '#fff',
                    border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{b.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 3 }}>
                        {b.date || 'Recent result'}
                      </div>
                    </div>
                    {b.winner && (
                      <div style={{ fontSize: 13, fontWeight: 800, color: b.winnerColor || T.pr }}>
                        {b.winner}
                      </div>
                    )}
                  </div>

                  {(b.gainLoss || b.majority || b.turnout) && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {b.gainLoss && <Chip color={b.winnerColor || T.pr}>{b.gainLoss}</Chip>}
                      {b.majority && <Chip color={T.pr}>Majority {b.majority}</Chip>}
                      {b.turnout && <Chip color={T.pr}>Turnout {b.turnout}</Chip>}
                    </div>
                  )}

                  {b.note && (
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.65, marginTop: 8 }}>
                      {b.note}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  borderRadius: 14,
                  padding: '14px',
                  marginBottom: 10,
                  background: T.c0 || '#fff',
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                  textAlign: 'center',
                  fontSize: 14,
                  color: T.tl,
                }}
              >
                No recent by-election results loaded yet.
              </div>
            )}
          </>
        )}

        {tab === 'councils' && (
          <>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.tl} strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>

              <input
                type="search"
                placeholder="Search councils, regions, parties…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 38px',
                  background: T.c0 || '#fff',
                  border: `1.5px solid ${search ? T.pr : T.cardBorder || 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 12,
                  fontSize: 15,
                  color: T.th,
                  fontFamily: "'Outfit', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
              />
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 8 }}>
              {filtered.length} of {councils.length} councils {search ? '· filtered search' : '· tap for full profile'}
            </div>

            {filtered.map((c, i) => (
              <motion.div
                key={i}
                {...TAP}
                onClick={() => openCouncil(c.name)}
                style={{
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 6,
                  background: T.c0 || '#fff',
                  border: `1px solid ${(CONTROL_COLORS[c.control] || '#888')}18`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <DiffDot d={c.difficulty} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{c.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
                    {c.region} · {c.type} · {c.seats} seats
                  </div>
                  {c.watchFor && (
                    <div
                      style={{
                        fontSize: 13,
                        color: T.tl,
                        marginTop: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.watchFor}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <ControlBadge control={c.control} T={T} />
                  {c.verdict && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: DIFF_COLORS[c.difficulty] || T.tl, marginTop: 3 }}>
                      {c.verdict}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </>
        )}

        {tab === 'regions' &&
          regions.map((r, i) => (
            <div
              key={i}
              style={{
                borderRadius: 14,
                padding: '13px 14px',
                marginBottom: 10,
                background: T.c0 || '#fff',
                border: `1px solid ${(r.accentColor || T.pr)}28`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 20 }}>{r.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{r.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
                    {r.councils} councils · {r.seats} seats
                  </div>
                </div>
                <Chip color={DIFF_COLORS[r.difficulty] || '#888'}>{r.difficulty}</Chip>
              </div>

              <div style={{ fontSize: 13, fontWeight: 500, color: T.tm, lineHeight: 1.65, marginBottom: 8 }}>{r.story}</div>

              {r.watchFor && (
                <div
                  style={{
                    padding: '8px 10px',
                    background: T.c1 || 'rgba(0,0,0,0.04)',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: T.tl,
                      marginBottom: 3,
                    }}
                  >
                    Watch for
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tm }}>{r.watchFor}</div>
                </div>
              )}

              {r.councils_list?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.councils_list.map((cl, j) => (
                    <motion.div
                      key={j}
                      {...TAP}
                      onClick={() => openCouncil(cl.name)}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: T.c1 || 'rgba(0,0,0,0.05)',
                        color: T.th,
                        cursor: 'pointer',
                        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                      }}
                    >
                      {cl.name}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}

        {tab === 'scotland' && (
          <>
            <div
              style={{
                borderRadius: 14,
                padding: '13px 14px',
                marginBottom: 10,
                background: T.c0 || '#fff',
                border: '1px solid #C4922A28',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#C4922A',
                  marginBottom: 10,
                }}
              >
                🏴 Scottish Parliament · 7 May 2026
              </div>

              <div style={{ fontSize: 13, fontWeight: 500, color: T.tm, lineHeight: 1.65, marginBottom: 10 }}>
                First major test for Reform UK in Scotland. Post-Yousaf SNP leadership election. Labour hoping to capitalise on SNP weakness.
              </div>

              <DevolvedPollGrid
                T={T}
                polls={[
                  { party: 'SNP', pct: 34, color: '#C4922A', trend: '▼ Falling' },
                  { party: 'Labour', pct: 28, color: '#E4003B', trend: '▲ Rising' },
                  { party: 'Conservative', pct: 16, color: '#0087DC', trend: '▼ Falling' },
                  { party: 'Green', pct: 9, color: '#02A95B', trend: '→ Stable' },
                  { party: 'Lib Dem', pct: 7, color: '#FAA61A', trend: '▲ Rising' },
                  { party: 'Reform', pct: 5, color: '#12B7D4', trend: '▲ New' },
                ]}
              />
            </div>

            <SectionLabel T={T}>Key Holyrood battlegrounds</SectionLabel>

            {[
              { seat: 'Edinburgh Central', holding: 'SNP', challenger: 'Labour', note: 'Angus Robertson personal vote vs Labour revival' },
              { seat: 'Glasgow Southside', holding: 'SNP', challenger: 'Labour', note: "Humza Yousaf's former seat — symbolic Labour target" },
              { seat: 'Lothian Region', holding: 'Con', challenger: 'Reform', note: 'Can Reform break through via regional list?' },
              { seat: 'West Scotland', holding: 'SNP', challenger: 'Con/Lab', note: 'Three-way marginal on regional list' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 6,
                  background: T.c0 || '#fff',
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: T.th, marginBottom: 2 }}>{s.seat}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 3 }}>
                  {s.holding} → {s.challenger}
                </div>
                <div style={{ fontSize: 13, color: T.tl }}>{s.note}</div>
              </div>
            ))}
          </>
        )}

        {tab === 'wales' && (
          <>
            <div
              style={{
                borderRadius: 14,
                padding: '13px 14px',
                marginBottom: 10,
                background: T.c0 || '#fff',
                border: '1px solid #3F842828',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#3F8428',
                  marginBottom: 10,
                }}
              >
                🏴 Senedd · 7 May 2026
              </div>

              <div style={{ fontSize: 13, fontWeight: 500, color: T.tm, lineHeight: 1.65, marginBottom: 10 }}>
                Expanded 96-seat Senedd uses a new proportional system for the first time. Labour dominance under serious threat from Reform UK in valleys communities.
              </div>

              <DevolvedPollGrid
                T={T}
                polls={[
                  { party: 'Labour', pct: 33, color: '#E4003B', trend: '▼ Falling' },
                  { party: 'Reform', pct: 22, color: '#12B7D4', trend: '▲ Surging' },
                  { party: 'Conservative', pct: 16, color: '#0087DC', trend: '▼ Falling' },
                  { party: 'Plaid Cymru', pct: 15, color: '#3F8428', trend: '→ Stable' },
                  { party: 'Green', pct: 7, color: '#02A95B', trend: '▲ Rising' },
                  { party: 'Lib Dem', pct: 5, color: '#FAA61A', trend: '→ Stable' },
                ]}
              />
            </div>

            <SectionLabel T={T}>Key Senedd contests</SectionLabel>

            {[
              { seat: 'Rhondda', holding: 'Lab', challenger: 'Reform', note: "Reform's strongest Welsh target — heavy Leave vote" },
              { seat: 'Cardiff Central', holding: 'LD', challenger: 'Lab/Green', note: 'Three-way marginal in university city' },
              { seat: 'Ynys Môn (Anglesey)', holding: 'PC', challenger: 'Lab', note: 'Plaid heartland under Labour pressure' },
              { seat: 'Brecon & Radnor', holding: 'LD', challenger: 'Con/Reform', note: 'Traditional Blue territory, LD defending' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 6,
                  background: T.c0 || '#fff',
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: T.th, marginBottom: 2 }}>{s.seat}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 3 }}>
                  {s.holding} → {s.challenger}
                </div>
                <div style={{ fontSize: 13, color: T.tl }}>{s.note}</div>
              </div>
            ))}
          </>
        )}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}