import { canWinPollConflict, comparePollConflictPriority, getUsablePollDate } from '../shared/pollValidation'

const TARGET_POLLSTERS = [
  'YouGov',
  'More in Common',
  'Find Out Now',
  'Opinium',
  'Lord Ashcroft Polls',
  'Focaldata',
]

const PARTIES = [
  { key: 'ref', name: 'Reform', fullName: 'Reform UK' },
  { key: 'lab', name: 'Labour', fullName: 'Labour' },
  { key: 'con', name: 'Conservative', fullName: 'Conservative' },
  { key: 'grn', name: 'Green', fullName: 'Green' },
  { key: 'ld', name: 'Lib Dem', fullName: 'Lib Dem' },
]

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

function getDateMs(poll) {
  return parseDateish(getUsablePollDate(poll) || poll?.date)?.getTime() || 0
}

function formatSpreadValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function getLatestPollForPollster(polls, pollster) {
  const matching = (polls || [])
    .filter((poll) => cleanText(poll?.pollster) === pollster)
    .filter((poll) => canWinPollConflict(poll))

  if (!matching.length) return null

  return [...matching].sort((a, b) => {
    const dateDiff = getDateMs(b) - getDateMs(a)
    if (dateDiff !== 0) return dateDiff
    return comparePollConflictPriority(a, b)
  })[0] || null
}

function getPollLeaderBoard(poll) {
  return PARTIES
    .map((party) => ({
      ...party,
      value: safeNumber(poll?.[party.key]),
    }))
    .filter((party) => party.value != null)
    .sort((a, b) => b.value - a.value)
}

function getSpreadClassification(spread) {
  if (spread <= 3) return 'strong agreement'
  if (spread <= 6) return 'moderate variation'
  return 'high disagreement'
}

function formatPartyList(names = []) {
  if (names.length <= 1) return names[0] || ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

export function buildPollSpreadInsights({ polls = [] } = {}) {
  const latestPolls = TARGET_POLLSTERS
    .map((pollster) => getLatestPollForPollster(polls, pollster))
    .filter(Boolean)

  if (latestPolls.length < 2) return null

  const spreads = PARTIES
    .map((party) => {
      const values = latestPolls
        .map((poll) => ({
          pollster: cleanText(poll?.pollster),
          value: safeNumber(poll?.[party.key]),
        }))
        .filter((entry) => entry.value != null)

      if (values.length < 2) return null

      const highest = [...values].sort((a, b) => b.value - a.value)[0]
      const lowest = [...values].sort((a, b) => a.value - b.value)[0]
      const spread = +(highest.value - lowest.value).toFixed(1)

      return {
        ...party,
        spread,
        classification: getSpreadClassification(spread),
        highest,
        lowest,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.spread - a.spread)

  if (!spreads.length) return null

  const reformSpread = spreads.find((party) => party.key === 'ref') || null
  const labourSpread = spreads.find((party) => party.key === 'lab') || null
  const conservativeSpread = spreads.find((party) => party.key === 'con') || null
  const greenSpread = spreads.find((party) => party.key === 'grn') || null
  const leadingPartyVotes = latestPolls
    .map((poll) => getPollLeaderBoard(poll)[0]?.key || null)
    .filter(Boolean)
  const reformLeadsCount = leadingPartyVotes.filter((key) => key === 'ref').length
  const reformClearlyLeading = reformLeadsCount >= Math.ceil(latestPolls.length / 2)
  const trailingPositions = latestPolls
    .flatMap((poll) => {
      const board = getPollLeaderBoard(poll)
      const trailing = reformClearlyLeading ? board.filter((party) => party.key !== 'ref').slice(0, 3) : board.slice(1, 4)
      return trailing.map((party) => party.key)
    })
    .filter(Boolean)
  const secondPlaceSet = new Set(trailingPositions)
  const widestSpread = spreads[0]
  const maxSpread = widestSpread?.spread ?? 0
  const overallClassification = getSpreadClassification(maxSpread)

  let headline = 'Pollsters are not far apart on the current picture'
  if (overallClassification === 'strong agreement') {
    headline = reformClearlyLeading
      ? 'Pollsters broadly agree that Reform are ahead'
      : 'Pollsters are largely in agreement on the current picture'
  } else if (overallClassification === 'moderate variation') {
    headline = reformClearlyLeading && secondPlaceSet.size >= 2
      ? 'Behind Reform, the picture is less settled'
      : 'Pollsters point to some variation, but not a split picture'
  } else if (reformClearlyLeading && secondPlaceSet.size >= 2) {
    const contestedNames = [...secondPlaceSet]
      .map((key) => PARTIES.find((party) => party.key === key)?.name || key)
      .filter(Boolean)
    headline = `Behind Reform, the race looks far less settled across ${formatPartyList(contestedNames.slice(0, 3))}`
  } else {
    headline = `Pollsters are much less aligned on ${widestSpread.fullName}`
  }

  const bullets = []
  if (reformSpread) {
    bullets.push(
      `Reform spread: ${formatSpreadValue(reformSpread.spread)} pts (${reformSpread.classification})`,
    )
  }
  if (labourSpread) {
    bullets.push(
      `Labour spread: ${formatSpreadValue(labourSpread.spread)} pts (${labourSpread.classification})`,
    )
  }
  if (secondPlaceSet.size >= 2 && reformClearlyLeading) {
    const secondPlaceNames = [...secondPlaceSet]
      .map((key) => PARTIES.find((party) => party.key === key)?.name || key)
      .filter(Boolean)
    bullets.push(`There is no clear consensus on second place between ${formatPartyList(secondPlaceNames.slice(0, 3))}`)
  } else if (widestSpread && widestSpread.key !== 'ref' && widestSpread.key !== 'lab') {
    bullets.push(
      `${widestSpread.fullName} spread: ${formatSpreadValue(widestSpread.spread)} pts (${widestSpread.classification})`,
    )
  } else if (conservativeSpread || greenSpread) {
    const comparison = [conservativeSpread, greenSpread]
      .filter(Boolean)
      .sort((a, b) => b.spread - a.spread)[0]
    if (comparison) bullets.push(`${comparison.fullName} spread: ${formatSpreadValue(comparison.spread)} pts (${comparison.classification})`)
  }

  return {
    headline,
    bullets: bullets.slice(0, 3),
    spreads,
    maxSpread,
    overallClassification,
    widestSpread,
    reformClearlyLeading,
    secondPlaceParties: [...secondPlaceSet]
      .map((key) => PARTIES.find((party) => party.key === key)?.name || key)
      .filter(Boolean),
  }
}

export default buildPollSpreadInsights
