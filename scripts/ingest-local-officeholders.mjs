import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

const CONFIG_PATH =
  process.env.LOCAL_OFFICEHOLDER_SOURCES_CONFIG ||
  process.argv.find((arg) => arg.startsWith('--config='))?.split('=')[1] ||
  'scripts/config/local-officeholder-sources.json'

const COUNCIL_FILTER =
  process.argv.find((arg) => arg.startsWith('--council='))?.split('=')[1] ||
  ''

const CHUNK_SIZE = Number(
  process.env.LOCAL_OFFICEHOLDER_CHUNK_SIZE ||
    process.argv.find((arg) => arg.startsWith('--chunk-size='))?.split('=')[1] ||
    '25',
)

const DRY_RUN = process.argv.includes('--dry-run')

function fail(message, extra = '') {
  console.error(message)
  if (extra) console.error(extra)
  process.exit(1)
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function simplifyCouncilKey(value = '') {
  return slugify(
    String(value || '')
      .replace(/^city of /i, '')
      .replace(/\b(city council|county council|district council|borough council|metropolitan borough council|london borough|council)\b/gi, '')
      .replace(/\s+/g, ' '),
  )
}

function wardKey(value = '') {
  return slugify(
    String(value || '')
      .replace(/[’']/g, '')
      .replace(/\bward\b/gi, ''),
  )
}

function decodeHtml(value = '') {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function absoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return ''
  }
}

function chunkArray(values, size) {
  const chunks = []
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size))
  }
  return chunks
}

function resolveRepoPath(pathValue) {
  return resolve(REPO_ROOT, String(pathValue || '').trim())
}

async function readJsonFile(pathValue) {
  const text = await readFile(resolveRepoPath(pathValue), 'utf8')
  return JSON.parse(text)
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'Politiscope local officeholder ingest (+https://politiscope.co.uk)',
    },
  }).catch((error) => {
    fail(`Failed to fetch ${url}`, error?.message || String(error))
  })

  const text = await response.text().catch(() => '')
  if (!response.ok) {
    fail(`Fetch failed for ${url} (${response.status}).`, text.slice(0, 500))
  }
  return text
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
  }).catch((error) => {
    fail(`Failed to fetch ${url}`, error?.message || String(error))
  })

  const text = await response.text().catch(() => '')
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    fail(`Fetch failed for ${url} (${response.status}).`, payload ? JSON.stringify(payload, null, 2) : text)
  }
  return payload
}

async function fetchLookupIndex(apiBase) {
  const payload = await fetchJson(`${apiBase.replace(/\/$/, '')}/api/local-vote/lookup-index`)
  if (!payload || !Array.isArray(payload.councils) || !Array.isArray(payload.wards)) {
    fail('Local vote lookup index payload was invalid.')
  }
  return payload
}

function buildLookupMaps(payload) {
  const councilsBySlug = new Map()
  const councilsBySimpleName = new Map()
  const wardsByCouncil = new Map()

  for (const council of payload.councils || []) {
    if (council.slug) councilsBySlug.set(String(council.slug).trim(), council)
    const keys = [council.name, council.supportedAreaLabel, council.slug].map(simplifyCouncilKey).filter(Boolean)
    for (const key of keys) {
      if (!councilsBySimpleName.has(key)) councilsBySimpleName.set(key, council)
    }
  }

  for (const ward of payload.wards || []) {
    if (!ward.councilId) continue
    const map = wardsByCouncil.get(ward.councilId) || new Map()
    const keys = [ward.name, ward.slug, ...(Array.isArray(ward.aliases) ? ward.aliases : [])].map(wardKey).filter(Boolean)
    for (const key of keys) {
      if (!map.has(key)) map.set(key, ward)
    }
    wardsByCouncil.set(ward.councilId, map)
  }

  return {
    councilsBySlug,
    councilsBySimpleName,
    wardsByCouncil,
  }
}

function findCouncil(config, maps) {
  const slug = String(config.councilSlug || '').trim()
  if (slug && maps.councilsBySlug.has(slug)) return maps.councilsBySlug.get(slug)

  for (const key of [config.councilName, config.councilSlug].map(simplifyCouncilKey).filter(Boolean)) {
    const council = maps.councilsBySimpleName.get(key)
    if (council) return council
  }

  return null
}

function findWard(council, wardName, maps) {
  const map = maps.wardsByCouncil.get(council?.id)
  if (!map) return null
  return map.get(wardKey(wardName)) || null
}

function extractWardLinks(html, sourceUrl) {
  const links = []
  const pattern = /<a[^>]+href=["']([^"']*\/councillors\/specificWard\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match = pattern.exec(html)
  while (match) {
    const url = absoluteUrl(match[1], sourceUrl)
    const ward = decodeHtml(match[2])
    if (url && ward) links.push({ ward, url })
    match = pattern.exec(html)
  }
  return links
}

function parseCouncillorsFromWardPage(html, wardFallback, wardPageUrl, config) {
  const rows = []
  const linkPattern = /<a[^>]+class=["'][^"']*\blisting__link\b[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match = linkPattern.exec(html)

  while (match) {
    const profileUrl = absoluteUrl(match[1], wardPageUrl)
    const block = match[2]
    const nameMatch = block.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i)
    const name = decodeHtml(nameMatch?.[1] || '')
    const wardMatch = block.match(/<strong>\s*Ward:\s*<\/strong>\s*([^<]+)/i)
    const partyMatch = block.match(/<strong>\s*Party:\s*<\/strong>\s*([^<]+)/i)
    const ward = decodeHtml(wardMatch?.[1] || wardFallback)
    const party = decodeHtml(partyMatch?.[1] || '')

    if (name && ward && party) {
      rows.push({
        ward,
        name,
        party,
        profileUrl,
        sourceUrl: profileUrl || wardPageUrl,
        sourceLabel: config.sourceLabel || 'Official councillors by ward',
        lastChecked: config.lastChecked || '',
        verificationStatus: config.verificationStatus || 'verified',
      })
    }

    match = linkPattern.exec(html)
  }

  return rows
}

async function loadBirminghamOfficeholders(config) {
  const sourceUrl = String(config.sourceUrl || '').trim()
  if (!sourceUrl) {
    return { rows: [], warning: 'Birmingham officeholder source URL is missing.' }
  }

  const indexHtml = await fetchText(sourceUrl)
  const wardLinks = extractWardLinks(indexHtml, sourceUrl)
  const rows = []
  const warnings = []

  if (!wardLinks.length) {
    return { rows: [], warning: 'No Birmingham councillor ward links were found.' }
  }

  for (const link of wardLinks) {
    const wardHtml = await fetchText(link.url)
    const wardRows = parseCouncillorsFromWardPage(wardHtml, link.ward, link.url, config)
    if (!wardRows.length) warnings.push(`No councillors parsed for ${link.ward}.`)
    rows.push(...wardRows)
  }

  return { rows, wardLinks, warnings }
}

async function loadOfficeholdersForSource(config) {
  const parserType = String(config.parserType || '').trim()

  if (parserType === 'birmingham-councillors-by-ward') {
    return loadBirminghamOfficeholders(config)
  }

  return { rows: [], warning: `Unsupported parser type "${parserType}" for ${config.councilSlug || config.councilName}.` }
}

function normalizeImportRow({ council, ward, officeholder, sourceConfig }) {
  return {
    councilId: council.id,
    councilSlug: council.slug,
    councilName: council.name,
    wardId: ward.id,
    wardSlug: ward.slug,
    wardName: ward.name,
    officeholderName: officeholder.name,
    partyName: officeholder.party,
    role: 'Councillor',
    seatStatus: 'occupied',
    isCurrent: true,
    profileUrl: officeholder.profileUrl || '',
    sourceUrl: officeholder.sourceUrl || sourceConfig.sourceUrl || '',
    sourceLabel: officeholder.sourceLabel || sourceConfig.sourceLabel || 'Official councillors by ward',
    lastChecked: officeholder.lastChecked || sourceConfig.lastChecked || '',
    verificationStatus: officeholder.verificationStatus || sourceConfig.verificationStatus || 'verified',
    sourceAttribution: 'official-councillor-source',
    sourceType: 'official-officeholder-source',
  }
}

async function postJson(apiBase, body) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/local-vote/ingest/officeholders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch((error) => {
    fail('Failed to reach local officeholder ingest endpoint.', error?.message || String(error))
  })

  const text = await response.text().catch(() => '')
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    fail(
      `Local officeholder ingest failed (${response.status}).`,
      payload ? JSON.stringify(payload, null, 2) : text,
    )
  }

  return payload
}

export async function ingestLocalOfficeholders() {
  const apiBase = API_BASE
  const config = await readJsonFile(CONFIG_PATH)
  const sourceConfigs = (Array.isArray(config.sources) ? config.sources : [])
    .filter((source) => !COUNCIL_FILTER || slugify(source.councilSlug || source.councilName) === slugify(COUNCIL_FILTER))

  if (!sourceConfigs.length) {
    fail('No officeholder source config entries matched.')
  }

  const enabledSources = sourceConfigs.filter((source) => source.enabled)
  if (!enabledSources.length) {
    fail('No enabled officeholder source config entries matched.')
  }

  const lookup = await fetchLookupIndex(apiBase)
  const maps = buildLookupMaps(lookup)
  const rowsForImport = []
  const warnings = []
  const skipped = []
  const matchedWardSlugs = new Set()

  for (const sourceConfig of enabledSources) {
    const council = findCouncil(sourceConfig, maps)
    if (!council) {
      warnings.push(`Council not found in lookup index: ${sourceConfig.councilSlug || sourceConfig.councilName}`)
      continue
    }

    const loaded = await loadOfficeholdersForSource(sourceConfig)
    if (loaded.warning) warnings.push(loaded.warning)
    for (const warning of loaded.warnings || []) warnings.push(warning)

    for (const officeholder of loaded.rows || []) {
      if (!officeholder.name || !officeholder.party || !officeholder.ward) {
        skipped.push({ reason: 'missing-officeholder-fields', council: council.slug, officeholder })
        continue
      }
      if (!officeholder.sourceUrl && !sourceConfig.sourceUrl) {
        skipped.push({ reason: 'missing-source-url', council: council.slug, name: officeholder.name, ward: officeholder.ward })
        continue
      }

      const ward = findWard(council, officeholder.ward, maps)
      if (!ward) {
        skipped.push({ reason: 'ward-not-found', council: council.slug, name: officeholder.name, ward: officeholder.ward })
        continue
      }

      matchedWardSlugs.add(ward.slug)
      rowsForImport.push(normalizeImportRow({ council, ward, officeholder, sourceConfig }))
    }
  }

  const summaryBase = {
    apiBase,
    configPath: CONFIG_PATH,
    enabledSources: enabledSources.map((source) => source.councilSlug || source.councilName),
    rowsReady: rowsForImport.length,
    matchedWards: matchedWardSlugs.size,
    skipped: skipped.slice(0, 50),
    warnings,
  }

  if (!rowsForImport.length) {
    fail('No officeholder rows were ready to import.', JSON.stringify(summaryBase, null, 2))
  }

  if (DRY_RUN || process.argv.includes('--check-only')) {
    console.log(JSON.stringify({ ok: true, dryRun: true, ...summaryBase }, null, 2))
    return
  }

  const runId = `local_vote_ingest_officeholders_${Date.now()}`
  const sourceLabel = 'Official Local Authority current councillor sources'
  const started = await postJson(apiBase, {
    action: 'start',
    runId,
    sourceLabel,
    totalRows: rowsForImport.length,
    affectedCouncilIds: [...new Set(rowsForImport.map((row) => row.councilId).filter(Boolean))],
    priorityCouncils: sourceConfigs.filter((source) => source.priority).map((source) => source.councilSlug || source.councilName),
  })

  const chunkSize = Number.isFinite(CHUNK_SIZE) && CHUNK_SIZE > 0 ? CHUNK_SIZE : 25
  const chunks = chunkArray(rowsForImport, chunkSize)
  let matchedRows = 0
  let insertedOfficeholders = 0
  let rowsUpserted = 0
  let skippedSamples = [...skipped]

  for (let index = 0; index < chunks.length; index += 1) {
    console.log(`[LocalOfficeholders] Importing chunk ${index + 1}/${chunks.length} (${chunks[index].length} rows)`)
    const payload = await postJson(apiBase, {
      action: 'chunk',
      runId: started.runId,
      sourceLabel,
      rows: chunks[index],
      chunkIndex: index + 1,
      totalChunks: chunks.length,
    })

    matchedRows += Number(payload.matchedRows || 0)
    insertedOfficeholders += Number(payload.insertedOfficeholders || 0)
    rowsUpserted += Number(payload.rowsUpserted || 0)
    skippedSamples = [...skippedSamples, ...(payload.skippedSamples || [])]
  }

  const finished = await postJson(apiBase, {
    action: 'finish',
    runId: started.runId,
    sourceLabel,
    skippedSamples: skippedSamples.slice(0, 50),
  })

  console.log(JSON.stringify({
    ok: finished.ok,
    runId: started.runId,
    ...summaryBase,
    matchedRows,
    insertedOfficeholders,
    rowsUpserted,
    validation: finished.validation || {},
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestLocalOfficeholders().catch((error) => {
    fail('Unexpected local officeholder import failure.', error?.stack || error?.message || String(error))
  })
}
