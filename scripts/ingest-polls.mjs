import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { runPollIngest } from '../src/shared/pollIngestCore.js'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data', 'polls')
const CANONICAL_JSON_PATH = process.env.POLITISCOPE_POLLS_JSON || path.join(DATA_DIR, 'canonical.json')
const LEGACY_MERGED_JSON_PATH =
  process.env.POLITISCOPE_LEGACY_MERGED_JSON || path.join(DATA_DIR, 'merged.json')
const DEFAULT_INGEST_NOTIFIER_PATH = path.join(ROOT, 'scripts', 'notifiers', 'ingestNotifier.mjs')

let ingestNotifierPromise = null

async function loadIngestNotifier() {
  if (!ingestNotifierPromise) {
    ingestNotifierPromise = (async () => {
      const configuredPath = String(process.env.POLITISCOPE_INGEST_NOTIFIER || '').trim()
      const fullPath = configuredPath
        ? (path.isAbsolute(configuredPath) ? configuredPath : path.join(ROOT, configuredPath))
        : DEFAULT_INGEST_NOTIFIER_PATH

      try {
        await fs.access(fullPath)
      } catch {
        return null
      }

      const mod = await import(pathToFileURL(fullPath).href)
      return mod.default || mod.notifyIngestEvent || null
    })()
  }

  return ingestNotifierPromise
}

async function emitIngestNotification(payload) {
  const notifier = await loadIngestNotifier()
  if (!notifier) return false
  await notifier(payload)
  return true
}

async function overwritePolls({ env, polls }) {
  const res = await fetch(`${env.POLITISCOPE_API_BASE}/api/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      section: 'pollsData',
      payload: polls,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Overwrite failed ${res.status}: ${text}`)
  }
  return { ok: true, raw: text }
}

async function saveIngestStatus({ env, statusPayload }) {
  const res = await fetch(`${env.POLITISCOPE_API_BASE}/api/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      section: 'ingestStatus',
      payload: statusPayload,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Ingest status save failed ${res.status}: ${text}`)
  }
  return { ok: true, raw: text }
}

async function persistCanonicalOutputs({ polls, counts, dropped, now }) {
  await fs.mkdir(DATA_DIR, { recursive: true })

  const payload = JSON.stringify(polls, null, 2)
  await fs.writeFile(CANONICAL_JSON_PATH, payload, 'utf-8')
  await fs.writeFile(LEGACY_MERGED_JSON_PATH, payload, 'utf-8')

  const meta = {
    generatedAt: now.toISOString(),
    totalPolls: polls.length,
    counts,
    droppedCount: dropped.length,
    canonicalJsonPath: CANONICAL_JSON_PATH,
    legacyMergedJsonPath: LEGACY_MERGED_JSON_PATH,
    primaryDiscoverySource: 'Wikipedia',
  }

  await fs.writeFile(path.join(DATA_DIR, 'canonical.meta.json'), JSON.stringify(meta, null, 2), 'utf-8')
}

async function main() {
  const { polls, counts, dropped, overwriteResult, statusPayload } = await runPollIngest({
    env: {
      POLITISCOPE_API_BASE: process.env.POLITISCOPE_API_BASE,
    },
    logger: console,
    persistCanonicalOutputs,
    overwritePolls,
    saveIngestStatus,
  })

  await emitIngestNotification({
    status: 'success',
    timestamp: new Date().toISOString(),
    apiBase: process.env.POLITISCOPE_API_BASE || 'https://politiscope-api.craighow8.workers.dev',
    totalFetched: polls.length,
    droppedInvalidRows: dropped.length,
    overwriteResult,
    error: null,
  }).catch((notifyError) => {
    console.warn('[ingest-polls] WARNING: notifier hook failed', notifyError)
  })

  console.log(JSON.stringify(statusPayload, null, 2))
}

main().catch((err) => {
  console.error('[ingest-polls] ERROR:', err instanceof Error ? err.message : err)
  process.exit(1)
})
