import React, { useMemo, useState } from 'react'
import { ScrollArea, StickyPills } from '../components/ui'

const TABS = [
  { key: 'age', label: 'Age' },
  { key: 'class', label: 'Class' },
  { key: 'education', label: 'Education' },
  { key: 'region', label: 'Region' },
  { key: 'ethnicity', label: 'Ethnicity' },
  { key: 'scotland', label: 'Scotland' },
  { key: 'wales', label: 'Wales' },
  { key: 'nonvoters', label: 'Non-Voters' },
]

const PARTIES = [
  { key: 'REF', label: 'Reform', color: '#12B7D4' },
  { key: 'LAB', label: 'Labour', color: '#E4003B' },
  { key: 'CON', label: 'Con', color: '#0087DC' },
  { key: 'GRN', label: 'Green', color: '#02A95B' },
  { key: 'LD', label: 'LD', color: '#FAA61A' },
]

const DATA = {
  age: {
    title: 'Voting by Age Group',
    note: 'Younger voters skew Green/Labour. Reform UK strongest with 45–64. The traditional age gap is widening.',
    groups: [
      { label: '18–24', REF: 12, LAB: 20, CON: 8, GRN: 35, LD: 14 },
      { label: '25–34', REF: 16, LAB: 22, CON: 10, GRN: 28, LD: 14 },
      { label: '35–44', REF: 22, LAB: 22, CON: 14, GRN: 20, LD: 14 },
      { label: '45–54', REF: 28, LAB: 20, CON: 16, GRN: 14, LD: 13 },
      { label: '55–64', REF: 32, LAB: 18, CON: 18, GRN: 12, LD: 12 },
      { label: '65+', REF: 30, LAB: 16, CON: 26, GRN: 8, LD: 13 },
    ],
  },
  class: {
    title: 'Voting by Social Class',
    note: 'AB professionals now split across Reform/Green/Con. Reform dominates C2/DE — a complete reversal of traditional class voting.',
    groups: [
      { label: 'AB · Professional', REF: 20, LAB: 18, CON: 20, GRN: 24, LD: 18 },
      { label: 'C1 · Clerical', REF: 26, LAB: 18, CON: 18, GRN: 19, LD: 14 },
      { label: 'C2 · Skilled working', REF: 32, LAB: 18, CON: 16, GRN: 14, LD: 11 },
      { label: 'DE · Semi/unskilled', REF: 30, LAB: 20, CON: 12, GRN: 16, LD: 10 },
    ],
  },
  education: {
    title: 'Voting by Education',
    note: 'Education is now the strongest demographic predictor. Degree-educated voters split Green/Labour. Non-degree voters break heavily Reform.',
    groups: [
      { label: 'Degree educated', REF: 16, LAB: 22, CON: 16, GRN: 28, LD: 18 },
      { label: 'Non-degree educated', REF: 33, LAB: 15, CON: 18, GRN: 13, LD: 11 },
      { label: 'In education (16–21)', REF: 12, LAB: 20, CON: 8, GRN: 35, LD: 14 },
    ],
  },
  region: {
    title: 'Voting by Region',
    note: 'Reform leads in the Midlands and North. Labour holds London. Greens strong in South West. SNP dominates Scotland at Holyrood level.',
    groups: [
      { label: 'London', REF: 16, LAB: 26, CON: 14, GRN: 26, LD: 14 },
      { label: 'South East', REF: 26, LAB: 14, CON: 20, GRN: 18, LD: 18 },
      { label: 'South West', REF: 24, LAB: 14, CON: 18, GRN: 20, LD: 20 },
      { label: 'Midlands', REF: 32, LAB: 20, CON: 18, GRN: 14, LD: 10 },
      { label: 'North of England', REF: 30, LAB: 22, CON: 14, GRN: 16, LD: 11 },
      { label: 'Wales', REF: 24, LAB: 26, CON: 14, GRN: 14, LD: 12 },
      { label: 'Scotland', REF: 14, LAB: 28, CON: 14, GRN: 10, LD: 8 },
    ],
  },
  ethnicity: {
    title: 'Voting by Ethnicity',
    note: 'Reform support is heavily concentrated among White British voters. Labour retains strong support with Asian and Black British communities.',
    groups: [
      { label: 'White British', REF: 30, LAB: 17, CON: 17, GRN: 17, LD: 12 },
      { label: 'Asian British', REF: 14, LAB: 36, CON: 16, GRN: 18, LD: 12 },
      { label: 'Black British', REF: 8, LAB: 44, CON: 10, GRN: 22, LD: 10 },
      { label: 'Mixed / Other', REF: 18, LAB: 24, CON: 12, GRN: 26, LD: 14 },
    ],
  },
  scotland: {
    title: 'Scottish Westminster Voting Intention',
    note: 'Scotland has a distinct political landscape. The SNP dominates Holyrood. At Westminster level, Labour made major gains in 2024, cutting SNP from 48 to 9 seats.',
    customRows: [
      { label: 'SNP', val: 36, color: '#C4922A' },
      { label: 'Labour', val: 28, color: '#E4003B' },
      { label: 'Conservative', val: 14, color: '#0087DC' },
      { label: 'Reform UK', val: 14, color: '#12B7D4' },
      { label: 'Green', val: 10, color: '#02A95B' },
      { label: 'Lib Dem', val: 8, color: '#FAA61A' },
    ],
  },
  wales: {
    title: 'Welsh Westminster Voting Intention',
    note: 'Labour still leads in Wales but Reform is making inroads in Leave-heavy valleys. Plaid Cymru competes strongly for the Welsh-speaking vote.',
    customRows: [
      { label: 'Labour', val: 30, color: '#E4003B' },
      { label: 'Reform UK', val: 24, color: '#12B7D4' },
      { label: 'Conservative', val: 16, color: '#0087DC' },
      { label: 'Plaid Cymru', val: 14, color: '#3F8428' },
      { label: 'Green', val: 10, color: '#02A95B' },
      { label: 'Lib Dem', val: 6, color: '#FAA61A' },
    ],
  },
  nonvoters: {
    title: '2024 Non-Voters — Who Are They?',
    note: '42% of eligible voters did not vote in 2024. Reform UK and Restore Britain are specifically targeting this demographic. Non-voters are disproportionately young, lower-income, and live in deprived urban or post-industrial areas.',
    facts: [
      { label: 'Did not vote in 2024', val: '42%', color: '#6b7280' },
      { label: 'Non-voter if 18–24', val: '54%', color: '#12B7D4' },
      { label: 'Non-voter in DE social class', val: '51%', color: '#8b5cf6' },
      { label: 'Live in most deprived areas', val: '62% NV', color: '#E4003B' },
      { label: 'Restore Britain membership — ex non-voters', val: '~40%', color: '#1a4a9e' },
    ],
    wouldVote: [
      { label: 'Reform UK', val: 26, color: '#12B7D4' },
      { label: 'Restore Britain', val: 18, color: '#1a4a9e' },
      { label: 'Labour', val: 16, color: '#E4003B' },
      { label: 'Green', val: 14, color: '#02A95B' },
      { label: 'Conservative', val: 10, color: '#0087DC' },
      { label: 'Lib Dem', val: 6, color: '#FAA61A' },
      { label: 'Other/DK', val: 10, color: '#6b7280' },
    ],
  },
}

function formatPct(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const rounded = Math.round(Number(value) * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
}

function deriveGroupLeader(group) {
  const rows = PARTIES
    .filter((party) => group[party.key] != null && group[party.key] > 0)
    .map((party) => ({
      ...party,
      value: Number(group[party.key] || 0),
    }))
    .sort((a, b) => b.value - a.value)

  const leader = rows[0] || null
  const runnerUp = rows[1] || null
  const gap = leader && runnerUp ? +(formatPct(leader.value - runnerUp.value)) : null

  return { rows, leader, runnerUp, gap }
}

function deriveDemographicBriefing(tab, d) {
  if (!d) return null

  if (d.groups?.length) {
    const groupLeaders = d.groups.map((group) => ({
      group,
      ...deriveGroupLeader(group),
    }))
    const leaderCounts = groupLeaders.reduce((acc, entry) => {
      if (!entry.leader) return acc
      acc[entry.leader.label] = (acc[entry.leader.label] || 0) + 1
      return acc
    }, {})
    const leadTable = Object.entries(leaderCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
    const leadingParty = leadTable[0] || null
    const strongestPeak = groupLeaders
      .flatMap((entry) => entry.rows.map((row) => ({ ...row, group: entry.group.label })))
      .sort((a, b) => b.value - a.value)[0]
    const widestLead = [...groupLeaders]
      .filter((entry) => entry.gap != null)
      .sort((a, b) => (b.gap || 0) - (a.gap || 0))[0]

    const partyAverages = PARTIES.reduce((acc, party) => {
      const values = d.groups.map((group) => Number(group[party.key] || 0))
      acc[party.key] = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
      return acc
    }, {})

    const distinctiveness = d.groups
      .flatMap((group) =>
        PARTIES
          .filter((party) => group[party.key] != null && group[party.key] > 0)
          .map((party) => ({
            party,
            group: group.label,
            score: Number(group[party.key] || 0) - Number(partyAverages[party.key] || 0),
            value: Number(group[party.key] || 0),
          })),
      )
      .sort((a, b) => b.score - a.score)[0]

    const fragmented = !!leadingParty && leadingParty.count < Math.ceil(d.groups.length / 2)
    const challengerPattern = groupLeaders.filter((entry) => entry.runnerUp?.label === 'Labour').length

    let headline = `${leadingParty?.label || 'No party'} leads most groups`
    if (fragmented) {
      headline = strongestPeak ? `${strongestPeak.label} has the strongest single score` : 'No party dominates this demographic map'
    } else if (distinctiveness?.score >= 6) {
      headline = `${distinctiveness.party.label} strongest in ${distinctiveness.group}`
    } else if (widestLead?.leader) {
      headline = `${widestLead.leader.label} leads clearly in ${widestLead.group.label}`
    }

    let subline = 'The field is split across different parts of the electorate.'
    if (fragmented && strongestPeak) {
      subline = `${strongestPeak.label} records the highest score, but no party controls the wider picture.`
    } else if (leadingParty && widestLead?.runnerUp) {
      subline = `${leadingParty.label} leads ${leadingParty.count}/${d.groups.length} groups, but the sharpest divide is in ${widestLead.group.label}.`
    } else if (challengerPattern >= 2) {
      subline = `Labour remains the main challenger in several groups, even where it is not ahead.`
    }

    const stats = [
      {
        label: 'Leads most groups',
        value: leadingParty ? `${leadingParty.label} leads ${leadingParty.count}/${d.groups.length}` : 'No clear pattern',
        tone: leadingParty?.label === strongestPeak?.label ? strongestPeak.color : '#6b7280',
      },
      {
        label: 'Peak support',
        value: strongestPeak ? `${strongestPeak.label} ${formatPct(strongestPeak.value)}% (${strongestPeak.group})` : 'No clear peak',
        tone: strongestPeak?.color || '#6b7280',
      },
      {
        label: 'Biggest divide',
        value: widestLead ? `${widestLead.group.label} biggest gap` : distinctiveness ? `${distinctiveness.group} stands out` : 'No clear split',
        tone: distinctiveness?.party?.color || '#6b7280',
      },
    ]

    return { headline, subline, stats }
  }

  if (d.customRows?.length) {
    const rows = [...d.customRows].sort((a, b) => b.val - a.val)
    const leader = rows[0]
    const runnerUp = rows[1]
    const gap = leader && runnerUp ? +(formatPct(leader.val - runnerUp.val)) : null
    const spread = leader && rows[rows.length - 1] ? +(formatPct(leader.val - rows[rows.length - 1].val)) : null
    const concentrated = gap != null && gap >= 6

    const headline = concentrated
      ? `${leader.label} leads clearly here`
      : `${leader.label} is still ahead here`
    const subline = runnerUp
      ? `${leader.label} is ${formatPct(gap)} points ahead of ${runnerUp.label}.`
      : `${leader.label} currently leads this contest.`

    return {
      headline,
      subline,
      stats: [
        { label: 'Leading party', value: `${leader.label} ${formatPct(leader.val)}%`, tone: leader.color },
        { label: 'Main challenger', value: runnerUp ? `${runnerUp.label} ${formatPct(runnerUp.val)}%` : 'No clear challenger', tone: runnerUp?.color || '#6b7280' },
        { label: 'Biggest divide', value: spread != null ? `${formatPct(spread)}pt spread` : 'Limited data', tone: '#6b7280' },
      ],
    }
  }

  if (tab === 'nonvoters') {
    const rows = [...(d.wouldVote || [])].sort((a, b) => b.val - a.val)
    const leader = rows[0]
    const runnerUp = rows[1]
    const gap = leader && runnerUp ? +(formatPct(leader.val - runnerUp.val)) : null
    const biggestFact = [...(d.facts || [])].find((fact) => /\d/.test(String(fact.val)))

    const headline = gap != null && gap >= 6
      ? `${leader.label} leads among non-voters`
      : 'Non-voter preferences are still fragmented'
    const subline = runnerUp
      ? `${leader.label} leads this pool, but ${runnerUp.label} is still close enough to matter.`
      : 'Non-voter preferences are still uneven across the field.'

    return {
      headline,
      subline,
      stats: [
        { label: 'Leads this group', value: leader ? `${leader.label} ${formatPct(leader.val)}%` : 'No clear lead', tone: leader?.color || '#6b7280' },
        { label: 'Main challenger', value: runnerUp ? `${runnerUp.label} ${formatPct(runnerUp.val)}%` : 'No clear second', tone: runnerUp?.color || '#6b7280' },
        { label: 'Key stat', value: biggestFact ? `${biggestFact.val} ${biggestFact.label}` : 'Limited data', tone: biggestFact?.color || '#6b7280' },
      ],
    }
  }

  return null
}

function BriefingStat({ stat, T, card }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '10px 10px 9px',
        background: card,
        border: `1px solid ${stat.tone || '#6b7280'}18`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: T.tl,
          textAlign: 'center',
          marginBottom: 5,
        }}
      >
        {stat.label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: T.th,
          lineHeight: 1.24,
          textAlign: 'center',
        }}
      >
        {stat.value}
      </div>
    </div>
  )
}

function BarGroup({ groups, parties, maxScale = 40, T }) {
  return (
    <div>
      {groups.map((g, gi) => (
        <div
          key={gi}
          style={{
            padding: '12px 12px 10px',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}`,
            borderRadius: 14,
            background: T.c0,
            marginBottom: gi < groups.length - 1 ? 8 : 0,
          }}
        >
          {(() => {
            const { leader, runnerUp, gap } = deriveGroupLeader(g)
            const signal = leader
              ? runnerUp && gap != null
                ? `${leader.label} lead · ${formatPct(gap)}pt gap`
                : `${leader.label} lead`
              : null

            return (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 3 }}>{g.label}</div>
                {signal ? (
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: leader.color, marginBottom: 8 }}>
                    {signal}
                  </div>
                ) : null}
              </>
            )
          })()}

          {parties
            .filter((p) => g[p.key] != null && g[p.key] > 0)
            .sort((a, b) => (g[b.key] || 0) - (g[a.key] || 0))
            .map((p, pi) => (
              <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: pi < 4 ? 6 : 0 }}>
                <div
                  style={{
                    width: 42,
                    fontSize: 12,
                    fontWeight: pi === 0 ? 800 : 700,
                    color: p.color,
                    flexShrink: 0,
                  }}
                >
                  {p.label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: pi === 0 ? 8 : 7,
                    borderRadius: 999,
                    background: T.c1 || 'rgba(0,0,0,0.07)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, ((g[p.key] || 0) / maxScale) * 100)}%`,
                      height: '100%',
                      background: p.color,
                      borderRadius: 999,
                      opacity: pi === 0 ? 1 : 0.92,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: pi === 0 ? 900 : 800,
                    color: p.color,
                    width: 34,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {g[p.key]}%
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

function SimpleBar({ rows, T }) {
  const max = Math.max(...rows.map((r) => r.val), 1)

  return (
    <div>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` : 'none',
          }}
        >
          <div style={{ width: 110, fontSize: 13, fontWeight: i === 0 ? 800 : 700, color: i === 0 ? T.th : T.tm, flexShrink: 0 }}>{r.label}</div>
          <div
            style={{
              flex: 1,
              height: i === 0 ? 9 : 8,
              borderRadius: 999,
              background: T.c1 || 'rgba(0,0,0,0.07)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(r.val / max) * 100}%`,
                height: '100%',
                background: r.color,
                borderRadius: 999,
                opacity: i === 0 ? 1 : 0.92,
              }}
            />
          </div>
          <div style={{ fontSize: 14, fontWeight: i === 0 ? 900 : 800, color: r.color, width: 36, textAlign: 'right', flexShrink: 0 }}>
            {r.val}%
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DemographicsScreen({ T, nav }) {
  const [tab, setTab] = useState('age')
  const d = DATA[tab]
  const briefing = useMemo(() => deriveDemographicBriefing(tab, d), [tab, d])

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
          Demographics
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
          Voting blocs · age · class · region
        </div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {briefing ? (
          <div
            style={{
              borderRadius: 16,
              padding: '14px 14px 12px',
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: T.th,
                lineHeight: 1.22,
                textAlign: 'center',
                maxWidth: 460,
                margin: '0 auto 5px',
                letterSpacing: '-0.02em',
              }}
            >
              {briefing.headline}
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: T.tm,
                lineHeight: 1.5,
                textAlign: 'center',
                maxWidth: 520,
                margin: '0 auto 12px',
                opacity: 0.9,
              }}
            >
              {briefing.subline}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              {briefing.stats.slice(0, 3).map((stat) => (
                <BriefingStat key={stat.label} stat={stat} T={T} card={T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} />
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            borderRadius: 14,
            padding: '16px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, color: T.th, marginBottom: 5 }}>{d.title}</div>

          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: T.tl,
              lineHeight: 1.55,
              marginBottom: d.groups || d.customRows ? 12 : 0,
            }}
          >
            {d.note}
          </div>

          {d.groups && <BarGroup groups={d.groups} parties={PARTIES} T={T} />}

          {d.customRows && !d.groups && <SimpleBar rows={d.customRows} T={T} />}

          {tab === 'nonvoters' && (
            <>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: T.tl,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: 16,
                  marginBottom: 10,
                }}
              >
                Key stats
              </div>

              {d.facts.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom: i < d.facts.length - 1 ? `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` : 'none',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, flex: 1 }}>{f.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: f.color }}>{f.val}</div>
                </div>
              ))}

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: T.tl,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: 16,
                  marginBottom: 10,
                }}
              >
                If 2024 non-voters did vote today
              </div>

              <SimpleBar rows={d.wouldVote} T={T} />
            </>
          )}
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: T.tl, lineHeight: 1.6, padding: '0 4px' }}>
          Source: YouGov, More in Common, Deltapoll · 7-poll rolling avg · Mar 2026
        </div>
      </ScrollArea>
    </div>
  )
}


