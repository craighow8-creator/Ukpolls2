#!/usr/bin/env node

import process from 'node:process'
import {
  canWinPollConflict,
  comparePollConflictPriority,
  getUsablePollDate,
  sourceTier,
  validatePollRow,
} from '../src/shared/pollValidation.js'

const DEFAULT_API_BASE = 'https://politiscope-api.craighow8.workers.dev'
const DEFAULT_STALE_DAYS = 14
const PARTY_KEYS = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp', 'pc', 'oth']

function readArg(name, fallback = null) {
  const prefix = `--${name}=`
  const inline = process.argv.find((arg) => arg.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)

  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]

  return fallback
}

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function parseIsoDate(value) {
  const text = cleanText(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const date = new Date(`${text}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function ageDays(dateText, now = new Date()) {
  const date = parseIsoDate(dateText)
  if (!date) return null
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return Math.max(0, Math.floor((today.getTime() - date.getTime()) / 86400000))
}

function canonicalDate(poll) {
  return getUsablePollDate(poll)
}

function canonicalTime(poll) {
  return parseIsoDate(canonicalDate(poll))?.getTime() || 0
}

function normaliseSourceUrl(url) {
  return cleanText(url)
    .replace(/#.*$/, '')
    .replace(/[?&]utm_[^=&]+=[^&#]+/gi, '')
    .replace(/[?&]fbclid=[^&#]+/gi, '')
    .replace(/[?&]gclid=[^&#]+/gi, '')
    .replace(/[?&]$/g, '')
    .replace(/\/$/, '')
}

function pollLabel(poll) {
  const date = canonicalDate(poll) || 'no-date'
  return `${cleanText(poll?.pollster) || 'Unknown'} ${date}${poll?.id ? ` (${poll.id})` : ''}`
}

function sourceLabel(poll) {
  const tier = sourceTier(poll)
  if (tier === 'fallback') return 'Wikipedia fallback'
  if (tier === 'manual') return 'manual/admin'
  return 'direct source'
}

function toplineSignature(poll) {
  return PARTY_KEYS.map((key) => `${key}:${poll?.[key] ?? ''}`).join('|')
}

function compareNewestPolls(a, b) {
  const dateDiff = canonicalTime(b) - canonicalTime(a)
  if (dateDiff !== 0) return dateDiff

  const dateTextDiff = canonicalDate(b).localeCompare(canonicalDate(a))
  if (dateTextDiff !== 0) return dateTextDiff

  const priorityDiff = comparePollConflictPriority(a, b)
  if (priorityDiff !== 0) return priorityDiff

  return cleanText(a?.id || '').localeCompare(cleanText(b?.id || ''))
}

function groupByPollster(polls) {
  const groups = new Map()
  for (const poll of polls) {
    const pollster = cleanText(poll?.pollster) || 'Unknown'
    if (!groups.has(pollster)) groups.set(pollster, [])
    groups.get(pollster).push(poll)
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

function latestPollPerPollster(polls) {
  return groupByPollster(polls).map(([pollster, rows]) => {
    const sorted = [...rows].filter(canWinPollConflict).sort(compareNewestPolls)
    const latest = sorted[0] || [...rows].sort(compareNewestPolls)[0] || null
    return { pollster, latest, count: rows.length }
  })
}

function findMissingDateRows(polls) {
  return polls.filter((poll) => !cleanText(poll?.date) || !canonicalDate(poll))
}

function findMissingSourceRows(polls) {
  return polls.filter((poll) => !normaliseSourceUrl(poll?.sourceUrl))
}

function findStalePollsters(latestRows, staleDays) {
  return latestRows
    .map((row) => ({
      ...row,
      age: ageDays(canonicalDate(row.latest)),
    }))
    .filter((row) => row.age == null || row.age > staleDays)
}

function findDuplicateConflicts(polls) {
  const groups = new Map()

  for (const poll of polls) {
    const pollster = cleanText(poll?.pollster).toLowerCase()
    const date = canonicalDate(poll)
    if (!pollster || !date) continue

    const key = `${pollster}|${date}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(poll)
  }

  return [...groups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => {
      const signatures = new Set(rows.map(toplineSignature))
      const tiers = new Set(rows.map(sourceTier))
      const sourceUrls = new Set(rows.map((row) => normaliseSourceUrl(row.sourceUrl)).filter(Boolean))
      return {
        key,
        rows,
        conflictingToplines: signatures.size > 1,
        mixedSourceTiers: tiers.size > 1,
        distinctSourceUrls: sourceUrls.size,
      }
    })
}

function extractPollRows(payload) {
  if (Array.isArray(payload?.pollsData)) return payload.pollsData
  if (Array.isArray(payload?.pollsArchive)) return payload.pollsArchive
  if (Array.isArray(payload?.polls_history)) return payload.polls_history
  if (Array.isArray(payload?.polls)) return payload.polls
  return []
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`GET ${url} failed ${res.status}: ${text.slice(0, 500)}`)
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(`GET ${url} returned non-JSON: ${text.slice(0, 500)}`)
  }
}

function printSection(title) {
  console.log(`\n${title}`)
  console.log('-'.repeat(title.length))
}

function printPollSummary(row) {
  const poll = row.latest
  if (!poll) {
    console.log(`- ${row.pollster}: missing`)
    return
  }

  const date = canonicalDate(poll) || 'missing date'
  const tier = sourceLabel(poll)
  const sourceUrl = normaliseSourceUrl(poll.sourceUrl) || 'missing sourceUrl'
  console.log(`- ${row.pollster}: ${date} · ${tier} · ${sourceUrl}`)
}

function printSampleRows(rows, formatter, limit = 12) {
  rows.slice(0, limit).forEach((row) => console.log(formatter(row)))
  if (rows.length > limit) console.log(`- ... ${rows.length - limit} more`)
}

async function main() {
  const apiBase = String(readArg('api-base', process.env.POLITISCOPE_API_BASE || DEFAULT_API_BASE)).replace(/\/$/, '')
  const staleDays = Number(readArg('stale-days', DEFAULT_STALE_DAYS))
  const dataUrl = `${apiBase}/api/data`

  console.log(`[poll-health] API base: ${apiBase}`)
  console.log(`[poll-health] Stale threshold: ${staleDays} days`)

  const payload = await fetchJson(dataUrl)
  const polls = extractPollRows(payload).filter((row) => row && typeof row === 'object')
  const latestRows = latestPollPerPollster(polls)
  const newestOverall = [...polls].filter(canWinPollConflict).sort(compareNewestPolls)[0] || [...polls].sort(compareNewestPolls)[0] || null
  const missingDateRows = findMissingDateRows(polls)
  const missingSourceRows = findMissingSourceRows(polls)
  const stalePollsters = findStalePollsters(latestRows, staleDays)
  const duplicateGroups = findDuplicateConflicts(polls)
  const conflictingGroups = duplicateGroups.filter((group) => group.conflictingToplines)
  const invalidRows = polls
    .map((poll) => ({ poll, verdict: validatePollRow(poll) }))
    .filter((row) => !row.verdict.valid)

  printSection('Latest poll per pollster')
  latestRows.forEach(printPollSummary)

  printSection('Newest overall poll')
  if (newestOverall) printPollSummary({ pollster: newestOverall.pollster || 'Unknown', latest: newestOverall })
  else console.log('- none')

  printSection('Rows missing date')
  if (missingDateRows.length) {
    printSampleRows(missingDateRows, (poll) => `- ${pollLabel(poll)} · date=${poll?.date ?? 'missing'} · canonical=${canonicalDate(poll) || 'missing'}`)
  } else {
    console.log('- none')
  }

  printSection('Rows missing sourceUrl')
  if (missingSourceRows.length) {
    printSampleRows(missingSourceRows, (poll) => `- ${pollLabel(poll)} · ${sourceLabel(poll)}`)
  } else {
    console.log('- none')
  }

  printSection('Stale pollsters')
  if (stalePollsters.length) {
    printSampleRows(stalePollsters, (row) => `- ${row.pollster}: ${canonicalDate(row.latest) || 'missing date'} · ${row.age == null ? 'unknown age' : `${row.age} days old`} · ${sourceLabel(row.latest)}`)
  } else {
    console.log('- none')
  }

  printSection('Duplicate / same pollster-date rows')
  if (duplicateGroups.length) {
    printSampleRows(
      duplicateGroups,
      (group) => `- ${group.key} · rows=${group.rows.length} · conflictingToplines=${group.conflictingToplines ? 'yes' : 'no'} · mixedSourceTiers=${group.mixedSourceTiers ? 'yes' : 'no'}`,
    )
  } else {
    console.log('- none')
  }

  printSection('Invalid rows')
  if (invalidRows.length) {
    printSampleRows(
      invalidRows,
      ({ poll, verdict }) => `- ${pollLabel(poll)} · ${verdict.errors.join('; ')}`,
    )
  } else {
    console.log('- none')
  }

  const failReasons = []
  const warningReasons = []

  if (!polls.length) failReasons.push('no poll rows found')
  if (missingDateRows.some((poll) => !canonicalDate(poll))) failReasons.push('rows missing canonical date')
  if (invalidRows.length) failReasons.push(`${invalidRows.length} invalid row(s)`)
  if (conflictingGroups.length) failReasons.push(`${conflictingGroups.length} conflicting same pollster/date group(s)`)

  if (missingDateRows.length) warningReasons.push(`${missingDateRows.length} row(s) missing explicit date field`)
  if (missingSourceRows.length) warningReasons.push(`${missingSourceRows.length} row(s) missing sourceUrl`)
  if (stalePollsters.length) warningReasons.push(`${stalePollsters.length} stale pollster(s) over ${staleDays} days`)
  if (duplicateGroups.length && !conflictingGroups.length) warningReasons.push(`${duplicateGroups.length} duplicate same pollster/date group(s), no conflicting toplines`)

  printSection('Status')
  if (failReasons.length) {
    console.log(`FAIL: ${failReasons.join('; ')}`)
    if (warningReasons.length) console.log(`Warnings: ${warningReasons.join('; ')}`)
    process.exitCode = 1
  } else if (warningReasons.length) {
    console.log(`WARNING: ${warningReasons.join('; ')}`)
  } else {
    console.log('OK: poll data is healthy')
  }
}

main().catch((err) => {
  console.error(`[poll-health] FAIL: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
