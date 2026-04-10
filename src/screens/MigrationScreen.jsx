import React, { useMemo, useState } from 'react'
import { ScrollArea, StickyPills } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { MIGRATION_POLICIES } from '../data/policy/migrationPolicies'
import { getPartyByName } from '../data/partyRegistry'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'breakdown', label: 'Breakdown' },
  { key: 'visas', label: 'Visas' },
  { key: 'parties', label: 'Party views' },
]

const OVERVIEW_FALLBACK = {
  fetchYear: 'ONS · Year ending June 2025',
  netTotal: 204000,
  netPrev: 649000,
  netPrev2: 944000,
}

function fmt(n) {
  const value = Number(n || 0)
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}m`
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`
  return `${Math.round(value)}`
}

function pct(value, digits = 0) {
  if (!Number.isFinite(value)) return '0%'
  return `${value.toFixed(digits)}%`
}

function formatSignedCompact(value, suffix = '') {
  if (!Number.isFinite(value)) return ''
  const rounded = Math.abs(value) >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}${suffix}`
}

function hasVisaData(M = {}) {
  return Array.isArray(M.byVisa) && M.byVisa.some((row) => Number(row?.granted ?? row?.count ?? row?.n ?? 0) > 0)
}

function hasNationalityData(M = {}) {
  return Array.isArray(M.byNationality) && M.byNationality.some((row) => {
    const inflow = Number(row?.inflow || 0)
    const outflow = Number(row?.outflow || 0)
    const net = Number(row?.net || 0)
    return inflow > 0 || outflow > 0 || net !== 0
  })
}

function normaliseVisaRows(M = {}) {
  if (!hasVisaData(M)) return []

  return [...(M.byVisa || [])]
    .map((row) => ({
      ...row,
      label: row?.type || row?.route || 'Unknown route',
      total: Number(row?.granted ?? row?.count ?? row?.n ?? 0),
      change: Number.isFinite(row?.change) ? row.change : null,
      color: row?.color || null,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
}

function normaliseNationalityRows(M = {}) {
  if (!hasNationalityData(M)) return []

  return [...(M.byNationality || [])]
    .map((row) => ({
      ...row,
      inflow: Number(row?.inflow || 0),
      outflow: Number(row?.outflow || 0),
      net: row?.net == null ? null : Number(row.net),
    }))
    .filter((row) => row.inflow > 0 || row.outflow > 0 || (row.net != null && row.net !== 0))
    .sort((a, b) => b.inflow - a.inflow)
}

function isBritishNationalityRow(row = {}) {
  const name = String(row?.name || '').trim().toLowerCase()
  return /\bbritish\b/.test(name) || ['uk', 'uk nationals', 'united kingdom'].includes(name)
}

function splitNationalityRows(M = {}) {
  const rows = normaliseNationalityRows(M)
  return {
    foreignRows: rows.filter((row) => !isBritishNationalityRow(row)),
    britishRows: rows.filter((row) => isBritishNationalityRow(row)),
  }
}

function deriveMigrationOverviewSummary(M = {}) {
  const usingFallback = !Number.isFinite(M.netTotal)
  const netNow = Number.isFinite(M.netTotal) ? M.netTotal : OVERVIEW_FALLBACK.netTotal
  const prev = Number.isFinite(M.netPrev) ? M.netPrev : OVERVIEW_FALLBACK.netPrev
  const peak = Number.isFinite(M.netPrev2) ? M.netPrev2 : OVERVIEW_FALLBACK.netPrev2
  const fallFromPeak = peak > 0 ? ((peak - netNow) / peak) * 100 : 0
  const changeVsPrev = prev > 0 ? ((netNow - prev) / prev) * 100 : 0
  const visas = normaliseVisaRows(M)
  const topVisa = visas[0] || null

  let headline = 'Net migration remains well below the 2023 peak'
  if (fallFromPeak < 25) headline = 'Net migration remains elevated by recent standards'
  else if (fallFromPeak >= 60) headline = 'Net migration has fallen sharply from its peak'

  let body = `The latest estimate is ${fmt(netNow)}, ${pct(fallFromPeak)} below the 2023 high.`
  if (topVisa) {
    body = `${body} Study and work routes still shape the legal migration picture.`
  } else if (usingFallback) {
    body = `${body} This view uses the maintained headline series while route detail catches up.`
  } else {
    body = `${body} Detailed route data is thinner than the headline series.`
  }

  return {
    headline,
    body,
    context: usingFallback ? 'Using maintained headline series while fuller route data updates' : 'Latest net migration estimate and recent direction',
    stats: [
      { label: 'CURRENT', value: fmt(netNow), meta: 'Latest estimate', color: '#02A95B' },
      { label: 'FROM PEAK', value: `↓ ${pct(fallFromPeak)}`, meta: `${fmt(peak)} in 2023`, color: '#12B7D4' },
      { label: 'VS 2024', value: `${changeVsPrev < 0 ? '↓' : '↑'} ${pct(Math.abs(changeVsPrev))}`, meta: `${fmt(prev)} previous`, color: changeVsPrev < 0 ? '#02A95B' : '#E4003B' },
    ],
    netNow,
    prev,
    peak,
    downPct: Math.round(fallFromPeak),
    usingFallback,
  }
}

function deriveBreakdownSummary(M = {}) {
  const { foreignRows, britishRows } = splitNationalityRows(M)
  if (!foreignRows.length) {
    return {
      available: false,
      headline: 'Detailed nationality routes are not available yet',
      body: britishRows.length
        ? 'British nationality movement is available, but foreign source-country detail is not ready.'
        : 'This view will update once source-country migration detail is loaded.',
      stats: [],
    }
  }

  const top = foreignRows[0]
  const topFive = foreignRows.slice(0, 5)
  const totalTopFive = topFive.reduce((sum, row) => sum + row.inflow, 0)
  const topShare = totalTopFive > 0 ? (top.inflow / totalTopFive) * 100 : 0
  const foreignOutflow = foreignRows.filter((row) => (row.net || 0) < 0)
  const workStudyHeavy = foreignRows.filter((row) => /work|study/i.test(String(row.type || ''))).length

  let headline = `${top.name} is the largest foreign source in view`
  if (topShare >= 35) headline = `${top.name} stands out more clearly than the rest`

  let body = `The foreign inflow picture is led by ${top.name}, with ${workStudyHeavy} main routes work or study-heavy.`
  if (foreignOutflow.length) {
    body = `${body} ${foreignOutflow[0].name} shows net outflow in the foreign-country mix.`
  } else if (britishRows.length) {
    body = `${body} British movement is shown separately as context.`
  }

  return {
    available: true,
    headline,
    body,
    stats: [
      { label: 'TOP SOURCE', value: `${top.name} ${fmt(top.inflow)}`, meta: 'Largest inflow shown', color: '#12B7D4' },
      { label: 'CONCENTRATION', value: pct(topShare), meta: 'Share of top five inflow', color: '#FAA61A' },
      { label: 'FOREIGN NET FLOW', value: foreignOutflow.length ? foreignOutflow[0].name : 'No outflow row', meta: foreignOutflow.length ? `${fmt(Math.abs(foreignOutflow[0].net))} net out` : 'Main foreign routes net positive', color: '#02A95B' },
    ],
  }
}

function deriveVisaSummary(M = {}) {
  const rows = normaliseVisaRows(M)
  if (!rows.length) {
    return {
      available: false,
      headline: 'Visa route detail is awaiting a fuller update',
      body: 'The headline migration series is available, but the visa split is not ready to show yet.',
      stats: [],
    }
  }

  const total = rows.reduce((sum, row) => sum + row.total, 0)
  const top = rows[0]
  const topShare = total > 0 ? (top.total / total) * 100 : 0
  const withChange = rows.filter((row) => Number.isFinite(row.change))
  const biggestMove = withChange.length
    ? [...withChange].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0]
    : null

  let headline = `${top.label} is the largest visa route in view`
  if (topShare >= 45) headline = `${top.label} dominates the visa mix`

  let body = `${top.label} accounts for ${pct(topShare)} of the routes shown.`
  if (biggestMove) {
    body = `${body} ${biggestMove.label} shows the clearest year-on-year movement.`
  } else {
    body = `${body} The current route split is clearer than the direction of change.`
  }

  return {
    available: true,
    headline,
    body,
    stats: [
      { label: 'TOP ROUTE', value: `${top.label} ${fmt(top.total)}`, meta: 'Largest route shown', color: top.color || '#12B7D4' },
      { label: 'ROUTE SHARE', value: pct(topShare), meta: 'Of visible total', color: '#FAA61A' },
      { label: 'BIGGEST MOVE', value: biggestMove ? `${biggestMove.label} ${formatSignedCompact(biggestMove.change, '%')}` : 'Change pending', meta: biggestMove ? 'Vs previous year' : 'No route deltas loaded', color: biggestMove?.change > 0 ? '#E4003B' : '#02A95B' },
    ],
  }
}

function getStanceLabel(score) {
  const value = Number(score)
  if (value >= 9) return 'Maximum restriction'
  if (value >= 7) return 'High restriction'
  if (value >= 5) return 'Controlled reduction'
  if (value >= 3) return 'Managed system'
  return 'Open / liberal'
}

function getPolicyColor(policy) {
  return getPartyByName(policy?.party).color
}

function derivePartySummary(policies = MIGRATION_POLICIES) {
  const ranked = [...policies].sort((a, b) => (b.stanceScore || 0) - (a.stanceScore || 0))
  const toughest = ranked[0]
  const mostOpen = ranked[ranked.length - 1]
  const middle = [...policies].sort((a, b) => Math.abs((a.stanceScore || 0) - 5) - Math.abs((b.stanceScore || 0) - 5))[0]

  return {
    headline: 'The main split is restriction versus managed migration',
    body: `${toughest.party} sits at the most restrictive end, while ${mostOpen.party} is the clearest liberal outlier. ${middle.party} is closest to the controlled-reduction middle ground.`,
    stats: [
      { label: 'HARDEST LINE', value: toughest.party, meta: getStanceLabel(toughest.stanceScore), color: getPolicyColor(toughest) },
      { label: 'MOST OPEN', value: mostOpen.party, meta: getStanceLabel(mostOpen.stanceScore), color: getPolicyColor(mostOpen) },
      { label: 'DIVIDING LINE', value: 'Control vs deterrence', meta: 'Where the contrast sharpens', color: '#FAA61A' },
    ],
  }
}

function SectionLabel({ children, T, quiet = false }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: quiet ? T.tl : T.th,
        marginBottom: 10,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function BriefingCard({ T, title, body, stats = [], context = null, subtle = false }) {
  const visibleStats = stats.filter(Boolean).slice(0, 3)

  return (
    <div
      style={{
        borderRadius: 15,
        padding: subtle ? '14px 14px 12px' : '15px 15px 13px',
        marginBottom: 12,
        background: T.c0,
        border: `1px solid ${subtle ? (T.cardBorder || 'rgba(0,0,0,0.08)') : `${T.pr}26`}`,
      }}
    >
      <SectionLabel T={T} quiet={subtle}>{subtle ? 'Context' : 'Briefing'}</SectionLabel>

      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          fontSize: subtle ? 18 : 21,
          fontWeight: 800,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>

      <div
        style={{
          maxWidth: 540,
          margin: '8px auto 0',
          fontSize: 13,
          fontWeight: 500,
          color: T.tl,
          textAlign: 'center',
          lineHeight: 1.55,
        }}
      >
        {body}
      </div>

      {visibleStats.length ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: visibleStats.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: 8,
            marginTop: 12,
          }}
        >
          {visibleStats.map((stat) => (
            <div
              key={`${stat.label}-${stat.value}`}
              style={{
                borderRadius: 12,
                padding: '10px 11px',
                background: subtle ? T.sf : `${stat.color || T.pr}0C`,
                border: `1px solid ${subtle ? (T.cardBorder || 'rgba(0,0,0,0.06)') : `${stat.color || T.pr}22`}`,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: T.tl,
                  marginBottom: 6,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: stat.color || T.th,
                  lineHeight: 1.15,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: T.tl,
                  lineHeight: 1.35,
                  marginTop: 4,
                }}
              >
                {stat.meta}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {context ? (
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: T.tl,
            textAlign: 'center',
            lineHeight: 1.4,
            marginTop: 10,
          }}
        >
          {context}
        </div>
      ) : null}
    </div>
  )
}

function OverviewStatCard({ T, label, value, sub, color, change }) {
  return (
    <div
      style={{
        borderRadius: 13,
        padding: '12px 13px',
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: T.tl,
          marginBottom: 7,
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
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.tl,
          marginTop: 5,
        }}
      >
        {sub}
      </div>
      {change ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: change.startsWith('▼') ? '#02A95B' : change.startsWith('▲') ? '#E4003B' : T.tl,
            marginTop: 5,
          }}
        >
          {change}
        </div>
      ) : null}
    </div>
  )
}

function DataUnavailable({ T, title, body }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '18px 16px',
        marginBottom: 12,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      <div
        style={{
          maxWidth: 500,
          margin: '8px auto 0',
          fontSize: 13,
          fontWeight: 500,
          color: T.tl,
          textAlign: 'center',
          lineHeight: 1.55,
        }}
      >
        {body}
      </div>
    </div>
  )
}

function MetricRow({ T, title, value, detail, fillPct, color, signal = null, signalColor = null }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 6,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: T.th }}>{title}</div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: color || T.pr }}>{value}</div>
      </div>

      <div
        style={{
          height: 5,
          borderRadius: 999,
          background: T.c1 || 'rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, fillPct || 0))}%`,
            height: '100%',
            background: color || T.pr,
            borderRadius: 999,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 6,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 500, color: T.tl, lineHeight: 1.45 }}>{detail}</div>
        {signal ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: signalColor || T.tl, whiteSpace: 'nowrap' }}>{signal}</div>
        ) : null}
      </div>
    </div>
  )
}

function ContextMovementCard({ T, rows = [] }) {
  const visible = rows.filter(Boolean)
  if (!visible.length) return null

  return (
    <div
      style={{
        borderRadius: 13,
        padding: '12px 14px',
        marginTop: 4,
        marginBottom: 12,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <SectionLabel T={T} quiet>British movement context</SectionLabel>
      {visible.map((row) => {
        const netOut = (row.net || 0) < 0
        const value = row.net == null
          ? row.outflow
            ? `${fmt(row.outflow)} outflow`
            : fmt(row.inflow)
          : netOut
            ? `${fmt(Math.abs(row.net))} net out`
            : `${fmt(row.net)} net in`

        return (
          <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{row.name}</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: T.tl, lineHeight: 1.45, marginTop: 4 }}>
                Shown as nationality movement context, not a foreign source-country route.
              </div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: netOut ? '#02A95B' : T.pr, whiteSpace: 'nowrap' }}>
              {value}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PartyViewCard({ T, party }) {
  const color = getPolicyColor(party)
  const stanceLabel = getStanceLabel(party.stanceScore)

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '13px 14px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <div style={{ fontSize: 14, fontWeight: 800, color }}>{party.party}</div>
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color,
            background: `${color}12`,
            border: `1px solid ${color}22`,
            borderRadius: 999,
            padding: '4px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {stanceLabel}
        </div>
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 700, color: T.th, lineHeight: 1.35 }}>
        {party.positioning}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
        {(party.routes || []).slice(0, 4).map((route) => (
          <div
            key={route}
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: T.tl,
              background: T.sf,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              borderRadius: 999,
              padding: '4px 8px',
            }}
          >
            {route}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 500, color: T.tl, lineHeight: 1.5, marginTop: 8 }}>
        {party.summary}
      </div>

      {Array.isArray(party.sources) && party.sources.length ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {party.sources.slice(0, 2).map((source) => (
            <a
              key={`${party.party}-${source.label}`}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color,
                textDecoration: 'none',
              }}
            >
              {source.label} →
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function MigrationScreen({ T, nav, migration }) {
  const [tab, setTab] = useState('overview')
  const M = migration || {}

  const overview = useMemo(() => deriveMigrationOverviewSummary(M), [M])
  const breakdown = useMemo(() => deriveBreakdownSummary(M), [M])
  const visaSummary = useMemo(() => deriveVisaSummary(M), [M])
  const partySummary = useMemo(() => derivePartySummary(MIGRATION_POLICIES), [])
  const nationalitySplit = useMemo(() => splitNationalityRows(M), [M])
  const nationalityRows = nationalitySplit.foreignRows
  const britishNationalityRows = nationalitySplit.britishRows
  const visaRows = useMemo(() => normaliseVisaRows(M), [M])

  const breakdownMax = nationalityRows.length ? Math.max(...nationalityRows.map((row) => row.inflow || 0)) : 0
  const visaMax = visaRows.length ? Math.max(...visaRows.map((row) => row.total || 0)) : 0

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
          Net Migration
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl }}>
            {M.fetchYear || OVERVIEW_FALLBACK.fetchYear}
          </div>

          <InfoButton id="migration_net" T={T} size={18} />
        </div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'overview' && (
          <>
            <div
              style={{
                borderRadius: 16,
                padding: '18px 18px 16px',
                marginBottom: 12,
                background: T.c0,
                border: `1px solid ${T.pr}40`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `${T.pr}07`,
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: T.tl,
                  marginBottom: 8,
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                }}
              >
                Current net migration
              </div>

              <div
                style={{
                  fontSize: 54,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: T.hero,
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                }}
              >
                {fmt(overview.netNow)}
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.tl,
                  marginTop: 6,
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                }}
              >
                {M.fetchYear || OVERVIEW_FALLBACK.fetchYear}
              </div>

              <div style={{ marginTop: 14, position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: T.tl,
                    marginBottom: 5,
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>2023 peak: {fmt(overview.peak)}</span>
                  <span>Now: {fmt(overview.netNow)}</span>
                </div>

                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: T.c1 || 'rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((overview.netNow / overview.peak) * 100)}%`,
                      height: '100%',
                      background: T.pr,
                      borderRadius: 999,
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#02A95B',
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  ▼ Down {overview.downPct}% from 2023 peak
                </div>
              </div>
            </div>

            <BriefingCard
              T={T}
              title={overview.headline}
              body={overview.body}
              stats={overview.stats}
              context={overview.context}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 9,
                marginBottom: 14,
              }}
            >
              <OverviewStatCard T={T} label="2023 peak" value={fmt(overview.peak)} sub="ONS high" color="#E4003B" change="▲ Historical high" />
              <OverviewStatCard T={T} label="2024 estimate" value={fmt(overview.prev)} sub="Revised ONS" color="#F97316" change="▼ Down from peak" />
              <OverviewStatCard T={T} label="2025 estimate" value={fmt(overview.netNow)} sub="Latest headline view" color="#02A95B" change="▼ Lower again" />
              <OverviewStatCard T={T} label="Political benchmark" value="<100k" sub="Stated control target" color={T.pr} />
            </div>
          </>
        )}

        {tab === 'breakdown' && (
          <>
            <BriefingCard T={T} title={breakdown.headline} body={breakdown.body} stats={breakdown.stats} />

            {!breakdown.available ? (
              <DataUnavailable T={T} title="Breakdown unavailable" body="Top nationality routes will appear here once source-country detail is loaded." />
            ) : (
              <>
                <SectionLabel T={T}>Top foreign source countries</SectionLabel>
                {nationalityRows.map((row) => {
                  const netOut = (row.net || 0) < 0
                  const primaryValue = netOut ? `${fmt(Math.abs(row.net))} net out` : fmt(row.inflow)
                  const detail = netOut
                    ? `${row.type || 'Net outflow'} · outflow ${fmt(row.outflow || 0)}`
                    : `${row.type || 'Main inflow route'}`
                  return (
                    <MetricRow
                      key={row.name}
                      T={T}
                      title={row.name}
                      value={primaryValue}
                      detail={detail}
                      fillPct={breakdownMax ? (row.inflow / breakdownMax) * 100 : 0}
                      color={netOut ? '#02A95B' : T.pr}
                      signal={netOut ? 'Net outflow' : null}
                      signalColor="#02A95B"
                    />
                  )
                })}
                <ContextMovementCard T={T} rows={britishNationalityRows} />
              </>
            )}
          </>
        )}

        {tab === 'visas' && (
          <>
            <BriefingCard T={T} title={visaSummary.headline} body={visaSummary.body} stats={visaSummary.stats} />

            {!visaSummary.available ? (
              <DataUnavailable
                T={T}
                title="Visa route detail unavailable"
                body="The headline migration series is live, but the visa-route breakdown is still awaiting a fuller data update."
              />
            ) : (
              <>
                <SectionLabel T={T}>Visa routes</SectionLabel>
                {visaRows.map((row) => (
                  <MetricRow
                    key={row.label}
                    T={T}
                    title={row.label}
                    value={fmt(row.total)}
                    detail={row.change != null ? `${row.change > 0 ? 'Up' : 'Down'} ${Math.abs(row.change)}% vs previous year` : 'Route volume shown'}
                    fillPct={visaMax ? (row.total / visaMax) * 100 : 0}
                    color={row.color || T.pr}
                    signal={row.change != null ? `${row.change > 0 ? '+' : ''}${row.change}%` : null}
                    signalColor={row.change > 0 ? '#E4003B' : '#02A95B'}
                  />
                ))}
              </>
            )}
          </>
        )}

        {tab === 'parties' && (
          <>
            <BriefingCard T={T} title={partySummary.headline} body={partySummary.body} stats={partySummary.stats} subtle />

            <SectionLabel T={T}>Party positions</SectionLabel>
            {MIGRATION_POLICIES.map((party) => (
              <PartyViewCard key={party.party} T={T} party={party} />
            ))}
          </>
        )}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}
