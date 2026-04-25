import React, { useEffect, useState, useMemo } from 'react'
import { StickyPills, haptic } from '../components/ui'
import SharedTrendChart, { buildDisplayTrendRows, makeTrendPartyKeys } from '../components/charts/SharedTrendChart'
import { PortraitAvatar } from '../utils/portraits'
import { POLICY_AREAS, POLICY_RECORDS } from '../data/policy/policyRecords'
import { POLICY_AREA_LABELS } from '../data/policy/policyTaxonomy'
import { getAvailablePolicyAreasForParty, getPartyPolicies } from '../data/policy/policySelectors'
import { getStanceLabel } from '../data/policy/stanceUtils'
import { useSwipeNav } from '../utils/swipeNav'
import CompareLauncherSheet from '../components/CompareLauncherSheet'

const bCard = (T, color, extra = {}) => ({
  borderRadius: 14,
  padding: '14px 16px',
  // Keep this fully opaque so the ambient background cannot bleed into cards.
  background: T.sf,
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

const COMPARE_POLICY_AREAS = new Set(['immigration', 'economy', 'nhs', 'climate'])

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

function StickyPillsBar({ T, tab, setTab }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8,
        background: T.sf,
        padding: '10px 16px 12px',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />
    </div>
  )
}

function PolicyRecordCard({ T, p, record }) {
  const stanceLabel = record.stanceLabel || getStanceLabel(record.stanceScore)
  const details = Array.isArray(record.details) ? record.details.filter(Boolean) : []
  const sources = Array.isArray(record.sources) ? record.sources.filter(Boolean) : []
  const title = cleanText(record.title || record.topic || record.area)
  const summary = cleanText(record.summary)
  const sourceTypeLabel = (type) => cleanText(type).replace(/_/g, ' ')

  return (
    <div style={{ ...bCard(T, p.color, { marginBottom: 12 }) }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
          marginBottom: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.th, lineHeight: 1.3 }}>
            {title}
          </div>
          {summary && summary !== title ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: T.tm, marginTop: 5, lineHeight: 1.45 }}>
              {summary}
            </div>
          ) : null}
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: p.color,
            background: `${p.color}12`,
            border: `1px solid ${p.color}26`,
            borderRadius: 999,
            padding: '5px 8px',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {stanceLabel}
        </div>
      </div>

      {details.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, position: 'relative', zIndex: 1 }}>
          {details.map((detail) => (
            <div key={detail} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: p.color,
                  flexShrink: 0,
                  marginTop: 7,
                  opacity: 0.85,
                }}
              />
              <div style={{ fontSize: 13.5, fontWeight: 500, color: T.tm, lineHeight: 1.55 }}>
                {detail}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {sources.length ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {sources.map((source) => {
            const label = source.title || source.label || 'Policy source'
            const content = (
              <>
                {label}
                {source.type ? <span style={{ color: T.tl, fontWeight: 700 }}> · {sourceTypeLabel(source.type)}</span> : null}
              </>
            )

            if (source.url) {
              return (
                <a
                  key={`${record.id}-${label}`}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: p.color,
                    textDecoration: 'none',
                  }}
                >
                  {content} →
                </a>
              )
            }

            return (
              <div key={`${record.id}-${label}`} style={{ fontSize: 12, fontWeight: 700, color: T.tl }}>
                {content}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function PolicyUnavailable({ T, party, area }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '26px 18px',
        color: T.tl,
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.55,
        borderRadius: 14,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      No structured policy records available yet for {party}
      {area ? ` on ${POLICY_AREA_LABELS[area] || area}` : ''}.
    </div>
  )
}

function normaliseInitialTab(tab) {
  if (tab === 'policy') return 'pledges'
  return TABS.some((item) => item.key === tab) ? tab : 'overview'
}

export default function PartyScreen({
  T,
  idx,
  nav,
  parties,
  leaders,
  trends,
  polls,
  pollContext,
  policyRecords = POLICY_RECORDS,
  openTab,
  selectedPolicyArea: initialPolicyArea,
  policyArea,
  updateCurrentParams,
}) {
  const p = parties[idx]
  const leader = leaders?.find((l) => l.party === p?.name)
  const incomingPolicyArea = initialPolicyArea || policyArea || 'immigration'
  const [tab, setTab] = useState(() => normaliseInitialTab(openTab))
  const [pledgeTopic, setPledgeTopic] = useState(() => incomingPolicyArea)
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    setTab(normaliseInitialTab(openTab))
  }, [openTab, idx])

  useEffect(() => {
    if (initialPolicyArea || policyArea) setPledgeTopic(initialPolicyArea || policyArea)
  }, [initialPolicyArea, policyArea, idx])

  if (!p) return null

  const ranked = [...parties].sort((a, b) => b.pct - a.pct)
  const mainParties = parties.filter((x) => x.name !== 'Other')
  const mainIdx = mainParties.findIndex((x) => x.name === p.name)

  useSwipeNav({
    items: mainParties,
    currentIdx: mainIdx,
    onNavigate: (newIdx) =>
      nav('party', {
        idx: parties.indexOf(mainParties[newIdx]),
        openTab: tab,
        selectedPolicyArea: pledgeTopic,
      }),
  })

  const rank = ranked.findIndex((x) => x.name === p.name)
  const ranks = ['Leading', '2nd', '3rd', '4th', '5th', '6th', '7th']
  const rankLabel = ranks[rank] || ''
  const leaderIdx = leaders?.indexOf(leader)
  const funding = FUNDING[p.name]
  const availablePolicyAreas = getAvailablePolicyAreasForParty(p.name, policyRecords)
  const selectedPolicyArea = availablePolicyAreas.includes(pledgeTopic)
    ? pledgeTopic
    : availablePolicyAreas[0] || POLICY_AREAS[0]
  const selectedPolicyRecords = getPartyPolicies(p.name, selectedPolicyArea, policyRecords)
  const compareContextArea = tab === 'pledges' && COMPARE_POLICY_AREAS.has(selectedPolicyArea) ? selectedPolicyArea : 'overview'
  const openCompareWith = ({ baseParty, opponent, contextArea }) => {
    setCompareOpen(false)
    updateCurrentParams?.({
      openTab: tab,
      selectedPolicyArea: selectedPolicyArea,
      policyArea: selectedPolicyArea,
    })
    nav('compare', {
      leftParty: baseParty.name,
      rightParty: opponent.name,
      fromScreen: 'party',
      fromPartyIdx: idx,
      returnTab: tab,
      returnPolicyArea: tab === 'pledges' ? selectedPolicyArea : undefined,
      compareContext: tab,
      policyArea: contextArea,
      tab: contextArea,
    })
  }

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

  const displayTrendRows = useMemo(() => buildDisplayTrendRows(trends, pollContext), [trends, pollContext])
  const partyTrendKeys = useMemo(() => makeTrendPartyKeys([p.name]), [p.name])
  const rawPollRows = useMemo(() => pollContext?.allPollsSorted || polls || [], [pollContext, polls])
  const partyTrendMeta = useMemo(() => {
    const latest = displayTrendRows[displayTrendRows.length - 1]
    return [
      latest?.fullDate ? `Latest point: ${latest.fullDate}` : null,
      displayTrendRows.length ? `${displayTrendRows.length} trend points` : null,
      rawPollRows.length ? `${rawPollRows.length} polls in source` : null,
    ].filter(Boolean).join(' · ')
  }, [displayTrendRows, rawPollRows])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <StickyPillsBar T={T} tab={tab} setTab={setTab} />

      <div
        style={{
          height: 1,
          background: T.cardBorder || 'rgba(0,0,0,0.10)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
          flexShrink: 0,
        }}
      />
      <div style={{ padding: '12px 16px 40px' }}>
        <button
          onClick={() => {
            haptic(6)
            setCompareOpen(true)
          }}
          style={{
            width: '100%',
            border: `1px solid ${p.color}30`,
            background: `${p.color}10`,
            color: p.color,
            borderRadius: 999,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 850,
            letterSpacing: '0.01em',
            marginBottom: 12,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Compare with…
        </button>

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

                <StatBox T={T} label="Seats" value={p.seats || 0} color={p.color} />

                <StatBox
                  T={T}
                  label="Change"
                  value={`${p.change > 0 ? '+' : p.change < 0 ? '-' : '—'}${p.change === 0 ? 'pt' : `${Math.abs(p.change)}pt`}`}
                  color={p.change > 0 ? '#02A95B' : p.change < 0 ? '#C8102E' : T.tl}
                />

                <StatBox T={T} label="Rank" value={rankLabel || '—'} color={T.th} />

                <StatBox T={T} label="MRP" value={`${p.seats || 0}/650`} color={p.color} />
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
          <>
            {availablePolicyAreas.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {availablePolicyAreas.map((area) => (
                  <div
                    key={area}
                    onClick={() => {
                      haptic(4)
                      setPledgeTopic(area)
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: selectedPolicyArea === area ? p.color : T.c0,
                      border: `1px solid ${selectedPolicyArea === area ? 'transparent' : p.color + '33'}`,
                      fontSize: 14,
                      fontWeight: 700,
                      color: selectedPolicyArea === area ? '#fff' : p.color,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background 0.18s',
                    }}
                  >
                    {POLICY_AREA_LABELS[area] || area}
                  </div>
                ))}
              </div>
            ) : null}

            {selectedPolicyRecords.length ? (
              selectedPolicyRecords.map((record) => (
                <PolicyRecordCard key={record.id} T={T} p={p} record={record} />
              ))
            ) : (
              <PolicyUnavailable T={T} party={p.name} area={availablePolicyAreas.length ? selectedPolicyArea : null} />
            )}
          </>
        ) : null}

        {tab === 'trend' ? (
          <>
            <div style={{ ...bCard(T, p.color, { marginBottom: 16, textAlign: 'center', padding: '14px 10px 12px' }) }}>
              <SectionLabel T={T}>{p.name} polling trend</SectionLabel>
              <SharedTrendChart
                trends={displayTrendRows}
                rawPolls={rawPollRows}
                partyKeys={partyTrendKeys}
                T={T}
                metaText={partyTrendMeta}
              />
            </div>

            <div style={{ ...bCard(T, null) }}>
              <SectionLabel T={T}>Monthly data</SectionLabel>

              {displayTrendRows
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
                      borderBottom: i < displayTrendRows.length - 1 ? `0.5px solid ${T.c1}` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.tm }}>{t.fullDate || t.month}</div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: p.color,
                      }}
                    >
                      {safeNumber(t[partyTrendKeys[0]?.key]) != null ? `${safeNumber(t[partyTrendKeys[0]?.key])}%` : '—'}
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : null}

        {tab === 'funding' && funding ? (
          <div style={{ ...bCard(T, p.color, { marginBottom: 16 }) }}>
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

      <CompareLauncherSheet
        T={T}
        open={compareOpen}
        baseParty={p}
        parties={parties}
        contextArea={compareContextArea}
        fromScreen="party"
        onClose={() => setCompareOpen(false)}
        onLaunch={openCompareWith}
      />
    </div>
  )
}
