const PARTY_COLORS = {
  conservative: '#0087DC',
  con: '#0087DC',
  labour: '#E4003B',
  lab: '#E4003B',
  'reform uk': '#12B7D4',
  reform: '#12B7D4',
  green: '#02A95B',
  grn: '#02A95B',
  'lib dem': '#FAA61A',
  'lib dems': '#FAA61A',
  'liberal democrats': '#FAA61A',
  'liberal democrat': '#FAA61A',
  ld: '#FAA61A',
  snp: '#C4922A',
  'plaid cymru': '#3F8428',
  pc: '#3F8428',
  'workers party': '#8B1E3F',
}

const TAG_ALIASES = {
  upset: 'upset',
  bellwether: 'bellwether',
  'government pressure': 'government pressure',
  'close hold': 'close hold',
  'historic swing': 'historic swing',
  'blue wall': 'blue wall',
  'red wall': 'red wall',
  'urban shift': 'urban shift',
  'southern tactical vote': 'southern tactical vote',
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function canonicalParty(value) {
  const text = cleanText(value).toLowerCase()
  if (!text) return ''
  if (['conservative', 'conservatives', 'con'].includes(text)) return 'Conservative'
  if (['labour', 'lab'].includes(text)) return 'Labour'
  if (['reform uk', 'reform'].includes(text)) return 'Reform UK'
  if (['green', 'grn', 'green party'].includes(text)) return 'Green'
  if (['lib dem', 'lib dems', 'liberal democrat', 'liberal democrats', 'ld'].includes(text)) return 'Lib Dem'
  if (text === 'snp') return 'SNP'
  if (['plaid cymru', 'pc'].includes(text)) return 'Plaid Cymru'
  if (['workers party', "workers party of britain"].includes(text)) return 'Workers Party'
  return cleanText(value)
}

function partyColor(value) {
  const text = cleanText(value).toLowerCase()
  return PARTY_COLORS[text] || PARTY_COLORS[canonicalParty(value).toLowerCase()] || '#6b7280'
}

function slugifyByElectionId(name, date, fallback = 'contest') {
  const slug = cleanText(name || fallback)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || fallback}-${date || 'undated'}`
}

function parseDateish(...values) {
  for (const raw of values) {
    const text = cleanText(raw)
    if (!text) continue
    const lower = text.toLowerCase()

    if (lower.includes('tbc') || lower.includes('to be confirmed') || lower === 'pending') {
      continue
    }

    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (iso) {
      const parsed = Date.parse(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`)
      if (!Number.isNaN(parsed)) return parsed
    }

    const ddmmyyyy = text.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (ddmmyyyy) {
      const parsed = Date.parse(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}T00:00:00Z`)
      if (!Number.isNaN(parsed)) return parsed
    }

    if (!/[a-z]{3,}/i.test(text)) continue

    const natural = Date.parse(text)
    if (!Number.isNaN(natural)) return natural
  }

  return null
}

function toIsoDate(...values) {
  const ts = parseDateish(...values)
  if (!ts) return null
  return new Date(ts).toISOString().slice(0, 10)
}

function formatDateLabel(...values) {
  const ts = parseDateish(...values)
  if (!ts) return cleanText(values.find(Boolean)) || 'Date TBC'
  const date = new Date(ts)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}-${month}-${year}`
}

function toFiniteNumber(value) {
  if (value == null || value === '') return null
  if (typeof value === 'object' && value.pts != null) return toFiniteNumber(value.pts)
  const parsed = Number.parseFloat(String(value).replace(/,/g, '').replace(/%/g, '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

function normaliseSwing(value) {
  const swing = toFiniteNumber(value)
  return swing == null ? null : Math.abs(swing)
}

function canonicalTag(value) {
  const text = cleanText(value).toLowerCase()
  return TAG_ALIASES[text] || cleanText(value)
}

function deriveGainLoss({ winner, previous }) {
  const normalizedWinner = canonicalParty(winner)
  const normalizedPrevious = canonicalParty(previous)
  if (!normalizedWinner || !normalizedPrevious) return null
  return normalizedWinner === normalizedPrevious ? 'HOLD' : 'GAIN'
}

function tagBoost(text) {
  let score = 0
  if (text.includes('upset')) score += 10
  if (text.includes('bellwether')) score += 10
  if (text.includes('government pressure')) score += 8
  if (text.includes('historic')) score += 8
  if (text.includes('close hold')) score += 6
  if (text.includes('blue wall')) score += 5
  if (text.includes('red wall')) score += 5
  if (text.includes('urban shift')) score += 4
  if (text.includes('southern tactical vote')) score += 4
  return score
}

function significanceScore(row) {
  const majorityOverturned = Math.max(toFiniteNumber(row.majority2024) || 0, toFiniteNumber(row.majority) || 0)
  const swing = normaliseSwing(row.swing) || 0
  const gainLoss = deriveGainLoss(row)
  const keywordText = [
    cleanText(row.summary),
    cleanText(row.significance),
    cleanText(row.watchFor),
    ...(Array.isArray(row.tags) ? row.tags.map(cleanText) : []),
  ]
    .join(' ')
    .toLowerCase()

  return (
    (gainLoss === 'GAIN' ? 100 : 40) +
    swing * 3 +
    Math.min(majorityOverturned / 1000, 25) +
    tagBoost(keywordText)
  )
}

function deriveTags(row) {
  const existing = new Set(
    (Array.isArray(row.tags) ? row.tags : [])
      .map((item) => canonicalTag(item))
      .filter(Boolean)
  )
  const gainLoss = cleanText(row.gainLoss).toUpperCase() || deriveGainLoss(row)
  const winner = canonicalParty(row.winner)
  const previous = canonicalParty(row.previous || row.defending)
  const majorityOverturned = Math.max(toFiniteNumber(row.majority2024) || 0, toFiniteNumber(row.majority) || 0)
  const swing = normaliseSwing(row.swing) || 0
  const lowerText = [row.summary, row.significance, row.watchFor].map(cleanText).join(' ').toLowerCase()

  if (gainLoss === 'GAIN' && winner) existing.add('upset')
  if (gainLoss === 'HOLD' && (toFiniteNumber(row.majority) || 0) <= 1000) existing.add('close hold')
  if (swing >= 20) existing.add('historic swing')
  if (lowerText.includes('bellwether')) existing.add('bellwether')
  if (previous === 'Labour' && gainLoss === 'GAIN') existing.add('government pressure')
  if (majorityOverturned >= 10000 && gainLoss === 'GAIN') existing.add('upset')
  if (lowerText.includes('blue wall')) existing.add('blue wall')
  if (lowerText.includes('red wall')) existing.add('red wall')
  if (lowerText.includes('urban shift') || lowerText.includes('urban left') || lowerText.includes('urban seat')) {
    existing.add('urban shift')
  }
  if (lowerText.includes('southern tactical vote') || (lowerText.includes('tactical') && lowerText.includes('southern'))) {
    existing.add('southern tactical vote')
  }

  return [...existing].sort((a, b) => a.localeCompare(b))
}

function shapeContest(row, kind, defaultSource = 'maintained local source') {
  const isoDate = toIsoDate(row.date, row.dateLabel)
  const dateLabel = formatDateLabel(row.date, row.dateLabel)
  const previous = canonicalParty(row.previous || row.defending)
  const winner = canonicalParty(row.winner)
  const gainLoss = cleanText(row.gainLoss).toUpperCase() || deriveGainLoss({ winner, previous })
  const source = cleanText(row.source || defaultSource) || null
  const contest = {
    id: cleanText(row.id) || slugifyByElectionId(row.name, isoDate || dateLabel),
    name: cleanText(row.name),
    date: isoDate,
    dateLabel,
    type: cleanText(row.type) || 'Parliamentary',
    region: cleanText(row.region) || null,
    defending: previous || null,
    previous: previous || null,
    winner: winner || null,
    gainLoss,
    majority: toFiniteNumber(row.majority),
    majority2024: toFiniteNumber(row.majority2024),
    swing: normaliseSwing(row.swing),
    turnout: toFiniteNumber(row.turnout),
    summary: cleanText(row.summary || row.context),
    significance: cleanText(row.significance),
    watchFor: cleanText(row.watchFor),
    tags: [],
    winnerColor: cleanText(row.winnerColor) || (winner ? partyColor(winner) : null),
    defColor: cleanText(row.defColor) || (previous ? partyColor(previous) : null),
    status: cleanText(row.status) || (kind === 'upcoming' ? 'upcoming' : 'result'),
    source,
    significanceScore: kind === 'recent' ? significanceScore({ ...row, winner, previous }) : 0,
    context: cleanText(row.context || row.summary),
    verdict: cleanText(row.verdict),
  }

  contest.tags = deriveTags({ ...contest, ...row, tags: row.tags })
  return contest
}

// Raw source rows are normalised here into the frontend-ready payload.
// This is the main plug-in point for any future scraper or API import.
// Raw rows stay hand-maintained or source-fed; all intelligence fields are derived here
// so the frontend can consume one stable, shaped payload.
export function shapeByElectionsPayload(raw = {}) {
  const defaultSource = cleanText(raw.source || 'maintained local source')
  const upcoming = [...(Array.isArray(raw.upcoming) ? raw.upcoming : [])]
    .map((row) => shapeContest(row, 'upcoming', defaultSource))
    .filter((row) => row.name)
    .sort((a, b) => {
      const aTs = parseDateish(a.date, a.dateLabel) || Number.MAX_SAFE_INTEGER
      const bTs = parseDateish(b.date, b.dateLabel) || Number.MAX_SAFE_INTEGER
      return aTs - bTs
    })

  const recent = [...(Array.isArray(raw.recent) ? raw.recent : [])]
    .map((row) => shapeContest(row, 'recent', defaultSource))
    .filter((row) => row.name)
    .sort((a, b) => {
      const aTs = parseDateish(a.date, a.dateLabel) || 0
      const bTs = parseDateish(b.date, b.dateLabel) || 0
      return bTs - aTs || (b.significanceScore || 0) - (a.significanceScore || 0)
    })

  const biggestSwing = recent.reduce((best, contest) => {
    if ((contest.swing || 0) > (best?.swing || 0)) return contest
    return best
  }, null)

  const latestRecent = recent[0] || null
  const sourceSet = new Set(
    [...upcoming, ...recent]
      .map((contest) => cleanText(contest.source || defaultSource))
      .filter(Boolean)
  )
  const meta = {
    // Timestamp for the latest shaping run so the frontend can show freshness.
    updatedAt: new Date().toISOString(),
    // Quick counts for hero stats and integrity checks without re-counting arrays in the UI.
    upcomingCount: upcoming.length,
    recentCount: recent.length,
    // Strongest swing signal in the current recent-results set.
    biggestSwingContest: biggestSwing?.name || null,
    biggestSwingPoints: biggestSwing?.swing ?? null,
    // Most recent dated result carried in the recent array.
    latestRecentDate: latestRecent?.date || latestRecent?.dateLabel || null,
    // Count of distinct source labels feeding the shaped dataset.
    sourceCount: sourceSet.size,
  }

  return {
    upcoming,
    recent: recent.map((contest) => ({
      ...contest,
      isBiggestSwing: biggestSwing ? contest.id === biggestSwing.id : false,
    })),
    meta,
  }
}

export {
  canonicalParty,
  deriveGainLoss,
  deriveTags,
  formatDateLabel,
  normaliseSwing,
  partyColor,
  significanceScore,
}

export default shapeByElectionsPayload
