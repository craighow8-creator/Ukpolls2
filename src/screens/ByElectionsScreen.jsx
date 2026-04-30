import React, { useEffect, useMemo, useState } from 'react'
import SectionDataMeta from '../components/SectionDataMeta'

const PARTY_COLORS = {
  Conservative: '#0087DC',
  Con: '#0087DC',
  Labour: '#E4003B',
  Lab: '#E4003B',
  'Reform UK': '#12B7D4',
  Reform: '#12B7D4',
  Green: '#02A95B',
  Grn: '#02A95B',
  'Lib Dem': '#FAA61A',
  'Liberal Democrat': '#FAA61A',
  LD: '#FAA61A',
  SNP: '#C4922A',
  'Plaid Cymru': '#3F8428',
  PC: '#3F8428',
}

const BY_ELECTION_EXPLAINER = [
  {
    title: 'One-seat pressure test',
    body: 'A single contest can expose pressure on a party faster than national polling.',
  },
  {
    title: 'Swing signal',
    body: 'Changes in vote share show where local opinion may be moving.',
  },
  {
    title: 'Message rehearsal',
    body: 'Parties use by-elections to test campaign messages before bigger elections.',
  },
]

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function parseDateish(...values) {
  for (const raw of values) {
    const value = cleanText(raw)
    if (!value) continue

    const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy
      const parsed = new Date(`${year}-${month}-${day}T00:00:00`)
      if (!Number.isNaN(parsed.getTime())) return parsed.getTime()
    }

    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime()
  }

  return 0
}

function formatDisplayDate(contest) {
  const raw = cleanText(contest?.date)
  if (raw) {
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0')
      const month = String(parsed.getMonth() + 1).padStart(2, '0')
      const year = parsed.getFullYear()
      return `${day}-${month}-${year}`
    }
    const ddmmyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (ddmmyyyy) return raw
  }

  return cleanText(contest?.dateLabel) || 'Date TBC'
}

function formatDateLabel(value) {
  const raw = cleanText(value)
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    return `${iso[3]}-${iso[2]}-${iso[1]}`
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0')
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const year = parsed.getFullYear()
    return `${day}-${month}-${year}`
  }

  return raw
}

function getPartyColor(party, fallback = '#12B7D4') {
  return PARTY_COLORS[cleanText(party)] || fallback
}

function getWinner(contest) {
  return cleanText(contest?.winner)
}

function getPrevious(contest) {
  return cleanText(contest?.previous || contest?.defending)
}

function isGain(contest) {
  const gainLoss = cleanText(contest?.gainLoss).toLowerCase()
  if (gainLoss.includes('gain')) return true
  const winner = getWinner(contest)
  const previous = getPrevious(contest)
  return !!winner && !!previous && winner.toLowerCase() !== previous.toLowerCase()
}

function isHold(contest) {
  const gainLoss = cleanText(contest?.gainLoss).toLowerCase()
  if (gainLoss.includes('hold')) return true
  const winner = getWinner(contest)
  const previous = getPrevious(contest)
  return !!winner && !!previous && winner.toLowerCase() === previous.toLowerCase()
}

function getSwingPoints(contest) {
  if (contest?.swing?.pts != null && !Number.isNaN(Number(contest.swing.pts))) return Number(contest.swing.pts)
  const raw = cleanText(contest?.swing)
  const parsed = Number.parseFloat(raw.replace(/[^\d.-]/g, ''))
  return Number.isNaN(parsed) ? 0 : Math.abs(parsed)
}

function getMajorityToDefend(contest) {
  const candidates = [contest?.majority2024, contest?.majority]
  for (const value of candidates) {
    const parsed = Number(value)
    if (!Number.isNaN(parsed) && parsed > 0) return parsed
  }
  return 0
}

function getResultLine(contest) {
  const winner = getWinner(contest)
  const previous = getPrevious(contest)
  if (!winner) return 'Result pending'
  if (isGain(contest) && previous) return `${winner} gain from ${previous}`
  if (isHold(contest) && previous) return `${winner} hold`
  return `${winner} win`
}

function getBenefitingParty(recent) {
  const counts = recent.reduce((acc, contest) => {
    if (!isGain(contest)) return acc
    const winner = getWinner(contest)
    if (!winner) return acc
    acc[winner] = (acc[winner] || 0) + 1
    return acc
  }, {})

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (!sorted.length) return null
  if (sorted.length === 1 || sorted[0][1] > sorted[1][1]) {
    return { party: sorted[0][0], count: sorted[0][1] }
  }
  return null
}

function heroSummary(recent) {
  const total = recent.length
  const gains = recent.filter(isGain)
  const holds = recent.filter(isHold)
  const biggestSwing = recent.reduce((best, contest) => {
    const swing = getSwingPoints(contest)
    if (!best || swing > best.swing) return { contest, swing }
    return best
  }, null)
  const benefiting = getBenefitingParty(recent)

  const lines = []
  lines.push(`There have been ${total} recent by-elections, producing ${gains.length} gains and ${holds.length} holds.`)

  if (benefiting) {
    lines.push(`${benefiting.party} appear to be benefiting most, with ${benefiting.count} gain${benefiting.count === 1 ? '' : 's'}.`)
  } else if (gains.length) {
    lines.push('The gains are more fragmented, with no single party dominating the picture.')
  } else {
    lines.push('Recent contests have mostly reinforced existing party control rather than overturning it.')
  }

  if (biggestSwing?.contest) {
    lines.push(`The sharpest movement came in ${biggestSwing.contest.name}, with a ${biggestSwing.swing.toFixed(1)} point swing.`)
  }

  return { total, gains: gains.length, holds: holds.length, biggestSwing, benefiting, text: lines.join(' ') }
}

function buildHeroText({ recentCount, upcomingCount, biggestSwingContest, biggestSwingPoints }) {
  let lead = ''
  if (recentCount > 0 && upcomingCount > 0) {
    lead = 'This watchlist tracks verified Westminster by-election results and confirmed upcoming Commons contests.'
  } else if (recentCount > 0) {
    lead = 'This watchlist tracks verified Westminster by-elections since the 2024 general election. No upcoming Commons by-election is currently loaded.'
  } else if (upcomingCount > 0) {
    lead = 'This watchlist is tracking confirmed upcoming Westminster by-elections. Results will appear here once contests are held.'
  } else {
    lead = 'No verified Westminster by-elections are loaded yet.'
  }

  if (biggestSwingContest && biggestSwingPoints != null) {
    return `${lead} The sharpest recent move came in ${biggestSwingContest}, with a ${biggestSwingPoints.toFixed(1)} point swing.`
  }

  return lead
}

function tagBoost(contest) {
  const text = [
    ...(contest?.tags || []),
    cleanText(contest?.verdict),
    cleanText(contest?.significance),
    cleanText(contest?.watchFor),
    cleanText(contest?.context),
  ].join(' ').toLowerCase()

  let score = 0
  if (text.includes('upset')) score += 10
  if (text.includes('bellwether')) score += 10
  if (text.includes('government pressure')) score += 8
  if (text.includes('historic')) score += 8
  if (text.includes('largest swing')) score += 8
  return score
}

function contestRank(contest) {
  return (
    (isGain(contest) ? 100 : 40) +
    getSwingPoints(contest) * 3 +
    Math.min(getMajorityToDefend(contest) / 1000, 20) +
    tagBoost(contest)
  )
}

function keyContestSentence(contest) {
  if (cleanText(contest?.significance)) return cleanText(contest.significance)
  if (isGain(contest)) {
    return `${getWinner(contest)} overturned ${getPrevious(contest)} in a contest with wider political weight.`
  }
  if (getSwingPoints(contest) >= 10) {
    return `${getWinner(contest)} held on, but only after a sharp swing in the seat.`
  }
  return `${getResultLine(contest)} in a contest watched beyond the constituency itself.`
}

function recentSignificance(contest) {
  return cleanText(contest?.significance || contest?.watchFor || contest?.verdict || contest?.context)
}

function watchForLine(contest) {
  return cleanText(contest?.watchFor || contest?.context || contest?.verdict || 'Watch whether the defending party can withstand local pressure.')
}

function Card({ T, borderColor, children, style }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: '14px 14px',
        marginBottom: 10,
        background: T.c0,
        border: `1px solid ${borderColor || T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ T, children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.tl,
        textAlign: 'center',
        margin: '14px 0 8px',
      }}
    >
      {children}
    </div>
  )
}

function StatChip({ T, label, value, color, sub }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '10px 8px',
        background: T.c1 || 'rgba(0,0,0,0.03)',
        border: `1px solid ${color}24`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.tl, marginTop: 4 }}>
        {label}
      </div>
      {sub ? <div style={{ fontSize: 11, fontWeight: 600, color: T.tl, marginTop: 3, lineHeight: 1.35 }}>{sub}</div> : null}
    </div>
  )
}

function KeySignalCard({ T, contest }) {
  const accent = getPartyColor(getWinner(contest), T.pr || '#12B7D4')
  return (
    <Card T={T} borderColor={`${accent}30`}>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.th, textAlign: 'center' }}>{contest.name}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginTop: 4, textAlign: 'center' }}>{formatDisplayDate(contest)}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: accent, marginTop: 8, textAlign: 'center' }}>{getResultLine(contest)}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
        {getSwingPoints(contest) ? <div style={{ fontSize: 12, fontWeight: 800, color: accent, background: `${accent}18`, borderRadius: 999, padding: '4px 9px' }}>Swing {getSwingPoints(contest).toFixed(1)} pts</div> : null}
        {getMajorityToDefend(contest) ? <div style={{ fontSize: 12, fontWeight: 800, color: T.pr, background: `${T.pr}18`, borderRadius: 999, padding: '4px 9px' }}>Majority {getMajorityToDefend(contest).toLocaleString()}</div> : null}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.55, marginTop: 9, textAlign: 'center' }}>
        {keyContestSentence(contest)}
      </div>
    </Card>
  )
}

function UpcomingCard({ T, contest }) {
  const defending = getPrevious(contest)
  const color = getPartyColor(defending, contest?.defColor || T.pr || '#12B7D4')
  return (
    <Card T={T} borderColor={`${color}28`} style={{ padding: '12px 13px' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.th, textAlign: 'center' }}>{contest.name}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, textAlign: 'center', marginTop: 4 }}>{formatDisplayDate(contest)}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {defending ? <div style={{ fontSize: 12, fontWeight: 800, color, background: `${color}18`, borderRadius: 999, padding: '4px 9px' }}>{defending} defend</div> : null}
        {getMajorityToDefend(contest) ? <div style={{ fontSize: 12, fontWeight: 800, color: T.pr, background: `${T.pr}18`, borderRadius: 999, padding: '4px 9px' }}>Majority {getMajorityToDefend(contest).toLocaleString()}</div> : null}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.th, lineHeight: 1.55, marginTop: 9, textAlign: 'center' }}>
        {watchForLine(contest)}
      </div>
    </Card>
  )
}

function RecentResultCard({ T, contest }) {
  const accent = getPartyColor(getWinner(contest), T.pr || '#12B7D4')
  return (
    <Card T={T} borderColor={`${accent}24`} style={{ padding: '12px 13px' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.th, textAlign: 'center' }}>{contest.name}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, textAlign: 'center', marginTop: 4 }}>{formatDisplayDate(contest)}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: accent, marginTop: 8, textAlign: 'center' }}>{getResultLine(contest)}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {getSwingPoints(contest) ? <div style={{ fontSize: 12, fontWeight: 800, color: accent, background: `${accent}18`, borderRadius: 999, padding: '4px 9px' }}>Swing {getSwingPoints(contest).toFixed(1)} pts</div> : null}
        {contest?.majority ? <div style={{ fontSize: 12, fontWeight: 800, color: T.pr, background: `${T.pr}18`, borderRadius: 999, padding: '4px 9px' }}>Majority {Number(contest.majority).toLocaleString()}</div> : null}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.5, marginTop: 8, textAlign: 'center' }}>
        {cleanText(contest?.summary || contest?.verdict || contest?.context)}
      </div>
      {recentSignificance(contest) ? (
        <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, lineHeight: 1.5, marginTop: 6, textAlign: 'center' }}>
          {recentSignificance(contest)}
        </div>
      ) : null}
    </Card>
  )
}

function ByElectionExplainer({ T }) {
  return (
    <Card T={T} style={{ marginBottom: 12 }}>
      <SectionTitle T={T}>Why by-elections matter</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
        }}
      >
        {BY_ELECTION_EXPLAINER.map((item) => (
          <div
            key={item.title}
            style={{
              borderRadius: 12,
              padding: '11px 10px',
              background: T.c1 || 'rgba(0,0,0,0.035)',
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: T.th, lineHeight: 1.25, marginBottom: 5 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, lineHeight: 1.45 }}>
              {item.body}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function ByElectionsScreen({ T, byElections, dataState = {} }) {
  const meta = byElections?.meta && typeof byElections.meta === 'object' ? byElections.meta : null

  const upcoming = useMemo(
    () => [...(byElections?.upcoming || [])].filter((item) => item.status !== 'skip').sort((a, b) => parseDateish(a.date, a.dateLabel) - parseDateish(b.date, b.dateLabel)),
    [byElections]
  )

  const recent = useMemo(
    () => [...(byElections?.recent || [])].sort((a, b) => parseDateish(b.date, b.dateLabel) - parseDateish(a.date, a.dateLabel)),
    [byElections]
  )

  const summary = useMemo(() => heroSummary(recent), [recent])
  const keySignals = useMemo(() => [...recent].sort((a, b) => contestRank(b) - contestRank(a)).slice(0, Math.min(4, recent.length)), [recent])
  const resolvedMeta = useMemo(() => ({
    recentCount: meta?.recentCount ?? summary.total ?? recent.length,
    upcomingCount: meta?.upcomingCount ?? upcoming.length,
    biggestSwingContest: cleanText(meta?.biggestSwingContest) || cleanText(summary.biggestSwing?.contest?.name),
    biggestSwingPoints:
      meta?.biggestSwingPoints != null && !Number.isNaN(Number(meta.biggestSwingPoints))
        ? Number(meta.biggestSwingPoints)
        : summary.biggestSwing?.swing ?? null,
    latestRecentDate: formatDateLabel(meta?.latestRecentDate) || formatDisplayDate(recent[0]),
    reviewedAt: formatDateLabel(meta?.reviewedAt || meta?.updatedAt),
    scope: cleanText(meta?.scope),
    sourceType: cleanText(meta?.sourceType),
  }), [meta, recent, summary, upcoming])
  const heroText = useMemo(() => buildHeroText(resolvedMeta), [resolvedMeta])
  const compactMetaLine = useMemo(() => {
    const parts = [
      resolvedMeta.reviewedAt ? `Reviewed ${resolvedMeta.reviewedAt}` : null,
      resolvedMeta.scope ? 'Westminster by-elections' : null,
      resolvedMeta.sourceType ? 'official sources' : null,
    ].filter(Boolean)
    return parts.join(' · ')
  }, [resolvedMeta])
  const [keySignalsOpen, setKeySignalsOpen] = useState(() => !(byElections?.upcoming || []).length)

  useEffect(() => {
    setKeySignalsOpen(upcoming.length === 0)
  }, [upcoming.length])

  return (
    <div
      style={{
        background: T.sf,
      }}
    >
      <div style={{ padding: '18px 18px 0' }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: -1,
            color: T.th,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          By-elections
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.tl, marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>
          Single-seat contests that can expose political pressure fast.
        </div>
      </div>

      <div style={{ padding: '12px 16px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <SectionDataMeta T={T} section={dataState.byElections || null} />
        </div>
        <Card T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
          <SectionTitle T={T}>Westminster by-election watchlist</SectionTitle>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
            {heroText}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            <StatChip T={T} label="Recent" value={resolvedMeta.recentCount} color={T.pr || '#12B7D4'} sub="verified results" />
            <StatChip T={T} label="Upcoming" value={resolvedMeta.upcomingCount} color={T.pr || '#12B7D4'} sub="confirmed contests" />
            <StatChip
              T={T}
              label="Biggest swing"
              value={resolvedMeta.biggestSwingPoints != null ? `${resolvedMeta.biggestSwingPoints.toFixed(1)}%` : '—'}
              color={T.pr || '#12B7D4'}
              sub={resolvedMeta.biggestSwingContest || 'No result'}
            />
          </div>
          {compactMetaLine ? (
            <div
              style={{
                marginTop: 10,
                fontSize: 11.5,
                fontWeight: 600,
                color: T.tl,
                textAlign: 'center',
                lineHeight: 1.45,
              }}
            >
              {compactMetaLine}
            </div>
          ) : null}
        </Card>

        <ByElectionExplainer T={T} />

        <SectionTitle T={T}>Upcoming watchlist</SectionTitle>
        {upcoming.length ? (
          upcoming.map((contest) => (
            <UpcomingCard key={contest.id || contest.name} T={T} contest={contest} />
          ))
        ) : (
          <Card T={T}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.tl, textAlign: 'center' }}>
              No confirmed upcoming Commons by-election is currently loaded.
            </div>
          </Card>
        )}

        {keySignals.length ? (
          <>
            <button
              type="button"
              onClick={() => setKeySignalsOpen((open) => !open)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <SectionTitle T={T}>Key signals</SectionTitle>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: T.pr || '#12B7D4',
                  marginTop: 6,
                }}
              >
                {keySignalsOpen ? 'Hide' : 'Show'}
              </span>
            </button>
            {keySignalsOpen
              ? keySignals.map((contest) => (
                  <KeySignalCard key={contest.id || contest.name} T={T} contest={contest} />
                ))
              : null}
          </>
        ) : null}

        <SectionTitle T={T}>Recent results</SectionTitle>
        {recent.length ? (
          recent.map((contest) => (
            <RecentResultCard key={contest.id || contest.name} T={T} contest={contest} />
          ))
        ) : (
          <Card T={T}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.tl, textAlign: 'center' }}>
              No recent by-election results loaded yet.
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
