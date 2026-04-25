import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { getLocalVoteGuideCouncil } from '../src/data/localVoteGuide.js'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function validateSheffieldCouncil(council) {
  const errors = []

  if (!council) {
    errors.push('Missing Sheffield council payload.')
    return errors
  }

  if (!Array.isArray(council.wards) || council.wards.length !== 28) {
    errors.push(`Expected 28 Sheffield wards, found ${Array.isArray(council.wards) ? council.wards.length : 0}.`)
  }

  for (const ward of council.wards || []) {
    if (!Array.isArray(ward.councillors) || ward.councillors.length < 1) {
      errors.push(`Ward "${ward.name}" is missing councillors.`)
    }

    if (!Array.isArray(ward.candidates) || ward.candidates.length < 1) {
      errors.push(`Ward "${ward.name}" is missing candidates.`)
    }

    for (const councillor of ward.councillors || []) {
      for (const field of ['name', 'party', 'sourceLabel', 'sourceUrl', 'lastChecked', 'verificationStatus']) {
        if (!councillor?.[field]) {
          errors.push(`Councillor "${councillor?.name || '(unknown)'}" in "${ward.name}" is missing ${field}.`)
        }
      }
    }

    for (const candidate of ward.candidates || []) {
      for (const field of ['name', 'party', 'sourceLabel', 'sourceUrl', 'lastChecked', 'verificationStatus']) {
        if (!candidate?.[field]) {
          errors.push(`Candidate "${candidate?.name || '(unknown)'}" in "${ward.name}" is missing ${field}.`)
        }
      }
    }

    const wardSources = Array.isArray(ward.sources) ? ward.sources : []
    if (!wardSources.length) {
      errors.push(`Ward "${ward.name}" is missing source records.`)
    }
  }

  const councilSources = Array.isArray(council.sources) ? council.sources : []
  if (!councilSources.length) {
    errors.push('Sheffield council payload is missing council-level sources.')
  }

  return errors
}

export async function seedSheffieldLocalVoteGuide() {
  const council = getLocalVoteGuideCouncil('sheffield-city-council')
  const errors = validateSheffieldCouncil(council)

  if (errors.length) {
    fail('Sheffield local vote validation failed before import.', errors.join('\n'))
  }

  const response = await fetch(`${API_BASE.replace(/\/$/, '')}/api/local-vote/ingest/sheffield`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ council }),
  }).catch((error) => {
    fail('Failed to reach local vote ingest endpoint.', error?.message || String(error))
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    fail(
      `Sheffield local vote import failed (${response.status}).`,
      payload ? JSON.stringify(payload, null, 2) : '',
    )
  }

  console.log(JSON.stringify(payload, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedSheffieldLocalVoteGuide().catch((error) => {
    fail('Unexpected Sheffield local vote seed failure.', error?.stack || error?.message || String(error))
  })
}
