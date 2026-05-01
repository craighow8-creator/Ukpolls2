import React from 'react'
import { ScrollArea } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { POLITICAL_MARKET_ROWS } from '../data/politicalMarkets'
import generatedPoliticalMarkets from '../data/politicalMarkets.generated.json'

const ELECTION_TYPE_LABELS = {
  'general-election': 'General election',
  'local-election': 'Local elections',
  leadership: 'Leadership / leaders',
  mayoral: 'Mayoral',
  council: 'Council',
}

function parseDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysSince(value) {
  const parsed = parseDate(value)
  if (!parsed) return null
  return Math.floor((Date.now() - parsed.getTime()) / 86400000)
}

function inferFreshnessStatus(row, fallbackDate) {
  const explicit = String(row?.freshnessStatus || '').trim().toLowerCase()
  if (explicit) return explicit
  const checkedAt = row?.checkedAt || row?.updatedAt || fallbackDate
  const age = daysSince(checkedAt)
  if (age == null) return ''
  return age > 14 ? 'stale' : 'fresh'
}

function probabilityToDecimal(probability) {
  if (!Number.isFinite(probability) || probability <= 0) return null
  return Math.round((1 / probability) * 100) / 100
}

function normaliseProbability(value, displayPct) {
  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    return numeric <= 1 ? Math.round(numeric * 1000) / 10 : Math.round(numeric * 10) / 10
  }

  const display = Number.parseFloat(String(displayPct || '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(display) ? display : null
}

function normalisePredictionMarketRows(predictionMarkets) {
  const payload = Array.isArray(predictionMarkets) ? { rows: predictionMarkets } : predictionMarkets
  if (!payload || typeof payload !== 'object') return []

  const fallbackCheckedAt = payload.checkedAt || payload.generatedAt || payload.updatedAt || payload.meta?.updatedAt
  const source = payload.source || payload.meta?.source || 'Polymarket'
  const sourceUrl = payload.sourceUrl || payload.meta?.sourceUrl || ''

  if (Array.isArray(payload.rows)) {
    return payload.rows
      .filter((row) => row && typeof row === 'object')
      .map((row, index) => ({
        marketId: row.marketId || row.id || `prediction-market-row-${index}`,
        marketName: row.marketName || row.title || row.question || 'Political market',
        electionType: row.electionType || row.category || 'general-election',
        runner: row.runner || row.label || row.outcome || '',
        party: row.party || '',
        oddsFractional: row.oddsFractional || '',
        oddsDecimal: Number.isFinite(Number(row.oddsDecimal)) ? Number(row.oddsDecimal) : null,
        impliedProbability: normaliseProbability(row.impliedProbability ?? row.probability, row.displayPct),
        source: row.source || source,
        sourceUrl: row.sourceUrl || row.url || sourceUrl,
        checkedAt: row.checkedAt || row.updatedAt || fallbackCheckedAt,
        freshnessStatus: inferFreshnessStatus(row, fallbackCheckedAt),
        marketType: row.marketType || 'prediction-market',
        notes: row.notes || 'Public market signal. Informational only, not advice.',
      }))
      .filter((row) => row.runner && Number.isFinite(row.impliedProbability))
  }

  if (!Array.isArray(payload.markets)) return []

  // Remote market rows should already be UK-politics filtered by the ingest/Worker path.
  return payload.markets.flatMap((market, marketIndex) => {
    const outcomes = Array.isArray(market?.outcomes) ? market.outcomes : []
    const checkedAt = market?.checkedAt || market?.updatedAt || fallbackCheckedAt
    return outcomes
      .map((outcome, outcomeIndex) => {
        const probability = normaliseProbability(outcome?.impliedProbability ?? outcome?.probability, outcome?.displayPct)
        return {
          marketId: outcome?.marketId || `${market?.id || `market-${marketIndex}`}-${outcome?.label || outcomeIndex}`,
          marketName: market?.marketName || market?.title || market?.question || 'Political market',
          electionType: market?.electionType || market?.category || 'general-election',
          runner: outcome?.runner || outcome?.label || outcome?.outcome || '',
          party: outcome?.party || '',
          oddsFractional: outcome?.oddsFractional || '',
          oddsDecimal: Number.isFinite(Number(outcome?.oddsDecimal))
            ? Number(outcome.oddsDecimal)
            : probabilityToDecimal(Number.isFinite(probability) ? probability / 100 : null),
          impliedProbability: probability,
          source: market?.source || source,
          sourceUrl: market?.sourceUrl || market?.url || sourceUrl,
          checkedAt,
          freshnessStatus: inferFreshnessStatus(market, checkedAt),
          marketType: market?.marketType || 'prediction-market',
          notes: market?.notes || 'Public market signal. Informational only, not advice.',
        }
      })
      .filter((row) => row.runner && Number.isFinite(row.impliedProbability))
  })
}

function formatDate(value, { includeTime = false } = {}) {
  const parsed = parseDate(value)
  if (!parsed) return 'Date not recorded'

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = parsed.getFullYear()
  if (!includeTime) return `${day}-${month}-${year}`

  const hour = String(parsed.getHours()).padStart(2, '0')
  const minute = String(parsed.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hour}:${minute}`
}

function formatMonthDate(year, monthName, day) {
  const months = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
  }
  const month = months[String(monthName || '').toLowerCase()]
  if (!month || !day || !year) return ''
  return `${String(day).padStart(2, '0')}-${month}-${year}`
}

function readableMarketName(name = '') {
  const text = String(name || '').trim()

  const electionCall = text.match(/Will the next UK election be called by ([A-Za-z]+) (\d{1,2}), (\d{4})\?/i)
  if (electionCall) {
    const date = formatMonthDate(electionCall[3], electionCall[1], electionCall[2])
    return `Will the next UK election be called by ${date}?`
  }

  const starmerOut = text.match(/Starmer out by ([A-Za-z]+) (\d{1,2}), (\d{4})\?/i)
  if (starmerOut) {
    const date = formatMonthDate(starmerOut[3], starmerOut[1], starmerOut[2])
    return `Will Keir Starmer leave office by ${date}?`
  }

  return text
}

function statusStyles(status) {
  const key = String(status || '').toLowerCase()
  if (key === 'fresh') {
    return {
      color: '#067647',
      background: '#12B76A16',
      border: '#12B76A30',
      label: 'Fresh',
    }
  }
  if (key === 'stale') {
    return {
      color: '#8A5A00',
      background: '#F59E0B18',
      border: '#F59E0B36',
      label: 'Stale',
    }
  }
  return {
    color: '#475467',
    background: 'rgba(71,84,103,0.08)',
    border: 'rgba(71,84,103,0.18)',
    label: status || 'Maintained',
  }
}

function Pill({ children, style }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        padding: '4px 8px',
        fontSize: 11,
        fontWeight: 850,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function groupByMarket(rows = []) {
  const groups = new Map()
  for (const row of rows) {
    const key = `${row.electionType || 'unknown'}:${row.marketName || row.marketId}`
    const existing = groups.get(key) || {
      id: key,
      displayName: readableMarketName(row.marketName),
      electionType: row.electionType || 'general-election',
      source: row.source || 'Unknown source',
      checkedAt: row.checkedAt || '',
      freshnessStatus: row.freshnessStatus || '',
      outcomes: [],
    }
    existing.outcomes.push(row)
    if (row.checkedAt && (!existing.checkedAt || new Date(row.checkedAt) > new Date(existing.checkedAt))) {
      existing.checkedAt = row.checkedAt
    }
    groups.set(key, existing)
  }

  return [...groups.values()].sort((a, b) => {
    const typeCompare = String(a.electionType).localeCompare(String(b.electionType))
    if (typeCompare) return typeCompare
    return String(a.displayName).localeCompare(String(b.displayName))
  })
}

function formatOdds(row) {
  if (row.oddsFractional) return { label: 'Fractional odds', value: row.oddsFractional }
  if (Number.isFinite(row.oddsDecimal)) return { label: 'Decimal odds', value: row.oddsDecimal.toFixed(2) }
  return { label: 'Odds', value: 'Not recorded' }
}

function OutcomeLine({ T, row, archived = false }) {
  const odds = formatOdds(row)
  const probability = Number.isFinite(row.impliedProbability) ? `${row.impliedProbability}%` : 'Not recorded'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(44px, 0.7fr) minmax(78px, auto) minmax(86px, auto)',
        alignItems: 'center',
        gap: 10,
        padding: archived ? '8px 10px' : '10px 12px',
        borderRadius: 10,
        background: archived ? 'transparent' : T.sf,
        border: `1px solid ${archived ? T.cardBorder || 'rgba(0,0,0,0.06)' : T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: archived ? 13 : 14, fontWeight: 850, color: T.th, lineHeight: 1.2 }}>
          {row.runner}
        </div>
        {row.party ? (
          <div style={{ fontSize: 11.5, fontWeight: 650, color: T.tl, marginTop: 2 }}>{row.party}</div>
        ) : null}
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Implied
        </div>
        <div style={{ fontSize: archived ? 16 : 20, fontWeight: 950, color: archived ? T.th : T.pr, lineHeight: 1.1 }}>
          {probability}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {odds.label}
        </div>
        <div style={{ fontSize: archived ? 14 : 16, fontWeight: 850, color: T.th, lineHeight: 1.2 }}>{odds.value}</div>
      </div>
    </div>
  )
}

function MarketCard({ T, market, archived = false }) {
  const status = statusStyles(market.freshnessStatus)

  return (
    <article
      style={{
        borderRadius: archived ? 12 : 14,
        padding: archived ? 12 : 16,
        background: archived ? 'rgba(255,255,255,0.45)' : T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        display: 'grid',
        gap: archived ? 8 : 12,
        opacity: archived ? 0.78 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: archived ? 14 : 16, fontWeight: 900, color: T.th, lineHeight: 1.28 }}>
            {market.displayName}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 650, color: T.tl, lineHeight: 1.4, marginTop: 4 }}>
            {market.source} · checked {formatDate(market.checkedAt, { includeTime: !archived })}
          </div>
        </div>
        <Pill
          style={{
            color: status.color,
            background: status.background,
            border: `1px solid ${status.border}`,
          }}
        >
          {status.label}
        </Pill>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {market.outcomes.map((row) => (
          <OutcomeLine key={row.marketId} T={T} row={row} archived={archived} />
        ))}
      </div>
    </article>
  )
}

function CurrentSection({ T, groups }) {
  if (!groups.length) {
    return (
      <div
        style={{
          borderRadius: 14,
          padding: '16px',
          background: T.c0,
          border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          color: T.tl,
          fontSize: 13,
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        No current imported market rows are available.
      </div>
    )
  }

  const groupedByType = groups.reduce((acc, market) => {
    const type = market.electionType || 'general-election'
    acc[type] = [...(acc[type] || []), market]
    return acc
  }, {})

  return Object.entries(groupedByType).map(([type, markets]) => (
    <section key={type} style={{ display: 'grid', gap: 10 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 950, color: T.th, letterSpacing: -0.2 }}>
          {ELECTION_TYPE_LABELS[type] || 'Political markets'}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {markets.map((market) => (
          <MarketCard key={market.id} T={T} market={market} />
        ))}
      </div>
    </section>
  ))
}

function ArchiveSection({ T, groups }) {
  return (
    <details
      style={{
        borderRadius: 14,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        overflow: 'hidden',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          listStyle: 'none',
          padding: '14px 16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 950, color: T.th }}>Archived market snapshot</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.tl, marginTop: 4 }}>
          Historical maintained snapshot · not current pricing · {groups.length} markets
        </div>
      </summary>

      <div style={{ display: 'grid', gap: 10, padding: '0 12px 12px' }}>
        {groups.map((market) => (
          <MarketCard key={market.id} T={T} market={market} archived />
        ))}
      </div>
    </details>
  )
}

export default function BettingScreen({ T, predictionMarkets }) {
  const archivedRows = POLITICAL_MARKET_ROWS
  const maintainedRows = normalisePredictionMarketRows(predictionMarkets)
  const generatedRows = normalisePredictionMarketRows(generatedPoliticalMarkets)
  const currentRows = maintainedRows.length ? maintainedRows : generatedRows
  const failedSources = Array.isArray(generatedPoliticalMarkets?.failedSources) ? generatedPoliticalMarkets.failedSources : []
  const currentGroups = groupByMarket(currentRows)
  const archivedGroups = groupByMarket(archivedRows)
  const staleCount = [...currentRows, ...archivedRows].filter((row) => row.freshnessStatus === 'stale').length
  const sourceStatus = currentRows.length ? `LIVE SOURCE · ${currentRows[0]?.source || 'Polymarket'}` : 'ARCHIVE · Maintained snapshot'

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
      <div
        style={{
          flexShrink: 0,
          padding: '12px 16px 10px',
          background: T.sf,
          borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 20, fontWeight: 950, color: T.th, letterSpacing: -0.4, lineHeight: 1 }}>
            Political markets
          </div>
          <InfoButton id="betting_odds" T={T} size={18} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
          <Pill
            style={{
              color: currentRows.length ? '#067647' : '#8A5A00',
              background: currentRows.length ? '#12B76A16' : '#F59E0B18',
              border: `1px solid ${currentRows.length ? '#12B76A30' : '#F59E0B36'}`,
            }}
          >
            {sourceStatus}
          </Pill>
        </div>
      </div>

      <ScrollArea>
        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              borderRadius: 14,
              padding: '16px 18px',
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950, color: T.th, lineHeight: 1.2 }}>Political markets</div>
            <div style={{ fontSize: 13, fontWeight: 650, color: T.tl, lineHeight: 1.5, marginTop: 8 }}>
              Market prices are shown as one public signal. They are not seat projections or advice.
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {[
              ['Current', currentGroups.length],
              ['Archived', archivedGroups.length],
              ['Stale rows', staleCount],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  borderRadius: 12,
                  padding: '10px 8px',
                  background: T.c0,
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 950, color: T.th }}>{value}</div>
                <div style={{ fontSize: 11.5, fontWeight: 750, color: T.tl }}>{label}</div>
              </div>
            ))}
          </div>

          {failedSources.length ? (
            <div
              style={{
                borderRadius: 12,
                padding: '12px 14px',
                background: '#FEE4E2',
                border: '1px solid #FDA29B',
                color: '#912018',
                fontSize: 12.5,
                fontWeight: 750,
                lineHeight: 1.45,
                textAlign: 'center',
              }}
            >
              {failedSources.length} configured market source failed during the latest import.
            </div>
          ) : null}

          <section style={{ display: 'grid', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 950, color: T.th, letterSpacing: -0.3 }}>
                Current market signals
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 650, color: T.tl, marginTop: 4 }}>
                Grouped by market question, with source and freshness shown once per card.
              </div>
            </div>
            <CurrentSection T={T} groups={currentGroups} />
          </section>

          <ArchiveSection T={T} groups={archivedGroups} />

          <div
            style={{
              borderRadius: 14,
              padding: '14px 16px',
              background: 'transparent',
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: T.th }}>How to read this</div>
            <div style={{ fontSize: 12.5, fontWeight: 650, color: T.tl, lineHeight: 1.55, marginTop: 7 }}>
              Market prices can move quickly. Implied probability may reflect market mechanics, liquidity and trader
              positioning as well as political information. Compare these signals with polls, policy and election data.
              This is not advice.
            </div>
          </div>

          <div style={{ height: 28 }} />
        </div>
      </ScrollArea>
    </div>
  )
}
