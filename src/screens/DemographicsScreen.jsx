import { useState } from 'react'
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

function BarGroup({ groups, parties, maxScale = 40, T }) {
  return (
    <div>
      {groups.map((g, gi) => (
        <div
          key={gi}
          style={{
            padding: '10px 0',
            borderBottom: gi < groups.length - 1 ? `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` : 'none',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 7 }}>{g.label}</div>

          {parties
            .filter((p) => g[p.key] != null && g[p.key] > 0)
            .sort((a, b) => (g[b.key] || 0) - (g[a.key] || 0))
            .map((p, pi) => (
              <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 36, fontSize: 12, fontWeight: 700, color: p.color, flexShrink: 0 }}>
                  {p.label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 7,
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
                    }}
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color, width: 34, textAlign: 'right', flexShrink: 0 }}>
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
            padding: '9px 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` : 'none',
          }}
        >
          <div style={{ width: 110, fontSize: 13, fontWeight: 700, color: T.tm, flexShrink: 0 }}>{r.label}</div>
          <div
            style={{
              flex: 1,
              height: 8,
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
              }}
            />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: r.color, width: 36, textAlign: 'right', flexShrink: 0 }}>
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
        <div
          style={{
            borderRadius: 14,
            padding: '16px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, color: T.th, marginBottom: 6 }}>{d.title}</div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: T.tm,
              lineHeight: 1.65,
              marginBottom: d.groups || d.customRows ? 14 : 0,
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