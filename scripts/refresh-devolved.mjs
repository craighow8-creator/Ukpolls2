// Devolved intelligence refresh script.
//
// What it does:
//   Calls POST /api/elections/devolved-refresh on the worker.
//   The worker re-derives the devolved payload from the maintained source records
//   in src/data/electionsDevolved.js, merges it with any existing stored mayors
//   data, and saves the result to the electionsIntelligence content section in D1.
//
// When to use this instead of the unified refresh:
//   - You only changed Devolved source data and want to preserve stored Mayors data.
//   - A future live-source hook feeds only the Devolved section.
//   For all other cases, prefer: npm run elections:intelligence:refresh:local
//
// Usage:
//   npm run elections:devolved:refresh:local
//   npm run elections:devolved:refresh:remote
//
//   or directly:
//   node ./scripts/refresh-devolved.mjs --api-base=http://127.0.0.1:8787

import process from 'node:process'

function resolveApiBase() {
  const cliArg = process.argv.find((arg) => arg.startsWith('--api-base='))
  if (cliArg) return cliArg.slice('--api-base='.length)
  return process.env.POLITISCOPE_API_BASE || 'https://politiscope-api.craighow8.workers.dev'
}

const API_BASE = resolveApiBase()

async function refreshDevolved() {
  const res = await fetch(`${API_BASE}/api/elections/devolved-refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Refresh failed ${res.status}: ${text}`)

  try {
    return JSON.parse(text)
  } catch {
    return { ok: true, raw: text }
  }
}

async function main() {
  console.log(`Using API base: ${API_BASE}`)
  console.log('Refreshing devolved intelligence...')

  const result = await refreshDevolved()

  if (!result.ok) {
    console.error('Refresh returned not-ok:', result)
    process.exit(1)
  }

  console.log(`Refreshed at: ${result.refreshedAt}`)
  console.log(`Nations covered: ${result.nationsCount}`)
  if (Array.isArray(result.nations)) {
    for (const n of result.nations) {
      console.log(`  ${n.title} — next election: ${n.nextElection || 'TBC'}`)
    }
  }
  console.log(`Source type: ${result.sourceType}`)
  if (result.note) console.log(`Note: ${result.note}`)
  console.log('Done.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
