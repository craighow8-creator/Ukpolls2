import {
  canWinPollConflict,
  comparePollConflictPriority,
  confidencePriority,
  getUsablePollDate,
  sourceTier,
} from '../shared/pollValidation'

const TARGET_POLLSTERS = [
  'YouGov',
  'More in Common',
  'Find Out Now',
  'Opinium',
  'Lord Ashcroft Polls',
  'Focaldata',
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

function shortPartyName(value) {
  const text = cleanText(value)
  if (text === 'Reform UK') return 'Reform'
  if (text === 'Conservative') return 'Conservatives'
  if (text === 'Green') return 'Greens'
  return text
}

function sortPollsDesc(polls = []) {
  return [...polls].sort((a, b) => {
    const ad = parseDateish(getUsablePollDate(a) || a?.date)
    const bd = parseDateish(getUsablePollDate(b) || b?.date)
    return (bd?.getTime() || 0) - (ad?.getTime() || 0)
  })
}

function getPollResults(poll) {
  return ['ref', 'lab', 'con', 'grn', 'ld']
    .map((key) => ({ key, pct: safeNumber(poll?.[key]) }))
    .filter((entry) => entry.pct != null)
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

function getLatestPollForPollster(polls, pollster) {
  const matching = (polls || [])
    .filter((poll) => cleanText(poll?.pollster) === pollster)
    .filter((poll) => canWinPollConflict(poll))

  if (!matching.length) return null
  return [...matching].sort(comparePollConflictPriority)[0] || null
}

function getDaysOld(poll, now = new Date()) {
  const date = parseDateish(getUsablePollDate(poll) || poll?.date)
  if (!date) return null
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000))
}

function getTrendSnapshotParty(pollContext, partyName) {
  const snapshot = Array.isArray(pollContext?.partyPollSnapshot) ? pollContext.partyPollSnapshot : []
  return snapshot.find((party) => cleanText(party?.name) === cleanText(partyName)) || null
}

function buildConfidenceLine({ polls = [], parties = [], spread = null, now = new Date() }) {
  const majorLatest = TARGET_POLLSTERS
    .map((pollster) => getLatestPollForPollster(polls, pollster))
    .filter(Boolean)
  const strongDirect = majorLatest.filter((poll) => {
    const tier = sourceTier(poll)
    return (tier === 'direct' || tier === 'manual') && confidencePriority(poll) >= 3
  })
  const freshDirect = strongDirect.filter((poll) => {
    const days = getDaysOld(poll, now)
    return days != null && days <= 10
  })

  const ranked = [...(Array.isArray(parties) ? parties : [])]
    .filter((party) => safeNumber(party?.pct) != null)
    .sort((a, b) => (safeNumber(b?.pct) || 0) - (safeNumber(a?.pct) || 0))
  const leader = ranked[0]
  const second = ranked[1]
  const third = ranked[2]
  const secondGap = leader && second && third ? +((safeNumber(second?.pct) || 0) - (safeNumber(third?.pct) || 0)).toFixed(1) : null

  if ((spread?.maxSpread || 0) <= 3 && strongDirect.length >= 4 && freshDirect.length >= 3) {
    return 'The overall picture is relatively stable across pollsters.'
  }

  if ((spread?.maxSpread || 0) >= 7 && leader && secondGap != null && secondGap <= 3) {
    return 'The picture is clearer at the top than in the race for second.'
  }

  if ((spread?.maxSpread || 0) >= 7) {
    return leader
      ? `Pollsters still disagree significantly behind ${shortPartyName(leader?.name)}.`
      : 'Pollsters still disagree significantly.'
  }

  if (strongDirect.length <= 2 || freshDirect.length <= 1) {
    return 'Limited recent direct polling reduces certainty.'
  }

  return 'The broad picture is reasonably clear across pollsters.'
}

function buildWhatChangedLine({ polls = [], latestPoll = null, pollContext = null, raceState = null }) {
  const focalPoll = latestPoll || sortPollsDesc(polls)[0] || null
  if (!focalPoll) return null

  const previousSamePollster = findPreviousSamePollster(focalPoll, polls)
  const latestResults = getPollResults(focalPoll)
  const second = latestResults[1] || null
  const third = latestResults[2] || null

  if (previousSamePollster) {
    const previousResults = getPollResults(previousSamePollster)
    const previousSecond = previousResults[1] || null
    const previousThird = previousResults[2] || null
    const currentSecondGap =
      second && third ? +((second.pct || 0) - (third.pct || 0)).toFixed(1) : null
    const previousSecondGap =
      previousSecond && previousThird ? +((previousSecond.pct || 0) - (previousThird.pct || 0)).toFixed(1) : null

    if (
      currentSecondGap != null &&
      previousSecondGap != null &&
      currentSecondGap <= 3 &&
      previousSecondGap - currentSecondGap >= 1.5
    ) {
      return 'The main shift is a tighter contest for second place.'
    }

    const allChanges = ['ref', 'lab', 'con', 'grn', 'ld']
      .map((key) => {
        const current = safeNumber(focalPoll?.[key])
        const previous = safeNumber(previousSamePollster?.[key])
        if (current == null || previous == null) return null
        return +(current - previous).toFixed(1)
      })
      .filter((value) => value != null)

    const biggestMove = allChanges.length ? Math.max(...allChanges.map((value) => Math.abs(value))) : 0
    if (biggestMove < 1.5) return 'Little has changed since the previous reading.'

    const leader = latestResults[0] || null
    if (leader) {
      const leaderPrevious = safeNumber(previousSamePollster?.[leader.key])
      const leaderNow = safeNumber(focalPoll?.[leader.key])
      if (leaderNow != null && leaderPrevious != null) {
        const delta = +(leaderNow - leaderPrevious).toFixed(1)
        if (delta >= 1.5) return `The latest poll is slightly stronger for ${shortPartyName(leader?.key === 'ref' ? 'Reform UK' : leader?.key === 'con' ? 'Conservative' : leader?.key === 'lab' ? 'Labour' : leader?.key === 'grn' ? 'Green' : 'Lib Dem')}.`
        if (delta <= -1.5) return `The latest poll is slightly softer for ${shortPartyName(leader?.key === 'ref' ? 'Reform UK' : leader?.key === 'con' ? 'Conservative' : leader?.key === 'lab' ? 'Labour' : leader?.key === 'grn' ? 'Green' : 'Lib Dem')}.`
      }
    }
  }

  const snapshot = Array.isArray(pollContext?.partyPollSnapshot) ? pollContext.partyPollSnapshot : []
  const snapshotLeader = snapshot.slice().sort((a, b) => (safeNumber(b?.pct) || 0) - (safeNumber(a?.pct) || 0))[0] || null
  if (snapshotLeader && typeof snapshotLeader?.recentDelta === 'number') {
    if (Math.abs(snapshotLeader.recentDelta) < 1.5) return 'Little has changed since the previous reading.'
    if (snapshotLeader.recentDelta > 0) return `The latest poll is slightly stronger for ${shortPartyName(snapshotLeader?.name)} than recent trend.`
    return `The latest poll is slightly softer for ${shortPartyName(snapshotLeader?.name)} than recent trend.`
  }

  if (raceState?.headline?.toLowerCase().includes('tightening')) {
    return 'The main shift is a tighter contest behind the leader.'
  }

  return 'Insufficient recent data to identify clear change.'
}

function buildDisagreementNote({ spread = null, houseEffects = null }) {
  if ((spread?.maxSpread || 0) >= 7 && spread?.widestSpread?.fullName) {
    return `Pollsters remain far less aligned on ${spread.widestSpread.fullName} than on the rest of the field.`
  }

  if ((spread?.maxSpread || 0) >= 6 && houseEffects?.strongest?.fullName) {
    return `${houseEffects.strongest.fullName} still shows more variation between pollsters than the wider picture.`
  }

  return null
}

export function buildPollingIntelligence({
  polls = [],
  parties = [],
  latestPoll = null,
  pollContext = null,
  raceState = null,
  spread = null,
  houseEffects = null,
  now = new Date(),
} = {}) {
  return {
    confidenceLine: buildConfidenceLine({ polls, parties, spread, now }),
    whatChangedLine: buildWhatChangedLine({ polls, latestPoll, pollContext, raceState }),
    disagreementNote: buildDisagreementNote({ spread, houseEffects }),
  }
}

export default buildPollingIntelligence
