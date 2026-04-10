const PARTY_KEYS = [
  { key: 'ref', name: 'Reform UK', short: 'REF' },
  { key: 'lab', name: 'Labour', short: 'LAB' },
  { key: 'con', name: 'Conservative', short: 'CON' },
  { key: 'grn', name: 'Green', short: 'GRN' },
  { key: 'ld', name: 'Lib Dem', short: 'LD' },
  { key: 'rb', name: 'Restore Britain', short: 'RB' },
  { key: 'snp', name: 'SNP', short: 'SNP' },
  { key: 'pc', name: 'Plaid Cymru', short: 'PC' },
  { key: 'oth', name: 'Other', short: 'OTH' },
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

function displayDate(poll) {
  return cleanText(poll?.publishedAt) || cleanText(poll?.fieldworkEnd) || cleanText(poll?.fieldworkStart) || cleanText(poll?.date)
}

function sortPollsDesc(polls) {
  return [...(polls || [])].sort((a, b) => {
    const ad = parseDateish(displayDate(a))
    const bd = parseDateish(displayDate(b))
    return (bd?.getTime() || 0) - (ad?.getTime() || 0)
  })
}

function getPollResults(poll) {
  return PARTY_KEYS
    .map((party) => {
      const pct = safeNumber(poll?.[party.key])
      if (pct == null) return null
      return { ...party, pct }
    })
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct)
}

function findPreviousSamePollster(latestPoll, polls) {
  const pollster = cleanText(latestPoll?.pollster).toLowerCase()
  if (!pollster) return null

  return sortPollsDesc(polls).find((poll) => {
    if (poll === latestPoll) return false
    if (cleanText(poll?.id) && cleanText(poll?.id) === cleanText(latestPoll?.id)) return false
    return cleanText(poll?.pollster).toLowerCase() === pollster
  }) || null
}

function describeMover(mover, direction, source = 'trend') {
  if (!mover || mover.delta == null) {
    return null
  }

  const absDelta = Math.abs(mover.delta)
  if (absDelta < 1.5) {
    return null
  }

  const label =
    source === 'same-pollster'
      ? `${mover.short} is up ${absDelta.toFixed(absDelta % 1 ? 1 : 0)}pt on ${cleanText(mover.pollster)}'s last reading`
      : `${mover.short} has edged up ${absDelta.toFixed(absDelta % 1 ? 1 : 0)}pt in the recent picture`

  const downLabel =
    source === 'same-pollster'
      ? `${mover.short} is down ${absDelta.toFixed(absDelta % 1 ? 1 : 0)}pt on ${cleanText(mover.pollster)}'s last reading`
      : `${mover.short} has slipped ${absDelta.toFixed(absDelta % 1 ? 1 : 0)}pt in the recent picture`

  return direction === 'up' ? label : downLabel
}

function getTrendMovers(pollContext) {
  const snapshot = Array.isArray(pollContext?.partyPollSnapshot) ? pollContext.partyPollSnapshot : []
  const withDelta = snapshot
    .map((party) => ({
      name: cleanText(party?.name),
      short: cleanText(party?.abbr || party?.name),
      delta: typeof party?.recentDelta === 'number' ? party.recentDelta : null,
    }))
    .filter((party) => party.delta != null)

  const up = [...withDelta].filter((party) => party.delta > 0).sort((a, b) => b.delta - a.delta)[0] || null
  const down = [...withDelta].filter((party) => party.delta < 0).sort((a, b) => a.delta - b.delta)[0] || null
  return { up, down }
}

function getSamePollsterMovers(latestPoll, previousPoll) {
  if (!latestPoll || !previousPoll) return { up: null, down: null }

  const changes = PARTY_KEYS
    .map((party) => {
      const current = safeNumber(latestPoll?.[party.key])
      const previous = safeNumber(previousPoll?.[party.key])
      if (current == null || previous == null) return null
      return {
        ...party,
        pollster: latestPoll?.pollster,
        delta: +(current - previous).toFixed(1),
      }
    })
    .filter(Boolean)

  const up = [...changes].filter((party) => party.delta > 0).sort((a, b) => b.delta - a.delta)[0] || null
  const down = [...changes].filter((party) => party.delta < 0).sort((a, b) => a.delta - b.delta)[0] || null
  return { up, down }
}

function getRecentBaselineForParty(partyKey, polls, pollContext, latestPoll) {
  const snapshot = Array.isArray(pollContext?.partyPollSnapshot) ? pollContext.partyPollSnapshot : []
  const party = PARTY_KEYS.find((entry) => entry.key === partyKey)
  if (party) {
    const snapshotValue = safeNumber(
      snapshot.find((row) => cleanText(row?.abbr).toLowerCase() === party.short.toLowerCase())?.pct,
    )
    if (snapshotValue != null) return snapshotValue
  }

  const recentValues = sortPollsDesc(polls)
    .filter((poll) => {
      if (!poll || poll === latestPoll) return false
      if (cleanText(poll?.id) && cleanText(poll?.id) === cleanText(latestPoll?.id)) return false
      return safeNumber(poll?.[partyKey]) != null
    })
    .slice(0, 8)
    .map((poll) => safeNumber(poll?.[partyKey]))
    .filter((value) => value != null)

  if (!recentValues.length) return null
  return recentValues.reduce((sum, value) => sum + value, 0) / recentValues.length
}

function getPollsterVarianceSignal(latestPoll, previousPoll, leaderKey) {
  if (!latestPoll || !previousPoll || !leaderKey) return null
  const current = safeNumber(latestPoll?.[leaderKey])
  const previous = safeNumber(previousPoll?.[leaderKey])
  if (current == null || previous == null) return null
  return Math.abs(current - previous)
}

function getOutlierLabel(latestPoll, polls, pollContext, leader, previousSamePollster) {
  if (!latestPoll || !leader?.key) return 'is broadly in line with recent trend'

  const latestValue = safeNumber(latestPoll?.[leader.key])
  const baseline = getRecentBaselineForParty(leader.key, polls, pollContext, latestPoll)
  if (latestValue == null || baseline == null) return 'is broadly in line with recent trend'

  const diff = +(latestValue - baseline).toFixed(1)
  const absDiff = Math.abs(diff)
  const pollsterVariance = getPollsterVarianceSignal(latestPoll, previousSamePollster, leader.key)
  const explainedByPollsterVariance = pollsterVariance != null && pollsterVariance <= 2

  if (absDiff >= 4 && !explainedByPollsterVariance) {
    return 'looks well outside the recent run of form'
  }

  if (diff >= 2) return 'looks slightly stronger than recent trend'
  if (diff <= -2) return 'looks slightly softer than recent trend'
  return 'is broadly in line with recent trend'
}

export function buildPollInsights({ polls = [], latestPoll = null, pollContext = null } = {}) {
  const sortedPolls = sortPollsDesc(polls)
  const focalPoll = latestPoll || sortedPolls[0] || null
  if (!focalPoll) return null

  const latestResults = getPollResults(focalPoll)
  const leader = latestResults[0] || null
  const second = latestResults[1] || null
  if (!leader) return null

  const previousSamePollster = findPreviousSamePollster(focalPoll, sortedPolls)
  const samePollsterMovers = getSamePollsterMovers(focalPoll, previousSamePollster)
  const trendMovers = getTrendMovers(pollContext)

  const moverUp = samePollsterMovers.up || trendMovers.up
  const moverDown = samePollsterMovers.down || trendMovers.down
  const moverSource = previousSamePollster ? 'same-pollster' : 'trend'
  const moverUpText = describeMover(moverUp, 'up', samePollsterMovers.up ? moverSource : 'trend')
  const moverDownText = describeMover(moverDown, 'down', samePollsterMovers.down ? moverSource : 'trend')

  const gap = second ? +((leader.pct || 0) - (second.pct || 0)).toFixed(1) : null
  const raceLabel =
    gap == null ? 'latest reading'
      : gap >= 8 ? 'clear lead'
        : gap >= 3 ? 'modest lead'
          : 'tight race'

  const outlierLabel = getOutlierLabel(focalPoll, sortedPolls, pollContext, leader, previousSamePollster)
  const pollsterText = cleanText(focalPoll?.pollster) || 'The latest poll'
  const samePollsterContext = previousSamePollster
    ? ` Compared with ${pollsterText}'s previous poll, the topline ${moverUpText || moverDownText ? 'has moved a little' : 'is largely unchanged'}.`
    : ''
  const minimalMovement = !moverUpText && !moverDownText

  return {
    headline: second
      ? gap >= 8
        ? `${pollsterText} has ${leader.short} ${gap} points clear. The result ${outlierLabel}.${samePollsterContext}`
        : gap >= 3
          ? `${pollsterText} puts ${leader.short} ${gap} points ahead of ${second.short}. The result ${outlierLabel}.${samePollsterContext}`
          : `${pollsterText} points to a tight race, with ${leader.short} ${gap} point${gap === 1 ? '' : 's'} ahead of ${second.short}. The result ${outlierLabel}.${samePollsterContext}`
      : `${pollsterText} keeps ${leader.short} in front and ${outlierLabel}.${samePollsterContext}`,
    bullets: minimalMovement
      ? ['There is little sign of movement since the last poll']
      : [moverUpText, moverDownText].filter(Boolean),
  }
}

export default buildPollInsights
