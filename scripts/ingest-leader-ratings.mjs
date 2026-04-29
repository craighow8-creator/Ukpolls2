#!/usr/bin/env node
import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

const CONFIG_PATH =
  process.env.LEADER_RATINGS_CONFIG ||
  process.argv.find((arg) => arg.startsWith('--config='))?.split('=')[1] ||
  'scripts/config/leader-ratings-sources.json'

const DRY_RUN = process.argv.includes('--dry-run')

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeRating(row, dataset) {
  const favourable = numberOrNull(row.favourable)
  const unfavourable = numberOrNull(row.unfavourable)
  const suppliedNet = numberOrNull(row.net)
  const net = suppliedNet ?? (favourable != null && unfavourable != null ? favourable - unfavourable : null)

  return {
    name: cleanText(row.name),
    party: cleanText(row.party),
    favourable,
    unfavourable,
    net,
    metricLabel: cleanText(row.metricLabel) || dataset.metricLabel,
    source: cleanText(row.source) || dataset.source,
    sourceUrl: cleanText(row.sourceUrl) || dataset.sourceUrl,
    fieldworkDate: cleanText(row.fieldworkDate) || dataset.fieldworkDate || '',
    publishedAt: cleanText(row.publishedAt) || dataset.publishedAt || '',
    updatedAt: cleanText(row.updatedAt) || dataset.updatedAt,
  }
}

function validatePayload(payload) {
  const errors = []

  if (!payload.source) errors.push('Dataset is missing source.')
  if (!payload.sourceUrl) errors.push('Dataset is missing sourceUrl.')
  if (!payload.metricLabel) errors.push('Dataset is missing metricLabel.')
  if (!Array.isArray(payload.ratings) || !payload.ratings.length) errors.push('Dataset has no ratings.')

  const sourceSet = new Set((payload.ratings || []).map((rating) => rating.source).filter(Boolean))
  if (sourceSet.size > 1) errors.push(`Dataset mixes sources: ${[...sourceSet].join(', ')}`)

  for (const rating of payload.ratings || []) {
    if (!rating.name) errors.push('A rating is missing name.')
    if (!rating.party) errors.push(`Rating for ${rating.name || 'unknown leader'} is missing party.`)
    if (rating.net == null) errors.push(`Rating for ${rating.name || 'unknown leader'} is missing net.`)
    if (!rating.sourceUrl) errors.push(`Rating for ${rating.name || 'unknown leader'} is missing sourceUrl.`)
  }

  return errors
}

async function postJson(apiBase, body) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((error) => fail('Failed to reach /api/save.', error?.message || String(error)))

  const text = await response.text().catch(() => '')
  if (!response.ok) fail(`Leader ratings import failed (${response.status}).`, text)
  return text
}

export async function ingestLeaderRatings() {
  const configPath = resolve(process.cwd(), CONFIG_PATH)
  const raw = JSON.parse(await readFile(configPath, 'utf8'))
  const updatedAt = cleanText(raw.updatedAt) || new Date().toISOString()
  const dataset = {
    datasetId: cleanText(raw.datasetId) || `leader-ratings-${Date.now()}`,
    source: cleanText(raw.source),
    sourceUrl: cleanText(raw.sourceUrl),
    metricLabel: cleanText(raw.metricLabel) || 'Net favourability',
    fieldworkDate: cleanText(raw.fieldworkDate),
    publishedAt: cleanText(raw.publishedAt),
    updatedAt,
  }

  const payload = {
    ...dataset,
    ratings: (Array.isArray(raw.ratings) ? raw.ratings : []).map((row) => normalizeRating(row, dataset)),
  }

  const errors = validatePayload(payload)
  if (errors.length) fail('Leader ratings config failed validation.', errors.map((error) => `- ${error}`).join('\n'))

  if (DRY_RUN) {
    console.log(JSON.stringify({ ok: true, dryRun: true, apiBase: API_BASE, configPath: CONFIG_PATH, ...payload }, null, 2))
    return
  }

  await postJson(API_BASE, { section: 'leaderRatings', payload })
  console.log(JSON.stringify({
    ok: true,
    imported: payload.ratings.length,
    source: payload.source,
    metricLabel: payload.metricLabel,
    publishedAt: payload.publishedAt,
    apiBase: API_BASE,
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestLeaderRatings().catch((error) => fail('Unexpected leader ratings import failure.', error?.stack || error?.message || String(error)))
}
