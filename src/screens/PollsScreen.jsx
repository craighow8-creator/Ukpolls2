import { useMemo, useState } from 'react'
import { StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'

const TABS = [
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'latest', label: 'Latest Polls' },
  { key: 'trends', label: 'Trends' },
  { key: 'pollsters', label: 'Pollsters' },
  { key: 'methodology', label: 'Methodology' },
]

const PARTY_KEYS = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp']

const PARTY_COLORS = {
  ref: '#12B7D4',
  lab: '#E4003B',
  con: '#0087DC',
  grn: '#02A95B',
  ld: '#FAA61A',
  rb: '#1A4A9E',
  snp: '#C4922A',
}

const PARTY_NAMES = {
  ref: 'Reform UK',
  lab: 'Labour',
  con: 'Conservative',
  grn: 'Green',
  ld: 'Liberal Democrat',
  rb: 'Restore Britain',
  snp: 'SNP',
}

const RELEASE_POLLSTERS = new Set([
  'yougov',
  'more in common',
  'techne',
  'opinium',
  'ipsos',
])

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/Â·/g, '·').replace(/\s+/g, ' ').trim()
}

function normalisePollster(value) {
  return cleanText(value).toLowerCase()
}

function parseDateish(value) {
  const text = cleanText(value)
  if (!text) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const d = new Date(text)
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [dd, mm, yyyy] = text.split('-').map(Number)
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (/^\d{1,2}\s+[A-Za-z]{3,9}(\s*[-–]\s*\d{1,2}\s+[A-Za-z]{3,9})?$/.test(text)) {
    const chunk = text.split(/[-–]/)[0].trim()
    const d = new Date(`${chunk} ${new Date().getFullYear()}`)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(text)
  return Number.isNaN(d.getTime()) ? null : d
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

function displaySubMeta(poll) {
  const parts = [
    poll?.sample ? `Sample ${poll.sample}` : null,
    cleanText(poll?.method),
    cleanText(poll?.mode),
  ].filter(Boolean)

  return parts.join(' · ')
}

function hasLiveSource(poll) {
  return !!cleanText(poll?.sourceUrl)
}

function isImportedPoll(poll) {
  return hasLiveSource(poll)
}

function pollSortScore(poll) {
  return cleanText(poll?.publishedAt) || cleanText(poll?.fieldworkEnd) || cleanText(poll?.fieldworkStart) || cleanText(poll?.date) || ''
}

function keepLatestPollPerPollster(polls) {
  const latest = new Map()

  for (const poll of polls || []) {
    const name = cleanText(poll?.pollster)
    if (!name) continue
    const current = latest.get(name)
    if (!current || pollSortScore(poll) > pollSortScore(current)) {
      latest.set(name, poll)
    }
  }

  return [...latest.values()].sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a)))
}

function getVisibleTrendPolls(polls, months = 3) {
  const sorted = [...(polls || [])].sort((a, b) => {
    const ad = parseDateish(displayDate(a))
    const bd = parseDateish(displayDate(b))
    return (ad?.getTime() || 0) - (bd?.getTime() || 0)
  })

  const latest = sorted[sorted.length - 1]
  const latestDate = parseDateish(displayDate(latest))
  if (!latestDate) return sorted

  const start = new Date(latestDate)
  start.setUTCMonth(start.getUTCMonth() - months)

  const filtered = sorted.filter((poll) => {
    const d = parseDateish(displayDate(poll))
    return d ? d >= start : true
  })

  return filtered.length ? filtered : sorted
}

function formatMonthLabel(value) {
  const d = parseDateish(value)
  if (!d) return cleanText(value)
  return d.toLocaleDateString('en-GB', { month: 'short' })
}

function getPollResults(poll) {
  return PARTY_KEYS
    .map((key) => {
      const pct = safeNumber(poll?.[key])
      if (pct == null) return null
      return {
        key,
        pct,
        color: PARTY_COLORS[key],
        name: PARTY_NAMES[key],
        short: key === 'ld' ? 'LD' : key === 'snp' ? 'SNP' : key === 'rb' ? 'RB' : key.toUpperCase(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct)
}

function buildSeries(polls, partyKey) {
  return polls.map((poll) => safeNumber(poll?.[partyKey])).filter((v) => v != null).slice(-12)
}

function groupPollsByPollster(polls) {
  const map = new Map()

  for (const poll of polls || []) {
    const name = cleanText(poll?.pollster)
    if (!name) continue
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(poll)
  }

  return [...map.entries()]
    .map(([name, list]) => ({
      name,
      polls: [...list].sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a))),
      latestPoll: [...list].sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a)))[0],
    }))
    .sort((a, b) => (b.polls.length !== a.polls.length ? b.polls.length - a.polls.length : a.name.localeCompare(b.name)))
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

function MiniBar({ value, max, color, T, height = 8 }) {
  const pct = Math.max(2, Math.min(100, ((value || 0) / Math.max(max || 1, 1)) * 100))
  return (
    <div
      style={{
        flex: 1,
        height,
        borderRadius: 999,
        background: T.c1 || 'rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 999,
        }}
      />
    </div>
  )
}

function HeroSnapshot({ T, parties, latestLivePoll, nav }) {
  const main = (parties || []).filter((p) => p.name !== 'Other').sort((a, b) => (b.pct || 0) - (a.pct || 0))
  const topFive = main.slice(0, 5)
  const leader = main[0]
  const runnerUp = main[1]
  const gap = leader && runnerUp ? +((safeNumber(leader.pct) || 0) - (safeNumber(runnerUp.pct) || 0)).toFixed(1) : null

  if (!leader) return null

  return (
    <div
      style={{
        borderRadius: 18,
        padding: '18px 18px 16px',
        marginBottom: 14,
        background: T.c0,
        border: `1px solid ${(leader.color || T.pr)}30`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Badge color={leader.color || T.pr}>Polling snapshot</Badge>
        {latestLivePoll ? <Badge color={T.pr} subtle>Latest live poll</Badge> : null}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: leader.color || T.th,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        {leader.abbr || leader.name}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: T.th,
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        {leader.pct}% {gap != null && runnerUp ? `· leads ${runnerUp.abbr || runnerUp.name} by ${gap}pt` : ''}
      </div>

      {latestLivePoll ? (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.tl,
            textAlign: 'center',
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          Latest live poll: {cleanText(latestLivePoll.pollster)} · {displayDate(latestLivePoll)}
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topFive.map((party, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr 40px',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: party.color, textAlign: 'left' }}>{party.abbr}</div>
            <MiniBar value={party.pct} max={leader.pct || 1} color={party.color} T={T} height={9} />
            <div style={{ fontSize: 13, fontWeight: 800, color: party.color, textAlign: 'right' }}>{party.pct}%</div>
          </div>
        ))}
      </div>

      {latestLivePoll ? (
        <div
          onClick={() => {
            haptic(6)
            nav('pollDetail', { poll: latestLivePoll })
          }}
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: 700,
            color: T.pr,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          Open latest live poll →
        </div>
      ) : null}
    </div>
  )
}

function PollCard({ T, poll, nav }) {
  const results = getPollResults(poll)
  const leader = results[0]
  const max = leader?.pct || 30
  const subMeta = displaySubMeta(poll)
  const live = isImportedPoll(poll)
  const sourceText = cleanText(poll?.source)
  const sourceUrl = cleanText(poll?.sourceUrl)

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollDetail', { poll })
      }}
      style={{
        borderRadius: 16,
        padding: '16px',
        marginBottom: 10,
        background: T.c0,
        border: `1px solid ${live ? (leader?.color || T.pr) + '33' : T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            onClick={(e) => {
              e.stopPropagation()
              if (poll?.pollster) {
                haptic(6)
                nav('pollster', { pollster: poll.pollster })
              }
            }}
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: T.th,
              cursor: poll?.pollster ? 'pointer' : 'default',
              textAlign: 'left',
            }}
          >
            {cleanText(poll?.pollster) || 'Unknown pollster'}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.tl,
              marginTop: 3,
              textAlign: 'left',
            }}
          >
            {displayDate(poll)}
          </div>

          {subMeta ? (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: T.tl,
                opacity: 0.85,
                marginTop: 4,
                textAlign: 'left',
                lineHeight: 1.4,
              }}
            >
              {subMeta}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {live ? <Badge color={T.pr}>Live import</Badge> : <Badge color={T.tl} subtle>Archive</Badge>}
          {leader ? <Badge color={leader.color} subtle>{leader.name} leads</Badge> : null}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {results.map((r) => (
          <div
            key={r.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '44px 1fr 34px',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: r.color, textAlign: 'left' }}>{r.short}</div>
            <MiniBar value={r.pct} max={max} color={r.color} T={T} />
            <div style={{ fontSize: 13, fontWeight: 800, color: r.color, textAlign: 'right' }}>{r.pct}%</div>
          </div>
        ))}
      </div>

      {sourceText || sourceUrl ? (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            fontSize: 12,
            fontWeight: 600,
            color: T.tl,
            lineHeight: 1.45,
            textAlign: 'center',
          }}
        >
          {sourceText || 'Source available'}
        </div>
      ) : null}

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: T.tl,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        Open poll detail →
      </div>
    </div>
  )
}

function PollsterCard({ T, group, nav }) {
  const latest = group.latestPoll
  const latestResults = getPollResults(latest).slice(0, 5)
  const liveCount = group.polls.filter((p) => isImportedPoll(p)).length

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollster', { pollster: group.name })
      }}
      style={{
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{group.name}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 4 }}>
            {group.polls.length} poll{group.polls.length === 1 ? '' : 's'} stored
            {liveCount ? ` · ${liveCount} live` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge color={latest?.isBpcMember ? T.pr : T.tl} subtle>
            {latest?.isBpcMember ? 'BPC member' : 'Pollster'}
          </Badge>
        </div>
      </div>

      {latest ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.tl, marginTop: 10, textAlign: 'center' }}>
            Latest: {displayDate(latest)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            {latestResults.map((r) => (
              <div key={r.key} style={{ fontSize: 13, fontWeight: 800, color: r.color }}>
                {r.short} {r.pct}%
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div style={{ fontSize: 12, fontWeight: 700, color: T.tl, marginTop: 10, textAlign: 'center' }}>
        Open pollster profile →
      </div>
    </div>
  )
}

function getTrendValuesFromParties(parties, polls) {
  return (parties || [])
    .filter((p) => p.name !== 'Other')
    .map((p) => {
      const key = PARTY_KEYS.find((k) => PARTY_NAMES[k] === p.name || p.abbr?.toLowerCase() === k)
      const series = key ? buildSeries(polls, key) : []
      const delta = series.length >= 2 ? +(series[series.length - 1] - series[0]).toFixed(1) : null
      return {
        key,
        name: p.name,
        abbr: p.abbr,
        color: p.color,
        current: safeNumber(p.pct),
        delta,
        series,
      }
    })
    .filter((p) => p.key && p.current != null)
    .sort((a, b) => b.current - a.current)
}

function getTrendLabel(delta) {
  if (delta == null) return { text: 'Flat', color: null }
  if (delta > 0.4) return { text: 'Rising', color: '#02A95B' }
  if (delta < -0.4) return { text: 'Slipping', color: '#C8102E' }
  return { text: 'Stable', color: null }
}

function formatDelta(delta) {
  if (delta == null) return ''
  return `${delta > 0 ? '+' : ''}${delta}pt`
}

function ordinalWord(n) {
  if (n === 1) return 'first'
  if (n === 2) return 'second'
  if (n === 3) return 'third'
  if (n === 4) return 'fourth'
  if (n === 5) return 'fifth'
  return `${n}th`
}

function buildTrendTakeaway({ parties, polls, focusedKey, hidden }) {
  const trendPolls = getVisibleTrendPolls(polls, 3)
  const values = getTrendValuesFromParties(parties, trendPolls)
  const visible = values.filter((p) => !hidden?.[p.key])

  if (!visible.length) {
    return {
      headline: 'No visible trend lines',
      subhead: 'Bring a party back into view to rebuild the trend picture.',
    }
  }

  if (focusedKey) {
    const focused = values.find((p) => p.key === focusedKey && !hidden?.[p.key])
    if (!focused) {
      return {
        headline: 'Trend focus cleared',
        subhead: 'All visible lines are back in the wider trend picture.',
      }
    }

    const rank = values.findIndex((p) => p.key === focused.key) + 1
    const rankText = rank ? ordinalWord(rank) : null
    const label = getTrendLabel(focused.delta)

    let headline = `${focused.name} sit ${rankText} on ${focused.current}%`
    let subhead = `${focused.name} look ${label.text.toLowerCase()} in the recent trend picture.`

    if (focused.delta != null && Math.abs(focused.delta) > 0.4) {
      subhead = `${focused.name} are ${formatDelta(focused.delta)} across the recent trend window.`
    }

    if (focused.delta != null && Math.abs(focused.delta) <= 0.4) {
      subhead = `${focused.name} are broadly flat across the recent trend window.`
    }

    return { headline, subhead }
  }

  const leader = visible[0]
  const second = visible[1]
  const moversUp = [...visible].filter((p) => p.delta != null).sort((a, b) => (b.delta || 0) - (a.delta || 0))
  const moversDown = [...visible].filter((p) => p.delta != null).sort((a, b) => (a.delta || 0) - (b.delta || 0))
  const rising = moversUp[0]
  const falling = moversDown[0]
  const gap = leader && second ? +((leader.current || 0) - (second.current || 0)).toFixed(1) : null

  let headline = leader
    ? `${leader.name} still lead on ${leader.current}%`
    : 'Trend picture remains active'

  let parts = []

  if (leader && second && gap != null) {
    parts.push(`${leader.name} are ${gap}pt ahead of ${second.name}.`)
  }

  if (rising && rising.delta != null && rising.delta > 0.4) {
    parts.push(`${rising.name} are the clearest risers.`)
  }

  if (
    falling &&
    falling.delta != null &&
    falling.delta < -0.4 &&
    (!rising || falling.key !== rising.key)
  ) {
    parts.push(`${falling.name} have softened most.`)
  }

  if (!parts.length) {
    parts.push('Recent movement remains fairly contained across the visible trend window.')
  }

  return {
    headline,
    subhead: parts.join(' '),
  }
}

function CompactMovers({ movers, hidden, focused, onPress, T }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {movers.map((p) => {
        const hiddenNow = !!hidden[p.key]
        const focusedNow = focused === p.key && !hiddenNow
        const activeNow = !hiddenNow
        const label = getTrendLabel(p.delta)

        return (
          <div
            key={p.key}
            onClick={() => {
              haptic(4)
              onPress(p.key)
            }}
            style={{
              borderRadius: 16,
              padding: '11px 13px',
              background: activeNow ? `${p.color}1F` : `${p.color}0D`,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              alignItems: 'start',
              cursor: 'pointer',
              opacity: hiddenNow ? 0.3 : 1,
              transform: focusedNow ? 'translateY(-1px)' : 'none',
              transition: 'opacity 0.2s ease, transform 0.2s ease, background 0.2s ease',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: p.color,
                  lineHeight: 1.2,
                  textAlign: 'left',
                }}
              >
                {p.name}
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: label.color || T.tl,
                  marginTop: 5,
                  lineHeight: 1.25,
                  textAlign: 'left',
                }}
              >
                {label.text}{p.delta != null ? ` · ${formatDelta(p.delta)}` : ''}
              </div>
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: p.color,
                lineHeight: 1,
                textAlign: 'right',
                paddingTop: 1,
              }}
            >
              {p.current}%
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PremiumTrendChart({
  polls,
  hidden,
  focused,
  setFocused,
  selectedIndex,
  setSelectedIndex,
  resetToAll,
  T,
}) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const trendPolls = getVisibleTrendPolls(polls, 3)

  const baseKeys = ['ref', 'lab', 'con', 'grn', 'ld']
  const optionalKeys = []
  if (trendPolls.some((poll) => safeNumber(poll?.rb) != null)) optionalKeys.push('rb')
  if (trendPolls.some((poll) => safeNumber(poll?.snp) != null)) optionalKeys.push('snp')

  const orderedKeys = [...baseKeys, ...optionalKeys]

  const series = orderedKeys
    .map((key) => {
      const points = trendPolls
        .map((poll, i) => {
          const value = safeNumber(poll?.[key])
          return value == null ? null : {
            i,
            value,
            date: displayDate(poll),
            poll,
          }
        })
        .filter(Boolean)

      return {
        key,
        label: PARTY_NAMES[key],
        short: key === 'ld' ? 'LD' : key === 'snp' ? 'SNP' : key === 'rb' ? 'RB' : key.toUpperCase(),
        color: PARTY_COLORS[key],
        points,
        latest: points[points.length - 1]?.value ?? null,
      }
    })
    .filter((item) => item.points.length >= 2)

  const visibleSeries = series.filter((item) => !hidden[item.key])
  if (!visibleSeries.length) return null

  const activeFocus = hoveredKey || focused
  const allVals = visibleSeries.flatMap((s) => s.points.map((p) => p.value))
  const minV = Math.max(0, Math.floor((Math.min(...allVals) - 2) / 5) * 5)
  const maxV = Math.min(100, Math.ceil((Math.max(...allVals) + 2) / 5) * 5)
  const yRange = Math.max(maxV - minV, 5)

  const pointCount = trendPolls.length
  const COL = 84
  const LEFT = 22
  const RIGHT = 72
  const TOP = 20
  const BOTTOM = 38
  const H = 340
  const INNER_H = H - TOP - BOTTOM
  const W = Math.max(520, LEFT + RIGHT + Math.max(pointCount - 1, 1) * COL)

  const xPos = (i) => LEFT + i * COL
  const yPos = (value) => TOP + INNER_H - ((value - minV) / yRange) * INNER_H

  const selected = selectedIndex == null ? pointCount - 1 : selectedIndex

  const months = []
  let lastMonth = ''
  trendPolls.forEach((poll, i) => {
    const label = formatMonthLabel(displayDate(poll))
    if (label !== lastMonth) {
      months.push({ i, label })
      lastMonth = label
    }
  })

  const gridVals = []
  for (let v = minV; v <= maxV; v += 5) gridVals.push(v)

  const tooltipRows = visibleSeries
    .map((s) => {
      const point = s.points.find((p) => p.i === selected)
      return point ? { ...s, selectedValue: point.value } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.selectedValue - a.selectedValue)

  const activeDate = trendPolls[selected] ? displayDate(trendPolls[selected]) : displayDate(trendPolls[trendPolls.length - 1])

  return (
    <>
      <div
        style={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          paddingBottom: 8,
        }}
      >
        <div
          style={{
            position: 'sticky',
            left: 0,
            top: 0,
            bottom: 0,
            width: 18,
            pointerEvents: 'none',
            background: `linear-gradient(90deg, ${T.c0} 0%, ${T.c0}cc 50%, transparent 100%)`,
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'sticky',
            float: 'right',
            right: 0,
            top: 0,
            bottom: 0,
            width: 24,
            pointerEvents: 'none',
            background: `linear-gradient(270deg, ${T.c0} 0%, ${T.c0}cc 45%, transparent 100%)`,
            zIndex: 2,
          }}
        />

        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          style={{ display: 'block', overflow: 'visible' }}
          onClick={() => {
            resetToAll()
          }}
        >
          {gridVals.map((v) => (
            <g key={v}>
              <line x1={LEFT} y1={yPos(v)} x2={W - RIGHT + 12} y2={yPos(v)} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
              <text x={LEFT - 8} y={yPos(v) + 4} textAnchor="end" fontSize="11" fill={T.tl}>{v}</text>
            </g>
          ))}

          {months.map((m) => (
            <text key={m.i} x={xPos(m.i)} y={H - 10} textAnchor="middle" fontSize="11" fill={T.tl} fontWeight="700">
              {m.label}
            </text>
          ))}

          <line
            x1={xPos(selected)}
            y1={TOP}
            x2={xPos(selected)}
            y2={H - BOTTOM}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {visibleSeries.map((s) => {
            const pts = s.points.map((p) => ({ ...p, x: xPos(p.i), y: yPos(p.value) }))
            const pathD = pts
              .map((pt, idx) => {
                if (idx === 0) return `M${pt.x},${pt.y}`
                const prev = pts[idx - 1]
                const cpx = (prev.x + pt.x) / 2
                return `C${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`
              })
              .join(' ')

            const selectedSeries = hoveredKey ? hoveredKey === s.key : focused ? focused === s.key : false
            const dim = hoveredKey ? hoveredKey !== s.key : false

            return (
              <g key={s.key}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={selectedSeries ? 4 : 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={dim ? 0.18 : 1}
                  style={{ transition: 'opacity 0.2s ease, stroke-width 0.2s ease' }}
                />

                {pts.map((pt, idx) => {
                  const selectedPoint = idx === pts.length - 1 || pt.i === selected
                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={selectedPoint ? 5 : 3.5}
                        fill={selectedPoint ? s.color : T.c0}
                        stroke={s.color}
                        strokeWidth={2}
                        opacity={dim ? 0.18 : 1}
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={18}
                        fill="transparent"
                        onMouseEnter={() => setHoveredKey(s.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        onClick={(e) => {
                          e.stopPropagation()
                          haptic(4)
                          setFocused(s.key)
                          setSelectedIndex(pt.i)
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </g>
                  )
                })}

                {pts[pts.length - 1] ? (
                  <text
                    x={W - RIGHT + 18}
                    y={pts[pts.length - 1].y + 4}
                    fontSize="12"
                    fontWeight="800"
                    fill={s.color}
                    opacity={dim ? 0.35 : 1}
                  >
                    {s.short} {s.latest}%
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>

      <div
        style={{
          marginTop: 12,
          borderRadius: 14,
          padding: '12px 14px',
          background: T.sf,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 8, textAlign: 'center' }}>
          {activeDate}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {tooltipRows.map((row) => (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.tm, flex: 1 }}>{row.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: row.color }}>{row.selectedValue}%</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function CombinedTrendCard({
  T,
  polls,
  parties,
  hidden,
  focused,
  setFocused,
  setHidden,
  selectedIndex,
  setSelectedIndex,
}) {
  const trendPolls = getVisibleTrendPolls(polls, 3)
  const story = buildTrendTakeaway({
    parties,
    polls: trendPolls,
    focusedKey: focused,
    hidden,
  })

  const movers = getTrendValuesFromParties(parties, trendPolls).filter((m) => PARTY_KEYS.includes(m.key))

  const handleMoverPress = (key) => {
    const currentlyHidden = !!hidden[key]
    const currentlyVisibleCount = movers.filter((m) => !hidden[m.key]).length

    if (!currentlyHidden && currentlyVisibleCount <= 1) {
      return
    }

    setHidden((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))

    if (!currentlyHidden && focused === key) {
      setFocused(null)
    }

    if (currentlyHidden && focused == null) {
      return
    }
  }

  const resetToAll = () => {
    setFocused(null)
    setHidden({})
  }

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        background: T.c0,
        marginBottom: 12,
      }}
    >
      <div style={{ padding: '16px 16px 12px' }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: T.th,
            textAlign: 'left',
            lineHeight: 1.2,
            minHeight: 22,
            transition: 'opacity 0.18s ease',
          }}
        >
          {story.headline}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.tl,
            textAlign: 'left',
            lineHeight: 1.55,
            marginTop: 7,
            minHeight: 38,
            transition: 'opacity 0.18s ease',
          }}
        >
          {story.subhead}
        </div>

        <div style={{ marginTop: 14 }}>
          <PremiumTrendChart
            polls={trendPolls}
            hidden={hidden}
            focused={focused}
            setFocused={setFocused}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            resetToAll={resetToAll}
            T={T}
          />
        </div>
      </div>

      <div
        style={{
          background: T.sf,
          padding: '10px 12px 12px',
        }}
      >
        <CompactMovers
          movers={movers}
          hidden={hidden}
          focused={focused}
          onPress={handleMoverPress}
          T={T}
        />
      </div>
    </div>
  )
}

function MethodologyCard({ T, title, body }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '14px 15px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800, color: T.th, marginBottom: 5, textAlign: 'center' }}>
        {title}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, lineHeight: 1.65, textAlign: 'center' }}>
        {body}
      </div>
    </div>
  )
}

function ScrollAwayHeader({ T, latestLivePoll }) {
  return (
    <div style={{ padding: '8px 16px 10px' }}>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
          color: T.th,
          textAlign: 'center',
        }}
      >
        Polls
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
          Polling journey · latest race · pollsters · trends
        </div>
        <InfoButton id="poll_average" T={T} size={20} />
      </div>

      {latestLivePoll ? (
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
          Latest live poll in feed: {latestLivePoll.pollster} · {displayDate(latestLivePoll)}
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

export default function PollsScreen({ T, parties, polls, meta, nav }) {
  const [tab, setTab] = useState('snapshot')
  const [trendHidden, setTrendHidden] = useState({})
  const [trendFocused, setTrendFocused] = useState(null)
  const [trendSelectedIndex, setTrendSelectedIndex] = useState(null)

  const allPolls = useMemo(() => {
    const raw = Array.isArray(polls) ? polls : []
    return [...raw]
      .filter((poll) => RELEASE_POLLSTERS.has(normalisePollster(poll?.pollster)))
      .sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a)))
  }, [polls])

  const importedPolls = useMemo(() => allPolls.filter((poll) => isImportedPoll(poll)), [allPolls])
  const latestPolls = useMemo(() => keepLatestPollPerPollster(importedPolls.length ? importedPolls : allPolls), [allPolls, importedPolls])
  const latestLivePoll = latestPolls[0] || importedPolls[0] || null

  const mainParties = useMemo(
    () => (Array.isArray(parties) ? parties : []).filter((p) => p.name !== 'Other').sort((a, b) => (b.pct || 0) - (a.pct || 0)),
    [parties],
  )

  const pollsterGroups = useMemo(() => groupPollsByPollster(allPolls), [allPolls])

  const topTwo = mainParties.slice(0, 2)
  const gap = topTwo.length === 2 ? +((safeNumber(topTwo[0].pct) || 0) - (safeNumber(topTwo[1].pct) || 0)).toFixed(1) : null

  void meta

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} latestLivePoll={latestLivePoll} />
      <StickyPillsBar T={T} tab={tab} setTab={setTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {tab === 'snapshot' ? (
          <>
            <HeroSnapshot T={T} parties={mainParties} latestLivePoll={latestLivePoll} nav={nav} />

            {topTwo.length === 2 ? (
              <div
                style={{
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 12,
                  background: T.c0,
                  border: `1px solid ${(topTwo[0].color || T.pr)}22`,
                }}
              >
                <SectionLabel T={T}>Race state</SectionLabel>

                <div style={{ fontSize: 23, fontWeight: 800, color: T.th, textAlign: 'center', lineHeight: 1.15 }}>
                  {topTwo[0].name} lead by {gap}pt
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <Badge color={topTwo[0].color}>{topTwo[0].abbr} {topTwo[0].pct}%</Badge>
                  <Badge color={topTwo[1].color} subtle>{topTwo[1].abbr} {topTwo[1].pct}%</Badge>
                </div>
              </div>
            ) : null}

            {latestPolls[0] ? (
              <>
                <SectionLabel
                  T={T}
                  action={{
                    label: 'See all',
                    onClick: () => {
                      haptic(6)
                      setTab('latest')
                    },
                  }}
                >
                  Latest poll
                </SectionLabel>
                <PollCard T={T} poll={latestPolls[0]} nav={nav} />
              </>
            ) : null}

            <SectionLabel
              T={T}
              action={{
                label: 'See all',
                onClick: () => {
                  haptic(6)
                  setTab('pollsters')
                },
              }}
            >
              Pollster directory
            </SectionLabel>

            {pollsterGroups.slice(0, 5).map((group) => (
              <PollsterCard key={group.name} T={T} group={group} nav={nav} />
            ))}
          </>
        ) : null}

        {tab === 'latest' ? (
          <>
            <SectionLabel T={T}>Latest polls</SectionLabel>

            <div
              style={{
                borderRadius: 14,
                padding: '12px 14px',
                marginBottom: 12,
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge color={T.pr}>{importedPolls.length ? 'Live-first ordering' : 'Archive view'}</Badge>
                <Badge color={T.tl} subtle>{latestPolls.length} shown</Badge>
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
                Live-imported polls are prioritised when available. Older legacy rows stay visible below until the archive is fully cleaned.
              </div>
            </div>

            {latestPolls.map((poll) => (
              <PollCard key={poll.id || `${poll.pollster}-${displayDate(poll)}`} T={T} poll={poll} nav={nav} />
            ))}

            {latestPolls.length === 0 ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: T.tl, textAlign: 'center' }}>
                No polls loaded yet.
              </div>
            ) : null}
          </>
        ) : null}

        {tab === 'trends' ? (
          <CombinedTrendCard
            T={T}
            polls={allPolls}
            parties={mainParties}
            hidden={trendHidden}
            focused={trendFocused}
            setFocused={setTrendFocused}
            setHidden={setTrendHidden}
            selectedIndex={trendSelectedIndex}
            setSelectedIndex={setTrendSelectedIndex}
          />
        ) : null}

        {tab === 'pollsters' ? (
          <>
            <SectionLabel T={T}>Pollsters</SectionLabel>

            {pollsterGroups.map((group) => (
              <PollsterCard key={group.name} T={T} group={group} nav={nav} />
            ))}

            <div
              style={{
                borderRadius: 14,
                padding: '13px 14px',
                marginTop: 12,
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 5, textAlign: 'center' }}>
                Pollster transparency
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6, textAlign: 'center' }}>
                Pollsters are now treated as real entities. Next stage should deepen this with methodology notes, BPC status, commissioner context and house-effect comparison.
              </div>
            </div>
          </>
        ) : null}

        {tab === 'methodology' ? (
          <>
            <SectionLabel T={T}>How polls are shown</SectionLabel>

            <MethodologyCard
              T={T}
              title="Live imports first"
              body="When a poll has a real source link and imported metadata, it is treated as a live-imported poll and shown ahead of older legacy archive rows."
            />

            <MethodologyCard
              T={T}
              title="Fieldwork matters"
              body="Polling dates can mean different things. Where possible, fieldwork and published dates should both be stored, because a poll released today may reflect interviews done earlier."
            />

            <MethodologyCard
              T={T}
              title="Sample size is useful, not magic"
              body="Larger samples usually reduce random error, but weighting, turnout modelling and panel quality still matter. Bigger does not automatically mean better."
            />

            <MethodologyCard
              T={T}
              title="Why pollsters differ"
              body="Different turnout assumptions, house effects, weighting models and undecided-voter treatment can produce different results even in the same week."
            />

            <MethodologyCard
              T={T}
              title="Trends are directional"
              body="Trend views help show movement across the visible recent range. They are for direction of travel, not certainty or prediction."
            />
          </>
        ) : null}
      </div>
    </div>
  )
}