import process from 'node:process'
import RAW_BY_ELECTIONS from './data/by-elections.raw.mjs'
import { shapeByElectionsPayload } from './utils/shape-byelections.mjs'

function resolveApiBase() {
  const cliArg = process.argv.find((arg) => arg.startsWith('--api-base='))
  if (cliArg) return cliArg.slice('--api-base='.length)
  return process.env.POLITISCOPE_API_BASE || 'https://politiscope-api.craighow8.workers.dev'
}

const API_BASE = resolveApiBase()

async function importByElections(payload) {
  const res = await fetch(`${API_BASE}/api/elections/import-byelections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Import failed ${res.status}: ${text}`)
  try {
    return JSON.parse(text)
  } catch {
    return { ok: true, raw: text }
  }
}

function biggestSwingContest(recent = []) {
  return recent.reduce((best, contest) => {
    if ((contest.swing || 0) > (best?.swing || 0)) return contest
    return best
  }, null)
}

async function main() {
  console.log(`Using API base: ${API_BASE}`)
  const payload = shapeByElectionsPayload(RAW_BY_ELECTIONS)
  const biggestSwing = biggestSwingContest(payload.recent)
  const meta = payload?.meta && typeof payload.meta === 'object' ? payload.meta : null

  console.log(`Prepared upcoming contests: ${payload.upcoming.length}`)
  console.log(`Prepared recent contests: ${payload.recent.length}`)
  if (biggestSwing) {
    console.log(`Biggest swing: ${biggestSwing.name} (${biggestSwing.swing.toFixed(1)} pts)`)
  }
  if (meta?.updatedAt) {
    console.log(`Shaped at: ${meta.updatedAt}`)
  }

  console.log('Importing shaped by-elections payload...')
  const result = await importByElections(payload)
  console.log('Import result:')
  console.log(JSON.stringify(result, null, 2))
}

// PowerShell-safe fallback:
//   node ./scripts/ingest-byelections.mjs --api-base=http://127.0.0.1:8787
//   node ./scripts/ingest-byelections.mjs --api-base=https://politiscope-api.craighow8.workers.dev
main().catch((err) => {
  console.error('By-elections ingest failed:')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
