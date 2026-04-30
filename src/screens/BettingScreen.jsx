import React from 'react'
import { ScrollArea } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import SectionDataMeta from '../components/SectionDataMeta'
import { POLITICAL_MARKET_GROUPS, POLITICAL_MARKET_ROWS } from '../data/politicalMarkets'
import generatedPoliticalMarkets from '../data/politicalMarkets.generated.json'

const GROUP_EMPTY_COPY = {
  'local-elections': 'No maintained local election market rows are available yet.',
}

function formatCheckedAt(value) {
  if (!value) return 'Date not recorded'
  const [year, month, day] = String(value).split('-')
  if (year && month && day) return `${day}-${month}-${year}`
  return value
}

function statusStyles(status) {
  const key = String(status || '').toLowerCase()
  if (key === 'stale') {
    return {
      color: '#8A5A00',
      background: '#F59E0B18',
      border: '#F59E0B36',
      label: 'Stale archive',
    }
  }
  if (key === 'fresh') {
    return {
      color: '#067647',
      background: '#12B76A16',
      border: '#12B76A30',
      label: 'Fresh',
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
        borderRadius: 999,
        padding: '4px 8px',
        fontSize: 11,
        fontWeight: 800,
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

function MarketRow({ T, row }) {
  const status = statusStyles(row.freshnessStatus)
  const oddsLabel = row.oddsFractional || (Number.isFinite(row.oddsDecimal) ? row.oddsDecimal.toFixed(2) : 'Not recorded')

  return (
    <div
      style={{
        borderRadius: 12,
        padding: 14,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.th, lineHeight: 1.25 }}>{row.runner}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.tl, marginTop: 3 }}>
            {row.party || 'No party label'} · {row.marketName}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(72px, 0.6fr) minmax(120px, 1fr)',
          gap: 8,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            borderRadius: 10,
            padding: '10px 12px',
            background: T.sf,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Odds
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.th, marginTop: 2 }}>
            {oddsLabel}
          </div>
        </div>
        <div
          style={{
            borderRadius: 10,
            padding: '10px 12px',
            background: T.sf,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Raw implied probability
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.th, marginTop: 2 }}>
            {Number.isFinite(row.impliedProbability) ? `${row.impliedProbability}%` : 'Not recorded'}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.tl, lineHeight: 1.45 }}>
        Source: {row.source || 'Unknown source'} · Checked {formatCheckedAt(row.checkedAt)}
      </div>

      {row.notes ? (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.tl, lineHeight: 1.45 }}>
          {row.notes}
        </div>
      ) : null}
    </div>
  )
}

function MarketGroup({ T, group, rows, archived = false }) {
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3, color: T.th }}>
          {group.title}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.tl, marginTop: 3 }}>
          {archived
            ? 'Maintained historic rows kept for context, not current pricing.'
            : 'Freshness and source/date are shown on every row.'}
        </div>
      </div>

      {rows.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map((row) => (
            <MarketRow key={row.marketId} T={T} row={row} />
          ))}
        </div>
      ) : (
        <div
          style={{
            borderRadius: 12,
            padding: '14px 16px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            color: T.tl,
            fontSize: 13,
            fontWeight: 650,
            textAlign: 'center',
          }}
        >
          {GROUP_EMPTY_COPY[group.id] || 'No maintained market rows are available for this group yet.'}
        </div>
      )}
    </section>
  )
}

export default function BettingScreen({ T, dataState = {} }) {
  const archivedRows = POLITICAL_MARKET_ROWS
  const currentRows = Array.isArray(generatedPoliticalMarkets?.rows) ? generatedPoliticalMarkets.rows : []
  const allRows = [...currentRows, ...archivedRows]
  const staleCount = allRows.filter((row) => row.freshnessStatus === 'stale').length
  const failedSources = Array.isArray(generatedPoliticalMarkets?.failedSources) ? generatedPoliticalMarkets.failedSources : []

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
      <div style={{ padding: '18px 18px 0', flexShrink: 0, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: -0.6,
            color: T.th,
            lineHeight: 1,
          }}
        >
          Political markets
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 6,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
            Public market odds as one political signal, not predictions or advice
          </div>
          <InfoButton id="betting_odds" T={T} size={18} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <SectionDataMeta T={T} section={dataState.betting || null} />
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
            <div style={{ fontSize: 17, fontWeight: 900, color: T.th, lineHeight: 1.2 }}>
              Political markets
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, lineHeight: 1.5, marginTop: 8 }}>
              Odds can show how a public market is pricing political outcomes at a point in time. They are not
              forecasts, seat projections, polling averages, or betting advice.
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              padding: '14px 16px',
              background: '#F59E0B12',
              border: '1px solid #F59E0B36',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: '#8A5A00' }}>
              {currentRows.length ? 'Current market import connected' : 'Live market import not connected yet'}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 650, color: '#8A5A00', lineHeight: 1.45, marginTop: 5 }}>
              {currentRows.length
                ? 'Current rows use public Polymarket read data. They are market signals only and should not be read as predictions, forecasts or advice.'
                : 'The rows below are archived maintained snapshots from 20-03-2026. They are shown for context only and should not be read as current market pricing.'}
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              padding: '12px 14px',
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: T.th }}>{currentRows.length}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.tl }}>current rows</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#8A5A00' }}>{staleCount}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.tl }}>stale rows</div>
            </div>
          </div>

          <section style={{ display: 'grid', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3, color: T.th }}>
                Current market signals
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.tl, marginTop: 3 }}>
                Public Polymarket rows imported from configured UK politics markets.
              </div>
            </div>

            {currentRows.length ? (
              POLITICAL_MARKET_GROUPS.map((group) => {
                const groupRows = currentRows.filter((row) => group.electionTypes.includes(row.electionType))
                return groupRows.length ? <MarketGroup key={`current-${group.id}`} T={T} group={group} rows={groupRows} /> : null
              })
            ) : (
              <div
                style={{
                  borderRadius: 12,
                  padding: '14px 16px',
                  background: T.c0,
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                  color: T.tl,
                  fontSize: 13,
                  fontWeight: 650,
                  textAlign: 'center',
                }}
              >
                No current imported market rows are available.
              </div>
            )}
          </section>

          {failedSources.length ? (
            <div
              style={{
                borderRadius: 12,
                padding: '12px 14px',
                background: '#FEE4E2',
                border: '1px solid #FDA29B',
                color: '#912018',
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: 1.45,
                textAlign: 'center',
              }}
            >
              {failedSources.length} configured market source failed during the latest import.
            </div>
          ) : null}

          <section style={{ display: 'grid', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3, color: T.th }}>
                Archived market snapshot
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.tl, marginTop: 3 }}>
                Older maintained rows are separated from current market data.
              </div>
            </div>

          {POLITICAL_MARKET_GROUPS.map((group) => {
            const groupRows = archivedRows.filter((row) => group.electionTypes.includes(row.electionType))
            return <MarketGroup key={`archived-${group.id}`} T={T} group={group} rows={groupRows} archived />
          })}
          </section>

          <div
            style={{
              borderRadius: 14,
              padding: '14px 16px',
              background: 'transparent',
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: T.th }}>
              How to read these rows
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.tl, lineHeight: 1.5, marginTop: 6 }}>
              Implied probability is calculated directly from the listed fractional odds and does not remove bookmaker
              margin. Market prices can move quickly and should be compared with polls, policy positions and election
              data rather than used on their own.
            </div>
          </div>

          <div style={{ height: 32 }} />
        </div>
      </ScrollArea>
    </div>
  )
}
