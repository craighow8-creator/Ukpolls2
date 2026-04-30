import { POLITICAL_MARKET_ROWS } from '../src/data/politicalMarkets.js'

const REQUIRED_FIELDS = [
  'marketId',
  'marketName',
  'electionType',
  'runner',
  'oddsFractional',
  'impliedProbability',
  'source',
  'sourceUrl',
  'checkedAt',
  'freshnessStatus',
  'marketType',
]

function isMissing(value) {
  return value == null || String(value).trim() === ''
}

function daysSince(dateValue) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return null
  return Math.floor((Date.now() - parsed.getTime()) / 86400000)
}

const rows = Array.isArray(POLITICAL_MARKET_ROWS) ? POLITICAL_MARKET_ROWS : []
const missing = []
const stale = []

for (const row of rows) {
  const id = row?.marketId || row?.runner || 'unknown-row'
  for (const field of REQUIRED_FIELDS) {
    if (isMissing(row?.[field])) missing.push({ marketId: id, field })
  }

  const ageDays = daysSince(row?.checkedAt)
  if (row?.freshnessStatus === 'stale' || ageDays == null || ageDays > 14) {
    stale.push({
      marketId: id,
      runner: row?.runner || '',
      checkedAt: row?.checkedAt || '',
      freshnessStatus: row?.freshnessStatus || '',
      ageDays,
    })
  }
}

const result = {
  ok: missing.length === 0,
  rowCount: rows.length,
  staleCount: stale.length,
  missingSourceUrl: missing.filter((item) => item.field === 'sourceUrl').length,
  missingCheckedAt: missing.filter((item) => item.field === 'checkedAt').length,
  missing,
  stale,
}

console.log(JSON.stringify(result, null, 2))

if (missing.length) process.exit(1)
