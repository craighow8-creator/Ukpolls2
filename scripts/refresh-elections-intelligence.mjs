// Unified Elections intelligence refresh script.
//
// What it does:
//   Calls POST /api/elections/intelligence-refresh on the worker.
//   The worker rebuilds all Elections intelligence sections (Mayors + Devolved)
//   in one pass from the maintained source data and saves the complete payload
//   to the electionsIntelligence content section in D1.
//
// This is the default refresh command. Run it after any source edit that affects
// elections intelligence, regardless of which section changed.
//
// For section-specific refreshes (when you need to preserve stored data in one
// section while updating the other):
//   npm run elections:mayors:refresh:local
//   npm run elections:devolved:refresh:local
//
// Usage:
//   npm run elections:intelligence:refresh:local
//   npm run elections:intelligence:refresh:remote
//
//   or directly:
//   node ./scripts/refresh-elections-intelligence.mjs --api-base=http://127.0.0.1:8787

import process from 'node:process'

function resolveApiBase() {
  const cliArg = process.argv.find((arg) => arg.startsWith('--api-base='))
  if (cliArg) return cliArg.slice('--api-base='.length)
  return process.env.POLITISCOPE_API_BASE || 'https://politiscope-api.craighow8.workers.dev'
}

const API_BASE = resolveApiBase()

async function refreshElectionsIntelligence() {
  const res = await fetch(`${API_BASE}/api/elections/intelligence-refresh`, {
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
  console.log('Refreshing all Elections intelligence...')

  const result = await refreshElectionsIntelligence()

  if (!result.ok) {
    console.error('Refresh returned not-ok:', result)
    process.exit(1)
  }

  console.log(`Refreshed at: ${result.refreshedAt}`)

  const m = result.mayors || {}
  console.log(`Mayors:`)
  console.log(`  Regional: ${m.totalRegional}`)
  console.log(`    Labour: ${m.labourRegional}`)
  console.log(`    Conservative: ${m.conservativeRegional}`)
  console.log(`    Reform: ${m.reformRegional}`)
  console.log(`    New mayoralties: ${m.newRegional}`)
  console.log(`  Council: ${m.totalCouncil}`)
  if (m.enrichedCount > 0) {
    console.log(`  Enriched records: ${m.enrichedCount} (source type: ${m.sourceType})`)
  } else {
    console.log(`  Enriched records: none (source type: ${m.sourceType})`)
  }
  if (m.externalSourceUsed) {
    console.log(`  External overrides: ${m.externalOverrideCount || 0}`)
  }

  const d = result.devolved || {}
  console.log(`Devolved: ${d.nationsCount} nation(s)`)
  if (Array.isArray(d.nations)) {
    for (const n of d.nations) {
      console.log(`  ${n.title} — next election: ${n.nextElection || 'TBC'}`)
    }
  }

  if (result.note) console.log(`Note: ${result.note}`)
  console.log('Done.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
