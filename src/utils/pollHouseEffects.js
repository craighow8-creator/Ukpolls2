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

function average(values) {
  const usable = (values || []).filter((value) => value != null)
  if (!usable.length) return null
  return usable.reduce((sum, value) => sum + value, 0) / usable.length
}

function formatDelta(value) {
  const rounded = +value.toFixed(1)
  return `${rounded > 0 ? '+' : ''}${rounded}`
}

function formatPartyList(names = []) {
  if (names.length <= 1) return names[0] || ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

export function buildPollHouseEffectsInsights({ polls = [] } = {}) {
  const latestPolls = TARGET_POLLSTERS
    .map((pollster) => getLatestPollForPollster(polls, pollster))
    .filter(Boolean)

  if (latestPolls.length < 3) return null

  const partyLeans = PARTIES
    .map((party) => {
      const values = latestPolls
        .map((poll) => ({
          pollster: cleanText(poll?.pollster),
          value: safeNumber(poll?.[party.key]),
        }))
        .filter((entry) => entry.value != null)

      if (values.length < 3) return null

      const avg = average(values.map((entry) => entry.value))
      if (avg == null) return null

      const deviations = values.map((entry) => ({
        ...entry,
        deviation: +(entry.value - avg).toFixed(1),
      }))

      const highest = [...deviations].sort((a, b) => b.deviation - a.deviation)[0] || null
      const lowest = [...deviations].sort((a, b) => a.deviation - b.deviation)[0] || null
      const strongestDeviation = Math.max(Math.abs(highest?.deviation || 0), Math.abs(lowest?.deviation || 0))

      return {
        ...party,
        average: +avg.toFixed(1),
        highest,
        lowest,
        strongestDeviation: +strongestDeviation.toFixed(1),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.strongestDeviation - a.strongestDeviation)

  if (!partyLeans.length) return null

  const meaningful = partyLeans.filter((party) => party.strongestDeviation >= 2)
  const strongest = meaningful[0] || null
  const secondStrongest = meaningful[1] || null
  const reformLean = meaningful.find((party) => party.key === 'ref') || null
  const labourLean = meaningful.find((party) => party.key === 'lab') || null

  let headline = 'Pollsters look broadly aligned across the current picture'
  if (meaningful.length >= 2 && reformLean && meaningful.some((party) => party.key === 'grn')) {
    headline = 'House effects remain most visible on Reform and the Greens'
  } else if (reformLean && labourLean == null) {
    headline = 'Pollsters are relatively aligned on Labour, but differ more sharply on Reform'
  } else if (meaningful.length >= 2) {
    const names = meaningful.slice(0, 2).map((party) => party.name)
    headline = `House effects are most visible on ${formatPartyList(names)}`
  } else if (strongest) {
    headline = `The clearest house effect is on ${strongest.fullName}`
  }

  const bullets = []
  if (strongest?.highest && Math.abs(strongest.highest.deviation) >= 2) {
    bullets.push(`${strongest.highest.pollster} sits highest on ${strongest.name}, at ${formatDelta(strongest.highest.deviation)}pt against the pollster average`)
  }
  if (strongest?.lowest && Math.abs(strongest.lowest.deviation) >= 2) {
    bullets.push(`${strongest.lowest.pollster} is lowest on ${strongest.name}, at ${formatDelta(strongest.lowest.deviation)}pt against the pollster average`)
  }
  if (secondStrongest && secondStrongest !== strongest) {
    if (Math.abs(secondStrongest.highest?.deviation || 0) >= 2) {
      bullets.push(`${secondStrongest.highest.pollster} is among the highest ${secondStrongest.name} houses in the current mix`)
    } else if (Math.abs(secondStrongest.lowest?.deviation || 0) >= 2) {
      bullets.push(`${secondStrongest.lowest.pollster} is among the lowest ${secondStrongest.name} houses in the current mix`)
    }
  }

  if (!bullets.length) {
    bullets.push('Differences between the main houses are modest at the moment')
  }

  return {
    headline,
    bullets: bullets.slice(0, 3),
    meaningful,
    strongest,
    secondStrongest,
  }
}

export default buildPollHouseEffectsInsights
