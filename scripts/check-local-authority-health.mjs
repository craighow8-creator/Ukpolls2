#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const DEFAULT_API_BASE = 'https://politiscope-api.craighow8.workers.dev'
const DEFAULT_PRIORITY_CONFIG = 'scripts/config/local-candidate-sources.json'
const DEFAULT_OFFICEHOLDER_PRIORITY_CONFIG = 'scripts/config/local-officeholder-sources.json'
const DEFAULT_RESULT_PRIORITY_CONFIG = 'scripts/config/local-election-result-sources.json'

function readArg(name, fallback = '') {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match ? match.slice(prefix.length) : fallback
}

function trimApiBase(value) {
  return String(value || DEFAULT_API_BASE).replace(/\/+$/, '')
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
    },
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return {
    ok: response.ok,
    status: response.status,
    body,
  }
}

function printLine(label, value) {
  console.log(`${label.padEnd(30)} ${value}`)
}

async function loadPriorityConfig() {
  const configPath = readArg('config', DEFAULT_PRIORITY_CONFIG)
  try {
    const text = await readFile(configPath, 'utf8')
    const payload = JSON.parse(text)
    return (Array.isArray(payload?.sources) ? payload.sources : []).filter((source) => source.priority)
  } catch {
    return []
  }
}

async function loadOfficeholderPriorityConfig() {
  const configPath = readArg('officeholder-config', DEFAULT_OFFICEHOLDER_PRIORITY_CONFIG)
  try {
    const text = await readFile(configPath, 'utf8')
    const payload = JSON.parse(text)
    return (Array.isArray(payload?.sources) ? payload.sources : []).filter((source) => source.priority)
  } catch {
    return []
  }
}

async function loadResultPriorityConfig() {
  const configPath = readArg('result-config', DEFAULT_RESULT_PRIORITY_CONFIG)
  try {
    const text = await readFile(configPath, 'utf8')
    const payload = JSON.parse(text)
    return (Array.isArray(payload?.sources) ? payload.sources : []).filter((source) => source.priority)
  } catch {
    return []
  }
}

function summarizePriorityCoverage(prioritySources = [], coverageByCouncil = []) {
  const coverage = new Map(
    (coverageByCouncil || []).map((row) => [String(row.slug || '').trim(), row]),
  )
  const covered = []
  const missing = []

  for (const source of prioritySources) {
    const slug = String(source.councilSlug || '').trim()
    const row = coverage.get(slug)
    if (row?.candidates > 0) {
      covered.push(`${source.councilName || slug} (${row.candidates} candidates)`)
    } else {
      missing.push(source.councilName || slug)
    }
  }

  return { covered, missing }
}

function summarizePriorityOfficeholderCoverage(prioritySources = [], coverageByCouncil = []) {
  const coverage = new Map(
    (coverageByCouncil || []).map((row) => [String(row.slug || '').trim(), row]),
  )
  const covered = []
  const missing = []

  for (const source of prioritySources) {
    const slug = String(source.councilSlug || '').trim()
    const row = coverage.get(slug)
    if (row?.officeholders > 0) {
      covered.push(`${source.councilName || slug} (${row.officeholders} officeholders)`)
    } else {
      missing.push(source.councilName || slug)
    }
  }

  return { covered, missing }
}

function summarizePriorityResultCoverage(prioritySources = [], coverageByCouncil = []) {
  const coverage = new Map(
    (coverageByCouncil || []).map((row) => [String(row.slug || '').trim(), row]),
  )
  const covered = []
  const missing = []

  for (const source of prioritySources) {
    const slug = String(source.councilSlug || '').trim()
    const row = coverage.get(slug)
    if (row?.results > 0) {
      covered.push(`${source.councilName || slug} (${row.wards || 0} wards declared)`)
    } else {
      missing.push(source.councilName || slug)
    }
  }

  return { covered, missing }
}

function countLookupPostcodeSupportedWards(wards = []) {
  return wards.filter((ward) => ward?.gssCode || ward?.mapitAreaId).length
}

function summariseHealth(payload, prioritySources = [], officeholderPrioritySources = [], resultPrioritySources = []) {
  const counts = payload?.counts || {}
  const latest = payload?.latestLocalIngestRun || null
  const coverageByCouncil = Array.isArray(payload?.candidateCoverageByCouncil) ? payload.candidateCoverageByCouncil : []
  const officeholderCoverageByCouncil = Array.isArray(payload?.officeholderCoverageByCouncil) ? payload.officeholderCoverageByCouncil : []
  const resultCoverageByCouncil = Array.isArray(payload?.resultCoverageByCouncil) ? payload.resultCoverageByCouncil : []
  const councilsMissingCandidateSourceUrl = coverageByCouncil.filter((row) => Number(row.missingSourceUrl || 0) > 0)
  const councilsMissingOfficeholderSourceUrl = officeholderCoverageByCouncil.filter((row) => Number(row.missingSourceUrl || 0) > 0)
  const councilsMissingResultSourceUrl = resultCoverageByCouncil.filter((row) => Number(row.missingSourceUrl || 0) > 0)
  const priority = summarizePriorityCoverage(prioritySources, coverageByCouncil)
  const officeholderPriority = summarizePriorityOfficeholderCoverage(officeholderPrioritySources, officeholderCoverageByCouncil)
  const resultPriority = summarizePriorityResultCoverage(resultPrioritySources, resultCoverageByCouncil)

  printLine('Councils', counts.councils ?? 'unknown')
  printLine('Wards', counts.wards ?? 'unknown')
  printLine('Detailed councils', counts.detailedCouncils ?? 'unknown')
  printLine('Candidate coverage', `${counts.candidateWards ?? 0} wards / ${counts.candidateCouncils ?? 0} Local Authorities`)
  printLine('Candidates', counts.candidates ?? 0)
  printLine('Councils with candidates', counts.candidateCouncils ?? 0)
  printLine('Councils missing candidate source URL', councilsMissingCandidateSourceUrl.length)
  if (coverageByCouncil.length) {
    printLine('Priority councils covered', priority.covered.length ? priority.covered.join('; ') : 'none')
    printLine('Priority councils missing', priority.missing.length ? priority.missing.join('; ') : 'none')
  } else {
    printLine('Priority councils covered', 'unavailable from deployed health endpoint')
    printLine('Priority councils missing', 'unavailable from deployed health endpoint')
  }
  printLine('Officeholder coverage', `${counts.officeholderWards ?? 0} wards / ${counts.officeholderCouncils ?? 0} Local Authorities`)
  printLine('Officeholders', counts.officeholders ?? 0)
  printLine('Councils with officeholders', counts.officeholderCouncils ?? 0)
  printLine('Councils missing officeholder source URL', councilsMissingOfficeholderSourceUrl.length)
  if (officeholderCoverageByCouncil.length) {
    printLine('Priority officeholder covered', officeholderPriority.covered.length ? officeholderPriority.covered.join('; ') : 'none')
    printLine('Priority officeholder missing', officeholderPriority.missing.length ? officeholderPriority.missing.join('; ') : 'none')
  } else {
    printLine('Priority officeholder covered', 'unavailable from deployed health endpoint')
    printLine('Priority officeholder missing', 'unavailable from deployed health endpoint')
  }
  printLine('Result coverage', `${counts.resultWards ?? 0} wards / ${counts.resultCouncils ?? 0} Local Authorities`)
  printLine('Result rows', counts.resultRows ?? 0)
  printLine('Councils with results', counts.resultCouncils ?? 0)
  printLine('Councils missing result source URL', councilsMissingResultSourceUrl.length)
  if (resultCoverageByCouncil.length) {
    printLine('Priority results covered', resultPriority.covered.length ? resultPriority.covered.join('; ') : 'none')
    printLine('Priority results missing', resultPriority.missing.length ? resultPriority.missing.join('; ') : 'none')
  } else {
    printLine('Priority results covered', 'unavailable from deployed health endpoint')
    printLine('Priority results missing', 'unavailable from deployed health endpoint')
  }
  printLine('Rows missing sourceUrl', counts.rowsMissingSourceUrl ?? 0)
  printLine('Postcode-supported wards', counts.postcodeSupportedWards ?? 'unknown')
  printLine(
    'Latest local ingest',
    latest
      ? `${latest.pipeline} / ${latest.status} / ${latest.finishedAt || latest.startedAt || 'time unknown'}`
      : 'not recorded',
  )
}

function summariseLookupFallback(payload, prioritySources = []) {
  const councils = Array.isArray(payload?.councils) ? payload.councils : []
  const wards = Array.isArray(payload?.wards) ? payload.wards : []
  const councilSlugs = new Set(councils.map((council) => String(council.slug || '').trim()))
  const priorityKnown = prioritySources.filter((source) => councilSlugs.has(String(source.councilSlug || '').trim()))
  const priorityUnknown = prioritySources.filter((source) => !councilSlugs.has(String(source.councilSlug || '').trim()))

  printLine('Councils', councils.length)
  printLine('Wards', wards.length)
  printLine('Detailed councils', 'unavailable from lookup index')
  printLine('Candidate coverage', 'unavailable from lookup index')
  printLine('Councils with candidates', 'unavailable from lookup index')
  printLine('Councils missing candidate source URL', 'unavailable from lookup index')
  printLine('Priority councils in baseline', priorityKnown.length ? priorityKnown.map((source) => source.councilName || source.councilSlug).join('; ') : 'none')
  printLine('Priority councils missing baseline', priorityUnknown.length ? priorityUnknown.map((source) => source.councilName || source.councilSlug).join('; ') : 'none')
  printLine('Rows missing sourceUrl', 'unavailable from lookup index')
  printLine('Postcode-supported wards', countLookupPostcodeSupportedWards(wards))
  printLine('Latest local ingest', 'unavailable from lookup index')

  return councils.length && wards.length ? 'WARNING' : 'FAIL'
}

async function main() {
  const apiBase = trimApiBase(readArg('api-base', process.env.POLITISCOPE_API_BASE || DEFAULT_API_BASE))
  const prioritySources = await loadPriorityConfig()
  const officeholderPrioritySources = await loadOfficeholderPriorityConfig()
  const resultPrioritySources = await loadResultPriorityConfig()
  console.log(`Local Authority health check: ${apiBase}`)
  console.log('')

  const healthUrl = `${apiBase}/api/local-vote/health`
  const health = await fetchJson(healthUrl)

  let status = 'FAIL'
  let warnings = []

  if (health.ok && health.body?.ok) {
    status = health.body.status || 'OK'
    warnings = Array.isArray(health.body.warnings) ? health.body.warnings : []
    summariseHealth(health.body, prioritySources, officeholderPrioritySources, resultPrioritySources)
  } else {
    console.log(`Health endpoint unavailable (${health.status}). Falling back to lookup-index.`)
    console.log('')
    const fallback = await fetchJson(`${apiBase}/api/local-vote/lookup-index`)
    if (fallback.ok) {
      status = summariseLookupFallback(fallback.body, prioritySources)
      warnings = ['Read-only aggregate health endpoint is not available on this API deployment yet.']
    } else {
      console.error(`Lookup-index failed (${fallback.status}).`)
      if (fallback.body) console.error(typeof fallback.body === 'string' ? fallback.body : JSON.stringify(fallback.body, null, 2))
      process.exitCode = 1
      return
    }
  }

  console.log('')
  console.log(`Status: ${status}`)
  if (warnings.length) {
    console.log('Warnings:')
    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }

  if (status === 'FAIL') {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error)
  process.exitCode = 1
})
