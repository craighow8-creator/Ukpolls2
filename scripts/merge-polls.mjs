import fs from 'node:fs'
import path from 'node:path'
import { pollsterId } from './utils/pollsterRegistry.mjs'
import { comparePollConflictPriority, sourceTier } from '../src/shared/pollValidation.js'

function getArgValue(flag) {
  const args = process.argv.slice(2)
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1] || null
}

function ensureDirForFile(filePath) {
  if (!filePath) return
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function readJsonFile(filePath, label) {
  if (!filePath) return []
  if (!fs.existsSync(filePath)) throw new Error(`${label} file not found: ${filePath}`)
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  if (!Array.isArray(parsed)) throw new Error(`${label} file did not contain a JSON array: ${filePath}`)
  return parsed
}

function clean(value) {
  return String(value || '').trim()
}

function canonicalDate(record) {
  return record.fieldworkEnd || record.fieldworkStart || record.publishedAt || null
}

function buildMergeKey(record) {
  const pollster = clean(record?.pollsterId || pollsterId(record?.pollster) || record?.pollster).toLowerCase()
  const date = clean(canonicalDate(record))
  const sample = record?.sample == null ? '' : String(record.sample)
  if (!pollster || !date) return null
  return `${pollster}__${date}__${sample}`
}

function uniqueList(values) {
  return [...new Set((values || []).filter(Boolean))]
}

function mergeProvenance(existing, winner, loser) {
  const sourceTypes = uniqueList([
    ...(winner._sourceTypes || []),
    ...(loser._sourceTypes || []),
    winner.sourceType,
    loser.sourceType,
  ])

  const sourceTiers = uniqueList([
    ...(winner._sourceTiers || []),
    ...(loser._sourceTiers || []),
    sourceTier(winner),
    sourceTier(loser),
  ])

  const verifiedAgainst = uniqueList([
    ...clean(winner.verifiedAgainst).split(',').map((x) => clean(x)).filter(Boolean),
    ...clean(loser.verifiedAgainst).split(',').map((x) => clean(x)).filter(Boolean),
    winner.sourceType,
    loser.sourceType,
  ])

  existing._sourceTypes = sourceTypes
  existing._sourceTiers = sourceTiers
  existing.sourceType = winner.sourceType || loser.sourceType || null
  existing.sourceTier = sourceTier(winner)
  existing.verifiedAgainst = verifiedAgainst.join(', ')
  existing.provenanceSummary = sourceTiers.join(', ')
  return existing
}

function mergeTwo(existing, incoming) {
  const incomingWins = comparePollConflictPriority(incoming, existing) < 0

  const winner = incomingWins ? incoming : existing
  const loser = incomingWins ? existing : incoming
  const merged = { ...winner }

  for (const [key, value] of Object.entries(loser)) {
    if (merged[key] === null || merged[key] === undefined || merged[key] === '') merged[key] = value
  }

  merged.pollsterId = merged.pollsterId || pollsterId(merged.pollster) || null
  return mergeProvenance(merged, winner, loser)
}

function attachInitialProvenance(record) {
  const type = record.sourceType || null
  const tier = sourceTier(record)
  return {
    ...record,
    sourceType: type,
    sourceTier: tier,
    _sourceTypes: uniqueList([type]),
    _sourceTiers: [tier],
    verifiedAgainst: clean(record.verifiedAgainst) || clean(type),
    provenanceSummary: tier,
  }
}

function dedupe(records) {
  const accepted = []
  const quarantine = []
  const byKey = new Map()

  for (const raw of records) {
    if (!raw || typeof raw !== 'object') continue
    const record = attachInitialProvenance({
      ...raw,
      pollsterId: raw.pollsterId || pollsterId(raw.pollster) || null,
      confidence: raw.confidence || 'medium',
      verificationStatus: raw.verificationStatus || 'verified',
      suspect: !!raw.suspect,
    })

    if (record.suspect || clean(record.verificationStatus).toLowerCase() === 'rejected') {
      quarantine.push(record)
      continue
    }

    const key = buildMergeKey(record)
    if (!key) {
      quarantine.push({ ...record, suspect: true, verificationStatus: 'rejected', quarantineReason: 'missing merge key' })
      continue
    }

    const existing = byKey.get(key)
    byKey.set(key, existing ? mergeTwo(existing, record) : record)
  }

  accepted.push(...byKey.values())
  accepted.sort((a, b) => (canonicalDate(b) || '').localeCompare(canonicalDate(a) || ''))
  return { accepted, quarantine }
}

function buildCoverage(records) {
  const map = new Map()
  for (const record of records) {
    const key = record.pollster || 'Unknown'
    const current = map.get(key) || {
      count: 0,
      latestDate: '',
      sourceTypes: new Set(),
      sourceTiers: new Set(),
      confidence: new Set(),
      directCount: 0,
      fallbackCount: 0,
      manualCount: 0,
    }

    current.count += 1
    const date = canonicalDate(record) || ''
    if (date > current.latestDate) current.latestDate = date

    const tiers = record._sourceTiers || [record.sourceTier].filter(Boolean)
    const types = record._sourceTypes || [record.sourceType].filter(Boolean)

    for (const tier of tiers) current.sourceTiers.add(tier)
    for (const type of types) current.sourceTypes.add(type)
    if (record.confidence) current.confidence.add(record.confidence)

    if (tiers.includes('direct')) current.directCount += 1
    if (tiers.includes('fallback')) current.fallbackCount += 1
    if (tiers.includes('manual')) current.manualCount += 1

    map.set(key, current)
  }

  return Object.fromEntries(
    [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => [name, {
        count: value.count,
        latestDate: value.latestDate,
        sourceTypes: [...value.sourceTypes],
        sourceTiers: [...value.sourceTiers],
        confidence: [...value.confidence],
        directCount: value.directCount,
        fallbackCount: value.fallbackCount,
        manualCount: value.manualCount,
      }])
  )
}

function buildProvenanceSummary(records) {
  const summary = {
    mergedRows: records.length,
    directRows: 0,
    fallbackRows: 0,
    manualRows: 0,
    directOnlyPollsters: [],
    fallbackOnlyPollsters: [],
    mixedPollsters: [],
  }

  const pollsterTiers = new Map()

  for (const record of records) {
    const pollster = record.pollster || 'Unknown'
    const tiers = record._sourceTiers || [record.sourceTier].filter(Boolean)
    if (!pollsterTiers.has(pollster)) pollsterTiers.set(pollster, new Set())
    for (const tier of tiers) pollsterTiers.get(pollster).add(tier)

    if (tiers.includes('direct')) summary.directRows += 1
    if (tiers.includes('fallback')) summary.fallbackRows += 1
    if (tiers.includes('manual')) summary.manualRows += 1
  }

  for (const [pollster, tiersSet] of pollsterTiers.entries()) {
    const tiers = [...tiersSet]
    if (tiers.length === 1 && tiers[0] === 'direct') summary.directOnlyPollsters.push(pollster)
    else if (tiers.length === 1 && tiers[0] === 'fallback') summary.fallbackOnlyPollsters.push(pollster)
    else summary.mixedPollsters.push(pollster)
  }

  summary.directOnlyPollsters.sort()
  summary.fallbackOnlyPollsters.sort()
  summary.mixedPollsters.sort()

  return summary
}

function main() {
  const outPath = getArgValue('--out')
  const quarantineOut = getArgValue('--quarantine-out')
  const reportOut = getArgValue('--report-out')

  const inputs = [
    ['Wikipedia', getArgValue('--wiki')],
    ['YouGov', getArgValue('--yougov')],
    ['Opinium', getArgValue('--opinium')],
    ['More in Common', getArgValue('--more-in-common')],
    ['Find Out Now', getArgValue('--find-out-now')],
    ['JL Partners', getArgValue('--jl-partners')],
    ['Focaldata', getArgValue('--focaldata')],
    ['Deltapoll', getArgValue('--deltapoll')],
  ]

  const allRecords = []
  for (const [label, filePath] of inputs) {
    allRecords.push(...readJsonFile(filePath, label))
  }

  const { accepted, quarantine } = dedupe(allRecords)
  if (!accepted.length) throw new Error('No merged records were produced.')

  if (outPath) {
    ensureDirForFile(outPath)
    fs.writeFileSync(outPath, JSON.stringify(accepted, null, 2), 'utf-8')
    console.log(`[merge-polls] Saved merged output to ${outPath}`)
  }
  if (quarantineOut) {
    ensureDirForFile(quarantineOut)
    fs.writeFileSync(quarantineOut, JSON.stringify(quarantine, null, 2), 'utf-8')
    console.log(`[merge-polls] Saved quarantine output to ${quarantineOut}`)
  }
  if (reportOut) {
    ensureDirForFile(reportOut)
    fs.writeFileSync(reportOut, JSON.stringify({
      generatedAt: new Date().toISOString(),
      mergedCount: accepted.length,
      quarantinedCount: quarantine.length,
      coverage: buildCoverage(accepted),
      provenance: buildProvenanceSummary(accepted),
    }, null, 2), 'utf-8')
    console.log(`[merge-polls] Saved report to ${reportOut}`)
  }

  if (!outPath) console.log(JSON.stringify(accepted, null, 2))
}

try { main() } catch (error) {
  console.error('[merge-polls] Failed:', error.message)
  process.exit(1)
}
