import { useMemo, useState } from 'react'
import { StickyPills, haptic } from '../components/ui'
import { TrendLine } from '../components/TrendChart'
import { PortraitAvatar } from '../utils/portraits'
import { CardWatermark } from '../components/CardWatermark'
import { PLEDGES, PLEDGE_TOPICS } from '../data/pledges'
import { useSwipeNav } from '../utils/swipeNav'
import { InfoButton } from '../components/InfoGlyph'

const bCard = (T, color, extra = {}) => ({
  borderRadius: 14,
  padding: '14px 16px',
  background: T.c0,
  border: `1px solid ${color ? color + '28' : T.cardBorder || 'rgba(0,0,0,0.08)'}`,
  position: 'relative',
  overflow: 'hidden',
  ...extra,
})

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'pledges', label: 'Pledges' },
  { key: 'trend', label: 'Trend' },
  { key: 'funding', label: 'Funding' },
]

const FUNDING = {
  'Reform UK': {
    summary: 'Almost entirely reliant on one man.',
    body: "Christopher Harborne — a British businessman based in Thailand who made his fortune in aviation fuel — has donated over £5 million, making him by far the party's dominant backer. The remainder comes from property developers and financial sector figures. No trade union money whatsoever.",
    source: 'Electoral Commission · 2023–2024',
  },
  Labour: {
    summary: "Historically trade union money — but that's changing.",
    body: 'Unite and Unison remain the largest single donors. But since 2023, Labour has increasingly attracted tech entrepreneurs, City professionals, and media figures. In 2024, major donations came from financial services and property — a notable shift for a party founded by the unions.',
    source: 'Electoral Commission · 2023–2024',
  },
  Conservative: {
    summary: 'The party of the City — and it shows.',
    body: 'Hedge funds, private equity, and property are the bedrock. Lord Cruddas (City financial services, £3m+) and various asset managers feature prominently. Donation levels have fallen sharply since 2019.',
    source: 'Electoral Commission · 2023–2024',
  },
  Green: {
    summary: 'Small donors and progressive wealth.',
    body: 'The Greens rely heavily on a large base of small individual donations — a genuine grassroots funding model. Some larger donations come from individuals with backgrounds in environmental businesses and technology.',
    source: 'Electoral Commission · 2023–2024',
  },
  'Lib Dem': {
    summary: 'Professional class donors and the anti-Brexit dividend.',
    body: 'The Lib Dems draw heavily from professionals — lawyers, academics, consultants — and benefited enormously from Remain-aligned donors during and after Brexit. Their funding base is genuinely diffuse with no single dominant sector.',
    source: 'Electoral Commission · 2023–2024',
  },
  SNP: {
    summary: 'Membership-funded — and under scrutiny.',
    body: 'The SNP relies primarily on membership fees and small donations. However, finances came under serious scrutiny in 2023–24 following a police investigation into the handling of over £600,000 in ringfenced independence campaign funds.',
    source: 'Electoral Commission · Police Scotland 2023–24',
  },
  'Restore Britain': {
    summary: 'New party — primarily membership-funded.',
    body: "Founded early 2026, Restore Britain's initial funding comes from its paid membership base. No major third-party donors yet declared to the Electoral Commission.",
    source: 'Electoral Commission · 2026',
  },
}

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

function displayDate(poll) {
  return cleanText(poll?.publishedAt) || cleanText(poll?.fieldworkEnd) || cleanText(poll?.date) || 'Date unavailable'
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

function StatBox({ T, label, value, sub, color, wide = false }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '10px 12px',
        background: T.c0,
        border: `1px solid ${color ? color + '28' : T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 74,
        gridColumn: wide ? 'span 2' : undefined,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.tl,
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1,
          color: color || T.th,
          textAlign: 'center',
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.tl,
            marginTop: 5,
            textAlign: 'center',
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  )
}

function ScrollAwayHeader({ T, p, leader, rankLabel }) {
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
        <Badge color={p.color}>{p.abbr}</Badge>
        {rankLabel ? <Badge color={T.tl} subtle>{rankLabel}</Badge> : null}
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
        {p.name}
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
          Party profile · polling · funding
        </div>
        <InfoButton id="party_profile" T={T} size={20} />
      </div>

      {leader ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.tl,
            marginTop: 6,
            opacity: 0.85,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Leader: {leader.name}
        </div>
      ) : null}
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

export default function PartyScreen({ T, idx, nav, parties, leaders, trends, polls }) {
  const p = parties[idx]
  const leader = leaders?.find((l) => l.party === p?.name)
  const [tab, setTab] = useState('overview')
  const [pledgeTopic, setPledgeTopic] = useState('immigration')

  if (!p) return null

  const ranked = [...parties].sort((a, b) => b.pct - a.pct)
  const mainParties = parties.filter((x) => x.name !== 'Other')
  const mainIdx = mainParties.findIndex((x) => x.name === p.name)

  useSwipeNav({
    items: mainParties,
    currentIdx: mainIdx,
    onNavigate: (newIdx) => nav('party', { idx: parties.indexOf(mainParties[newIdx]) }),
  })

  const rank = ranked.findIndex((x) => x.name === p.name)
  const ranks = ['Leading', '2nd', '3rd', '4th', '5th', '6th', '7th']
  const rankLabel = ranks[rank] || ''
  const leaderIdx = leaders?.indexOf(leader)
  const pledges = PLEDGES[p.name]
  const funding = FUNDING[p.name]
  const availableTopics = PLEDGE_TOPICS.filter((t) => pledges?.[t.key]?.length > 0)

  const sorted = [...mainParties].sort((a, b) => b.pct - a.pct)
  const curIdx = sorted.findIndex((x) => x.name === p.name)
  const prev = curIdx > 0 ? sorted[curIdx - 1] : null
  const next = curIdx < sorted.length - 1 ? sorted[curIdx + 1] : null

  const recentPartyPolls = useMemo(() => {
    const key = p.key || p.abbr?.toLowerCase()
    return (polls || [])
      .filter((poll) => safeNumber(poll?.[key]) != null)
      .slice(0, 8)
  }, [polls, p])

  const trendData = useMemo(() => {
    return (trends || [])
      .map((t) => t[p.name])
      .filter((v) => safeNumber(v) != null)
      .map((v) => safeNumber(v))
  }, [trends, p.name])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} p={p} leader={leader} rankLabel={rankLabel} />
      <StickyPillsBar T={T} tab={tab} setTab={setTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {tab === 'overview' ? (
          <>
            <div
              style={{
                ...bCard(T, p.color, { marginBottom: 12, padding: '14px 14px 16px' }),
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.15fr 0.85fr 0.85fr',
                  gap: 8,
                  alignItems: 'stretch',
                }}
              >
                <div
                  onClick={() => {
                    if (!leader) return
                    haptic(8)
                    nav('leader', { lIdx: leaderIdx, from: 'party' })
                  }}
                  style={{
                    borderRadius: 12,
                    padding: '10px 12px',
                    background: T.c0,
                    border: `1px solid ${p.color}28`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: leader ? 'pointer' : 'default',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {leader ? (
                    <>
                      <PortraitAvatar name={leader.name} color={p.color} size={46} radius={23} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: T.tl,
                            marginBottom: 3,
                          }}
                        >
                          Leader
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: T.th,
                            lineHeight: 1.1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {leader.name.split(' ').pop()}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: leader.net >= 0 ? '#02A95B' : '#C8102E',
                            marginTop: 2,
                          }}
                        >
                          Net {leader.net >= 0 ? '+' : ''}
                          {leader.net}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tl }}>No leader data</div>
                  )}
                </div>

                <StatBox
                  T={T}
                  label="Polls"
                  value={
                    <>
                      {p.pct}
                      <span style={{ fontSize: '0.42em', fontWeight: 600, verticalAlign: 'super' }}>%</span>
                    </>
                  }
                  color={p.color}
                />

                <StatBox
                  T={T}
                  label="Seats"
                  value={p.seats || 0}
                  color={p.color}
                />

                <StatBox
                  T={T}
                  label="Change"
                  value={`${p.change > 0 ? '+' : p.change < 0 ? '-' : '—'}${p.change === 0 ? 'pt' : `${Math.abs(p.change)}pt`}`}
                  color={p.change > 0 ? '#02A95B' : p.change < 0 ? '#C8102E' : T.tl}
                />

                <StatBox
                  T={T}
                  label="Rank"
                  value={rankLabel || '—'}
                  color={T.th}
                />

                <StatBox
                  T={T}
                  label="MRP"
                  value={`${p.seats || 0}/650`}
                  color={p.color}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: 18,
                  marginTop: 12,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: prev ? prev.color : 'transparent',
                    cursor: prev ? 'pointer' : 'default',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={() => {
                    if (!prev) return
                    haptic(6)
                    nav('party', { idx: parties.indexOf(prev) })
                  }}
                >
                  {prev ? `‹ ${prev.abbr}` : '•'}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: T.tl,
                  }}
                >
                  National position
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: next ? next.color : 'transparent',
                    cursor: next ? 'pointer' : 'default',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={() => {
                    if (!next) return
                    haptic(6)
                    nav('party', { idx: parties.indexOf(next) })
                  }}
                >
                  {next ? `${next.abbr} ›` : '•'}
                </div>
              </div>

              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: T.c1,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {ranked
                  .filter((x) => x.seats)
                  .map((x, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${Math.round(((x.seats || 0) / 650) * 100)}%`,
                        height: '100%',
                        background: x.color,
                        opacity: x.name === p.name ? 1 : 0.45,
                      }}
                    />
                  ))}
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.tl,
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                MRP projection · <span style={{ color: p.color, fontWeight: 800 }}>{p.seats || 0} seats</span>
              </div>
            </div>

            <SectionLabel T={T}>Recent polls</SectionLabel>

            {recentPartyPolls.map((poll, i) => {
              const key = p.key || p.abbr?.toLowerCase()
              const val = poll[key]
              return (
                <div
                  key={i}
                  style={{
                    ...bCard(T, null, {
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }),
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: p.color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.th }}>
                      {cleanText(poll.pollster) || 'Unknown pollster'}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 2 }}>
                      {displayDate(poll)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: p.color,
                      background: `${p.color}18`,
                      borderRadius: 999,
                      padding: '4px 14px',
                      flexShrink: 0,
                    }}
                  >
                    {val}%
                  </div>
                </div>
              )
            })}
          </>
        ) : null}

        {tab === 'pledges' ? (
          pledges ? (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {availableTopics.map((t, i) => (
                  <div
                    key={i}
                    onClick={() => setPledgeTopic(t.key)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: pledgeTopic === t.key ? p.color : T.c0,
                      border: `1px solid ${pledgeTopic === t.key ? 'transparent' : p.color + '33'}`,
                      fontSize: 14,
                      fontWeight: 700,
                      color: pledgeTopic === t.key ? '#fff' : p.color,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background 0.18s',
                    }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>

              {(pledges[pledgeTopic] || []).map((item, i) => (
                <div key={i} style={{ ...bCard(T, p.color, { marginBottom: 12 }) }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: p.color,
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.th, lineHeight: 1.65 }}>
                        {item.pledge}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 6 }}>
                        {item.source}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                color: T.tl,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Manifesto data not yet available for {p.name}
            </div>
          )
        ) : null}

        {tab === 'trend' ? (
          <>
            <div style={{ ...bCard(T, p.color, { marginBottom: 16, textAlign: 'center' }) }}>
              <SectionLabel T={T}>12-month polling trend</SectionLabel>
              <TrendLine data={trendData} color={p.color} width={280} height={100} />
            </div>

            <div style={{ ...bCard(T, null) }}>
              <SectionLabel T={T}>Monthly data</SectionLabel>

              {(trends || [])
                .slice()
                .reverse()
                .map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: i < trends.length - 1 ? `0.5px solid ${T.c1}` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.tm }}>{t.month}</div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: p.color,
                      }}
                    >
                      {t[p.name] || '—'}%
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : null}

        {tab === 'funding' && funding ? (
          <div style={{ ...bCard(T, p.color, { marginBottom: 16 }) }}>
            <CardWatermark type="betting" color={p.color} size={90} />
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: p.color,
                marginBottom: 12,
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
              }}
            >
              {funding.summary}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: T.tm,
                lineHeight: 1.75,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {funding.body}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.tl,
                marginTop: 12,
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
              }}
            >
              {funding.source}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}