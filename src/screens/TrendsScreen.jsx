import React, { useMemo, useState } from 'react'
import { haptic } from '../components/ui'
import { getPartyByName } from '../data/partyRegistry'
import SharedTrendChart, { buildDisplayTrendRows } from '../components/charts/SharedTrendChart'

const PARTY_KEYS = [
  'Reform UK',
  'Labour',
  'Green',
  'Conservative',
  'Lib Dem',
  'Restore Britain',
].map((name) => {
  const party = getPartyByName(name)
  return {
    key: name,
    abbr: party.abbr,
    color: party.color,
  }
})

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

function shortPartyName(value) {
  if (value === 'Conservative') return 'Conservatives'
  if (value === 'Green') return 'Greens'
  return value
}

function formatGap(value) {
  if (value == null) return '0'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function ScrollAwayHeader({ T }) {
  return (
    <div style={{ padding: '10px 16px 8px' }}>
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
        Trends
      </div>
    </div>
  )
}

function getLatestValues(trends) {
  if (!trends?.length) return []

  const latest = trends[trends.length - 1]
  const oldest = trends[0]

  return PARTY_KEYS.map((p) => {
    const current = latest?.[p.key]
    const start = oldest?.[p.key]
    const delta = current != null && start != null ? +(current - start).toFixed(1) : null

    return {
      ...p,
      current,
      start,
      delta,
    }
  })
    .filter((p) => p.current != null)
    .sort((a, b) => b.current - a.current)
}

function buildTrendStory(trends, pollContext) {
  const vals = getLatestValues(trends)
  const leader = vals[0]
  const second = vals[1]
  const rising = [...vals].filter((p) => p.delta != null).sort((a, b) => (b.delta || 0) - (a.delta || 0))[0]
  const falling = [...vals].filter((p) => p.delta != null).sort((a, b) => (a.delta || 0) - (b.delta || 0))[0]
  const third = vals[2]
  const gap = leader && second ? +((leader.current || 0) - (second.current || 0)).toFixed(1) : null

  let headline = 'Trend picture in view'
  if (leader && second && gap != null) {
    if (gap >= 8) headline = `${shortPartyName(leader.key)} lead by ${formatGap(gap)} points`
    else if (gap >= 4) headline = `${shortPartyName(leader.key)} maintain clear lead`
    else headline = 'Race is tight at the top'
  }

  const subheadParts = []
  if (leader && second && gap != null) {
    if (gap >= 4) subheadParts.push(`${shortPartyName(leader.key)} hold their lead.`)
    else subheadParts.push(`${shortPartyName(leader.key)} and ${shortPartyName(second.key)} remain close.`)
  }

  if (rising && (rising.delta || 0) > 0.8 && (!leader || rising.key !== leader.key)) {
    subheadParts.push(`${shortPartyName(rising.key)} are the clearest risers.`)
  } else if (third && second && Math.abs((second.current || 0) - (third.current || 0)) <= 2) {
    subheadParts.push(`The race for second remains close.`)
  } else if (falling && (falling.delta || 0) < -0.8 && (!leader || falling.key !== leader.key)) {
    subheadParts.push(`${shortPartyName(falling.key)} are drifting lower.`)
  }

  return {
    headline,
    subhead: subheadParts.slice(0, 2).join(' ') || 'Not enough trend data yet to describe the race clearly.',
    leader,
    rising,
    falling,
    gap,
  }
}

function buildTrendWhyThisMatters(trends) {
  const vals = getLatestValues(trends)
  const leader = vals[0]
  const second = vals[1]
  const trailing = vals.slice(1, 4)
  const bullets = []

  if (leader && second) {
    const leadMargin = +((leader.current || 0) - (second.current || 0)).toFixed(1)
    if (leadMargin > 5) bullets.push('The leader has a clear margin over the field')
    else if (leadMargin < 4) bullets.push('The contest at the top remains tight')
  }

  if (trailing.length >= 3) {
    const trailingSpread = Math.max(...trailing.map((party) => party.current || 0)) - Math.min(...trailing.map((party) => party.current || 0))
    if (trailingSpread <= 3) bullets.push('The race for second is tightly clustered')
  }

  const rising = [...vals].filter((p) => p.delta != null && p.delta >= 1.5).sort((a, b) => (b.delta || 0) - (a.delta || 0))[0]
  if (rising) bullets.push(`${shortPartyName(rising.key)} are gaining steadily`)

  const visibleDeltas = vals.map((party) => party.delta).filter((value) => value != null)
  if (visibleDeltas.length && visibleDeltas.every((value) => Math.abs(value) < 1.5)) {
    bullets.push('The overall picture remains stable')
  }

  if (!bullets.length) bullets.push('Recent trend movement remains limited')

  return [...new Set(bullets)].slice(0, 4)
}

function WhyThisMattersCard({ T, bullets = [] }) {
  const visible = (bullets || []).filter(Boolean).slice(0, 4)
  if (!visible.length) return null

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '11px 13px',
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        marginBottom: 12,
      }}
    >
      <SectionLabel T={T}>Why this matters</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {visible.map((bullet) => (
          <div
            key={bullet}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.tl,
              lineHeight: 1.45,
              textAlign: 'center',
            }}
          >
            • {bullet}
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendHero({ T, trends, pollContext }) {
  const story = buildTrendStory(trends, pollContext)

  return (
    <div
      style={{
        borderRadius: 18,
        padding: '18px 18px 16px',
        marginBottom: 14,
        background: T.c0,
        border: `1px solid ${(story.leader?.color || T.pr)}30`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Badge color={story.leader?.color || T.pr}>Trend Hero</Badge>
        {story.rising && (story.rising.delta || 0) > 0 ? <Badge color="#02A95B" subtle>Rising: {story.rising.abbr}</Badge> : null}
        {story.falling && (story.falling.delta || 0) < 0 ? <Badge color="#C8102E" subtle>Falling: {story.falling.abbr}</Badge> : null}
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {story.headline}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: T.tl,
          textAlign: 'center',
          lineHeight: 1.6,
          marginTop: 10,
        }}
      >
        {story.subhead}
      </div>
    </div>
  )
}

function RaceShapeCard({ T, trends }) {
  const vals = getLatestValues(trends)
  if (vals.length < 2) return null

  const leader = vals[0]
  const second = vals[1]
  const latestGap = +((leader.current || 0) - (second.current || 0)).toFixed(1)
  const firstGap = leader.start != null && second.start != null ? +((leader.start || 0) - (second.start || 0)).toFixed(1) : null
  const gapDelta = firstGap != null ? +(latestGap - firstGap).toFixed(1) : null

  let label = 'Stable race'
  let color = T.tl

  if (gapDelta != null) {
    if (gapDelta > 0.4) {
      label = 'Lead appears to be widening'
      color = '#02A95B'
    } else if (gapDelta < -0.4) {
      label = 'Race appears to be tightening'
      color = '#C8102E'
    }
  }

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 12,
        background: T.c0,
        border: `1px solid ${color}26`,
      }}
    >
      <SectionLabel T={T}>Race shape</SectionLabel>

      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {latestGap}pt gap
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color,
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: T.tl,
          textAlign: 'center',
          lineHeight: 1.6,
          marginTop: 6,
        }}
      >
        {leader.key} vs {second.key}
        {gapDelta != null ? ` · change of ${gapDelta > 0 ? '+' : ''}${gapDelta}pt across the visible range` : ''}
      </div>
    </div>
  )
}

function PointDetails({ point, hidden, T }) {
  if (!point) return null

  return (
    <div
      style={{
        borderRadius: 12,
        padding: '12px 14px',
        background: T.c1 || 'rgba(0,0,0,0.05)',
        margin: '8px 0 10px',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 8, textAlign: 'center' }}>
        {point.fullDate}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, textAlign: 'center', marginBottom: 10, lineHeight: 1.5 }}>
        {typeof point.pollsterCount === 'number' ? `${point.pollsterCount} houses included` : 'Trend point'}
        {point.pollster ? ` · ${point.pollster}` : ''}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {PARTY_KEYS.filter((p) => point[p.key] != null && !hidden[p.key])
          .sort((a, b) => (point[b.key] || 0) - (point[a.key] || 0))
          .map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.tm, flex: 1 }}>{p.key}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: p.color }}>{point[p.key]}%</span>
            </div>
          ))}
      </div>
    </div>
  )
}

function MovementCards({ trends, focusedPartyKey, onToggle, T }) {
  const latest = getLatestValues(trends)
  const hasFocus = !!focusedPartyKey

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {latest.map((p) => {
        const focusedNow = focusedPartyKey === p.key
        const dimmed = hasFocus && !focusedNow
        const cardBg = focusedNow ? `${p.color}10` : T.c0
        const textColor = dimmed ? T.tl : T.th
        const accentOpacity = focusedNow ? '40' : dimmed ? '18' : '2A'
        let label = 'Flat'
        let labelColor = T.tl

        if (p.delta != null) {
          if (p.delta > 0.4) {
            label = 'Rising (recent)'
            labelColor = '#02A95B'
          } else if (p.delta < -0.4) {
            label = 'Slipping (recent)'
            labelColor = '#C8102E'
          }
        }

        return (
          <div
            key={p.key}
            onClick={() => {
              haptic(4)
              onToggle(p.key)
            }}
            style={{
              borderRadius: 14,
              padding: '8px 11px',
              background: cardBg,
              border: `1px solid ${p.color}${accentOpacity}`,
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
              WebkitTapHighlightColor: 'transparent',
              transform: focusedNow ? 'translateY(-1px)' : 'translateZ(0)',
              opacity: dimmed ? 0.45 : 1,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 58px',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color, opacity: dimmed ? 0.55 : 1 }}>{p.abbr}</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: p.color, lineHeight: 1, marginTop: 2, opacity: dimmed ? 0.65 : 1 }}>
                  {p.current}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: textColor }}>{p.key}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: dimmed ? T.tl : labelColor, marginTop: 2 }}>
                  {label}
                  {p.delta != null ? ` · ${p.delta > 0 ? '+' : ''}${p.delta}pt` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 64,
                    padding: '2px 7px',
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: focusedNow ? p.color : T.tl,
                    background: focusedNow ? `${p.color}14` : `${T.tl}12`,
                    border: `1px solid ${focusedNow ? `${p.color}2A` : `${T.tl}22`}`,
                  }}
                >
                  {focusedNow ? 'Focused' : hasFocus ? 'Muted' : 'All shown'}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MilestoneCard({ T, m }) {
  const mentioned = PARTY_KEYS.find((pk) => (m.text || '').toLowerCase().includes(pk.key.toLowerCase()))
  const color = mentioned?.color || T.pr

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 3,
            borderRadius: 99,
            alignSelf: 'stretch',
            background: color,
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {m.date}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.65 }}>{m.text}</div>
        </div>
      </div>
    </div>
  )
}

export default function TrendsScreen({ T, trends = [], pollContext, milestones = [], nav }) {
  const [focusedPartyKey, setFocusedPartyKey] = useState(null)
  const [scope, setScope] = useState('all')

  const displayTrends = useMemo(() => buildDisplayTrendRows(trends, pollContext), [trends, pollContext])
  const allPollsSorted = pollContext?.allPollsSorted || []
  const parseSourceLabel = (label) => {
    const text = String(label || '').trim()
    const match = text.match(/^(.*?)(?:\s*\((\d{4}-\d{2}-\d{2})\))?$/)
    return {
      pollster: String(match?.[1] || '').trim(),
      date: String(match?.[2] || '').trim(),
    }
  }
  const findPollById = (id) => (pollContext?.allPollsSorted || []).find((poll) => String(poll?.id || '') === String(id || '')) || null
  const findPollByLabel = (label) => {
    const { pollster: targetPollster, date: targetDate } = parseSourceLabel(label)
    if (!targetPollster) return null

    const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
    const targetKey = clean(targetPollster)

    return allPollsSorted.find((poll) => {
      const pollster = clean(poll?.pollster)
      if (!pollster || pollster !== targetKey) return false

      if (!targetDate) return true

      const dates = [poll?.fieldworkEnd, poll?.publishedAt, poll?.date, poll?.fieldworkStart]
        .map((value) => String(value || '').trim())
        .filter(Boolean)

      return dates.includes(targetDate)
    }) || null
  }
  const findPollsterByLabel = (label) => {
    const { pollster } = parseSourceLabel(label)
    return pollster || null
  }
  const totalPoints = useMemo(() => displayTrends?.length || 0, [displayTrends])
  const latestDate = displayTrends?.[displayTrends.length - 1]?.fullDate || ''
  const latestValues = useMemo(() => getLatestValues(displayTrends), [displayTrends])
  const trendStory = useMemo(() => buildTrendStory(displayTrends, pollContext), [displayTrends, pollContext])
  const whyThisMatters = useMemo(() => buildTrendWhyThisMatters(displayTrends), [displayTrends])
  const topThreeKeys = useMemo(() => latestValues.slice(0, 3).map((party) => party.key), [latestValues])
  const scopeHidden = useMemo(() => {
    const next = {}
    PARTY_KEYS.forEach((party) => {
      next[party.key] = scope === 'top3' && !topThreeKeys.includes(party.key)
    })
    return next
  }, [scope, topThreeKeys])
  const chartHidden = useMemo(() => {
    if (!focusedPartyKey) return {}

    const next = {}
    PARTY_KEYS.forEach((party) => {
      next[party.key] = party.key !== focusedPartyKey
    })
    return next
  }, [focusedPartyKey])
  const toggleFocus = (key) => {
    if (scope === 'top3' && !topThreeKeys.includes(key)) return
    setFocusedPartyKey((current) => (current === key ? null : key))
  }

  React.useEffect(() => {
    if (focusedPartyKey && scopeHidden[focusedPartyKey]) {
      setFocusedPartyKey(null)
    }
  }, [focusedPartyKey, scopeHidden])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} />

      <div style={{ padding: '12px 16px 40px' }}>
        {!displayTrends.length ? (
          <div
            style={{
              borderRadius: 14,
              padding: '18px 16px',
              marginBottom: 12,
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              fontSize: 14,
              fontWeight: 600,
              color: T.tl,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Trend data will appear here once enough polls are loaded.
          </div>
        ) : null}

        <div
          style={{
            borderRadius: 14,
            padding: '12px 12px 10px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: T.th,
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: 6,
            }}
          >
            {trendStory.headline}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 550,
              color: T.tl,
              textAlign: 'center',
              lineHeight: 1.45,
              marginBottom: 9,
            }}
          >
            {trendStory.subhead}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: T.tl,
              }}
            >
              View
            </span>
            <div
              style={{
                display: 'inline-flex',
                borderRadius: 999,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                background: T.sf,
                padding: 3,
                gap: 3,
              }}
            >
              {[
                { key: 'all', label: 'All parties' },
                { key: 'top3', label: 'Top 3 only' },
              ].map((option) => (
                <div
                  key={option.key}
                  onClick={() => {
                    haptic(4)
                    setScope(option.key)
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: scope === option.key ? T.c0 : T.th,
                    background: scope === option.key ? T.pr : 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    boxShadow: scope === option.key ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>

          <SharedTrendChart
            trends={displayTrends}
            rawPolls={pollContext?.allPollsSorted || []}
            hidden={chartHidden}
            hardHidden={scopeHidden}
            T={T}
            findPollById={findPollById}
            findPollByLabel={findPollByLabel}
            findPollsterByLabel={findPollsterByLabel}
            onOpenPoll={(poll) => nav?.('pollDetail', { poll })}
            onOpenPollster={(pollster) => nav?.('pollster', { pollster })}
            metaText={[
              latestDate ? `Latest point: ${latestDate}` : null,
              totalPoints ? `${totalPoints} trend points` : null,
            ].filter(Boolean).join(' · ')}
          />
        </div>

        <WhyThisMattersCard T={T} bullets={whyThisMatters} />

        <div
          style={{
            borderRadius: 14,
            padding: '11px 12px 10px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            marginBottom: milestones.length ? 12 : 0,
          }}
        >
          <SectionLabel T={T}>Party movers</SectionLabel>
          <MovementCards trends={displayTrends} focusedPartyKey={focusedPartyKey} onToggle={toggleFocus} T={T} />
          <div
            style={{
              fontSize: 11.5,
              color: T.tl,
              paddingTop: 7,
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            Tap a party row to focus it. Tap again to clear.
          </div>
        </div>

        {milestones.length ? (
          <>
            <SectionLabel T={T}>Timeline</SectionLabel>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.tl,
                marginBottom: 12,
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              {milestones.length} key events · most recent first
            </div>
            {milestones.map((m, i) => (
              <MilestoneCard key={i} T={T} m={m} />
            ))}
          </>
        ) : null}

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
