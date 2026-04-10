import React, { useState, useMemo } from 'react'
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

function formatPts(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const rounded = Math.round(Number(value) * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
}

function formatSignedPts(value) {
  const formatted = formatPts(value)
  if (formatted === '—') return formatted
  return Number(value) > 0 ? `+${formatted}` : formatted
}

function limitWords(text, maxWords = 25) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return text
  return `${words.slice(0, maxWords).join(' ')}…`
}

function composeNarrative(clauses) {
  if (!clauses.length) return ''

  if (clauses.length === 1) {
    return limitWords(`${clauses[0].text}.`)
  }

  const [a, b] = clauses

  if (a.parties.length && b.parties.length) {
    return limitWords(`${a.text}, while ${b.text}.`)
  }

  if (!b.parties.length) {
    return limitWords(`${a.text}, with ${b.text}.`)
  }

  return limitWords(`${a.text}. ${b.text}.`)
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

function StickyPillsBar({ T, activeTab, setActiveTab }) {
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
      <StickyPills pills={TABS} active={activeTab} onSelect={setActiveTab} T={T} />
    </div>
  )
}

function PartyLandscapeBriefing({ T, insight, card, border }) {
  if (!insight) return null

  const primaryItems = insight.items.slice(0, 2)
  const secondaryItems = insight.items.slice(2)
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 7px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }

  const renderInsightCard = (item, tone = 'primary') => {
    const isPrimary = tone === 'primary'
    const dark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
    return (
      <div
        key={item.label}
        style={{
          borderRadius: 14,
          padding: isPrimary ? '11px 11px 10px' : '9px 10px 9px',
          background: dark
            ? isPrimary
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(255,255,255,0.03)'
            : isPrimary
              ? 'rgba(0,0,0,0.035)'
              : 'rgba(0,0,0,0.02)',
          border: `1px solid ${isPrimary ? `${item.color}20` : `${item.color}14`}`,
          minHeight: isPrimary ? 96 : 88,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: T.tl,
            textAlign: 'center',
            marginBottom: 5,
          }}
        >
          {item.label}
        </div>
        <div
          style={{
            fontSize: isPrimary ? 16 : 14,
            fontWeight: 800,
            color: T.th,
            textAlign: 'center',
            lineHeight: 1.18,
          }}
        >
          {item.value}
        </div>
        {item.meta ? (
          <div
            style={{
              fontSize: isPrimary ? 11.5 : 11,
              fontWeight: 600,
              color: isPrimary ? item.color : T.tl,
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 1.28,
              opacity: isPrimary ? 0.95 : 0.82,
            }}
          >
            {item.meta}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 18,
        padding: '13px 14px 11px',
        marginBottom: 6,
        background: card,
        border: `1px solid ${border}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
        <span style={{ ...badgeStyle, color: T.pr, background: `${T.pr}0d`, border: `1px solid ${T.pr}18` }}>
          Party landscape briefing
        </span>
        <span style={{ ...badgeStyle, color: T.tl, background: 'rgba(127,127,127,0.05)', border: `1px solid ${border}` }}>
          What matters now
        </span>
      </div>

      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: T.th,
          lineHeight: 1.18,
          textAlign: 'center',
          letterSpacing: '-0.02em',
          marginBottom: 7,
          maxWidth: 430,
          marginInline: 'auto',
        }}
      >
        {insight.headline}
      </div>

      <div
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: T.th,
          lineHeight: 1.5,
          textAlign: 'center',
          marginBottom: 9,
          maxWidth: 450,
          marginInline: 'auto',
          opacity: 0.92,
        }}
      >
        {insight.body}
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {primaryItems.map((item) => renderInsightCard(item, 'primary'))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {secondaryItems.map((item) => renderInsightCard(item, 'secondary'))}
        </div>
      </div>
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

  const leadersByParty = useMemo(
    () => Object.fromEntries((leaders || []).map((leader) => [leader.party, leader])),
    [leaders],
  )

  const briefingInsight = useMemo(() => {
    if (!mainParties.length) return null

    const top = mainParties[0]
    const second = mainParties[1]
    const third = mainParties[2]
    const fourth = mainParties[3]
    const topPct = formatPts(top?.pct || 0)
    const positiveMovers = mainParties.filter((p) => (p.change || 0) > 0.4)
    const strongestMover = positiveMovers.length
      ? [...positiveMovers].sort((a, b) => (b.change || 0) - (a.change || 0))[0]
      : [...mainParties].sort((a, b) => Math.abs(b.change || 0) - Math.abs(a.change || 0))[0]

    // Derived signals: order, movement, and leader ratings. This stays deliberately
    // transparent so the briefing remains explainable and can later absorb richer
    // poll trend inputs without changing the output contract.
    const partySignals = mainParties.map((p, index) => {
      const leader = leadersByParty[p.name]
      const change = Number(p.change || 0)
      const leaderNet = leader && typeof leader.net === 'number' ? Number(leader.net) : null
      return {
        p,
        leader,
        index,
        change,
        leaderNet,
        rising: change >= 1,
        softening: change <= -1,
        flat: Math.abs(change) <= 0.5,
        isMinorChallenger: index >= 2,
        exposureScore: Math.max(0, -change) + Math.max(0, -(leaderNet ?? 0) / 8),
      }
    })
    const underPressure = [...partySignals].sort((a, b) => b.exposureScore - a.exposureScore)[0]

    const leadMargin = second ? +(formatPts((top.pct || 0) - (second.pct || 0))) : null
    const topThreeSpread = third ? +(formatPts((top.pct || 0) - (third.pct || 0))) : null
    const secondThirdGap = third && second ? +(formatPts((second.pct || 0) - (third.pct || 0))) : null
    const thirdFourthGap = fourth && third ? +(formatPts((third.pct || 0) - (fourth.pct || 0))) : null
    const strongestMoverPts = strongestMover ? formatPts(strongestMover.change || 0) : null
    const underPressurePts = underPressure?.p ? formatPts(underPressure.p.change || 0) : null
    const flatParty = partySignals.find((signal) => signal.flat && signal.index >= 2)
    const smallerPartyRising = partySignals.find((signal) => signal.isMinorChallenger && signal.rising)
    const secondRising = second ? (second.change || 0) >= 1 : false
    const leaderSoftening = (top.change || 0) <= -1
    const leaderPullingAway = leadMargin != null && leadMargin >= 5 && (top.change || 0) >= 0.8
    const topTight = leadMargin != null && leadMargin <= 2
    const topTightening = leadMargin != null && leadMargin <= 4 && secondRising
    const secondThirdBunching = secondThirdGap != null && secondThirdGap <= 2
    const middleBunching = thirdFourthGap != null && thirdFourthGap <= 2

    // Interpretation rules choose between a small set of political patterns rather than
    // treating every spread as simply "stable" or "fragmented".
    let raceLine = `${top.name} still leads`
    if (topTight) {
      raceLine = `${top.name} and ${second.name} are tightly matched`
    } else if (leaderPullingAway) {
      raceLine = `${top.name} is starting to pull away`
    } else if (leaderSoftening) {
      raceLine = `${top.name} still leads, but is softening`
    } else if (topTightening) {
      raceLine = `${top.name} still leads, but the gap is tightening`
    } else if (secondThirdBunching) {
      raceLine = `${top.name} still leads, but the field is bunching`
    } else {
      raceLine = `${top.name} still leads, but the picture is shifting underneath`
    }

    let momentumLine = strongestMover
      ? `${strongestMover.name} is the clearest mover`
      : 'The underlying picture remains fluid'
    if (smallerPartyRising) {
      momentumLine = `${smallerPartyRising.p.name} is the clearest upward mover`
    } else if (strongestMover && strongestMover.change <= -1) {
      momentumLine = `${strongestMover.name} is moving most, but backwards`
    } else if (middleBunching) {
      momentumLine = 'The middle order is tightening again'
    }

    // Compose the subheading from clauses, while tracking party mentions so the final
    // read stays concise and avoids repeating or contradicting the same party.
    const trackMentionedParties = new Set()
    const clausePool = []
    const addClause = ({ key, parties = [], text, priority = 0, blocks = [] }) => {
      if (!text) return
      clausePool.push({ key, parties, text, priority, blocks })
    }

    if (underPressure?.p && underPressure.exposureScore >= 1.5) {
      addClause({
        key: 'pressure',
        parties: [underPressure.p.name],
        text: `${underPressure.p.name} is under pressure`,
        priority: 4,
        blocks: ['steady'],
      })
    }

    if (secondThirdGap != null && secondThirdGap <= 2) {
      addClause({
        key: 'tightening',
        parties: [second.name, third.name],
        text: `the gap between ${second.name} and ${third.name} is narrowing`,
        priority: 3,
        blocks: ['bunching'],
      })
    } else if (topTightening) {
      addClause({
        key: 'tightening',
        parties: [second.name],
        text: `${second.name} is beginning to narrow the gap`,
        priority: 3,
      })
    }

    if (flatParty) {
      addClause({
        key: 'steady',
        parties: [flatParty.p.name],
        text: `${flatParty.p.name} remains broadly stable`,
        priority: 1,
      })
    } else if (topThreeSpread != null && topThreeSpread <= 8) {
      addClause({
        key: 'fluid',
        text: 'the order beneath first remains fluid',
        priority: 1,
      })
    }

    const selectedClauses = []
    const blockedKeys = new Set()
    for (const clause of clausePool.sort((a, b) => b.priority - a.priority)) {
      if (blockedKeys.has(clause.key)) continue
      if (clause.blocks.some((key) => blockedKeys.has(key))) continue

      const sharedParty = clause.parties.find((party) => trackMentionedParties.has(party))
      if (sharedParty) {
        const existingIndex = selectedClauses.findIndex((entry) => entry.parties.includes(sharedParty))
        if (existingIndex >= 0) {
          const existing = selectedClauses[existingIndex]
          if (existing.priority >= clause.priority) {
            continue
          }
          selectedClauses.splice(existingIndex, 1)
        }
      }

      selectedClauses.push(clause)
      clause.parties.forEach((party) => trackMentionedParties.add(party))
      clause.blocks.forEach((key) => blockedKeys.add(key))
      blockedKeys.add(clause.key)
      if (selectedClauses.length >= 2) break
    }

    const body = composeNarrative(selectedClauses.slice(0, 2))

    return {
      headline: `${raceLine}. ${momentumLine}.`,
      body,
      items: [
        {
          label: 'Leader of the pack',
          value: top.name,
          meta: second && leadMargin != null ? `${topPct}% · ${leadMargin}pt ahead of ${second.name}` : `${topPct}% nationally`,
          color: top.color || T.pr,
        },
        {
          label: 'Biggest mover',
          value: strongestMover?.name || 'No clear mover',
          meta: strongestMover ? `${formatSignedPts(strongestMoverPts)}pt change` : 'Flat week',
          color: strongestMover?.color || T.pr,
        },
        {
          label: 'Under pressure',
          value: underPressure?.p?.name || 'No clear target',
          meta:
            underPressure?.p
              ? `${formatSignedPts(underPressurePts)}pt${underPressure.leader && typeof underPressure.leader.net === 'number' ? ` · leader net ${formatSignedPts(underPressure.leader.net)}` : ''}`
              : 'No standout pressure point',
          color: underPressure?.p?.color || '#C8102E',
        },
        {
          label: 'Race shape',
          value: leaderPullingAway
            ? 'Leader pulling away'
            : topTight
              ? 'Tight top two'
              : secondThirdBunching
                ? 'Second-place squeeze'
                : smallerPartyRising
                  ? 'Smaller-party rise'
                  : 'Fluid field',
          meta:
            topTight && leadMargin != null
              ? `${top.name} leads ${second.name} by ${formatPts(leadMargin)}pts`
              : secondThirdGap != null && secondThirdGap <= 2
                ? `${second.name} and ${third.name} split by ${formatPts(secondThirdGap)}pts`
                : smallerPartyRising
                  ? `${smallerPartyRising.p.name} up ${formatSignedPts(smallerPartyRising.change)}pt`
                  : topThreeSpread != null
                    ? `Top 3 covered by ${formatPts(topThreeSpread)}pts`
                    : 'Waiting for more data',
          color: T.pr,
        },
      ],
    }
  }, [leadersByParty, mainParties, T.pr])

  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const card = isDark ? 'rgba(12,20,30,0.97)' : '#ffffff'
  const border = T.cardBorder || 'rgba(0,0,0,0.08)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <div style={{ padding: '8px 16px 0' }}>
        <PartyLandscapeBriefing T={T} insight={briefingInsight} card={card} border={border} />
      </div>

      <StickyPillsBar T={T} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {activeTab === 'overview' ? (
          <>
            <SectionLabel T={T}>Party directory</SectionLabel>

            {mainParties.map((p, i) => {
              const leader = leadersByParty[p.name]
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
              const leader = leadersByParty[p.name]
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
