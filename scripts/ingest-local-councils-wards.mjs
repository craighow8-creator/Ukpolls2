import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  process.argv.find((arg) => arg.startsWith('--api-base='))?.split('=')[1] ||
  'http://127.0.0.1:8787'

const WARDS_URL =
  process.env.LOCAL_VOTE_WARDS_URL ||
  process.argv.find((arg) => arg.startsWith('--wards-url='))?.split('=')[1] ||
  ''

const WARDS_FILE =
  process.env.LOCAL_VOTE_WARDS_FILE ||
  process.argv.find((arg) => arg.startsWith('--wards-file='))?.split('=')[1] ||
  ''

const WARDS_SOURCE_URL =
  process.env.LOCAL_VOTE_WARDS_SOURCE_URL ||
  process.argv.find((arg) => arg.startsWith('--wards-source-url='))?.split('=')[1] ||
  'https://www.ons.gov.uk/methodology/geography/geographicalproducts/namescodesandlookups/namesandcodeslistings/namesandcodesforelectoralgeography'

const CHUNK_SIZE = Number(
  process.env.LOCAL_VOTE_WARDS_CHUNK_SIZE ||
    process.argv.find((arg) => arg.startsWith('--chunk-size='))?.split('=')[1] ||
    '300',
)

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

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        value += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(value)
      value = ''
      continue
    }

    if (char === '\n') {
      row.push(value)
      rows.push(row)
      row = []
      value = ''
      continue
    }

    if (char === '\r') continue
    value += char
  }

  if (value.length || row.length) {
    row.push(value)
    rows.push(row)
  }

  if (!rows.length) return []

  const headers = rows[0].map((header) => String(header || '').trim())
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, String(values[index] || '').trim()])),
  )
}

function chunkArray(values, size) {
  const chunks = []
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size))
  }
  return chunks
}

function normalizeCouncilKey(value) {
  return slugify(
    String(value || '')
      .replace(/\b(council|city council|borough council|district council|county council|metropolitan borough council)\b/gi, '')
      .replace(/\s+/g, ' '),
  )
}

function buildCouncilKeys(value) {
  const raw = String(value || '').trim()
  const keys = new Set()
  if (!raw) return keys

  keys.add(slugify(raw))
  keys.add(normalizeCouncilKey(raw))
  return new Set([...keys].filter(Boolean))
}

function normalizeWardName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function pickValue(row, patterns = []) {
  const entries = Object.entries(row || {})
  for (const pattern of patterns) {
    const matched = entries.find(([key, value]) => pattern.test(key) && String(value || '').trim())
    if (matched) return String(matched[1] || '').trim()
  }
  return ''
}

function tierFromRegistryType(value) {
  const key = String(value || '').trim().toLowerCase()
  if (!key) return ''
  if (key.includes('metropolitan')) return 'Metropolitan Borough'
  if (key.includes('unitary')) return 'Unitary Authority'
  if (key.includes('london')) return 'London Borough'
  if (key.includes('district')) return 'District Council'
  if (key.includes('county')) return 'County Council'
  if (key.includes('borough')) return 'Borough Council'
  return String(value || '').trim()
}

function buildCouncilRegistryMap(registry = []) {
  const map = new Map()

  for (const council of registry) {
    for (const key of [
      ...buildCouncilKeys(council.slug),
      ...buildCouncilKeys(council.name),
      ...buildCouncilKeys(council.officialWebsite),
    ]) {
      map.set(key, council)
    }
  }

  return map
}

async function loadCouncilRegistry(apiBase) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/data`).catch((error) => {
    fail('Failed to fetch Politiscope council registry.', error?.message || String(error))
  })

  if (!response.ok) {
    fail(`Council registry fetch failed (${response.status}).`)
  }

  const payload = await response.json().catch(() => null)
  const registry = Array.isArray(payload?.councilRegistry) ? payload.councilRegistry : []

  if (!registry.length) {
    fail('Council registry payload was empty.')
  }

  return registry
}

async function loadWardCsvText() {
  if (WARDS_FILE) {
    return readFile(WARDS_FILE, 'utf8')
  }

  if (!WARDS_URL) {
    fail('Provide --wards-url or --wards-file for the ONS wards baseline source.')
  }

  const response = await fetch(WARDS_URL).catch((error) => {
    fail('Failed to fetch wards CSV.', error?.message || String(error))
  })

  if (!response.ok) {
    fail(`Wards CSV fetch failed (${response.status}).`, WARDS_URL)
  }

  return response.text()
}

function mapWardRow(row = {}) {
  return {
    wardCode: pickValue(row, [/^WD\d{2}CD$/i, /^WDCD$/i, /^CED\d{2}CD$/i, /^CEDCD$/i, /ward.*code/i]),
    wardName: normalizeWardName(
      pickValue(row, [/^WD\d{2}NM$/i, /^WDNM$/i, /^CED\d{2}NM$/i, /^CEDNM$/i, /ward.*name/i]),
    ),
    councilCode: pickValue(
      row,
      [/^LAD\d{2}CD$/i, /^LADCD$/i, /^CTYUA\d{2}CD$/i, /^UTLA\d{2}CD$/i, /^CTY\d{2}CD$/i, /council.*code/i, /local authority.*code/i],
    ),
    councilName: normalizeWardName(
      pickValue(
        row,
        [/^LAD\d{2}NM$/i, /^LADNM$/i, /^CTYUA\d{2}NM$/i, /^UTLA\d{2}NM$/i, /^CTY\d{2}NM$/i, /council.*name/i, /local authority.*name/i],
      ),
    ),
    countryName: normalizeWardName(
      pickValue(row, [/^CTRY\d{2}NM$/i, /^CTRYNM$/i, /country.*name/i]),
    ),
    mapitAreaId: pickValue(row, [/mapit/i, /^POST_ID$/i, /area_id/i]),
  }
}

function createRegistryCouncilRecord(item, fetchedAt) {
  const slug = String(item.slug || slugify(item.name)).trim()
  const name = String(item.name || '').trim()
  if (!slug || !name) return null

  return {
    slug,
    name,
    supportedAreaLabel: name,
    nation: 'England',
    tier: tierFromRegistryType(item.type),
    gssCode: '',
    officialWebsite: item.officialWebsite || '',
    governanceModel: item.governanceModel || '',
    electionModel: '',
    nextElectionDate: null,
    sourceNote: '',
    controls: [],
    updatedAt: fetchedAt,
    fetchedAt,
    sources: [
      {
        label: 'Politiscope council registry',
        url: `${API_BASE.replace(/\/$/, '')}/api/data`,
        sourceType: 'politiscope-council-registry',
        updatedAt: fetchedAt,
        verificationStatus: 'verified',
      },
    ],
  }
}

function ensureSource(list, source) {
  const sourceList = Array.isArray(list) ? list : []
  if (!source?.label || !source?.url) return sourceList
  if (sourceList.some((entry) => entry.label === source.label && entry.url === source.url)) return sourceList
  return [...sourceList, source]
}

function buildBaseline({ registry, wardRows, wardsSourceUrl, fetchedAt }) {
  const registryMap = buildCouncilRegistryMap(registry)
  const councilsBySlug = new Map()
  const wardsByKey = new Map()
  const unmatchedCouncils = []
  const unmatchedWards = []

  for (const item of registry) {
    const council = createRegistryCouncilRecord(item, fetchedAt)
    if (!council) continue
    councilsBySlug.set(council.slug, council)
  }

  for (const rawRow of wardRows) {
    const row = mapWardRow(rawRow)
    if (!row.wardCode || !row.wardName || !row.councilName) {
      unmatchedWards.push({
        reason: 'missing-core-fields',
        wardCode: row.wardCode,
        wardName: row.wardName,
        councilName: row.councilName,
      })
      continue
    }

    const matchedCouncil =
      [...buildCouncilKeys(row.councilName)].map((key) => registryMap.get(key)).find(Boolean) || null

    const councilSlug = String(matchedCouncil?.slug || slugify(row.councilName)).trim()
    if (!councilSlug) {
      unmatchedCouncils.push({
        councilName: row.councilName,
        councilCode: row.councilCode,
        wardName: row.wardName,
        wardCode: row.wardCode,
        reason: 'empty-council-slug',
      })
      continue
    }

    if (!councilsBySlug.has(councilSlug)) {
      councilsBySlug.set(councilSlug, {
        slug: councilSlug,
        name: row.councilName,
        supportedAreaLabel: row.councilName,
        nation: row.countryName || 'England',
        tier: matchedCouncil ? tierFromRegistryType(matchedCouncil.type) : '',
        gssCode: row.councilCode || '',
        officialWebsite: matchedCouncil?.officialWebsite || '',
        governanceModel: matchedCouncil?.governanceModel || '',
        electionModel: '',
        nextElectionDate: null,
        sourceNote: '',
        controls: [],
        updatedAt: fetchedAt,
        fetchedAt,
        sources: [],
      })
    }

    const council = councilsBySlug.get(councilSlug)
    if (!council) continue

    council.name = council.name || row.councilName
    council.supportedAreaLabel = council.supportedAreaLabel || row.councilName
    council.nation = council.nation || row.countryName || 'England'
    if (row.councilCode && !council.gssCode) {
      council.gssCode = row.councilCode
    }
    if (matchedCouncil?.officialWebsite && !council.officialWebsite) {
      council.officialWebsite = matchedCouncil.officialWebsite
    }
    if (matchedCouncil?.governanceModel && !council.governanceModel) {
      council.governanceModel = matchedCouncil.governanceModel
    }
    if (matchedCouncil?.type && !council.tier) {
      council.tier = tierFromRegistryType(matchedCouncil.type)
    }
    council.sources = ensureSource(council.sources, {
      label: 'ONS ward-to-local-authority lookup',
      url: wardsSourceUrl,
      sourceType: 'ons-electoral-geography',
      updatedAt: fetchedAt,
      verificationStatus: 'verified',
    })
    if (matchedCouncil) {
      council.sources = ensureSource(council.sources, {
        label: 'Politiscope council registry',
        url: `${API_BASE.replace(/\/$/, '')}/api/data`,
        sourceType: 'politiscope-council-registry',
        updatedAt: fetchedAt,
        verificationStatus: 'verified',
      })
    }

    const wardSlug = slugify(row.wardName)
    const wardKey = `${councilSlug}:${wardSlug}`

    if (!wardSlug) {
      unmatchedWards.push({
        reason: 'empty-ward-slug',
        councilSlug,
        wardName: row.wardName,
        wardCode: row.wardCode,
      })
      continue
    }

    if (!wardsByKey.has(wardKey)) {
      wardsByKey.set(wardKey, {
        councilSlug,
        slug: wardSlug,
        name: row.wardName,
        gssCode: row.wardCode,
        mapitAreaId: row.mapitAreaId || '',
        aliases: [],
        notes: '',
        candidateListStatus: '',
        updatedAt: fetchedAt,
        fetchedAt,
        sources: [
          {
            label: 'ONS electoral geography source',
            url: wardsSourceUrl,
            sourceType: 'ons-electoral-geography',
            updatedAt: fetchedAt,
            verificationStatus: 'verified',
          },
        ],
      })
    } else {
      const existing = wardsByKey.get(wardKey)
      if (row.wardCode && existing.gssCode && existing.gssCode !== row.wardCode) {
        unmatchedWards.push({
          reason: 'conflicting-gss',
          councilSlug,
          wardName: row.wardName,
          existingGss: existing.gssCode,
          incomingGss: row.wardCode,
        })
      }

      if (!existing.gssCode && row.wardCode) existing.gssCode = row.wardCode
      if (!existing.mapitAreaId && row.mapitAreaId) existing.mapitAreaId = row.mapitAreaId
    }
  }

  return {
    councils: [...councilsBySlug.values()],
    wards: [...wardsByKey.values()],
    unmatchedCouncils,
    unmatchedWards,
  }
}

async function postJson(apiBase, body) {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/local-vote/ingest/councils-wards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch((error) => {
    fail('Failed to reach local councils/wards ingest endpoint.', error?.message || String(error))
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    fail(
      `Local councils/wards ingest failed (${response.status}).`,
      payload ? JSON.stringify(payload, null, 2) : '',
    )
  }

  return payload
}

export async function ingestLocalCouncilsAndWards() {
  const fetchedAt = new Date().toISOString()
  const registry = await loadCouncilRegistry(API_BASE)
  const csvText = await loadWardCsvText()
  const wardRows = parseCsv(csvText)

  if (!wardRows.length) {
    fail('No ward rows could be parsed from the source CSV.')
  }

  const baseline = buildBaseline({
    registry,
    wardRows,
    wardsSourceUrl: WARDS_SOURCE_URL || WARDS_URL,
    fetchedAt,
  })

  if (!baseline.councils.length) {
    fail('No councils were available for baseline import.')
  }

  if (!baseline.wards.length) {
    fail('No wards could be matched into the local vote baseline.')
  }

  const runId = `local_vote_ingest_councils_wards_${Date.now()}`
  await postJson(API_BASE, {
    action: 'start',
    runId,
    councilCount: baseline.councils.length,
    wardCount: baseline.wards.length,
    wardsSourceUrl: WARDS_SOURCE_URL || WARDS_URL,
  })

  const councilChunks = chunkArray(baseline.councils, 100)
  const wardChunks = chunkArray(baseline.wards, Number.isFinite(CHUNK_SIZE) && CHUNK_SIZE > 0 ? CHUNK_SIZE : 300)

  let importedCouncils = 0
  let importedWards = 0

  for (const chunk of councilChunks) {
    const payload = await postJson(API_BASE, {
      action: 'councils',
      runId,
      councils: chunk,
    })
    importedCouncils += Number(payload.councilCount || 0)
  }

  for (const chunk of wardChunks) {
    const payload = await postJson(API_BASE, {
      action: 'wards',
      runId,
      wards: chunk,
    })
    importedWards += Number(payload.wardCount || 0)
  }

  const finished = await postJson(API_BASE, {
    action: 'finish',
    runId,
    unmatchedCouncils: baseline.unmatchedCouncils.slice(0, 100),
    unmatchedWards: baseline.unmatchedWards.slice(0, 100),
  })

  console.log(
    JSON.stringify(
      {
        ok: finished.ok,
        runId,
        importedCouncils,
        importedWards,
        validation: finished.validation || {},
        unmatchedCouncils: baseline.unmatchedCouncils.slice(0, 25),
        unmatchedWards: baseline.unmatchedWards.slice(0, 25),
      },
      null,
      2,
    ),
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingestLocalCouncilsAndWards().catch((error) => {
    fail('Unexpected local councils/wards ingest failure.', error?.stack || error?.message || String(error))
  })
}
