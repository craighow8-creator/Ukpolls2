const PARTY_FIELDS = [
  { field: 'ref', id: 'reform', name: 'Reform UK', abbr: 'REF', color: '#12B7D4' },
  { field: 'lab', id: 'labour', name: 'Labour', abbr: 'LAB', color: '#C8102E' },
  { field: 'con', id: 'con', name: 'Conservative', abbr: 'CON', color: '#0087DC' },
  { field: 'grn', id: 'green', name: 'Green', abbr: 'GRN', color: '#02A95B' },
  { field: 'ld', id: 'ld', name: 'Lib Dem', abbr: 'LD', color: '#FAA61A' },
  { field: 'rb', id: 'rb', name: 'Restore Britain', abbr: 'RB', color: '#7C3AED' },
  { field: 'snp', id: 'snp', name: 'SNP', abbr: 'SNP', color: '#C4922A' },
]
const GUARDED_EMERGING_PARTY_FIELDS = new Set(['rb'])

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const raw = String(value).replace(/%/g, '').replace(/,/g, '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseDateish(value) {
  const text = cleanText(value)
  if (!text) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const d = new Date(`${text}T00:00:00Z`)
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [dd, mm, yyyy] = text.split('-').map(Number)
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  return null
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

function displayDate(poll) {
  return cleanText(poll?.fieldworkEnd) || cleanText(poll?.publishedAt) || cleanText(poll?.date) || ''
}

function hasImpossibleDateOrder(poll) {
  const published = parseDateish(poll?.publishedAt)
  const fieldworkEnd = parseDateish(poll?.fieldworkEnd)
  const date = parseDateish(poll?.date)

  if (published && fieldworkEnd && daysBetween(fieldworkEnd, published) > 7) return true
  if (published && date && daysBetween(date, published) > 7) return true
  return false
}

function sortPollsDesc(polls) {
  return [...(polls || [])].sort((a, b) => {
    const ad = parseDateish(displayDate(a))
    const bd = parseDateish(displayDate(b))
    return (bd?.getTime() || 0) - (ad?.getTime() || 0)
  })
}

function average(nums) {
  const vals = nums.filter((v) => v != null)
  if (!vals.length) return null
  return +(vals.reduce((sum, v) => sum + v, 0) / vals.length).toFixed(1)
}

function weightedAverage(entries) {
  const usable = (entries || []).filter((entry) =>
    entry &&
    entry.value != null &&
    Number.isFinite(entry.value) &&
    entry.weight != null &&
    Number.isFinite(entry.weight) &&
    entry.weight > 0
  )

  if (!usable.length) return null

  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0)
  if (!totalWeight) return null

  return +(usable.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / totalWeight).toFixed(1)
}

function stdDev(values) {
  const vals = values.filter((v) => v != null)
  if (vals.length < 2) return 0
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length
  const variance = vals.reduce((s, v) => s + ((v - avg) ** 2), 0) / vals.length
  return +Math.sqrt(variance).toFixed(1)
}

function sourceTypeRank(poll) {
  const type = cleanText(poll?.sourceType).toLowerCase()
  if (type === 'official') return 5
  if (['yougov', 'opinium', 'more in common', 'find out now', 'jl partners', 'ipsos', 'survation', 'techne', 'focaldata'].includes(type)) return 4
  if (type === 'wikipedia') return 1
  return 2
}

function getPollWeight(poll, now = new Date()) {
  const sample = safeNumber(poll?.sample)
  const sampleWeight = sample && sample > 0 ? Math.sqrt(sample) : 20

  const pollDate = parseDateish(displayDate(poll))
  const ageDays = pollDate ? Math.max(0, daysBetween(now, pollDate)) : 28
  const freshnessWeight = Math.exp(-ageDays / 21)

  const sourceRank = sourceTypeRank(poll)
  const sourceWeight =
    sourceRank >= 4 ? 1.05
      : sourceRank <= 1 ? 0.9
        : 1

  return sampleWeight * freshnessWeight * sourceWeight
}

function confidenceRank(poll) {
  const c = cleanText(poll?.confidence).toLowerCase()
  if (c === 'high') return 3
  if (c === 'medium') return 2
  if (c === 'low') return 1
  return 0
}

function validationRank(poll) {
  const v = cleanText(poll?.verificationStatus).toLowerCase()
  if (v === 'verified') return 3
  if (v === 'flagged') return 2
  if (v === 'rejected') return 0
  return 1
}

function isPollTrendEligible(poll) {
  if (!poll || typeof poll !== 'object') return false
  if (poll?.suspect) return false
  if (cleanText(poll?.verificationStatus).toLowerCase() === 'rejected') return false
  if (hasImpossibleDateOrder(poll)) return false

  const d = parseDateish(displayDate(poll))
  if (!d) return false

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const ageDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

  if (cleanText(poll?.sourceType).toLowerCase() === 'wikipedia' && ageDays > 365) return false
  return true
}

function latestByPollster(polls) {
  const sorted = sortPollsDesc(polls)
  const map = new Map()

  for (const poll of sorted) {
    const key = cleanText(poll?.pollster).toLowerCase()
    if (!key || map.has(key)) continue
    if (!isPollTrendEligible(poll)) continue
    map.set(key, poll)
  }

  return [...map.values()]
}

function getWindowPolls(allPolls, endDate, windowDays = 28) {
  const endTs = endDate?.getTime?.() || 0
  const startTs = endTs - windowDays * 24 * 60 * 60 * 1000

  return (allPolls || []).filter((poll) => {
    if (!isPollTrendEligible(poll)) return false
    const d = parseDateish(displayDate(poll))
    if (!d) return false
    const ts = d.getTime()
    return ts >= startTs && ts <= endTs
  })
}

function keepLatestPerPollsterWithinWindow(polls) {
  const sorted = sortPollsDesc(polls)
  const map = new Map()

  for (const poll of sorted) {
    const key = cleanText(poll?.pollster).toLowerCase()
    if (!key) continue

    const existing = map.get(key)
    if (!existing) {
      map.set(key, poll)
      continue
    }

    const incomingScore =
      validationRank(poll) * 100 +
      confidenceRank(poll) * 10 +
      sourceTypeRank(poll)

    const existingScore =
      validationRank(existing) * 100 +
      confidenceRank(existing) * 10 +
      sourceTypeRank(existing)

    if (incomingScore > existingScore) {
      map.set(key, poll)
    }
  }

  return [...map.values()]
}

function hasEnoughEmergingPartyEvidence(polls, field) {
  if (!GUARDED_EMERGING_PARTY_FIELDS.has(field)) return true

  const supportingPolls = (polls || []).filter((poll) => safeNumber(poll?.[field]) != null)
  const distinctPollsters = new Set(
    supportingPolls
      .map((poll) => cleanText(poll?.pollster).toLowerCase())
      .filter(Boolean),
  )

  return supportingPolls.length >= 3 && distinctPollsters.size >= 2
}

function buildAverageFromPolls(polls, fallbackParties = []) {
  const eligiblePolls = (polls || []).filter(isPollTrendEligible)
  const latest = latestByPollster(eligiblePolls)
  const previous = new Map()
  const grouped = new Map()

  for (const poll of sortPollsDesc(eligiblePolls)) {
    const key = cleanText(poll?.pollster).toLowerCase()
    if (!key) continue
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(poll)
  }

  for (const [key, list] of grouped.entries()) {
    if (list.length > 1) previous.set(key, list[1])
  }

  const now = new Date()

  const snapshot = PARTY_FIELDS.map((party) => {
    const partyIsEligibleForSnapshot = hasEnoughEmergingPartyEvidence(eligiblePolls, party.field)
    const currentValues = latest.map((poll) => ({
      value: partyIsEligibleForSnapshot ? safeNumber(poll?.[party.field]) : null,
      weight: getPollWeight(poll, now),
    }))
    const previousValues = [...previous.values()].map((poll) => ({
      value: partyIsEligibleForSnapshot ? safeNumber(poll?.[party.field]) : null,
      weight: getPollWeight(poll, now),
    }))
    const avgPct = weightedAverage(currentValues)
    const prevAvg = weightedAverage(previousValues)
    const fallback = (fallbackParties || []).find((p) => cleanText(p?.name).toLowerCase() === party.name.toLowerCase())

    return {
      id: party.id,
      key: party.field,
      name: party.name,
      abbr: party.abbr,
      color: fallback?.color || party.color,
      pct: avgPct ?? safeNumber(fallback?.pct) ?? 0,
      change: avgPct != null && prevAvg != null ? +(avgPct - prevAvg).toFixed(1) : safeNumber(fallback?.change) ?? 0,
      seats: fallback?.seats ?? null,
      pollsterCount: currentValues.filter((v) => v != null).length,
    }
  }).filter((party) => party.pct != null)

  return snapshot.sort((a, b) => (b.pct || 0) - (a.pct || 0))
}

function applyEmaSmoothing(rows, alpha = 0.38) {
  if (!Array.isArray(rows) || rows.length < 2) return rows || []

  const out = []
  for (const row of rows) {
    const prev = out[out.length - 1] || null
    const next = { ...row }

    for (const party of PARTY_FIELDS) {
      const current = safeNumber(row?.[party.name])
      const previous = prev ? safeNumber(prev?.[party.name]) : null

      if (current == null) continue
      if (previous == null) {
        next[party.name] = current
      } else {
        next[party.name] = +(previous + alpha * (current - previous)).toFixed(1)
      }
    }

    out.push(next)
  }

  return out
}

function startOfUtcMonth(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function endOfUtcMonth(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
}

function sourcePollLabel(poll) {
  const pollster = cleanText(poll?.pollster) || 'Unknown pollster'
  const date = displayDate(poll)
  return date ? `${pollster} (${date})` : pollster
}

function buildTrendSeries(polls, fallbackTrends = []) {
  const eligiblePolls = (polls || []).filter(isPollTrendEligible)
  const sortedAsc = sortPollsDesc(eligiblePolls).reverse()
  if (!sortedAsc.length) return fallbackTrends || []

  const datedPolls = sortedAsc
    .map((poll) => ({ ...poll, _dateObj: parseDateish(displayDate(poll)) }))
    .filter((poll) => poll._dateObj)

  if (!datedPolls.length) return fallbackTrends || []

  const firstDate = datedPolls[0]._dateObj
  const lastDate = datedPolls[datedPolls.length - 1]._dateObj
  let cursor = startOfUtcMonth(firstDate)
  const end = startOfUtcMonth(lastDate)

  const monthlyRows = []
  while (cursor.getTime() <= end.getTime()) {
    const monthEnd = endOfUtcMonth(cursor)
    const anchor = monthEnd.getTime() > lastDate.getTime() ? lastDate : monthEnd
    const windowPolls = keepLatestPerPollsterWithinWindow(getWindowPolls(datedPolls, anchor, 35))

    if (windowPolls.length) {
      const directCount = windowPolls.filter((poll) => sourceTypeRank(poll) >= 4).length
      const sourcePartyPolls = Object.fromEntries(
        PARTY_FIELDS.map((party) => [
          party.name,
          [...new Set(windowPolls.filter((poll) => safeNumber(poll?.[party.field]) != null).map(sourcePollLabel).filter(Boolean))],
        ]),
      )
      const sourcePartyPollIds = Object.fromEntries(
        PARTY_FIELDS.map((party) => [
          party.name,
          [...new Set(windowPolls.filter((poll) => safeNumber(poll?.[party.field]) != null).map((poll) => cleanText(poll?.id)).filter(Boolean))],
        ]),
      )
      const row = {
        date: anchor.toISOString().slice(0, 10),
        month: anchor.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        pollster: `${windowPolls.length} houses`,
        pollsterCount: windowPolls.length,
        sourcePollsters: [...new Set(windowPolls.map(sourcePollLabel).filter(Boolean))],
        sourcePartyPolls,
        sourcePartyPollIds,
        directSourceCount: directCount,
        isTrendAggregate: true,
        confidence:
          directCount >= 3 ? 'robust'
            : directCount >= 1 ? 'mixed'
              : 'fallback',
      }

      for (const party of PARTY_FIELDS) {
        const partyIsEligibleForTrend = hasEnoughEmergingPartyEvidence(eligiblePolls, party.field)
        const values = partyIsEligibleForTrend ? windowPolls.map((poll) => safeNumber(poll?.[party.field])) : []
        row[party.name] = average(values)
      }

      monthlyRows.push(row)
    }

    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return applyEmaSmoothing(monthlyRows, 0.45)
}

function seriesForParty(trendSeries, partyName) {
  return (trendSeries || [])
    .map((point) => ({ date: point?.date, value: safeNumber(point?.[partyName]) }))
    .filter((point) => point.value != null)
}

function deltaForDays(series, days) {
  const vals = Array.isArray(series) ? series : []
  if (vals.length < 2) return null

  const latest = vals[vals.length - 1]
  const latestDate = parseDateish(latest?.date)
  if (!latestDate) return null

  const cutoffTs = latestDate.getTime() - days * 24 * 60 * 60 * 1000

  let anchor = null
  for (const point of vals) {
    const d = parseDateish(point?.date)
    if (!d) continue
    if (d.getTime() >= cutoffTs) {
      anchor = point
      break
    }
  }

  if (!anchor) anchor = vals[0]
  if (anchor?.value == null || latest?.value == null) return null
  return +(latest.value - anchor.value).toFixed(1)
}

function buildMovementMetrics(snapshot, trendSeries) {
  return snapshot.map((party) => {
    const series = seriesForParty(trendSeries, party.name)
    const recentDelta = deltaForDays(series, 30)
    const mediumDelta = deltaForDays(series, 90)
    const longDelta = deltaForDays(series, 180)
    const volatility = stdDev(series.slice(-6).map((point) => point.value))
    const latest = series.length ? series[series.length - 1]?.value : null

    let confidence = 'low'
    if (series.length >= 8 && volatility <= 2) confidence = 'high'
    else if (series.length >= 4) confidence = 'medium'

    let movementLabel = 'Trend confidence limited'
    if (recentDelta != null) {
      if (recentDelta >= 2) movementLabel = 'Sustained rise'
      else if (recentDelta > 0) movementLabel = 'Soft rise'
      else if (recentDelta <= -2) movementLabel = 'Sustained fall'
      else if (recentDelta < 0) movementLabel = 'Soft decline'
      else movementLabel = 'Flat trend'
    }

    return {
      ...party,
      latest,
      recentDelta,
      mediumDelta,
      longDelta,
      volatility,
      confidence,
      confidenceLabel:
        confidence === 'high'
          ? 'High trend confidence'
          : confidence === 'medium'
            ? 'Moderate trend confidence'
            : 'Limited trend confidence',
      movementLabel,
      isRising: recentDelta != null && recentDelta > 0,
      isFalling: recentDelta != null && recentDelta < 0,
    }
  })
}

function buildRaceSummary(parties) {
  const ranked = [...(parties || [])].sort((a, b) => (b.pct || 0) - (a.pct || 0))
  const leader = ranked[0] || null
  const second = ranked[1] || null
  const gap = leader && second ? +((leader.pct || 0) - (second.pct || 0)).toFixed(1) : null

  let raceLabel = 'Snapshot only'
  if (gap != null) {
    if (gap <= 2) raceLabel = 'Tight race'
    else if (gap <= 5) raceLabel = 'Competitive lead'
    else raceLabel = 'Clear snapshot lead'
  }

  return { leader, second, gap, raceLabel }
}

export function buildPollContext({ polls = [], fallbackParties = [], fallbackTrends = [] } = {}) {
  const eligiblePolls = (polls || []).filter(isPollTrendEligible)
  const allPollsSorted = sortPollsDesc(eligiblePolls)
  const latestPollsByPollster = latestByPollster(allPollsSorted)
  const rawAverage = buildAverageFromPolls(allPollsSorted, fallbackParties)
  const trendSeries = buildTrendSeries(allPollsSorted, fallbackTrends)
  const partyPollSnapshot = buildMovementMetrics(rawAverage, trendSeries)
  const raceSummary = buildRaceSummary(partyPollSnapshot)

  return {
    allPollsSorted,
    latestPollsByPollster,
    pollAverage: partyPollSnapshot,
    partyPollSnapshot,
    trendSeries,
    raceSummary,
    sourcePollCount: allPollsSorted.length,
    pollsterCount: latestPollsByPollster.length,
    generatedAt: new Date().toISOString(),
  }
}

export default buildPollContext
