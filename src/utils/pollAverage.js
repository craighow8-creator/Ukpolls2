function normalisePollster(value) {
  return String(value || '').trim().toLowerCase()
}

function getPollDate(poll) {
  const dateText = poll?.fieldworkEnd || poll?.publishedAt || poll?.date
  if (!dateText) return null

  if (typeof dateText === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateText)) {
    const [dd, mm, yyyy] = dateText.split('-').map(Number)
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(dateText)
  return Number.isNaN(d.getTime()) ? null : d
}

function isValidPoll(poll, now, windowDays, parties) {
  const d = getPollDate(poll)
  if (!d) return false
  if (d > now) return false

  const ageMs = now.getTime() - d.getTime()
  if (ageMs > windowDays * 24 * 60 * 60 * 1000) return false

  const pollster = normalisePollster(poll?.pollster)
  if (!pollster) return false

  const partyVals = parties
    .map((key) => Number(poll?.[key]))
    .filter((value) => Number.isFinite(value))

  if (partyVals.length < 4) return false

  const total = partyVals.reduce((sum, value) => sum + value, 0)
  if (total < 65 || total > 105) return false

  return true
}

function latestPerPollster(polls) {
  const map = new Map()

  for (const poll of polls || []) {
    const pollster = String(poll?.pollster || '').trim()
    if (!pollster) continue

    const existing = map.get(pollster)
    const currentDate = getPollDate(poll)
    const existingDate = existing ? getPollDate(existing) : null

    if (!existing || (currentDate && existingDate && currentDate > existingDate)) {
      map.set(pollster, poll)
    }
  }

  return [...map.values()]
}

function weightedAverage(polls, parties, now, windowDays) {
  if (!polls.length) return null

  const totals = {}
  const weights = {}

  for (const poll of polls) {
    const d = getPollDate(poll)
    if (!d) continue

    const daysAgo = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    const recencyWeight = Math.max(0.2, 1 - (daysAgo / windowDays))

    const sample = Number(poll?.sample)
    const sampleWeight =
      Number.isFinite(sample) && sample > 0
        ? Math.max(0.9, Math.min(1.1, Math.sqrt(sample / 1000)))
        : 1

    const weight = recencyWeight * sampleWeight

    for (const key of parties) {
      const value = Number(poll?.[key])
      if (!Number.isFinite(value)) continue

      totals[key] = (totals[key] || 0) + value * weight
      weights[key] = (weights[key] || 0) + weight
    }
  }

  const average = {}
  for (const key of parties) {
    if (!weights[key]) continue
    average[key] = totals[key] / weights[key]
  }

  return average
}

export function buildPollingAverage(polls = [], options = {}) {
  const baseWindowDays = Number(options.baseWindowDays || options.windowDays || 30)
  const momentumWindowDays = Number(options.momentumWindowDays || 10)
  const momentumStrength = Number(options.momentumStrength || 0.2)
  const maxMomentumShift = Number(options.maxMomentumShift || 1.5)
  const now = options.now ? new Date(options.now) : new Date()

  const parties = ['ref', 'lab', 'con', 'grn', 'ld', 'snp']

  const baseCandidates = (polls || []).filter((poll) =>
    isValidPoll(poll, now, baseWindowDays, parties)
  )

  if (!baseCandidates.length) return null

  const basePolls = latestPerPollster(baseCandidates)
  const baseAverage = weightedAverage(basePolls, parties, now, baseWindowDays)
  if (!baseAverage) return null

  const momentumCandidates = baseCandidates.filter((poll) => {
    const d = getPollDate(poll)
    if (!d) return false
    return (now.getTime() - d.getTime()) <= momentumWindowDays * 24 * 60 * 60 * 1000
  })

  const momentumPolls = latestPerPollster(momentumCandidates)
  const momentumAverage = weightedAverage(momentumPolls, parties, now, momentumWindowDays)

  const finalAverage = {}
  for (const key of parties) {
    const base = baseAverage[key]
    if (!Number.isFinite(base)) continue

    if (!momentumAverage || !Number.isFinite(momentumAverage[key])) {
      finalAverage[key] = +(base.toFixed(1))
      continue
    }

    const rawShift = momentumAverage[key] - base
    const clampedShift = Math.max(-maxMomentumShift, Math.min(maxMomentumShift, rawShift))
    const adjusted = base + clampedShift * momentumStrength

    finalAverage[key] = +(adjusted.toFixed(1))
  }

  return finalAverage
}
