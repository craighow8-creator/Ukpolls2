import { useState } from 'react'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import { TrendLine } from '../components/TrendChart'
import { PortraitAvatar } from '../utils/portraits'
import { CardWatermark } from '../components/CardWatermark'
import { PLEDGES, PLEDGE_TOPICS } from '../data/pledges'
import { useSwipeNav } from '../utils/swipeNav'

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

export default function PartyScreen({ T, idx, from, nav, goBack, parties, leaders, trends, polls }) {
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
  const lIdx = leaders?.indexOf(leader)
  const pledges = PLEDGES[p.name]
  const funding = FUNDING[p.name]
  const availableTopics = PLEDGE_TOPICS.filter((t) => pledges?.[t.key]?.length > 0)

  const sorted = [...mainParties].sort((a, b) => b.pct - a.pct)
  const curIdx = sorted.findIndex((x) => x.name === p.name)
  const prev = curIdx > 0 ? sorted[curIdx - 1] : null
  const next = curIdx < sorted.length - 1 ? sorted[curIdx + 1] : null

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
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: -0.8,
                color: T.th,
                lineHeight: 1,
              }}
            >
              {p.name}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
              Party profile · polling · funding
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.82fr 0.82fr 0.82fr',
            gap: 8,
            alignItems: 'stretch',
            marginBottom: 6,
          }}
        >
          <div
            onClick={() => {
              if (!leader) return
              haptic(8)
              nav('leader', { lIdx, from: 'party' })
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

          <div
            style={{
              borderRadius: 12,
              padding: '10px 12px',
              background: T.c0,
              border: `1px solid ${p.color}28`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
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
              Polls
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: p.color,
              }}
            >
              {p.pct}
              <span style={{ fontSize: '0.42em', fontWeight: 600, verticalAlign: 'super' }}>%</span>
            </div>
          </div>

          <div
            style={{
              borderRadius: 12,
              padding: '10px 12px',
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
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
              Change
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1,
                color: p.change > 0 ? '#02A95B' : p.change < 0 ? '#C8102E' : T.tl,
              }}
            >
              {p.change > 0 ? '+' : p.change < 0 ? '-' : '—'}
              {p.change === 0 ? 'pt' : `${Math.abs(p.change)}pt`}
            </div>
          </div>

          <div
            style={{
              borderRadius: 12,
              padding: '10px 12px',
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
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
              Seats
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1,
                color: p.color,
              }}
            >
              {p.seats || 0}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 16,
            marginBottom: 4,
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
            {ranks[rank] || ''} · National polls
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
            marginBottom: 4,
          }}
        >
          {ranked.filter((x) => x.seats).map((x, i) => (
            <div
              key={i}
              style={{
                width: `${Math.round((x.seats / 650) * 100)}%`,
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
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          MRP projection · <span style={{ color: p.color, fontWeight: 800 }}>{p.seats || 0} seats</span>
        </div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'overview' && (
          <>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: T.tl,
                marginBottom: 10,
                textAlign: 'center',
              }}
            >
              Recent polls
            </div>

            {(polls || [])
              .slice(0, 8)
              .map((poll, i) => {
                const val = poll[p.key || p.abbr?.toLowerCase()]
                if (!val) return null

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
                    <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.th }}>
                      {poll.pollster}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>{poll.date}</div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: p.color,
                        background: `${p.color}18`,
                        borderRadius: 999,
                        padding: '4px 14px',
                      }}
                    >
                      {val}%
                    </div>
                  </div>
                )
              })
              .filter(Boolean)}

            <div
              onClick={() => nav('ai', { partyName: p.name, partyColor: p.color })}
              style={{
                background: `linear-gradient(135deg,${T.bg1}ee,${T.bg2}cc)`,
                borderRadius: 14,
                padding: 24,
                cursor: 'pointer',
                marginTop: 16,
                WebkitTapHighlightColor: 'transparent',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.tl,
                  marginBottom: 8,
                }}
              >
                AI Briefing
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.th }}>
                Why do people vote {p.name}? →
              </div>
            </div>
          </>
        )}

        {tab === 'pledges' && (
          <>
            {pledges ? (
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
            )}
          </>
        )}

        {tab === 'trend' && (
          <>
            <div style={{ ...bCard(T, p.color, { marginBottom: 16, textAlign: 'center' }) }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.tl,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                12-month polling trend
              </div>
              <TrendLine
                data={(trends || []).map((t) => t[p.name]).filter(Boolean)}
                color={p.color}
                width={280}
                height={100}
              />
            </div>

            <div style={{ ...bCard(T, null) }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.tl,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                Monthly data
              </div>
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
        )}

        {tab === 'funding' && funding && (
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
        )}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}