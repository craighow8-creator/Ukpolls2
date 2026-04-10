import fs from 'node:fs'
import path from 'node:path'
import { pollsterId } from './utils/pollsterRegistry.mjs'
import { countCorePartyValues, getPartyTotal, getUsablePollDate, validatePollRow } from '../src/shared/pollValidation.js'

const PARTY_KEYS = ['lab', 'con', 'ref', 'ld', 'grn', 'snp', 'pc', 'rb', 'oth']
const CORE_PARTY_KEYS = ['lab', 'con', 'ref', 'ld', 'grn']

const MAX_FUTURE_DAYS = 7
const MAX_PUBLISHED_BEFORE_FIELDWORK_END_DAYS = 7

// User wants roughly 12 months of polls preserved.
const STALE_DAYS_WARNING = 180
const VERY_STALE_DAYS_WARNING = 365
const WIKIPEDIA_MAX_AGE_DAYS = 365

function getArgValue(flag) {
  const args = process.argv.slice(2)
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1] || null
}

function hasFlag(flag) {
  return process.argv.slice(2).includes(flag)
}

function ensureDirForFile(filePath) {
  if (!filePath) return
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function readJsonArray(filePath) {
  if (!filePath) throw new Error('Missing required --in path.')
  if (!fs.existsSync(filePath)) throw new Error(`Input file not found: ${filePath}`)
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  if (!Array.isArray(parsed)) throw new Error(`Input file is not a JSON array: ${filePath}`)
  return parsed
}

function parseIsoDate(value) {
  if (value == null) return null
  if (typeof value !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

function usableDate(record) {
  return getUsablePollDate(record) || null
}

function canonicalKey(record) {
  const date = usableDate(record)
  if (!record?.pollster || !date) return null
  return `${String(record.pollster).trim().toLowerCase()}__${date}`
}

function populatedPartyCount(record) {
  return PARTY_KEYS.filter((key) => typeof record[key] === 'number').length
}

function sumOfCorePartyValues(record) {
  return CORE_PARTY_KEYS.reduce((sum, key) => sum + (typeof record[key] === 'number' ? record[key] : 0), 0)
}

function sourceType(record) {
  return String(record?.sourceType || '').trim().toLowerCase()
}

function isWikipedia(record) {
  return sourceType(record) === 'wikipedia'
}

function isDirectSource(record) {
  return ['yougov', 'ipsos', 'opinium', 'more in common', 'find out now', 'jl partners', 'focaldata', 'survation', 'techne', 'official'].includes(sourceType(record))
}

function getSourceRank(record) {
  const type = sourceType(record)
  if (type === 'official') return 4
  if (isDirectSource(record)) return 3
  if (type === 'wikipedia') return 1
  return 2
}

function getConfidence(record, warnings, errors) {
  if (errors.length) return 'rejected'
  if (warnings.some((w) => w.includes('unrecognised pollster'))) return 'low'
  if (
    warnings.some((w) => w.includes('stale')) ||
    warnings.some((w) => w.includes('only 4 populated')) ||
    warnings.some((w) => w.includes('party total looks low'))
  ) {
    return 'medium'
  }
  if (getSourceRank(record) >= 3) return 'high'
  return 'medium'
}

function validateRecord(record, index) {
  const base = validatePollRow(record)
  const errors = [...base.errors.map((message) => `row ${index + 1}: ${message}`)]
  const warnings = [...base.warnings.map((message) => `row ${index + 1}: ${message}`)]
  const label = `row ${index + 1}`
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    errors.push(`${label}: record is not a valid object`)
    return { errors, warnings }
  }

  if (!record.id || typeof record.id !== 'string') errors.push(`${label}: missing or invalid id`)
  if (!record.pollster || typeof record.pollster !== 'string') errors.push(`${label}: missing or invalid pollster`)
  if (record.pollster && !pollsterId(record.pollster)) warnings.push(`${label}: unrecognised pollster "${record.pollster}"`)

  const date = usableDate(record)

  const fwStart = parseIsoDate(record.fieldworkStart)
  const fwEnd = parseIsoDate(record.fieldworkEnd)
  const pub = parseIsoDate(record.publishedAt)
  const useDate = parseIsoDate(date)

  if (useDate) {
    const futureDays = daysBetween(useDate, today)
    if (futureDays > MAX_FUTURE_DAYS) {
      errors.push(`${label}: date too far in the future (${date})`)
    } else if (futureDays > 0) {
      warnings.push(`${label}: date is slightly in the future (${date})`)
    }

    const ageDays = daysBetween(today, useDate)

    // Preserve about 12 months of poll history, but stop much older Wikipedia rows
    // from flowing into the live accepted set.
    if (isWikipedia(record) && ageDays > WIKIPEDIA_MAX_AGE_DAYS) {
      errors.push(`${label}: wikipedia row is older than 12 months (${ageDays} days old)`)
    } else if (ageDays > VERY_STALE_DAYS_WARNING) {
      warnings.push(`${label}: very stale poll (${ageDays} days old)`)
    } else if (ageDays > STALE_DAYS_WARNING) {
      warnings.push(`${label}: stale poll (${ageDays} days old)`)
    }
  }

  const partyCount = populatedPartyCount(record)
  const corePartyCount = countCorePartyValues(record)

  if (partyCount < 2) {
    errors.push(`${label}: too few populated party values (${partyCount})`)
  } else if (isWikipedia(record) && partyCount < 5) {
    errors.push(`${label}: wikipedia row has too few populated party values (${partyCount})`)
  } else if (partyCount < 5) {
    warnings.push(`${label}: only ${partyCount} populated party values`)
  }

  if (isWikipedia(record) && corePartyCount < 3) {
    errors.push(`${label}: wikipedia row has too few populated core party values (${corePartyCount})`)
  }

  const total = getPartyTotal(record)
  const coreTotal = sumOfCorePartyValues(record)

  if (total > 110) errors.push(`${label}: party total too high = ${total}`)
  else if (isWikipedia(record) && total > 0 && total < 55) errors.push(`${label}: wikipedia party total too low = ${total}`)
  else if (total > 0 && total < 60) warnings.push(`${label}: party total looks low = ${total}`)

  if (coreTotal > 105) errors.push(`${label}: core party total too high = ${coreTotal}`)
  else if (isWikipedia(record) && coreTotal > 0 && coreTotal < 45) errors.push(`${label}: wikipedia core party total too low = ${coreTotal}`)

  if (fwEnd && pub) {
    const diffDays = daysBetween(fwEnd, pub)
    if (diffDays > MAX_PUBLISHED_BEFORE_FIELDWORK_END_DAYS) {
      errors.push(`${label}: fieldworkEnd too far after publishedAt (${record.fieldworkEnd} vs ${record.publishedAt})`)
    } else if (diffDays > 0) {
      warnings.push(`${label}: publishedAt slightly before fieldworkEnd (${record.publishedAt} < ${record.fieldworkEnd})`)
    }
  }

  if (isWikipedia(record) && !record.sourceUrl) {
    warnings.push(`${label}: wikipedia row missing sourceUrl`)
  }

  const confidence = getConfidence(record, warnings, errors)
  return { errors, warnings, confidence }
}

function validateDataset(records) {
  const errors = []
  const warnings = []
  const idMap = new Map()
  const keyMap = new Map()
  const quarantine = []
  const accepted = []
  const coverage = new Map()

  records.forEach((record, index) => {
    const result = validateRecord(record, index)
    errors.push(...result.errors)
    warnings.push(...result.warnings)

    const enriched = {
      ...record,
      pollsterId: pollsterId(record?.pollster) || record?.pollsterId || null,
      confidence: result.confidence,
      suspect: result.errors.length > 0,
      verificationStatus: result.errors.length ? 'rejected' : result.warnings.length ? 'flagged' : 'verified',
    }

    if (record?.id) {
      const existing = idMap.get(record.id)
      if (existing != null) {
        const msg = `duplicate id "${record.id}" at rows ${existing + 1} and ${index + 1}`
        errors.push(msg)
        enriched.suspect = true
        enriched.verificationStatus = 'rejected'
        quarantine.push({ ...enriched, validationIssues: [msg] })
        return
      }
      idMap.set(record.id, index)
    }

    const key = canonicalKey(record)
    if (key) {
      const existing = keyMap.get(key)
      if (existing != null) {
        const msg = `duplicate pollster/date "${key}" at rows ${existing + 1} and ${index + 1}`
        errors.push(msg)
        enriched.suspect = true
        enriched.verificationStatus = 'rejected'
        quarantine.push({ ...enriched, validationIssues: [msg] })
        return
      }
      keyMap.set(key, index)
    }

    if (result.errors.length) {
      quarantine.push({ ...enriched, validationIssues: [...result.errors, ...result.warnings] })
      return
    }

    accepted.push(enriched)
    const bucket = coverage.get(enriched.pollster) || { count: 0, latestDate: '' }
    bucket.count += 1
    const date = usableDate(enriched) || ''
    if (date > bucket.latestDate) bucket.latestDate = date
    coverage.set(enriched.pollster, bucket)
  })

  return { errors, warnings, accepted, quarantine, coverage }
}

function main() {
  const inputPath = getArgValue('--in')
  const acceptedOut = getArgValue('--accepted-out')
  const quarantineOut = getArgValue('--quarantine-out')
  const reportOut = getArgValue('--report-out')
  const strict = hasFlag('--strict')

  const records = readJsonArray(inputPath)
  const { errors, warnings, accepted, quarantine, coverage } = validateDataset(records)

  if (acceptedOut) {
    ensureDirForFile(acceptedOut)
    fs.writeFileSync(acceptedOut, JSON.stringify(accepted, null, 2), 'utf-8')
  }
  if (quarantineOut) {
    ensureDirForFile(quarantineOut)
    fs.writeFileSync(quarantineOut, JSON.stringify(quarantine, null, 2), 'utf-8')
  }
  if (reportOut) {
    ensureDirForFile(reportOut)
    const report = {
      file: path.resolve(inputPath),
      total: records.length,
      accepted: accepted.length,
      quarantined: quarantine.length,
      warnings: warnings.length,
      errors: errors.length,
      coverage: Object.fromEntries([...coverage.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
      warningDetails: warnings.slice(0, 200),
      errorDetails: errors.slice(0, 200),
    }
    fs.writeFileSync(reportOut, JSON.stringify(report, null, 2), 'utf-8')
  }

  console.log(`[validate-polls] File: ${path.resolve(inputPath)}`)
  console.log(`[validate-polls] Records: ${records.length}`)
  console.log(`[validate-polls] Accepted: ${accepted.length}`)
  console.log(`[validate-polls] Quarantined: ${quarantine.length}`)
  console.log(`[validate-polls] Warnings: ${warnings.length}`)
  console.log(`[validate-polls] Errors: ${errors.length}`)

  if (strict && errors.length) process.exit(1)
}

try { main() } catch (error) {
  console.error('[validate-polls] Failed:', error.message)
  process.exit(1)
}
