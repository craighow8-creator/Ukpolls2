import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const FUNDING = {
  'Reform UK': {
    summary: 'Almost entirely reliant on one man.',
    body: 'Christopher Harborne — a British businessman based in Thailand who made his fortune in aviation fuel — has donated over £5 million, making him by far the dominant backer. No trade union money whatsoever.',
    source: 'Electoral Commission · 2023–2024',
  },
  Labour: {
    summary: "Historically trade union money — but that's changing.",
    body: 'Unite and Unison remain the largest single donors. But since 2023, Labour has increasingly attracted tech entrepreneurs, City professionals, and media figures. In 2024, major donations came from financial services and property.',
    source: 'Electoral Commission · 2023–2024',
  },
  Conservative: {
    summary: 'The party of the City — and it shows.',
    body: 'Hedge funds, private equity, and property are the bedrock. Lord Cruddas (City financial services, £3m+) and various asset managers feature prominently. Donation levels have fallen sharply since 2019.',
    source: 'Electoral Commission · 2023–2024',
  },
  Green: {
    summary: 'Small donors and progressive wealth.',
    body: 'The Greens rely heavily on a large base of small individual donations — a genuine grassroots funding model. No significant corporate or union backing.',
    source: 'Electoral Commission · 2023–2024',
  },
  'Lib Dem': {
    summary: 'Professional class donors and the anti-Brexit dividend.',
    body: 'The Lib Dems draw heavily from professionals — lawyers, academics, consultants — and benefited enormously from Remain-aligned donors during and after Brexit.',
    source: 'Electoral Commission · 2023–2024',
  },
  SNP: {
    summary: 'Membership-funded — and under scrutiny.',
    body: 'The SNP relies primarily on membership fees and small donations. Finances came under serious scrutiny in 2023–24 following a police investigation into the handling of over £600,000 in ringfenced independence campaign funds.',
    source: 'Electoral Commission · Police Scotland 2023–24',
  },
  'Restore Britain': {
    summary: 'New party — primarily membership-funded.',
    body: "Founded early 2026, Restore Britain's initial funding comes from its paid membership base. No major third-party donors yet declared to the Electoral Commission.",
    source: 'Electoral Commission · 2026',
  },
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'polling', label: 'Polling' },
  { key: 'funding', label: 'Funding' },
  { key: 'policies', label: 'Policies' },
]

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/Â·/g, '·').replace(/\s+/g, ' ').trim()
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const raw = String(value).replace(/%/g, '').replace(/,/g, '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
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

function StatPill({ label, value, color, T }) {
  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderRadius: 12,
        padding: '9px 12px',
        flex: 1,
        border: `1px solid ${color}20`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginBottom: 3, textAlign: 'center' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color }}>{value}</div>
    </div>
  )
}

function ScrollAwayHeader({ T, partyCount, leaderName }) {
  return (
    <div style={{ padding: '8px 16px 10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <Badge color={T.pr}>{partyCount} parties</Badge>
        {leaderName ? <Badge color={T.tl} subtle>Leading: {leaderName}</Badge> : null}
      </div>

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
        Parties
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
          Profiles · polling · funding · policies
        </div>
        <InfoButton id="parties_overview" T={T} size={20} />
      </div>
    </div>
  )
}

function StickyPillsBar({ T, activeTab, setActiveTab }) {
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
      <StickyPills pills={TABS} active={activeTab} onSelect={setActiveTab} T={T} />
    </div>
  )
}

export default function PartiesScreen({ T, nav, parties, polls, leaders }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedFunding, setExpanded] = useState(null)

  const mainParties = useMemo(
    () => (parties || []).filter((p) => p.name !== 'Other').sort((a, b) => (b.pct || 0) - (a.pct || 0)),
    [parties],
  )

  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const card = isDark ? 'rgba(12,20,30,0.97)' : '#ffffff'
  const border = T.cardBorder || 'rgba(0,0,0,0.08)'

  const leaderParty = mainParties[0]?.name || null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} partyCount={mainParties.length} leaderName={leaderParty} />
      <StickyPillsBar T={T} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {activeTab === 'overview' ? (
          <>
            <SectionLabel T={T}>Party directory</SectionLabel>

            {mainParties.map((p, i) => {
              const leader = leaders?.find((l) => l.party === p.name)
              const pIdx = (parties || []).indexOf(p)

              return (
                <motion.div
                  key={i}
                  {...TAP}
                  onClick={() => {
                    haptic(8)
                    nav('party', { idx: pIdx })
                  }}
                  style={{
                    borderRadius: 16,
                    marginBottom: 10,
                    overflow: 'hidden',
                    background: card,
                    border: `1px solid ${p.color}28`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ height: 4, background: p.color }} />

                  <div style={{ padding: '14px 16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, marginTop: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: T.th,
                            letterSpacing: -0.3,
                            lineHeight: 1.1,
                          }}
                        >
                          {p.name}
                        </div>
                        {leader ? (
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 3 }}>
                            Leader: {leader.name}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 40,
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                            color: p.color,
                          }}
                        >
                          {p.pct}%
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>Poll avg</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <StatPill label="MRP Seats" value={p.seats || '—'} color={p.color} T={T} />
                      <StatPill
                        label="Change"
                        value={`${p.change > 0 ? '+' : ''}${p.change === 0 ? '—' : p.change}pt`}
                        color={p.change > 0 ? '#02A95B' : p.change < 0 ? '#C8102E' : T.tl}
                        T={T}
                      />
                      {leader ? (
                        <StatPill
                          label="Leader net"
                          value={`${leader.net >= 0 ? '+' : ''}${leader.net}`}
                          color={leader.net >= 0 ? '#02A95B' : '#C8102E'}
                          T={T}
                        />
                      ) : (
                        <StatPill label="Leader net" value="—" color={T.tl} T={T} />
                      )}
                    </div>

                    <div style={{ height: 6, borderRadius: 999, background: border, overflow: 'hidden', marginBottom: 5 }}>
                      <div
                        style={{
                          width: `${Math.round(((p.seats || 0) / 650) * 100)}%`,
                          height: '100%',
                          background: p.color,
                          borderRadius: 999,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>{p.seats || 0} / 650 seats</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>Open profile →</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </>
        ) : null}

        {activeTab === 'polling' ? (
          <>
            <SectionLabel T={T}>Polling order</SectionLabel>

            <div
              style={{
                borderRadius: 14,
                padding: '12px 14px',
                marginBottom: 12,
                background: card,
                border: `1px solid ${border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge color={T.pr}>National average</Badge>
                <Badge color={T.tl} subtle>Ranked by share</Badge>
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
                Quick view of the current party order, poll share, and short-term movement.
              </div>
            </div>

            {[...mainParties]
              .sort((a, b) => (b.pct || 0) - (a.pct || 0))
              .map((p, i) => {
                const pIdx = (parties || []).indexOf(p)
                const maxPct = mainParties.reduce((m, x) => Math.max(m, x.pct || 0), 0)

                return (
                  <motion.div
                    key={i}
                    {...TAP}
                    onClick={() => {
                      haptic(8)
                      nav('party', { idx: pIdx })
                    }}
                    style={{
                      borderRadius: 12,
                      padding: '14px 16px',
                      marginBottom: 8,
                      background: card,
                      border: `1px solid ${p.color}22`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: T.tl, width: 20, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.th }}>{p.name}</div>
                        <div
                          style={{
                            height: 6,
                            borderRadius: 999,
                            background: 'rgba(0,0,0,0.07)',
                            marginTop: 6,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${((p.pct || 0) / Math.max(maxPct, 1)) * 100}%`,
                              height: '100%',
                              background: p.color,
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: p.color }}>{p.pct}%</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: p.change > 0 ? '#02A95B' : p.change < 0 ? '#C8102E' : T.tl,
                          }}
                        >
                          {p.change > 0 ? '▲' : p.change < 0 ? '▼' : '—'}
                          {p.change !== 0 ? ` ${Math.abs(p.change || 0)}pt` : ''}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
          </>
        ) : null}

        {activeTab === 'funding' ? (
          <>
            <SectionLabel T={T}>Funding profiles</SectionLabel>

            {mainParties.map((p, i) => {
              const f = FUNDING[p.name]
              if (!f) return null

              const isExpanded = expandedFunding === p.name
              return (
                <motion.div
                  key={i}
                  {...TAP}
                  onClick={() => setExpanded(isExpanded ? null : p.name)}
                  style={{
                    borderRadius: 14,
                    marginBottom: 8,
                    overflow: 'hidden',
                    background: card,
                    border: `1px solid ${p.color}28`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ height: 3, background: p.color }} />
                  <div style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.th }}>{p.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: p.color, marginTop: 2 }}>{f.summary}</div>
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          color: T.tl,
                          flexShrink: 0,
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      >
                        ›
                      </div>
                    </div>

                    {isExpanded ? (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${border}` }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, marginBottom: 8 }}>
                          {f.body}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>{f.source}</div>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )
            })}
          </>
        ) : null}

        {activeTab === 'policies' ? (
          <>
            <SectionLabel T={T}>Policy snapshots</SectionLabel>

            {mainParties.map((p, i) => {
              const leader = leaders?.find((l) => l.party === p.name)
              const pIdx = (parties || []).indexOf(p)
              const policyCards = ['immigration', 'economy', 'nhs', 'climate']
                .map((topic) => ({ topic, text: leader?.[topic] }))
                .filter((x) => x.text)

              if (!policyCards.length) return null

              return (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.th }}>{p.name}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                    {policyCards.map(({ topic, text }) => (
                      <motion.div
                        key={topic}
                        {...TAP}
                        onClick={() => {
                          haptic(8)
                          nav('party', { idx: pIdx })
                        }}
                        style={{
                          borderRadius: 12,
                          padding: '14px 14px',
                          background: card,
                          border: `1px solid ${p.color}22`,
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            letterSpacing: '0.10em',
                            textTransform: 'uppercase',
                            color: p.color,
                            marginBottom: 8,
                          }}
                        >
                          {topic}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: T.th,
                            lineHeight: 1.55,
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {cleanText(text)}
                        </div>

                        <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginTop: 10 }}>
                          Full profile →
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        ) : null}
      </div>
    </div>
  )
}