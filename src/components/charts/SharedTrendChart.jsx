import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { haptic } from '../ui'
import { getPartyByName } from '../../data/partyRegistry'

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
    abbr: party?.abbr || name,
    color: party?.color || '#888888',
  }
})

export function makeTrendPartyKeys(names = []) {
  return (Array.isArray(names) ? names : [])
    .filter(Boolean)
    .map((name) => {
      const party = getPartyByName(name)
      return {
        key: party?.name || name,
        abbr: party?.abbr || name,
        color: party?.color || '#888888',
      }
    })
}

function toDate(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [yyyy, mm, dd] = value.split('-').map(Number)
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('-').map(Number)
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  return null
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function formatUkDate(value) {
  const d = toDate(value)
  if (!d) return ''
  return `${pad2(d.getUTCDate())}-${pad2(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
}

function monthShortLabel(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
}

function yearShortLabel(value) {
  const d = toDate(value)
  if (!d) return ''
  return String(d.getUTCFullYear()).slice(-2)
}

function toPollNumber(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const n = Number(String(value).replace(/%/g, '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function getPartyValue(row, partyKey) {
  if (!row || !partyKey) return null
  const party = getPartyByName(partyKey)
  const candidateKeys = [
    partyKey,
    party?.name,
    party?.id,
    party?.abbr,
    party?.abbr?.toLowerCase(),
    ...(Array.isArray(party?.aliases) ? party.aliases : []),
    partyKey === 'Reform UK' ? 'ref' : null,
    partyKey === 'Labour' ? 'lab' : null,
    partyKey === 'Green' ? 'grn' : null,
    partyKey === 'Conservative' ? 'con' : null,
    partyKey === 'Lib Dem' ? 'ld' : null,
    partyKey === 'Restore Britain' ? 'rb' : null,
    partyKey === 'Plaid Cymru' ? 'pc' : null,
    partyKey === 'Other' ? 'oth' : null,
  ].filter(Boolean)

  for (const key of [...new Set(candidateKeys)]) {
    const value = toPollNumber(row?.[key])
    if (value != null) return value
  }

  return null
}

function normalisePollRowsToTrendRows(rows) {
  return [...(Array.isArray(rows) ? rows : [])]
    .map((row) => ({
      date: row?.date || row?.fieldworkEnd || row?.publishedAt || row?.fieldworkStart || null,
      'Reform UK': getPartyValue(row, 'Reform UK'),
      Labour: getPartyValue(row, 'Labour'),
      Green: getPartyValue(row, 'Green'),
      Conservative: getPartyValue(row, 'Conservative'),
      'Lib Dem': getPartyValue(row, 'Lib Dem'),
      'Restore Britain': getPartyValue(row, 'Restore Britain'),
      SNP: getPartyValue(row, 'SNP'),
      'Plaid Cymru': getPartyValue(row, 'Plaid Cymru'),
      Other: getPartyValue(row, 'Other'),
      pollster: row?.pollster,
      pollsterCount: row?.pollsterCount,
      sourcePollsters: Array.isArray(row?.sourcePollsters)
        ? row.sourcePollsters
        : row?.pollster
          ? [row.pollster]
          : [],
      sourcePartyPolls: row?.sourcePartyPolls && typeof row.sourcePartyPolls === 'object'
        ? row.sourcePartyPolls
        : {},
      sourcePartyPollIds: row?.sourcePartyPollIds && typeof row.sourcePartyPollIds === 'object'
        ? row.sourcePartyPollIds
        : {},
    }))
    .filter((row) => row.date)
}

function getRawPollDate(row) {
  return row?.date || row?.fieldworkEnd || row?.publishedAt || row?.fieldworkStart || null
}

function getRawPollPartyValue(row, partyKey) {
  return getPartyValue(row, partyKey)
}

function buildRawPollScatter({
  rawPolls = [],
  partyKeys = PARTY_KEYS,
  hardHidden = {},
  focusedPartyKey = null,
  trendStartMs,
  trendEndMs,
  trendSpanMs,
  chartStartX,
  chartEndX,
  yPos,
}) {
  const source = Array.isArray(rawPolls) ? rawPolls : []
  if (!source.length) {
    return { dots: [], includedPollCount: 0, renderedDotCount: 0 }
  }

  const bucketWidth = source.length > 700 ? 18 : source.length > 400 ? 15 : 12
  const maxPerBucket = source.length > 700 ? 1 : 2
  const visibleParties = partyKeys.filter((party) => !hardHidden[party.key])
  const buckets = new Map()
  let includedPollCount = 0

  source.forEach((row, index) => {
    const date = toDate(getRawPollDate(row))
    if (!date) return

    const time = date.getTime()
    if (time < trendStartMs || time > trendEndMs) return
    includedPollCount += 1

    const x = chartStartX + ((time - trendStartMs) / trendSpanMs) * (chartEndX - chartStartX)
    const bucketIndex = Math.max(0, Math.round((x - chartStartX) / bucketWidth))

    visibleParties.forEach((party) => {
      const value = getRawPollPartyValue(row, party.key)
      if (value == null) return

      const bucketKey = `${party.key}-${bucketIndex}`
      const entry = buckets.get(bucketKey) || []
      entry.push({
        key: `${row?.id || row?.pollster || 'poll'}-${party.key}-${time}-${index}`,
        color: party.color,
        x,
        y: yPos(value),
        value,
        muted: !!focusedPartyKey && party.key !== focusedPartyKey,
      })
      buckets.set(bucketKey, entry)
    })
  })

  const dots = []
  buckets.forEach((entries) => {
    if (!entries.length) return
    if (entries.length <= maxPerBucket) {
      dots.push(...entries)
      return
    }

    const sortedByValue = [...entries].sort((a, b) => a.value - b.value)
    const min = sortedByValue[0]
    const max = sortedByValue[sortedByValue.length - 1]
    const spread = Math.abs(max.value - min.value)

    if (maxPerBucket === 1 || spread <= 1.5) {
      const average = entries.reduce(
        (acc, item) => ({
          x: acc.x + item.x,
          y: acc.y + item.y,
          value: acc.value + item.value,
        }),
        { x: 0, y: 0, value: 0 },
      )
      dots.push({
        key: `${entries[0].key}-avg`,
        color: entries[0].color,
        x: average.x / entries.length,
        y: average.y / entries.length,
        value: average.value / entries.length,
      })
      return
    }

    dots.push(min)
    if (max.key !== min.key) dots.push(max)
  })

  return {
    dots,
    includedPollCount,
    renderedDotCount: dots.length,
  }
}

export function buildDisplayTrendRows(trends, pollContext) {
  const engineTrends = Array.isArray(pollContext?.trendSeries) ? pollContext.trendSeries : []
  const fallbackSource = engineTrends.length ? engineTrends : Array.isArray(trends) ? trends : []
  const source = normalisePollRowsToTrendRows(fallbackSource)

  return source
    .sort((a, b) => {
      const ad = toDate(a?.date)?.getTime() || 0
      const bd = toDate(b?.date)?.getTime() || 0
      return ad - bd
    })
    .map((row, index) => ({
      ...row,
      month: monthShortLabel(row.date) || row.month || row.pollster || `P${index + 1}`,
      yearShort: yearShortLabel(row.date),
      fullDate: formatUkDate(row.date),
    }))
}

function applyEmaSmoothing(rows, key, alpha = 0.34) {
  let previous = null

  return rows.map((row) => {
    const current = typeof row?.[key] === 'number' ? row[key] : null
    if (current == null) return null

    if (previous == null) {
      previous = current
      return +current.toFixed(1)
    }

    previous = previous + alpha * (current - previous)
    return +previous.toFixed(1)
  })
}

function buildCurvedPath(points) {
  if (!points.length) return ''
  if (points.length === 1) return `M${points[0].x},${points[0].y}`

  let d = `M${points[0].x},${points[0].y}`

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }

  return d
}

function makeTickIndexes(length) {
  if (length <= 1) return [0]
  const desired = length > 18 ? 6 : length > 10 ? 5 : length
  const step = Math.max(1, Math.ceil((length - 1) / Math.max(1, desired - 1)))
  const out = []
  for (let i = 0; i < length; i += step) out.push(i)
  if (out[out.length - 1] !== length - 1) out.push(length - 1)
  return [...new Set(out)]
}

function PointDetails({ point, hidden, hardHidden = {}, partyKeys = PARTY_KEYS, T, selectedPartyKey = null, findPollById = null, findPollByLabel = null, findPollsterByLabel = null, onOpenPoll = null, onOpenPollster = null }) {
  if (!point) return null
  const [showSources, setShowSources] = useState(false)
  const sourcePollsters = Array.isArray(point?.sourcePollsters) ? point.sourcePollsters.filter(Boolean) : []
  const selectedPartySources = selectedPartyKey && point?.sourcePartyPolls && Array.isArray(point.sourcePartyPolls[selectedPartyKey])
    ? point.sourcePartyPolls[selectedPartyKey].filter(Boolean)
    : []
  const selectedPartyPollIds = selectedPartyKey && point?.sourcePartyPollIds && Array.isArray(point.sourcePartyPollIds[selectedPartyKey])
    ? point.sourcePartyPollIds[selectedPartyKey].filter(Boolean)
    : []
  const selectedParty = partyKeys.find((party) => party.key === selectedPartyKey) || null
  const exactPoll = selectedPartyPollIds.length === 1 && typeof findPollById === 'function'
    ? findPollById(selectedPartyPollIds[0])
    : null

  useEffect(() => {
    setShowSources(false)
  }, [point?.fullDate, selectedPartyKey])

  const renderSourceLinks = (items) => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 10,
      }}
    >
      {items.map((label) => {
        const poll = typeof findPollByLabel === 'function' ? findPollByLabel(label) : null
        const pollster = !poll && typeof findPollsterByLabel === 'function' ? findPollsterByLabel(label) : null
        const canOpen = (poll && typeof onOpenPoll === 'function') || (pollster && typeof onOpenPollster === 'function')
        const handleOpen = canOpen
          ? () => {
              haptic(6)
              if (poll && typeof onOpenPoll === 'function') onOpenPoll(poll)
              else if (pollster && typeof onOpenPollster === 'function') onOpenPollster(pollster)
            }
          : null

        return (
          <button
            key={label}
            type="button"
            onPointerUp={handleOpen || undefined}
            style={{
              border: `1px solid ${canOpen ? `${T.pr}2A` : (T.cardBorder || 'rgba(0,0,0,0.10)')}`,
              background: T.c0,
              color: canOpen ? T.pr : T.tl,
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 999,
              padding: '6px 10px',
              cursor: canOpen ? 'pointer' : 'default',
              maxWidth: '100%',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      style={{
        borderRadius: 12,
        padding: '9px 11px 8px',
        background: T.sf,
        margin: '6px 0 4px',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 8, textAlign: 'center' }}>
        {point.fullDate}
      </div>

      {(() => {
        const countLabel = typeof point.pollsterCount === 'number'
          ? `${point.pollsterCount} house${point.pollsterCount === 1 ? '' : 's'} included`
          : 'Trend point'
        const pollsterText = String(point.pollster || '').trim()
        const duplicateHouseLabel = /^\d+\s+houses?$/i.test(pollsterText)
        const detailText = pollsterText && !duplicateHouseLabel ? `${countLabel} · ${pollsterText}` : countLabel

        return (
          <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, textAlign: 'center', marginBottom: 10, lineHeight: 1.5 }}>
            {detailText}
          </div>
        )
      })()}

      {exactPoll && typeof onOpenPoll === 'function' ? (
        <div
          onClick={() => {
            haptic(6)
            onOpenPoll(exactPoll)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            padding: '8px 12px',
            borderRadius: 999,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.10)'}`,
            background: T.c0,
            color: T.pr,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Open poll detail →
        </div>
      ) : null}

      {sourcePollsters.length || selectedPartySources.length ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => {
              haptic(4)
              setShowSources((value) => !value)
            }}
            style={{
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.10)'}`,
              background: T.c0,
              color: T.tl,
              fontSize: 11.5,
              fontWeight: 800,
              borderRadius: 999,
              padding: '6px 10px',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {showSources ? 'Hide sources' : 'Show sources'}
          </button>
        </div>
      ) : null}

      {showSources && sourcePollsters.length ? (
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 12, color: T.tl, textAlign: 'center', marginBottom: 8, lineHeight: 1.5 }}>
            {sourcePollsters.length === 1 ? 'Source poll' : 'Source polls'}
          </div>
          {renderSourceLinks(sourcePollsters)}
        </div>
      ) : null}

      {showSources && selectedParty && selectedPartySources.length ? (
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 12, color: T.tl, textAlign: 'center', marginBottom: 8, lineHeight: 1.5, fontWeight: 700 }}>
            {selectedPartySources.length === 1 ? `${selectedParty.abbr} source poll` : `${selectedParty.abbr} source polls`}
          </div>
          {renderSourceLinks(selectedPartySources)}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {partyKeys.filter((p) => point[p.key] != null && !hidden[p.key] && !hardHidden[p.key])
          .sort((a, b) => (point[b.key] || 0) - (point[a.key] || 0))
          .map((p) => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.tm, flex: 1 }}>{p.key}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: p.color }}>{point[p.key]}%</span>
            </div>
          ))}
      </div>
    </div>
  )
}

export default function SharedTrendChart({ trends, rawPolls = [], partyKeys = PARTY_KEYS, hidden = {}, hardHidden = {}, T, metaText = '', findPollById = null, findPollByLabel = null, findPollsterByLabel = null, onOpenPoll = null, onOpenPollster = null }) {
  const chartPartyKeys = Array.isArray(partyKeys) && partyKeys.length ? partyKeys : PARTY_KEYS
  const orderedTrends = useMemo(
    () => [...(Array.isArray(trends) ? trends : [])].sort((a, b) => (toDate(a?.date)?.getTime() || 0) - (toDate(b?.date)?.getTime() || 0)),
    [trends],
  )
  const scrollRef = useRef(null)
  const svgRef = useRef(null)

  const filteredTrends = orderedTrends

  const smoothedTrends = useMemo(() => {
    if (!filteredTrends.length) return []
    const perPartySeries = Object.fromEntries(
      chartPartyKeys.map((party) => [party.key, applyEmaSmoothing(filteredTrends, party.key, 0.34)]),
    )

    return filteredTrends.map((row, index) => {
      const out = { ...row }
      chartPartyKeys.forEach((party) => {
        out[party.key] = perPartySeries[party.key][index]
      })
      return out
    })
  }, [filteredTrends, chartPartyKeys])

  const latestIndex = Math.max(0, filteredTrends.length - 1)
  const [tooltip, setTooltip] = useState(latestIndex)
  const [hoverX, setHoverX] = useState(null)
  const [selectedPartyKey, setSelectedPartyKey] = useState(null)

  useEffect(() => {
    setTooltip(latestIndex)
    setHoverX(null)
    setSelectedPartyKey(null)
  }, [latestIndex])

  const setHoverFromEvent = (event) => {
    const svg = svgRef.current
    if (!svg || !filteredTrends.length) return

    const rect = svg.getBoundingClientRect()
    const x = event.clientX - rect.left
    const clampedX = Math.max(chartStartX, Math.min(chartEndX, x))
    const rawIndex = (clampedX - chartStartX) / Math.max(1, COL)
    const nextIndex = Math.max(0, Math.min(filteredTrends.length - 1, rawIndex))
    setHoverX(clampedX)
    setTooltip(Math.round(nextIndex))
  }

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !filteredTrends.length) return undefined

    const snapRight = () => {
      el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    }

    snapRight()
    const frame = requestAnimationFrame(snapRight)
    const timeout = window.setTimeout(snapRight, 80)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [filteredTrends.length])

  if (!filteredTrends || filteredTrends.length < 2) return null

  const allVals = []
  chartPartyKeys.forEach((party) => {
    smoothedTrends.forEach((row) => {
      if (row[party.key] != null && !hardHidden[party.key]) allVals.push(row[party.key])
    })
  })

  if (!allVals.length) return null

  const minV = Math.max(0, Math.floor((Math.min(...allVals) - 2) / 2) * 2)
  const maxV = Math.min(100, Math.ceil((Math.max(...allVals) + 2) / 2) * 2)
  const range = Math.max(1, maxV - minV)

  const isDense = filteredTrends.length > 18
  const COL = isDense ? 62 : 84
  const PT = 20
  const PB = 52
  const H = 350
  const CH = H - PT - PB
  const W = COL * Math.max(1, smoothedTrends.length - 1) + 132

  const xPos = (i) => i * COL + 28
  const yPos = (v) => PT + CH - ((v - minV) / range) * CH
  const clampY = (value) => Math.max(PT, Math.min(H - PB, value))
  const trendStartMs = toDate(filteredTrends[0]?.date)?.getTime() || 0
  const trendEndMs = toDate(filteredTrends[filteredTrends.length - 1]?.date)?.getTime() || trendStartMs
  const trendSpanMs = Math.max(1, trendEndMs - trendStartMs)
  const chartStartX = xPos(0)
  const chartEndX = xPos(Math.max(0, smoothedTrends.length - 1))
  const hoverIndex = hoverX == null
    ? tooltip
    : Math.max(0, Math.min(filteredTrends.length - 1, (hoverX - chartStartX) / Math.max(1, COL)))
  const hoverLower = Math.floor(hoverIndex)
  const hoverUpper = Math.min(filteredTrends.length - 1, Math.ceil(hoverIndex))
  const hoverMix = hoverUpper === hoverLower ? 0 : hoverIndex - hoverLower
  const hoverCursorX = hoverX == null ? xPos(tooltip) : hoverX

  const interpolateValue = (partyKey) => {
    const a = smoothedTrends[hoverLower]?.[partyKey]
    const b = smoothedTrends[hoverUpper]?.[partyKey]
    if (a == null && b == null) return null
    if (a == null) return b
    if (b == null) return a
    return a + (b - a) * hoverMix
  }

  const hoveredValues = useMemo(() => {
    return chartPartyKeys
      .filter((party) => !hardHidden[party.key])
      .map((party) => {
        const value = interpolateValue(party.key)
        return value == null
          ? null
          : {
              key: party.key,
              abbr: party.abbr,
              color: party.color,
              value,
            }
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value)
  }, [chartPartyKeys, hardHidden, hoverLower, hoverUpper, hoverMix, interpolateValue])

  const focusedPartyKey = useMemo(() => {
    const visibleKeys = chartPartyKeys.filter((party) => !hardHidden[party.key] && !hidden[party.key]).map((party) => party.key)
    return visibleKeys.length === 1 ? visibleKeys[0] : null
  }, [hidden, hardHidden, chartPartyKeys])
  const rawPollLayer = useMemo(
    () =>
      buildRawPollScatter({
        rawPolls,
        partyKeys: chartPartyKeys,
        hardHidden,
        focusedPartyKey,
        trendStartMs,
        trendEndMs,
        trendSpanMs,
        chartStartX,
        chartEndX,
        yPos,
      }),
    [rawPolls, chartPartyKeys, hardHidden, focusedPartyKey, trendStartMs, trendEndMs, trendSpanMs, chartStartX, chartEndX, range, minV],
  )

  const gridVals = []
  for (let v = Math.ceil(minV / 4) * 4; v <= maxV; v += 4) gridVals.push(v)

  const gridColor = T.th === '#ffffff' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const axisTextColor = T.th === '#ffffff' ? 'rgba(255,255,255,0.45)' : '#7A7A7A'
  const guideColor = T.th === '#ffffff' ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.20)'
  const hasFocusedSubset = !!focusedPartyKey
  const labelYs = (() => {
    const labels = chartPartyKeys
      .filter((party) => !hardHidden[party.key])
      .map((party) => {
        const value = interpolateValue(party.key)
        if (value == null) return null
        return {
          key: party.key,
          y: yPos(value),
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.y - b.y)

    const minGap = 16
    const top = PT + 12
    const bottom = H - PB - 10

    labels.forEach((label, index) => {
      const prevY = index > 0 ? labels[index - 1].labelY : top - minGap
      label.labelY = Math.max(label.y, prevY + minGap)
    })

    for (let index = labels.length - 1; index >= 0; index -= 1) {
      const nextY = index < labels.length - 1 ? labels[index + 1].labelY : bottom + minGap
      labels[index].labelY = Math.min(labels[index].labelY, nextY - minGap, bottom)
    }

    return new Map(labels.map((label) => [label.key, label.labelY]))
  })()

  const lines = chartPartyKeys.map((party) => {
    if (hardHidden[party.key]) return null
    const isDimmed = hasFocusedSubset && party.key !== focusedPartyKey

    const pts = smoothedTrends
      .map((row, index) => {
        if (row[party.key] == null) return null
        return {
          x: xPos(index),
          y: yPos(row[party.key]),
          smoothed: row[party.key],
          raw: filteredTrends[index]?.[party.key],
          i: index,
        }
      })
      .filter(Boolean)

    if (pts.length < 2) return null

    const selected = pts.find((pt) => pt.i === tooltip)
    const latest = pts[pts.length - 1]
    const hoverValue = interpolateValue(party.key)
    const hoverPoint = hoverValue == null ? null : { x: hoverCursorX, y: yPos(hoverValue) }
    const pathD = buildCurvedPath(pts)

    return (
      <g key={party.key}>
        <path
          d={pathD}
          fill="none"
          stroke={party.color}
          strokeWidth={isDimmed ? 2 : 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isDimmed ? 0.2 : 0.98}
        />

        {selected && hoverX == null ? (
          <text
            x={Math.min(selected.x + 12, W - 70)}
            y={labelYs.get(party.key) || selected.y - 10}
            fontSize={11}
            fontWeight={900}
            fill={party.color}
            opacity={isDimmed ? 0.45 : 1}
            stroke={T.c0}
            strokeWidth={3}
            paintOrder="stroke"
            strokeLinejoin="round"
          >
            {party.abbr} {Math.round(selected.raw ?? selected.smoothed)}%
          </text>
        ) : null}

        {hoverX == null && tooltip === latestIndex && latest ? (
          <text
            x={Math.min(latest.x + 14, W - 82)}
            y={labelYs.get(party.key) || latest.y + 14}
            fontSize={11.5}
            fontWeight={900}
            fill={party.color}
            opacity={isDimmed ? 0.45 : 1}
            stroke={T.c0}
            strokeWidth={3}
            paintOrder="stroke"
            strokeLinejoin="round"
          >
            {party.abbr} {Math.round(latest.raw ?? latest.smoothed)}%
          </text>
        ) : null}

        {hoverPoint && hoverX != null ? (
          <g>
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r={hoverPoint ? 5.5 : 0}
              fill={party.color}
              stroke={T.c0}
              strokeWidth={2}
              opacity={isDimmed ? 0.45 : 1}
            />
            <text
              x={Math.min(hoverPoint.x + 10, W - 64)}
              y={labelYs.get(party.key) || hoverPoint.y - 8}
              fontSize={11.5}
              fontWeight={900}
              fill={party.color}
              opacity={isDimmed ? 0.45 : 1}
              stroke={T.c0}
              strokeWidth={3}
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {party.abbr} {hoverValue.toFixed(1)}%
            </text>
          </g>
        ) : null}
      </g>
    )
  }).filter(Boolean)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 4px 0' }}>
        <svg width={40} height={H} style={{ flexShrink: 0, overflow: 'visible' }}>
          {gridVals.map((v) => (
            <text key={v} x={38} y={yPos(v) + 4} textAnchor="end" fontSize={10} fill={axisTextColor} fontFamily="Outfit,sans-serif">
              {v}
            </text>
          ))}
        </svg>

        <div
          ref={scrollRef}
          style={{
            overflowX: 'auto',
            flex: 1,
            position: 'relative',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ position: 'relative', width: W, height: H }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              width={W}
              height={H}
              style={{ display: 'block', overflow: 'visible', paddingRight: 40, touchAction: 'none' }}
              onPointerMove={(event) => {
                if (event.pointerType === 'mouse' || event.pointerType === 'pen' || event.pointerType === 'touch') {
                  setHoverFromEvent(event)
                }
              }}
              onPointerDown={(event) => {
                setHoverFromEvent(event)
              }}
              onPointerLeave={() => {
                setHoverX(null)
                setTooltip(latestIndex)
                setSelectedPartyKey(null)
              }}
            >
              <defs>
                <linearGradient id="trendGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={T.pr} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={T.pr} stopOpacity="0" />
                </linearGradient>
              </defs>

              {gridVals.map((v) => (
                <line key={v} x1={0} y1={yPos(v)} x2={W} y2={yPos(v)} stroke={gridColor} strokeWidth={0.8} />
              ))}

              <rect x={chartStartX} y={PT} width={Math.max(1, chartEndX - chartStartX)} height={H - PT - PB} fill="url(#trendGlow)" opacity={hoverX == null ? 0.55 : 0.28} />

              <g aria-label="Raw poll observations">
                {rawPollLayer.dots.map((dot) => (
                  <circle
                    key={dot.key}
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.muted ? 1.3 : 1.75}
                    fill={dot.color}
                    opacity={hoverX == null ? (dot.muted ? 0.06 : 0.16) : (dot.muted ? 0.04 : 0.1)}
                  />
                ))}
              </g>

              <g aria-label="Trend lines">
                {smoothedTrends.map((row, index) => {
                  const prev = smoothedTrends[index - 1]
                  const showYear = !prev || prev.yearShort !== row.yearShort
                  return (
                    <text
                      key={index}
                      x={xPos(index)}
                      y={H - 10}
                      textAnchor="middle"
                      fontSize={10}
                      fill={axisTextColor}
                      fontFamily="Outfit,sans-serif"
                    >
                      {showYear ? `${row.month} ${row.yearShort}` : row.month}
                    </text>
                  )
                })}

                {hoverCursorX != null ? (
                  <>
                    <line
                      x1={hoverCursorX}
                      y1={PT}
                      x2={hoverCursorX}
                      y2={H - PB}
                      stroke={guideColor}
                      strokeWidth={1.4}
                      opacity={0.95}
                      strokeDasharray="4,3"
                    />
                    <circle cx={hoverCursorX} cy={PT + 2} r={4.25} fill={T.c0} stroke={guideColor} strokeWidth={1.5} />
                  </>
                ) : null}

                {hoverX == null && tooltip === latestIndex ? (
                  <text
                    x={xPos(tooltip)}
                    y={PT - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={800}
                    fill={axisTextColor}
                    fontFamily="Outfit,sans-serif"
                  >
                    Latest
                  </text>
                ) : null}

                {lines}

                <rect
                  x={chartStartX}
                  y={PT}
                  width={Math.max(1, chartEndX - chartStartX)}
                  height={H - PT - PB}
                  fill="transparent"
                  style={{ cursor: 'crosshair', touchAction: 'none' }}
                  onPointerEnter={(event) => {
                    setHoverFromEvent(event)
                  }}
                  onPointerMove={(event) => {
                    setHoverFromEvent(event)
                  }}
                  onPointerDown={(event) => {
                    setHoverFromEvent(event)
                  }}
                  onPointerLeave={() => {
                    setHoverX(null)
                    setTooltip(latestIndex)
                  }}
                />
              </g>
            </svg>

            {hoverX != null ? (
              <div
                style={{
                  position: 'absolute',
                  left: Math.max(8, Math.min(W - 220, hoverCursorX + 16)),
                  top: 18,
                  width: 200,
                  borderRadius: 14,
                  padding: '10px 12px 9px',
                  background: T.sf,
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                  boxShadow: '0 12px 34px rgba(0,0,0,0.10)',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, color: T.th, lineHeight: 1.1, marginBottom: 3 }}>
                  {filteredTrends[hoverLower]?.fullDate || filteredTrends[tooltip]?.fullDate}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.tl, marginBottom: 8 }}>
                  Live slice
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {hoveredValues.slice(0, 5).map((item) => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.tm, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.abbr}
                        </span>
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 900, color: item.color }}>
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <PointDetails
        point={filteredTrends[tooltip]}
        hidden={{}}
        hardHidden={hardHidden}
        partyKeys={chartPartyKeys}
        T={T}
        selectedPartyKey={selectedPartyKey || focusedPartyKey}
        findPollById={findPollById}
        findPollByLabel={findPollByLabel}
        findPollsterByLabel={findPollsterByLabel}
        onOpenPoll={onOpenPoll}
        onOpenPollster={onOpenPollster}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          flexWrap: 'wrap',
          paddingTop: 3,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: T.tl }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.pr, opacity: 0.26 }} />
          Raw polls
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: T.tl }}>
          <span style={{ width: 12, height: 0, borderTop: `2px solid ${T.pr}` }} />
          Smoothed trend
        </div>
        {rawPollLayer.includedPollCount ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: T.tl }}>
            {rawPollLayer.includedPollCount} polls included
          </div>
        ) : null}
      </div>

      {metaText ? (
        <div
          style={{
            fontSize: 11.5,
            color: T.tl,
            lineHeight: 1.45,
            textAlign: 'center',
            paddingTop: 6,
          }}
        >
          {metaText}
        </div>
      ) : null}
    </div>
  )
}
