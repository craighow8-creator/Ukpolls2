import { POLITICAL_MARKET_ROWS } from '../src/data/politicalMarkets.js'
import { readFile } from 'node:fs/promises'

const REQUIRED_FIELDS = [
  'marketId',
  'marketName',
  'electionType',
  'runner',
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

async function readGeneratedRows() {
  try {
    const text = await readFile(new URL('../src/data/politicalMarkets.generated.json', import.meta.url), 'utf8')
    const payload = JSON.parse(text)
    return {
      rows: Array.isArray(payload?.rows) ? payload.rows : [],
      failedSources: Array.isArray(payload?.failedSources) ? payload.failedSources : [],
    }
  } catch (error) {
    return {
      rows: [],
      failedSources: [{ id: 'generated-json', reason: error?.message || String(error) }],
    }
  }
}

const generated = await readGeneratedRows()
const currentRows = generated.rows
const archivedRows = Array.isArray(POLITICAL_MARKET_ROWS) ? POLITICAL_MARKET_ROWS : []
const rows = [...currentRows, ...archivedRows]
const missing = []
const stale = []

for (const row of rows) {
  const id = row?.marketId || row?.runner || 'unknown-row'
  for (const field of REQUIRED_FIELDS) {
    if (isMissing(row?.[field])) missing.push({ marketId: id, field })
  }
  if (isMissing(row?.oddsFractional) && isMissing(row?.oddsDecimal)) {
    missing.push({ marketId: id, field: 'oddsFractional|oddsDecimal' })
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
  ok: missing.length === 0 && generated.failedSources.length === 0,
  rowCount: rows.length,
  currentRows: currentRows.length,
  archivedRows: archivedRows.length,
  staleCount: stale.length,
  missingSourceUrl: missing.filter((item) => item.field === 'sourceUrl').length,
  missingCheckedAt: missing.filter((item) => item.field === 'checkedAt').length,
  failedSources: generated.failedSources,
  missing,
  stale,
}

console.log(JSON.stringify(result, null, 2))

if (missing.length || generated.failedSources.length) process.exit(1)
