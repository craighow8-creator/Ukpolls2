#!/usr/bin/env node
import process from 'node:process'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function daysSince(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return Math.floor((Date.now() - parsed.getTime()) / 86400000)
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Politiscope/1.0 (+https://politiscope.co.uk)',
    },
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 240)}`)
  return JSON.parse(text)
}

const result = {
  ok: false,
  apiBase: API_BASE,
  migrationExists: false,
  netTotal: null,
  fetchYear: '',
  reviewedAt: '',
  sourceType: '',
  sourceUrlsPresent: false,
  trendRows: 0,
  nationalityRows: 0,
  visaRows: 0,
  hasSmallBoats: false,
  warnings: [],
  errors: [],
}

try {
  const data = await fetchJson(`${API_BASE.replace(/\/$/, '')}/api/data`)
  const migration = data?.migration
  result.migrationExists = !!(migration && typeof migration === 'object')

  if (!result.migrationExists) {
    result.errors.push('Migration payload is missing from /api/data.')
  } else {
    result.netTotal = Number(migration.netTotal)
    result.fetchYear = cleanText(migration.fetchYear)
    result.reviewedAt = cleanText(migration.meta?.reviewedAt)
    result.sourceType = cleanText(migration.meta?.sourceType)
    result.sourceUrlsPresent = !!(migration.meta?.onsSourceUrl && migration.meta?.onsBulletinUrl)
    result.trendRows = Array.isArray(migration.trend) ? migration.trend.length : 0
    result.nationalityRows = Array.isArray(migration.byNationality) ? migration.byNationality.length : 0
    result.visaRows = Array.isArray(migration.byVisa) ? migration.byVisa.length : 0
    result.hasSmallBoats = !!migration.smallBoats
    result.warnings = Array.isArray(migration.meta?.warnings) ? migration.meta.warnings : []

    if (!Number.isFinite(result.netTotal) || result.netTotal <= 0) result.errors.push('netTotal is missing or invalid.')
    if (!result.fetchYear) result.errors.push('fetchYear is missing.')
    if (!/ONS/i.test(result.fetchYear)) result.warnings.push('fetchYear does not mention ONS.')
    if (!result.reviewedAt) result.errors.push('meta.reviewedAt is missing.')
    if (!result.sourceType) result.errors.push('meta.sourceType is missing.')
    if (!result.sourceUrlsPresent) result.errors.push('ONS source URLs are missing.')
    if (result.trendRows < 2) result.errors.push('Trend does not include current and prior comparison rows.')

    const reviewedAge = daysSince(result.reviewedAt)
    if (reviewedAge == null) {
      result.warnings.push('reviewedAt is not parseable.')
    } else if (reviewedAge > 210) {
      result.warnings.push(`Migration dataset was reviewed ${reviewedAge} days ago; check whether a newer official estimate is available.`)
    }

    if (!/Official ONS \/ Home Office statistics/i.test(result.sourceType)) {
      result.warnings.push('sourceType is not the expected official-statistics label.')
    }
  }

  result.ok = result.errors.length === 0
} catch (error) {
  result.errors.push(error?.message || String(error))
}

console.log(JSON.stringify(result, null, 2))
if (!result.ok) process.exit(1)
