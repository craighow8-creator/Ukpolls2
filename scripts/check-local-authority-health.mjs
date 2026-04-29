#!/usr/bin/env node

const DEFAULT_API_BASE = 'https://politiscope-api.craighow8.workers.dev'

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

function countLookupPostcodeSupportedWards(wards = []) {
  return wards.filter((ward) => ward?.gssCode || ward?.mapitAreaId).length
}

function summariseHealth(payload) {
  const counts = payload?.counts || {}
  const latest = payload?.latestLocalIngestRun || null

  printLine('Councils', counts.councils ?? 'unknown')
  printLine('Wards', counts.wards ?? 'unknown')
  printLine('Detailed councils', counts.detailedCouncils ?? 'unknown')
  printLine('Candidate coverage', `${counts.candidateWards ?? 0} wards / ${counts.candidateCouncils ?? 0} Local Authorities`)
  printLine('Candidates', counts.candidates ?? 0)
  printLine('Officeholder coverage', `${counts.officeholderWards ?? 0} wards / ${counts.officeholderCouncils ?? 0} Local Authorities`)
  printLine('Officeholders', counts.officeholders ?? 0)
  printLine('Rows missing sourceUrl', counts.rowsMissingSourceUrl ?? 0)
  printLine('Postcode-supported wards', counts.postcodeSupportedWards ?? 'unknown')
  printLine(
    'Latest local ingest',
    latest
      ? `${latest.pipeline} / ${latest.status} / ${latest.finishedAt || latest.startedAt || 'time unknown'}`
      : 'not recorded',
  )
}

function summariseLookupFallback(payload) {
  const councils = Array.isArray(payload?.councils) ? payload.councils : []
  const wards = Array.isArray(payload?.wards) ? payload.wards : []

  printLine('Councils', councils.length)
  printLine('Wards', wards.length)
  printLine('Detailed councils', 'unavailable from lookup index')
  printLine('Candidate coverage', 'unavailable from lookup index')
  printLine('Rows missing sourceUrl', 'unavailable from lookup index')
  printLine('Postcode-supported wards', countLookupPostcodeSupportedWards(wards))
  printLine('Latest local ingest', 'unavailable from lookup index')

  return councils.length && wards.length ? 'WARNING' : 'FAIL'
}

async function main() {
  const apiBase = trimApiBase(readArg('api-base', process.env.POLITISCOPE_API_BASE || DEFAULT_API_BASE))
  console.log(`Local Authority health check: ${apiBase}`)
  console.log('')

  const healthUrl = `${apiBase}/api/local-vote/health`
  const health = await fetchJson(healthUrl)

  let status = 'FAIL'
  let warnings = []

  if (health.ok && health.body?.ok) {
    status = health.body.status || 'OK'
    warnings = Array.isArray(health.body.warnings) ? health.body.warnings : []
    summariseHealth(health.body)
  } else {
    console.log(`Health endpoint unavailable (${health.status}). Falling back to lookup-index.`)
    console.log('')
    const fallback = await fetchJson(`${apiBase}/api/local-vote/lookup-index`)
    if (fallback.ok) {
      status = summariseLookupFallback(fallback.body)
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
