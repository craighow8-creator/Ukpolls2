#!/usr/bin/env node
import process from 'node:process'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function isFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return false
  return Number.isFinite(Number(value))
}

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`).catch((error) => {
    fail(`Failed to fetch ${path}.`, error?.message || String(error))
  })
  const text = await response.text().catch(() => '')
  if (!response.ok) fail(`Leader ratings health fetch failed (${response.status}).`, text)
  try {
    return JSON.parse(text)
  } catch (error) {
    fail('Leader ratings health response was not JSON.', error?.message || String(error))
  }
}

async function main() {
  const data = await fetchJson('/api/data')
  const leaders = Array.isArray(data?.leaders) ? data.leaders : []
  const ratings = leaders.filter((leader) => leader.ratingSource === 'sourced')
  const missingNet = leaders.filter((leader) => !isFiniteNumber(leader.net)).map((leader) => leader.name)
  const missingSourceUrl = ratings.filter((leader) => !cleanText(leader.sourceUrl)).map((leader) => leader.name)
  const unmatched = Array.isArray(data?.leaderRatings?.unmatched) ? data.leaderRatings.unmatched : []
  const latestSource = data?.leaderRatings?.source || ratings[0]?.source || 'none'
  const latestDate = data?.leaderRatings?.publishedAt || data?.leaderRatings?.fieldworkDate || data?.leaderRatings?.updatedAt || 'unknown'

  const status = missingNet.length || missingSourceUrl.length || unmatched.length ? 'WARNING' : 'OK'

  console.log(`Leader ratings health: ${status}`)
  console.log(`API: ${API_BASE}`)
  console.log(`Latest source: ${latestSource}`)
  console.log(`Latest date: ${latestDate}`)
  console.log(`Sourced leaders: ${ratings.length}/${leaders.length}`)
  console.log(`Leaders missing net: ${missingNet.length ? missingNet.join(', ') : 'none'}`)
  console.log(`Sourced leaders missing sourceUrl: ${missingSourceUrl.length ? missingSourceUrl.join(', ') : 'none'}`)
  console.log(`Ratings not matched to app profiles: ${unmatched.length ? unmatched.join(', ') : 'none'}`)

  if (status !== 'OK') process.exitCode = 1
}

main().catch((error) => fail('Unexpected leader ratings health failure.', error?.stack || error?.message || String(error)))
