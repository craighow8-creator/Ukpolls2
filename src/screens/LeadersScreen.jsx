import { getData } from '../data/store'
import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { haptic } from '../components/ui'
import { PortraitAvatar } from '../utils/portraits'

const TAP = {
  whileTap: { opacity: 0.76, scale: 0.992 },
  transition: { duration: 0.08 },
}

function shortLeaderRef(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : 'Leader'
}

function isFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return false
  return Number.isFinite(Number(value))
}

function hasFavourabilitySplit(leader) {
  return !!leader?._hasFavourabilitySplit && isFiniteNumber(leader.favourable) && isFiniteNumber(leader.unfavourable)
}

function ratingMetricLabel(leader) {
  return leader?.metricLabel || (leader?.ratingSource === 'sourced' ? 'Net favourability' : 'Maintained profile rating')
}

function ratingSourceLine(leader) {
  if (leader?.ratingSource !== 'sourced') return 'Maintained profile rating'
  const source = leader.source || 'Leader ratings source'
  const date = leader.publishedAt || leader.fieldworkDate || leader.updatedAt || ''
  return date ? `${source} · ${date}` : source
}

function NetBadge({ net, large = false }) {
  const positive = net >= 0
  const color = positive ? '#02A95B' : '#C8102E'

  return (
    <div
      style={{
        fontSize: large ? 46 : 24,
        fontWeight: 800,
        letterSpacing: '-0.03em',
        color,
        lineHeight: 1,
      }}
    >
      {positive ? '+' : ''}
      {net}
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
        background: subtle ? `${color}10` : `${color}18`,
        border: `1px solid ${color}24`,
        borderRadius: 999,
        padding: '5px 10px',
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
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.tl,
        marginBottom: 12,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function BriefingStat({ label, value, tone, T, surface }) {
  const color = tone === 'good' ? '#02A95B' : tone === 'bad' ? '#C8102E' : T.pr
  return (
    <div
      style={{
        minWidth: 0,
        borderRadius: 14,
        padding: '11px 11px 10px',
        background: surface,
        border: `1px solid ${color}18`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.tl,
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.25,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function HeroBriefing({ T, summary, isDark }) {
  const heroSurface = isDark
    ? 'linear-gradient(180deg, rgba(22,32,45,0.98), rgba(11,19,29,0.98))'
    : 'linear-gradient(180deg, #ffffff, #f8fafc)'
  const statSurface = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.72)'

  return (
    <div
      style={{
        borderRadius: 20,
        padding: '0 18px 18px',
        marginBottom: 18,
        background: heroSurface,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.24)' : '0 12px 28px rgba(15,23,42,0.07)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${T.pr}00 0%, ${T.pr || '#12B7D4'} 50%, ${T.pr}00 100%)`,
          opacity: 0.9,
        }}
      />

      <div style={{ padding: '16px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: T.tl,
              opacity: 0.9,
            }}
          >
            Leadership briefing
          </span>
        </div>

        <div
          style={{
            fontSize: 25,
            fontWeight: 850,
            color: T.th,
            textAlign: 'center',
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            maxWidth: 620,
            margin: '0 auto 8px',
          }}
        >
          {summary.headline}
        </div>

        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: T.tl,
            textAlign: 'center',
            lineHeight: 1.58,
            maxWidth: 720,
            margin: '0 auto 14px',
          }}
        >
          {summary.body}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 9,
          }}
        >
          <BriefingStat label="Top leader" value={summary.topLabel} tone="good" T={T} surface={statSurface} />
          <BriefingStat label="Under pressure" value={summary.pressureLabel} tone="bad" T={T} surface={statSurface} />
          <BriefingStat label="Leader-party gap" value={summary.mismatchLabel} tone="neutral" T={T} surface={statSurface} />
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.tl,
            marginTop: 12,
            opacity: 0.88,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Net favourability shown where available; favourable/unfavourable split shown only when supplied by a sourced dataset.
        </div>
      </div>
    </div>
  )
}

function LeaderSignal({ text, border, T }) {
  if (!text) return null
  return (
    <div
      style={{
        marginTop: 11,
        paddingTop: 10,
        borderTop: `1px solid ${border}`,
        fontSize: 12,
        fontWeight: 700,
        color: T.tl,
        lineHeight: 1.5,
        textAlign: 'center',
        letterSpacing: '0.01em',
      }}
    >
      {text}
    </div>
  )
}

export default function LeadersScreen({ T, nav }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.resolve(getData())
      .then((next) => {
        if (!cancelled) setData(next)
      })
      .catch((err) => {
        console.warn('LeadersScreen: failed to load data', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const leaders = data?.leaders || []
  const parties = data?.polls || []
  const sorted = useMemo(() => [...(leaders || [])].sort((a, b) => Number(b.net ?? -999) - Number(a.net ?? -999)), [leaders])

  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const card = isDark ? 'rgba(12,20,30,0.97)' : '#ffffff'
  const border = T.cardBorder || 'rgba(0,0,0,0.08)'

  const leaderPartyMap = useMemo(() => {
    const map = {}
    ;(parties || []).forEach((p) => {
      map[p.name] = p
    })
    return map
  }, [parties])

  const summary = useMemo(() => {
    const top = sorted[0]
    const second = sorted[1]
    const bottom = sorted[sorted.length - 1]

  if (!top) {
    return {
      headline: 'Leader favourability data is not available yet.',
      body: 'Once sourced favourability figures are loaded, this screen will highlight who is leading, who is under pressure, and where leadership is helping or hurting party performance.',
      topLabel: '—',
      pressureLabel: '—',
      mismatchLabel: '—',
    }
  }

  const mismatchCandidates = sorted
    .map((leader) => {
      const party = leaderPartyMap[leader.party]
      const partyChange = typeof party?.change === 'number' ? party.change : null
      if (partyChange == null) return null
      return {
        leader,
        party,
        partyChange,
        score: Math.abs(leader.net - partyChange * 10),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)

  const mismatchEntry = mismatchCandidates[0] || null
  const mismatch = mismatchEntry?.leader || bottom
  const mismatchParty = mismatchEntry?.party || leaderPartyMap[mismatch?.party]
  const mismatchPartyChange = typeof mismatchEntry?.partyChange === 'number' ? mismatchEntry.partyChange : null

  // Derived signals:
  // - topGap: separation at the top of the favourability table
  // - bottomSeverity: how far underwater the weakest leader is
  // - mismatchScore: distance between leader standing and party momentum
  // - spreadAcrossField: whether the table is compressed or stretched
  // These signals feed a narrative mode chooser so the hero leads with the
  // most meaningful favourability story rather than always defaulting to top vs bottom.
  const topGap = second ? top.net - second.net : null
  const third = sorted[2] || null
  const spreadAcrossField = top.net - bottom.net
  const bottomSeverity = Math.abs(Math.min(bottom.net, 0))
  const mismatchScore = mismatchEntry?.score ?? 0
  const topSeparated = topGap != null && topGap >= 6
  const topRaceTight = topGap != null && topGap <= 2
  const pressureSevere = bottom.net <= -25
  const mismatchSevere = mismatchScore >= 14
  const fieldCompressed = spreadAcrossField <= 12

  // Narrative priority:
  // 1. Mismatch if leadership/party disconnect is especially stark
  // 2. Crisis if one leader is deeply underwater and that dominates the table
  // 3. Tight top race if the leaders are closely bunched
  // 4. Dominance if the leader is clearly separated
  // 5. Fragmented/flat field as the fallback when no single signal dominates
  let mode = 'fragmented'
  if (mismatchSevere && mismatch?.name !== top.name && mismatch?.name !== bottom.name) {
    mode = 'mismatch'
  } else if (pressureSevere && bottomSeverity >= (topGap ?? 0) + 12) {
    mode = 'pressure'
  } else if (topRaceTight) {
    mode = 'tightTop'
  } else if (topSeparated) {
    mode = 'dominance'
  } else if (fieldCompressed || (third && top.net - third.net <= 5)) {
    mode = 'fragmented'
  }

  let headline = `${top.name} leads the favourability table`
  let body = `${top.name} is still the strongest-rated leader, but the wider field remains open.`

  if (mode === 'dominance') {
    headline = `${top.name} has opened a clear favourability lead`
    body = second
      ? `${top.name} is ${topGap} points clear of ${second.name}, giving them the cleanest leadership cushion in the field.`
      : `${top.name} is clearly ahead on leader ratings, with no close challenger in view.`
  } else if (mode === 'tightTop') {
    headline = 'The race at the top is tightening'
    body = second
      ? `${top.name} and ${second.name} are separated by only ${topGap} points, so the leadership order still looks contestable.`
      : `${top.name} remains in front, but the favourability lead is too narrow to feel settled.`
  } else if (mode === 'pressure') {
    headline = `${bottom.name} remains deep underwater`
    body = `${bottom.name} is carrying the heaviest favourability pressure in the table, and that level of weakness is now the defining signal in the field.`
  } else if (mode === 'mismatch') {
    headline = `${mismatch.name} is the clearest favourability mismatch`
    body = `${mismatch.name}'s personal standing is the sharpest disconnect with party momentum, making that leadership gap harder to ignore.`
  } else {
    headline = 'Leader favourability remains unsettled across the field'
    body = second && third
      ? `${top.name} still leads, but the gaps behind are narrow enough that the favourability order can still shift quickly.`
      : `${top.name} remains ahead, but the table is not yet producing one dominant favourability story.`
  }

  return {
    headline,
    body,
    topLabel: `${top.name} ${top.net >= 0 ? '+' : ''}${top.net}`,
    pressureLabel: `${bottom.name} ${bottom.net >= 0 ? '+' : ''}${bottom.net}`,
    mismatchLabel:
      mismatch && mismatchParty
        ? mismatchPartyChange != null && mismatchPartyChange > 0 && mismatch.net < 0
          ? `${shortLeaderRef(mismatch.name)} trails ${mismatchParty.name}`
          : mismatchPartyChange != null && mismatchPartyChange < 0 && mismatch.net >= 0
            ? `${shortLeaderRef(mismatch.name)} runs ahead of ${mismatchParty.name}`
            : mismatch.net < 0
              ? `${shortLeaderRef(mismatch.name)} lags the party`
              : `${shortLeaderRef(mismatch.name)} is out of sync`
        : 'No clear split',
  }
  }, [sorted, leaderPartyMap])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <div style={{ padding: '12px 16px 0' }}>
        <HeroBriefing T={T} summary={summary} isDark={isDark} />
      </div>

      <div style={{ padding: '4px 16px 40px' }}>
        <SectionLabel T={T}>Favourability leaderboard</SectionLabel>

        {sorted.map((l, i) => {
          const lIdx = leaders.indexOf(l)
          const party = leaderPartyMap[l.party]
          const partyChange = typeof party?.change === 'number' ? party.change : null
          const signal =
            partyChange == null
              ? null
              : l.net >= 0 && partyChange <= 0
                ? 'Outperforming party'
                : l.net < 0 && partyChange > 0
                  ? 'Dragging party down'
                  : l.net >= 0 && partyChange > 0
                    ? 'Aligned with party momentum'
                    : 'Party and leader under pressure'

          const rankColor = i === 0 ? l.color : T.tl

          return (
            <motion.div
              key={i}
              {...TAP}
              onClick={() => {
                haptic(8)
                nav('leader', { lIdx })
              }}
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                marginBottom: 10,
                background: card,
                border: `1px solid ${l.color}${i === 0 ? '32' : '22'}`,
                boxShadow: i === 0
                  ? (isDark ? '0 10px 24px rgba(0,0,0,0.24)' : '0 10px 24px rgba(15,23,42,0.07)')
                  : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ height: 3, background: l.color, flexShrink: 0 }} />

              <div style={{ padding: '15px 16px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      fontSize: i === 0 ? 22 : 18,
                      fontWeight: 900,
                      color: rankColor,
                      flexShrink: 0,
                      textAlign: 'center',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {i + 1}
                  </div>

                  <PortraitAvatar name={l.name} color={l.color} size={58} radius={29} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: T.th,
                        lineHeight: 1.15,
                        marginBottom: 3,
                      }}
                    >
                      {l.name}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: l.color,
                      }}
                    >
                      {l.party}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <NetBadge net={l.net} large={i === 0} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.tl, marginTop: 4 }}>
                      {hasFavourabilitySplit(l) ? `${l.favourable}% / ${l.unfavourable}%` : ratingMetricLabel(l)}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 650, color: T.tl, textAlign: 'center', marginTop: 9, lineHeight: 1.45 }}>
                  {l.sourceUrl ? (
                    <a href={l.sourceUrl} target="_blank" rel="noreferrer" style={{ color: T.pr, textDecoration: 'none' }}>
                      {ratingSourceLine(l)}
                    </a>
                  ) : (
                    ratingSourceLine(l)
                  )}
                </div>

                <LeaderSignal text={signal} border={border} T={T} />
              </div>
            </motion.div>
          )
        })}

        <div
          style={{
            borderRadius: 14,
            padding: '13px 14px',
            marginTop: 12,
            marginBottom: 10,
            background: card,
            border: `1px solid ${border}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: T.th, marginBottom: 5, textAlign: 'center' }}>
            About net favourability
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6, textAlign: 'center' }}>
            Net favourability = % favourable minus % unfavourable. The app does not mix this with approval, satisfaction, or best-PM polling.
          </div>
        </div>
      </div>
    </div>
  )
}
