import { POLICY_RECORDS } from './policyRecords'
import { POLICY_AREAS, POLICY_AREA_LABELS, POLICY_TAXONOMY } from './policyTaxonomy'
import { chooseControllingSource, prioritizeSources } from './sourcePriority'
import { getStanceLabel } from './stanceUtils'

export const COMPARISON_PARTIES = [
  'Reform UK',
  'Labour',
  'Conservative',
  'Green',
  'Lib Dem',
  'SNP',
  'Plaid Cymru',
  'Restore Britain',
]

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

function uniqueBy(values = [], keyFn) {
  const seen = new Set()
  return values.filter((value) => {
    const key = keyFn(value)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function confidenceRank(value) {
  const key = norm(value)
  if (key === 'high') return 3
  if (key === 'medium') return 2
  if (key === 'low') return 1
  return 0
}

function coverageRank(value) {
  const key = norm(value)
  if (key === 'full') return 3
  if (key === 'standard') return 2
  if (key === 'partial') return 1
  return 0
}

function cleanLabel(value) {
  return String(value || '').replace(/_/g, ' ').trim()
}

function formatAreaLabel(area) {
  return POLICY_AREA_LABELS?.[area] || String(area || '').replace(/([a-z])([A-Z])/g, '$1 $2')
}

function sourceKey(source = {}) {
  return `${norm(source.url)}|${norm(source.title)}|${norm(source.type)}`
}

function sortPolicyRecords(records = []) {
  return [...records].sort((a, b) => {
    const aSource = chooseControllingSource(a.sources || [])
    const bSource = chooseControllingSource(b.sources || [])
    const sourceGap = Number(bSource?.priority || 0) - Number(aSource?.priority || 0)
    if (sourceGap !== 0) return sourceGap
    const confidenceGap = confidenceRank(b.confidence) - confidenceRank(a.confidence)
    if (confidenceGap !== 0) return confidenceGap
    return Math.abs(Number(b.stanceScore || 0)) - Math.abs(Number(a.stanceScore || 0))
  })
}

export function getRepresentativePolicyRecord(policyRecords = POLICY_RECORDS, partyName, area, topic = 'All') {
  const partyKey = norm(partyName)
  const records = getPoliciesForAreaAndTopic(policyRecords, area, topic).filter((record) => norm(record.party) === partyKey)
  return sortPolicyRecords(records)[0] || null
}

export function derivePolicyPreview(record) {
  if (!record) {
    return {
      missing: true,
      summary: 'No structured record available yet for this issue.',
      details: [],
      controllingSource: null,
      sourceCount: 0,
      stanceLabel: 'No record',
      confidence: 'missing',
      coverage: 'missing',
    }
  }

  const sources = prioritizeSources(Array.isArray(record.sources) ? record.sources : [])
  const details = Array.isArray(record.details) ? record.details.filter(Boolean).slice(0, 4) : []

  return {
    missing: false,
    id: record.id,
    title: record.title || record.topic || record.area,
    summary: record.summary || record.title || 'Structured policy record available.',
    details,
    controllingSource: sources[0] || record.controllingSource || chooseControllingSource(record.sources || []),
    sourceCount: sources.length,
    stanceScore: record.stanceScore,
    stanceLabel: record.stanceLabel || getStanceLabel(record.stanceScore),
    confidence: record.confidence || 'medium',
    coverage: record.coverage || 'standard',
    rawClaims: Array.isArray(record.rawClaims) ? record.rawClaims : [],
  }
}

export function derivePartyAreaPreview(policyRecords = POLICY_RECORDS, partyName, area, topic = 'All') {
  return derivePolicyPreview(getRepresentativePolicyRecord(policyRecords, partyName, area, topic))
}

export function getPoliciesForArea(policyRecords = POLICY_RECORDS, area) {
  const areaKey = norm(area)
  return (policyRecords || []).filter((record) => norm(record.area) === areaKey)
}

export function getPoliciesForAreaAndTopic(policyRecords = POLICY_RECORDS, area, topic = 'All') {
  const areaRecords = getPoliciesForArea(policyRecords, area)
  if (!topic || norm(topic) === 'all') return areaRecords
  const topicKey = norm(topic)
  return areaRecords.filter((record) => norm(record.topic) === topicKey)
}

export function getPolicyAreaOrder(policyTaxonomy = POLICY_TAXONOMY) {
  const taxonomyKeys = Object.keys(policyTaxonomy || {})
  const extras = taxonomyKeys.filter((area) => !POLICY_AREAS.includes(area))
  return [...POLICY_AREAS, ...extras]
}

export function getPartyComparisonRecord(policyRecords = POLICY_RECORDS, partyName, area, topic = 'All') {
  const partyKey = norm(partyName)
  const records = getPoliciesForAreaAndTopic(policyRecords, area, topic).filter((record) => norm(record.party) === partyKey)
  if (!records.length) {
    return {
      party: partyName,
      area,
      topic,
      missing: true,
      stanceScore: null,
      stanceLabel: 'No record',
      summary: 'No structured record available yet for this issue.',
      details: [],
      sources: [],
      controllingSource: null,
      sourceCount: 0,
      confidence: 'missing',
      coverage: 'missing',
    }
  }

  const orderedRecords = sortPolicyRecords(records)
  const representative = orderedRecords[0]
  const scores = records.map((record) => Number(record.stanceScore)).filter(Number.isFinite)
  const stanceScore = scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : Number(representative.stanceScore || 0)
  const sources = uniqueBy(
    records.flatMap((record) => (Array.isArray(record.sources) ? record.sources : [])),
    sourceKey,
  )
  const rankedSources = prioritizeSources(sources)
  const details = uniqueBy(
    orderedRecords.flatMap((record) => (Array.isArray(record.details) ? record.details : [])),
    (detail) => norm(detail),
  )
  const confidence =
    records.map((record) => record.confidence).sort((a, b) => confidenceRank(a) - confidenceRank(b))[0] ||
    representative.confidence ||
    'medium'
  const coverage =
    records.map((record) => record.coverage).sort((a, b) => coverageRank(a) - coverageRank(b))[0] ||
    representative.coverage ||
    'standard'

  return {
    party: partyName,
    area,
    topic,
    missing: false,
    recordIds: records.map((record) => record.id).filter(Boolean),
    records,
    stanceScore,
    stanceLabel: getStanceLabel(stanceScore),
    summary: representative.summary || representative.title || representative.topic || 'Structured policy record available.',
    details: details.slice(0, 4),
    sources: rankedSources,
    controllingSource: rankedSources[0] || representative.controllingSource || chooseControllingSource(representative.sources || []),
    sourceCount: rankedSources.length,
    confidence,
    coverage,
  }
}

export function getComparisonRows(policyRecords = POLICY_RECORDS, area, topic = 'All', parties = COMPARISON_PARTIES) {
  const partyList = uniqueBy([...(parties || []), ...COMPARISON_PARTIES], (party) => norm(party))
  return partyList.map((party) => getPartyComparisonRecord(policyRecords, party, area, topic))
}

function knownRows(rows = []) {
  return rows.filter((row) => !row.missing && Number.isFinite(Number(row.stanceScore)))
}

function getExtremes(rows = []) {
  const known = knownRows(rows)
  if (!known.length) return { hardest: null, mostOpen: null, spread: 0 }
  const ordered = [...known].sort((a, b) => Number(a.stanceScore) - Number(b.stanceScore))
  const hardest = ordered[0]
  const mostOpen = ordered[ordered.length - 1]
  return {
    hardest,
    mostOpen,
    spread: Number(mostOpen.stanceScore) - Number(hardest.stanceScore),
  }
}

function getLowestConfidence(rows = []) {
  const candidates = rows
    .filter((row) => !row.missing)
    .sort((a, b) => {
      const confidenceGap = confidenceRank(a.confidence) - confidenceRank(b.confidence)
      if (confidenceGap !== 0) return confidenceGap
      return coverageRank(a.coverage) - coverageRank(b.coverage)
    })
  return candidates[0] || null
}

export function deriveComparisonSignals(policyRecords = POLICY_RECORDS, area, topic = 'All', parties = COMPARISON_PARTIES) {
  const rows = getComparisonRows(policyRecords, area, topic, parties)
  const known = knownRows(rows)
  const missing = rows.filter((row) => row.missing)
  const { hardest, mostOpen, spread } = getExtremes(rows)
  const lowConfidence = getLowestConfidence(rows)
  const bandCounts = known.reduce((acc, row) => {
    const label = row.stanceLabel || getStanceLabel(row.stanceScore)
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})
  const largestBand = Object.entries(bandCounts).sort((a, b) => b[1] - a[1])[0] || null

  return {
    rows,
    knownCount: known.length,
    missingCount: missing.length,
    hardest,
    mostOpen,
    lowConfidence,
    spread,
    bandCounts,
    largestBand,
    isPolarised: spread >= 6,
    isClustered: spread > 0 && spread <= 3,
  }
}

export function deriveComparisonBriefing(policyRecords = POLICY_RECORDS, area, topic = 'All', parties = COMPARISON_PARTIES) {
  const areaLabel = formatAreaLabel(area).toLowerCase()
  const topicLabel = topic && norm(topic) !== 'all' ? String(topic).toLowerCase() : areaLabel
  const signals = deriveComparisonSignals(policyRecords, area, topic, parties)
  const { hardest, mostOpen, lowConfidence, knownCount, missingCount, spread, isPolarised, isClustered, largestBand } = signals

  if (!knownCount) {
    return {
      headline: `No structured ${topicLabel} comparison yet`,
      body: 'The comparison framework is ready, but this issue still needs source-backed records.',
      signals: [
        { label: 'Records', value: '0 available' },
        { label: 'Coverage', value: 'Awaiting data' },
      ],
    }
  }

  const splitText = hardest && mostOpen && hardest.party !== mostOpen.party
    ? `${hardest.party} and ${mostOpen.party} mark the widest split`
    : largestBand
    ? `${largestBand[1]} parties sit in the ${largestBand[0].toLowerCase()} band`
    : 'Parties cluster around a similar position'

  let headline = `The ${topicLabel} divide is ${isPolarised ? 'wide' : isClustered ? 'clustered' : 'measurable'}`
  let body = `${splitText}.`

  if (isPolarised && hardest && mostOpen) {
    body = `${hardest.party} takes the hardest line, while ${mostOpen.party} is the most open in the current records.`
  } else if (isClustered && largestBand) {
    body = `Most parties sit close together, with ${largestBand[0].toLowerCase()} the largest stance band.`
  } else if (largestBand) {
    body = `The largest group is ${largestBand[0].toLowerCase()}, while outliers define the edges of the debate.`
  }

  const briefingSignals = [
    hardest ? { label: 'Hardest line', value: hardest.party } : null,
    mostOpen ? { label: 'Most open', value: mostOpen.party } : null,
    {
      label: 'Coverage',
      value: missingCount ? `${knownCount}/${knownCount + missingCount} parties` : `${knownCount} parties`,
    },
  ].filter(Boolean)

  if (lowConfidence && (norm(lowConfidence.confidence) !== 'high' || norm(lowConfidence.coverage) === 'partial')) {
    briefingSignals[2] = {
      label: 'Thinnest record',
      value: lowConfidence.party,
    }
  }

  return {
    headline,
    body,
    signals: briefingSignals,
    spread,
    ...signals,
  }
}

export function getComparisonSummary(policyRecords = POLICY_RECORDS, area, topic = 'All', parties = COMPARISON_PARTIES) {
  const signals = deriveComparisonSignals(policyRecords, area, topic, parties)
  return {
    hardest: signals.hardest,
    mostOpen: signals.mostOpen,
    lowestConfidence: signals.lowConfidence,
  }
}

export function formatSourceType(type) {
  const label = cleanLabel(type)
  if (!label) return 'Source'
  return label.replace(/\b\w/g, (char) => char.toUpperCase())
}
