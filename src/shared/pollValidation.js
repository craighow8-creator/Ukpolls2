const PARTY_KEYS = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp', 'pc', 'oth']
const CORE_PARTY_KEYS = ['ref', 'lab', 'con', 'grn', 'ld']
const DATE_FIELDS = ['publishedAt', 'fieldworkStart', 'fieldworkEnd']

function cleanText(value) {
  if (value == null) return ''
  return String(value).trim()
}

function parseIsoDate(value) {
  const text = cleanText(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const date = new Date(`${text}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toFiniteNumber(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function parseDisplayDate(value) {
  const iso = parseIsoDate(value)
  if (iso) return iso

  const text = cleanText(value)
  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [dd, mm, yyyy] = text.split('-').map(Number)
    const date = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

export function getUsablePollDate(poll) {
  return cleanText(poll?.date || poll?.fieldworkEnd || poll?.publishedAt || poll?.fieldworkStart || '')
}

export function countCorePartyValues(poll) {
  return CORE_PARTY_KEYS.filter((key) => toFiniteNumber(poll?.[key]) != null).length
}

export function getPartyTotal(poll) {
  return PARTY_KEYS.reduce((sum, key) => {
    const value = toFiniteNumber(poll?.[key])
    return value == null ? sum : sum + value
  }, 0)
}

export function countPopulatedPartyValues(poll) {
  return PARTY_KEYS.filter((key) => toFiniteNumber(poll?.[key]) != null).length
}

export function verificationPriority(poll) {
  const status = cleanText(poll?.verificationStatus).toLowerCase()
  if (status === 'verified') return 3
  if (status === 'flagged') return 2
  if (status === 'rejected') return 0
  return 1
}

export function sourceTier(poll) {
  const type = cleanText(poll?.sourceType).toLowerCase()
  const sourceUrl = cleanText(poll?.sourceUrl).toLowerCase()
  if (type === 'manual' || type === 'admin') return 'manual'
  if (type === 'fallback' || type === 'wikipedia') return 'fallback'
  if (sourceUrl.includes('wikipedia.org')) return 'fallback'
  if (!type && !sourceUrl) return 'fallback'
  return 'direct'
}

export function sourceTierPriority(poll) {
  const tier = sourceTier(poll)
  if (tier === 'manual') return 3
  if (tier === 'direct') return 2
  return 1
}

export function confidencePriority(poll) {
  const confidence = cleanText(poll?.confidence).toLowerCase()
  if (confidence === 'high') return 3
  if (confidence === 'medium') return 2
  if (confidence === 'low') return 1
  return 0
}

export function hasSample(poll) {
  const sample = toFiniteNumber(poll?.sample)
  return sample != null && sample > 0
}

export function canWinPollConflict(poll) {
  return !poll?.suspect && cleanText(poll?.verificationStatus).toLowerCase() !== 'rejected'
}

export function getConflictDateMs(poll) {
  const date =
    parseDisplayDate(cleanText(poll?.date)) ||
    parseIsoDate(cleanText(poll?.fieldworkEnd)) ||
    parseIsoDate(cleanText(poll?.publishedAt)) ||
    parseIsoDate(cleanText(poll?.fieldworkStart))

  return date?.getTime() || 0
}

export function comparePollConflictPriority(a, b) {
  const winnerEligibilityDiff = Number(canWinPollConflict(b)) - Number(canWinPollConflict(a))
  if (winnerEligibilityDiff !== 0) return winnerEligibilityDiff

  const aTier = sourceTier(a)
  const bTier = sourceTier(b)
  const aIsPreferredTier = aTier === 'direct' || aTier === 'manual'
  const bIsPreferredTier = bTier === 'direct' || bTier === 'manual'

  if (aTier === 'fallback' && bIsPreferredTier) return 1
  if (bTier === 'fallback' && aIsPreferredTier) return -1

  const verificationDiff = verificationPriority(b) - verificationPriority(a)
  if (verificationDiff !== 0) return verificationDiff

  const sourceDiff = sourceTierPriority(b) - sourceTierPriority(a)
  if (sourceDiff !== 0) return sourceDiff

  const confidenceDiff = confidencePriority(b) - confidencePriority(a)
  if (confidenceDiff !== 0) return confidenceDiff

  const partyCountDiff = countPopulatedPartyValues(b) - countPopulatedPartyValues(a)
  if (partyCountDiff !== 0) return partyCountDiff

  const sampleDiff = Number(hasSample(b)) - Number(hasSample(a))
  if (sampleDiff !== 0) return sampleDiff

  const dateDiff = getConflictDateMs(b) - getConflictDateMs(a)
  if (dateDiff !== 0) return dateDiff

  return cleanText(a?.id || '').localeCompare(cleanText(b?.id || ''))
}

export function validatePollRow(poll, options = {}) {
  const { displaySafe = false } = options
  const errors = []
  const warnings = []

  if (!poll || typeof poll !== 'object' || Array.isArray(poll)) {
    return { valid: false, errors: ['record is not a valid object'], warnings }
  }

  if (!cleanText(poll?.pollster)) errors.push('missing pollster')

  const usableDate = getUsablePollDate(poll)
  if (!usableDate) errors.push('missing usable date')
  else if (!parseIsoDate(usableDate)) errors.push('usable date must be ISO YYYY-MM-DD')

  for (const field of DATE_FIELDS) {
    const value = poll?.[field]
    if (value != null && cleanText(value) && !parseIsoDate(value)) {
      errors.push(`invalid ISO date in ${field}`)
    }
  }

  const fieldworkStart = parseIsoDate(poll?.fieldworkStart)
  const fieldworkEnd = parseIsoDate(poll?.fieldworkEnd)
  if (fieldworkStart && fieldworkEnd && fieldworkStart.getTime() > fieldworkEnd.getTime()) {
    errors.push('fieldworkStart after fieldworkEnd')
  }

  const sample = toFiniteNumber(poll?.sample)
  if (poll?.sample != null && sample == null) errors.push('invalid sample')
  if (sample != null && sample <= 0) errors.push('invalid sample')

  for (const key of PARTY_KEYS) {
    const rawValue = poll?.[key]
    if (rawValue == null || rawValue === '') continue

    const value = toFiniteNumber(rawValue)
    if (value == null) {
      errors.push(`invalid ${key}`)
      continue
    }
    if (value < 0) errors.push(`negative ${key}`)
    if (value > 100) errors.push(`impossible ${key}`)
  }

  const coreCount = countCorePartyValues(poll)
  if (coreCount < 3) errors.push(`too few populated core party values (${coreCount})`)

  const total = getPartyTotal(poll)
  if (total > 105) errors.push(`party total too high = ${total}`)

  if (displaySafe) {
    if (poll?.suspect) errors.push('suspect rows are not display-safe')
    if (cleanText(poll?.verificationStatus).toLowerCase() === 'rejected') {
      errors.push('rejected rows are not display-safe')
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function isDisplaySafePoll(poll) {
  return validatePollRow(poll, { displaySafe: true }).valid
}
