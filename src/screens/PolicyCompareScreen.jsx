import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { StickyPills, haptic } from '../components/ui'
import { POLICY_RECORDS } from '../data/policy/policyRecords'
import { POLICY_AREA_LABELS, POLICY_TAXONOMY } from '../data/policy/policyTaxonomy'
import {
  COMPARISON_PARTIES,
  deriveComparisonBriefing,
  formatSourceType,
  getComparisonRows,
  getComparisonSummary,
  getPolicyAreaOrder,
} from '../data/policy/policyCompareSelectors'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const FALLBACK_COLORS = {
  'Reform UK': '#12B7D4',
  Labour: '#E4003B',
  Conservative: '#0087DC',
  Green: '#02A95B',
  'Lib Dem': '#FAA61A',
  SNP: '#C4922A',
  'Plaid Cymru': '#3F8428',
  'Restore Britain': '#1a4a9e',
}

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function normalise(value) {
  return cleanText(value).toLowerCase()
}

function areaLabel(area) {
  return POLICY_AREA_LABELS?.[area] || cleanText(area).replace(/([a-z])([A-Z])/g, '$1 $2')
}

function sourceLabel(source) {
  if (!source) return 'No controlling source'
  return cleanText(source.title) || formatSourceType(source.type)
}

function sourceCountLabel(count) {
  const n = Number(count) || 0
  return `${n} source${n === 1 ? '' : 's'}`
}

function buildPartyColors(parties = []) {
  const colors = { ...FALLBACK_COLORS }
  parties.forEach((party) => {
    if (party?.name && party?.color) colors[party.name] = party.color
  })
  return colors
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
        marginBottom: 10,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function SurfaceCard({ T, children, borderColor, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: 14,
        background: T.c0,
        border: `1px solid ${borderColor || T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function MiniSignal({ T, label, value, color }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '10px 10px',
        background: T.c0,
        border: `1px solid ${(color || T.pr || '#12B7D4')}24`,
        textAlign: 'center',
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
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: color || T.th, lineHeight: 1.25 }}>
        {value}
      </div>
    </div>
  )
}

function TopicPill({ T, label, active, onClick }) {
  return (
    <motion.button
      {...TAP}
      onClick={onClick}
      style={{
        border: `1px solid ${active ? T.pr : T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        background: active ? `${T.pr}18` : T.c0,
        color: active ? T.pr : T.th,
        borderRadius: 999,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </motion.button>
  )
}

function BriefingCard({ T, briefing }) {
  return (
    <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
      <SectionLabel T={T}>Comparison briefing</SectionLabel>
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.16,
          letterSpacing: '-0.02em',
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        {briefing.headline}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: T.tl,
          textAlign: 'center',
          lineHeight: 1.6,
          maxWidth: 560,
          margin: '8px auto 0',
        }}
      >
        {briefing.body}
      </div>
      {briefing.signals?.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
          {briefing.signals.slice(0, 3).map((signal) => (
            <MiniSignal key={signal.label} T={T} label={signal.label} value={signal.value} color={T.pr || '#12B7D4'} />
          ))}
        </div>
      ) : null}
    </SurfaceCard>
  )
}

function SummaryStrip({ T, summary, partyColors }) {
  const items = [
    { label: 'Hardest line', row: summary.hardest },
    { label: 'Most open', row: summary.mostOpen },
    { label: 'Lowest certainty', row: summary.lowestConfidence },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
      {items.map((item) => {
        const color = item.row ? partyColors[item.row.party] || T.pr || '#12B7D4' : T.tl
        return (
          <MiniSignal
            key={item.label}
            T={T}
            label={item.label}
            value={item.row?.party || 'Not enough data'}
            color={color}
          />
        )
      })}
    </div>
  )
}

function PartyComparisonCard({ T, row, color }) {
  const source = row.controllingSource
  return (
    <SurfaceCard T={T} borderColor={`${color}28`} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: T.th, lineHeight: 1.2 }}>{row.party}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, lineHeight: 1.45, marginTop: 5 }}>
            {row.summary}
          </div>
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color,
            background: `${color}14`,
            border: `1px solid ${color}28`,
            borderRadius: 999,
            padding: '6px 9px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {row.stanceLabel}
        </div>
      </div>

      {row.details?.length ? (
        <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
          {row.details.slice(0, 4).map((detail) => (
            <div key={detail} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: color,
                  marginTop: 7,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.48 }}>{detail}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: T.tl, lineHeight: 1.45 }}>
          {source?.url ? (
            <a href={source.url} target="_blank" rel="noreferrer" style={{ color, textDecoration: 'none' }}>
              {sourceLabel(source)}
            </a>
          ) : (
            sourceLabel(source)
          )}
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {row.missing ? 'Awaiting record' : `${sourceCountLabel(row.sourceCount)} · ${cleanText(row.confidence) || 'confidence n/a'}`}
        </div>
      </div>
    </SurfaceCard>
  )
}

export default function PolicyCompareScreen({
  T,
  parties = [],
  policyRecords = POLICY_RECORDS,
  policyTaxonomy = POLICY_TAXONOMY,
  initialArea = 'immigration',
  initialTopic = 'All',
  updateCurrentParams,
}) {
  const areaOrder = useMemo(() => getPolicyAreaOrder(policyTaxonomy), [policyTaxonomy])
  const safeInitialArea = areaOrder.includes(initialArea) ? initialArea : areaOrder[0] || 'immigration'
  const [area, setArea] = useState(safeInitialArea)
  const [topic, setTopic] = useState(initialTopic || 'All')

  useEffect(() => {
    const nextArea = areaOrder.includes(initialArea) ? initialArea : areaOrder[0] || 'immigration'
    setArea(nextArea)
  }, [initialArea, areaOrder])

  useEffect(() => {
    setTopic(initialTopic || 'All')
  }, [initialTopic])

  useEffect(() => {
    updateCurrentParams?.({ area, topic })
  }, [area, topic, updateCurrentParams])

  const topics = policyTaxonomy?.[area] || []
  const partyNames = useMemo(
    () => parties.map((party) => party.name).filter((name) => cleanText(name) && normalise(name) !== 'other'),
    [parties],
  )
  const compareParties = partyNames.length ? partyNames : COMPARISON_PARTIES
  const partyColors = useMemo(() => buildPartyColors(parties), [parties])
  const rows = useMemo(
    () => getComparisonRows(policyRecords, area, topic, compareParties),
    [policyRecords, area, topic, compareParties],
  )
  const briefing = useMemo(
    () => deriveComparisonBriefing(policyRecords, area, topic, compareParties),
    [policyRecords, area, topic, compareParties],
  )
  const summary = useMemo(
    () => getComparisonSummary(policyRecords, area, topic, compareParties),
    [policyRecords, area, topic, compareParties],
  )
  const hasAnyRecord = rows.some((row) => !row.missing)

  const areaPills = areaOrder.map((key) => ({ key, label: areaLabel(key) }))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <div style={{ padding: '12px 16px 10px' }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: T.th,
            textAlign: 'center',
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          Policy comparison
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: T.tl,
            textAlign: 'center',
            lineHeight: 1.55,
            maxWidth: 560,
            margin: '8px auto 0',
          }}
        >
          Compare parties on one issue using structured official policy records and source-backed commitments.
        </div>
      </div>

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
        <StickyPills
          pills={areaPills}
          active={area}
          onSelect={(nextArea) => {
            haptic(4)
            setArea(nextArea)
            setTopic('All')
          }}
          T={T}
        />
      </div>

      <div style={{ padding: '12px 16px 40px' }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 6,
            marginBottom: 12,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {['All', ...topics].map((item) => (
            <TopicPill
              key={item}
              T={T}
              label={item}
              active={topic === item}
              onClick={() => {
                haptic(4)
                setTopic(item)
              }}
            />
          ))}
        </div>

        <BriefingCard T={T} briefing={briefing} />

        {hasAnyRecord ? (
          <>
            <SummaryStrip T={T} summary={summary} partyColors={partyColors} />

            <SectionLabel T={T}>Party positions</SectionLabel>
            {rows.map((row) => (
              <PartyComparisonCard
                key={row.party}
                T={T}
                row={row}
                color={partyColors[row.party] || FALLBACK_COLORS[row.party] || T.pr || '#12B7D4'}
              />
            ))}
          </>
        ) : (
          <SurfaceCard T={T} style={{ textAlign: 'center' }}>
            <SectionLabel T={T}>No records yet</SectionLabel>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.tl, lineHeight: 1.6 }}>
              No structured policy records are available for {topic === 'All' ? areaLabel(area).toLowerCase() : topic} yet.
            </div>
          </SurfaceCard>
        )}
      </div>
    </div>
  )
}
