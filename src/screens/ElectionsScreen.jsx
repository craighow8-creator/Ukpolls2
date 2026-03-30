import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { LOCAL_ELECTIONS, LOCAL_REGIONS } from '../data/elections'
import { daysTo } from '../utils/helpers'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'general', label: 'General' },
  { key: 'locals', label: 'Locals' },
  { key: 'devolved', label: 'Devolved' },
  { key: 'mayors', label: 'Mayors' },
  { key: 'byelections', label: 'By-elections' },
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

const GENERAL_2024 = [
  { party: 'Labour', seats: 412, vote: 33.7, color: '#E4003B' },
  { party: 'Conservative', seats: 121, vote: 23.7, color: '#0087DC' },
  { party: 'Liberal Democrat', seats: 72, vote: 12.2, color: '#FAA61A' },
  { party: 'Reform UK', seats: 5, vote: 14.3, color: '#12B7D4' },
  { party: 'Green', seats: 4, vote: 6.8, color: '#02A95B' },
  { party: 'SNP', seats: 9, vote: 2.5, color: '#C4922A' },
  { party: 'Plaid Cymru', seats: 4, vote: 0.7, color: '#3F8428' },
]

const MAYORAL_CONTESTS = [
  {
    name: 'Greater Lincolnshire',
    status: 'New mayoralty',
    note: 'A new office means no incumbent record to lean on. Early organisation and candidate recognition will matter more than usual.',
  },
  {
    name: 'Hull & East Yorkshire',
    status: 'New mayoralty',
    note: 'Another first-time contest. This is the kind of race where local profile can cut across national party brands.',
  },
  {
    name: 'West of England',
    status: 'Open test',
    note: 'Urban, mixed and politically fragmented. A strong local ground campaign could matter as much as the national mood.',
  },
  {
    name: 'Cambridgeshire & Peterborough',
    status: 'Competitive',
    note: 'A broad coalition-style electorate makes this one worth watching for tactical voting behaviour and turnout.',
  },
]

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function formatDate(value) {
  if (!value) return 'Date TBC'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return cleanText(value)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Chip({ children, color }) {
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
        background: `${color}1e`,
        border: `1px solid ${color}2B`,
        borderRadius: 999,
        padding: '4px 9px',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
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

function ControlBadge({ control, T }) {
  const c = CONTROL_COLORS[control] || T.tl
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 800,
        padding: '3px 8px',
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

function StatCard({ T, label, value, color, sub }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '12px 12px',
        textAlign: 'center',
        background: T.c0,
        border: `1px solid ${color}28`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: T.tl,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub ? (
        <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 4, lineHeight: 1.4 }}>
          {sub}
        </div>
      ) : null}
    </div>
  )
}

function SurfaceCard({ T, children, borderColor, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '14px',
        background: T.c0,
        border: `1px solid ${borderColor || T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function ScrollAwayHeader({ T, nextDate, nextLabel }) {
  return (
    <div style={{ padding: '8px 16px 10px' }}>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        Elections
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
          {nextLabel} · {formatDate(nextDate)}
        </div>
        <InfoButton id="elections_overview" T={T} size={20} />
      </div>
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
        padding: '8px 16px 10px',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />
    </div>
  )
}

function GeneralResultBars({ T }) {
  const maxSeats = Math.max(...GENERAL_2024.map((x) => x.seats))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {GENERAL_2024.map((row) => (
        <div
          key={row.party}
          style={{
            display: 'grid',
            gridTemplateColumns: '76px 1fr 88px',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: row.color }}>{row.party.split(' ')[0].toUpperCase()}</div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: T.c1 || 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(row.seats / maxSeats) * 100}%`,
                height: '100%',
                background: row.color,
                borderRadius: 999,
              }}
            />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: row.color, textAlign: 'right' }}>
            {row.seats} seats
          </div>
        </div>
      ))}
    </div>
  )
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
  const nextLabel = meta?.nextElectionLabel || 'Local and devolved elections'
  const days = daysTo(nextDate)

  const nextGeneralDate = meta?.nextGeneralElectionDate || ''
  const generalDays = nextGeneralDate ? daysTo(nextGeneralDate) : null

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

  const filteredCouncils = useMemo(() => {
    if (!search.trim()) return councils
    const q = search.toLowerCase()
    return allSearchableCouncils.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        cleanText(c.region).toLowerCase().includes(q) ||
        cleanText(c.control).toLowerCase().includes(q) ||
        cleanText(c.verdict).toLowerCase().includes(q) ||
        cleanText(c.note).toLowerCase().includes(q),
    )
  }, [allSearchableCouncils, councils, search])

  const veryContested = councils.filter((c) => c.difficulty === 'very hard')
  const hardToCall = councils.filter((c) => c.difficulty === 'hard')

  const openCouncil = (name) => {
    haptic(6)
    nav('council', { name })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} nextDate={nextDate} nextLabel={nextLabel} />
      <StickyPillsBar T={T} tab={tab} setTab={setTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {tab === 'overview' ? (
          <>
            <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Next major vote</SectionLabel>

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: T.th,
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}
              >
                {days} days to polling day
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.pr || '#12B7D4',
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                {formatDate(nextDate)}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: T.tl,
                  textAlign: 'center',
                  lineHeight: 1.6,
                  marginTop: 8,
                }}
              >
                {nextLabel}. This is the main election event currently in focus across the Elections journey.
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <Chip color={T.pr || '#12B7D4'}>Locals</Chip>
                <Chip color={T.pr || '#12B7D4'}>Devolved</Chip>
                <Chip color={T.pr || '#12B7D4'}>Mayors</Chip>
              </div>
            </SurfaceCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              <StatCard T={T} label="Councils voting" value="136" color={T.pr || '#12B7D4'} />
              <StatCard T={T} label="Seats up" value="1,641+" color={T.pr || '#12B7D4'} />
              <StatCard T={T} label="Very contested" value={veryContested.length} color="#E4003B" />
              <StatCard T={T} label="Hard to call" value={hardToCall.length} color="#F97316" />
            </div>

            <SurfaceCard T={T} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Election map</SectionLabel>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Chip color={T.pr || '#12B7D4'}>General</Chip>
                <Chip color={T.pr || '#12B7D4'}>Locals</Chip>
                <Chip color={T.pr || '#12B7D4'}>Scotland</Chip>
                <Chip color={T.pr || '#12B7D4'}>Wales</Chip>
                <Chip color={T.pr || '#12B7D4'}>Mayors</Chip>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: T.tl,
                  textAlign: 'center',
                  lineHeight: 1.6,
                  marginTop: 10,
                }}
              >
                Overview should answer what matters next. Deeper tabs break out the national, local, devolved, mayoral and by-election stories separately.
              </div>
            </SurfaceCard>

            <SectionLabel T={T}>Key contests to watch</SectionLabel>

            {veryContested.slice(0, 6).map((c, i) => (
              <motion.div
                key={i}
                {...TAP}
                onClick={() => openCouncil(c.name)}
                style={{
                  borderRadius: 14,
                  padding: '12px 14px',
                  marginBottom: 8,
                  background: T.c0,
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

                  {c.watchFor ? (
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: T.th,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.watchFor}
                    </div>
                  ) : null}

                  {c.verdict ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: DIFF_COLORS[c.difficulty] || T.tl, marginTop: 4 }}>
                      {c.verdict}
                    </div>
                  ) : null}
                </div>

                <ControlBadge control={c.control} T={T} />
              </motion.div>
            ))}
          </>
        ) : null}

        {tab === 'general' ? (
          <>
            <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>General election frame</SectionLabel>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: T.th,
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}
              >
                Next UK general election
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.tl,
                  textAlign: 'center',
                  lineHeight: 1.6,
                  marginTop: 8,
                }}
              >
                {nextGeneralDate
                  ? `${generalDays} days until the currently stored next general election date · ${formatDate(nextGeneralDate)}`
                  : 'Date not locked yet. Use this space for countdown, context and national electoral framing.'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <Chip color={T.pr || '#12B7D4'}>650 seats</Chip>
                <Chip color={T.pr || '#12B7D4'}>326 for majority</Chip>
                <Chip color={T.pr || '#12B7D4'}>National result</Chip>
              </div>
            </SurfaceCard>

            <SurfaceCard T={T} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Last general election result</SectionLabel>
              <GeneralResultBars T={T} />
            </SurfaceCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              <StatCard T={T} label="Majority line" value="326" color={T.pr || '#12B7D4'} />
              <StatCard T={T} label="Total seats" value="650" color={T.pr || '#12B7D4'} />
              <StatCard T={T} label="Labour seats" value="412" color="#E4003B" />
              <StatCard T={T} label="Conservative seats" value="121" color="#0087DC" />
            </div>

            <SurfaceCard T={T}>
              <SectionLabel T={T}>What this tab is for</SectionLabel>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
                This is the permanent national election home: countdown, last result, majority arithmetic, seat context and future forecast hooks. It is more important than giving by-elections front-rank billing.
              </div>
            </SurfaceCard>
          </>
        ) : null}

        {tab === 'locals' ? (
          <>
            <SurfaceCard T={T} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Local elections overview</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <StatCard T={T} label="Councils" value="136" color={T.pr || '#12B7D4'} />
                <StatCard T={T} label="Seats" value="1,641+" color={T.pr || '#12B7D4'} />
                <StatCard T={T} label="Very hard" value={veryContested.length} color="#E4003B" />
                <StatCard T={T} label="Hard" value={hardToCall.length} color="#F97316" />
              </div>
            </SurfaceCard>

            <SectionLabel T={T}>Regional picture</SectionLabel>

            {regions.map((r, i) => (
              <SurfaceCard key={i} T={T} borderColor={`${r.accentColor || T.pr}28`} style={{ marginBottom: 10 }}>
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

                <div style={{ fontSize: 13, fontWeight: 500, color: T.th, lineHeight: 1.65, marginBottom: 8 }}>
                  {r.story}
                </div>

                {r.watchFor ? (
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
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: T.tl,
                        marginBottom: 3,
                      }}
                    >
                      Watch for
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.th }}>{r.watchFor}</div>
                  </div>
                ) : null}

                {r.councils_list?.length > 0 ? (
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
                ) : null}
              </SurfaceCard>
            ))}

            <SectionLabel T={T}>Council directory</SectionLabel>

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
                  background: T.c0,
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
              {filteredCouncils.length} of {councils.length} councils {search ? '· filtered search' : '· tap for full profile'}
            </div>

            {filteredCouncils.map((c, i) => (
              <motion.div
                key={i}
                {...TAP}
                onClick={() => openCouncil(c.name)}
                style={{
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 6,
                  background: T.c0,
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
                  {c.watchFor ? (
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
                  ) : null}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <ControlBadge control={c.control} T={T} />
                  {c.verdict ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: DIFF_COLORS[c.difficulty] || T.tl, marginTop: 3 }}>
                      {c.verdict}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </>
        ) : null}

        {tab === 'devolved' ? (
          <>
            <SurfaceCard T={T} borderColor="#C4922A28" style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Scotland</SectionLabel>

              <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65 }}>
                First major Scottish Parliament test of the post-2024 political mood. SNP, Labour, Conservatives, Greens and any Reform breakthrough all matter here.
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
            </SurfaceCard>

            <SurfaceCard T={T} borderColor="#3F842828" style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Wales</SectionLabel>

              <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65 }}>
                The expanded Senedd and new proportional system make Wales one of the most interesting electoral laboratories in the cycle.
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
            </SurfaceCard>

            <SectionLabel T={T}>Key devolved battlegrounds</SectionLabel>

            {[
              { title: 'Edinburgh Central', note: 'Symbolic Labour target if the SNP vote softens in the capital.' },
              { title: 'Glasgow Southside', note: 'A seat with leadership symbolism and wider national meaning.' },
              { title: 'Rhondda', note: 'A strong test of whether Reform can translate discontent into Welsh breakthroughs.' },
              { title: 'Cardiff Central', note: 'A more fragmented, urban seat where tactical behaviour matters.' },
            ].map((item, i) => (
              <SurfaceCard key={i} T={T} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.th, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: T.tl, lineHeight: 1.6 }}>{item.note}</div>
              </SurfaceCard>
            ))}
          </>
        ) : null}

        {tab === 'mayors' ? (
          <>
            <SurfaceCard T={T} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Mayoral contests</SectionLabel>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
                Mayoral races are worth separating because they often reward candidate quality, local profile and turnout dynamics more than simple national polling.
              </div>
            </SurfaceCard>

            {MAYORAL_CONTESTS.map((m, i) => (
              <SurfaceCard key={i} T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{m.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.pr || '#12B7D4', marginTop: 3 }}>{m.status}</div>
                  </div>
                  <Chip color={T.pr || '#12B7D4'}>Mayoral</Chip>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, marginTop: 8 }}>
                  {m.note}
                </div>
              </SurfaceCard>
            ))}
          </>
        ) : null}

        {tab === 'byelections' ? (
          <>
            <SurfaceCard T={T} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>By-elections</SectionLabel>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
                Important, but secondary. They matter as signals and local shocks, not as the main structure of the Elections journey.
              </div>
            </SurfaceCard>

            <SectionLabel T={T}>Upcoming by-elections</SectionLabel>

            {upcomingByElections.length > 0 ? (
              upcomingByElections.map((b, i) => (
                <SurfaceCard key={i} T={T} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{b.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.pr || '#12B7D4', marginTop: 3 }}>
                        {b.date || 'Date TBC'}
                      </div>
                    </div>
                    {b.defending ? <ControlBadge control={b.defending} T={T} /> : null}
                  </div>

                  {b.note ? (
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, marginTop: 8 }}>
                      {b.note}
                    </div>
                  ) : null}

                  {(b.majority || b.turnout) ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {b.majority ? <Chip color={T.pr || '#12B7D4'}>Majority {b.majority}</Chip> : null}
                      {b.turnout ? <Chip color={T.pr || '#12B7D4'}>Turnout {b.turnout}</Chip> : null}
                    </div>
                  ) : null}
                </SurfaceCard>
              ))
            ) : (
              <SurfaceCard T={T} style={{ marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: T.tl }}>No upcoming by-elections loaded yet.</div>
              </SurfaceCard>
            )}

            <SectionLabel T={T}>Recent results</SectionLabel>

            {recentByElections.length > 0 ? (
              recentByElections.map((b, i) => (
                <SurfaceCard key={i} T={T} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{b.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 3 }}>
                        {b.date || 'Recent result'}
                      </div>
                    </div>
                    {b.winner ? (
                      <div style={{ fontSize: 13, fontWeight: 800, color: b.winnerColor || T.pr }}>{b.winner}</div>
                    ) : null}
                  </div>

                  {(b.gainLoss || b.majority || b.turnout) ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {b.gainLoss ? <Chip color={b.winnerColor || T.pr}>{b.gainLoss}</Chip> : null}
                      {b.majority ? <Chip color={T.pr || '#12B7D4'}>Majority {b.majority}</Chip> : null}
                      {b.turnout ? <Chip color={T.pr || '#12B7D4'}>Turnout {b.turnout}</Chip> : null}
                    </div>
                  ) : null}

                  {b.note ? (
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, marginTop: 8 }}>
                      {b.note}
                    </div>
                  ) : null}
                </SurfaceCard>
              ))
            ) : (
              <SurfaceCard T={T} style={{ marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: T.tl }}>No recent by-election results loaded yet.</div>
              </SurfaceCard>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}