#!/usr/bin/env node
import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'https://politiscope-api.craighow8.workers.dev'

const CONFIG_PATH =
  process.env.PARTY_POLICY_SOURCES_CONFIG ||
  process.argv.find((arg) => arg.startsWith('--config='))?.split('=')[1] ||
  'scripts/config/party-policy-sources.json'

const STALE_DAYS = Number(
  process.argv.find((arg) => arg.startsWith('--stale-days='))?.split('=')[1] ||
  process.env.POLICY_SOURCE_STALE_DAYS ||
  90,
)

const OFFICIAL_TYPES = new Set([
  'manifesto',
  'official_policy_paper',
  'official_policy_page',
  'official_pledge_page',
])

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeType(value) {
  return cleanText(value).toLowerCase().replace(/-/g, '_')
}

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function parseCheckedDate(value) {
  const text = cleanText(value)
  const match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00Z`)
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysSince(value) {
  const date = parseCheckedDate(value)
  if (!date) return null
  return Math.floor((Date.now() - date.getTime()) / 86400000)
}

function sourcesFor(record) {
  return Array.isArray(record?.sources) ? record.sources.filter(Boolean) : []
}

function hasOfficialSource(record) {
  return sourcesFor(record).some((source) => cleanText(source.url) && OFFICIAL_TYPES.has(normalizeType(source.type)))
}

function missingSourceUrl(record) {
  const sources = sourcesFor(record)
  return !sources.length || sources.every((source) => !cleanText(source.url))
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`).catch((error) => {
    fail(`Failed to fetch ${path}.`, error?.message || String(error))
  })
  const text = await response.text().catch(() => '')
  if (!response.ok) fail(`Policy source health fetch failed (${response.status}).`, text)
  try {
    return JSON.parse(text)
  } catch (error) {
    fail('Policy source health response was not JSON.', error?.message || String(error))
  }
}

async function main() {
  const config = JSON.parse(await readFile(resolve(process.cwd(), CONFIG_PATH), 'utf8'))
  const data = await fetchJson('/api/data')
  const records = Array.isArray(data?.policyRecords) ? data.policyRecords : []
  const officialRecords = records.filter(hasOfficialSource)
  const missingUrlRecords = records.filter(missingSourceUrl)
  const maintainedWithoutOfficial = records.filter((record) => !hasOfficialSource(record))
  const staleRecords = officialRecords.filter((record) => {
    const source = sourcesFor(record).find((entry) => cleanText(entry.lastChecked)) || record.controllingSource || {}
    const age = daysSince(source.lastChecked || record.lastChecked || record.updatedAt)
    return age == null || age > STALE_DAYS
  })

  const partiesCovered = new Set(officialRecords.map((record) => cleanText(record.party)).filter(Boolean))
  const areasCovered = new Set(officialRecords.map((record) => cleanText(record.area)).filter(Boolean))
  const configuredParties = new Set((config.sources || []).map((source) => cleanText(source.party)).filter(Boolean))
  const configuredSourcesMissingUrl = (config.sources || []).filter((source) => !cleanText(source.sourceUrl))

  const status =
    missingUrlRecords.length ||
    configuredSourcesMissingUrl.length ||
    staleRecords.length
      ? 'WARNING'
      : 'OK'

  console.log(`Policy sources health: ${status}`)
  console.log(`API: ${API_BASE}`)
  console.log(`Configured official source parties: ${configuredParties.size ? [...configuredParties].join(', ') : 'none'}`)
  console.log(`Official-source policy rows: ${officialRecords.length}/${records.length}`)
  console.log(`Parties covered by official-source rows: ${partiesCovered.size ? [...partiesCovered].join(', ') : 'none'}`)
  console.log(`Policy areas covered by official-source rows: ${areasCovered.size ? [...areasCovered].join(', ') : 'none'}`)
  console.log(`Rows missing sourceUrl: ${missingUrlRecords.length ? missingUrlRecords.map((record) => record.id || `${record.party}/${record.area}`).join(', ') : 'none'}`)
  console.log(`Stale or undated official source checks (> ${STALE_DAYS} days): ${staleRecords.length ? staleRecords.map((record) => record.id || `${record.party}/${record.area}`).join(', ') : 'none'}`)
  console.log(`Maintained/manual rows without official source: ${maintainedWithoutOfficial.length}`)
  console.log(`Configured sources missing URL: ${configuredSourcesMissingUrl.length ? configuredSourcesMissingUrl.map((source) => source.party || source.sourceTitle).join(', ') : 'none'}`)

  if (status !== 'OK') process.exitCode = 1
}

main().catch((error) => fail('Unexpected policy source health failure.', error?.stack || error?.message || String(error)))
