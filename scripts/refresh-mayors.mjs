// Mayors intelligence refresh script.
//
// What it does:
//   Calls POST /api/elections/mayors-refresh on the worker.
//   The worker re-derives the mayors payload from the maintained source arrays
//   in src/data/electionsMayors.js, merges it with any existing stored devolved
//   data, and saves the result to the electionsIntelligence content section in D1.
//
// When to use this instead of the unified refresh:
//   - You only changed Mayors source data and want to preserve stored Devolved data.
//   - A future live-source hook feeds only the Mayors section.
//   For all other cases, prefer: npm run elections:intelligence:refresh:local
//
// Usage:
//   npm run elections:mayors:refresh:local
//   npm run elections:mayors:refresh:remote
//
//   or directly:
//   node ./scripts/refresh-mayors.mjs --api-base=http://127.0.0.1:8787

import process from 'node:process'

function resolveApiBase() {
  const cliArg = process.argv.find((arg) => arg.startsWith('--api-base='))
  if (cliArg) return cliArg.slice('--api-base='.length)
  return process.env.POLITISCOPE_API_BASE || 'https://politiscope-api.craighow8.workers.dev'
}

const API_BASE = resolveApiBase()

async function refreshMayors() {
  const res = await fetch(`${API_BASE}/api/elections/mayors-refresh`, {
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
  console.log('Refreshing mayors intelligence...')

  const result = await refreshMayors()

  if (!result.ok) {
    console.error('Refresh returned not-ok:', result)
    process.exit(1)
  }

  console.log(`Refreshed at: ${result.refreshedAt}`)
  console.log(`Regional mayors: ${result.totalRegional}`)
  console.log(`  Labour: ${result.labourRegional}`)
  console.log(`  Conservative: ${result.conservativeRegional}`)
  console.log(`  Reform: ${result.reformRegional}`)
  console.log(`  New mayoralties: ${result.newRegional}`)
  console.log(`Council mayors: ${result.totalCouncil}`)
  console.log(`Source type: ${result.sourceType}`)
  if (result.note) console.log(`Note: ${result.note}`)
  console.log('Done.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
