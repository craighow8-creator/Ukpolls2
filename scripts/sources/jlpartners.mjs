import * as XLSX from 'xlsx'

const JL_RESULTS_URL = 'https://www.jlpartners.co.uk/polling-results'
const MAX_HISTORY = 40

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

function cleanHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8211;|&ndash;/gi, '–')
    .replace(/&#8217;|&#039;|&apos;/gi, "'")
    .replace(/&#038;|&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function stripTags(value) {
  return cleanHtml(String(value || ''))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const raw = String(value).trim().replace(/%/g, '').replace(/,/g, '')
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function absolutizeUrl(base, maybeUrl) {
  try {
    return new URL(maybeUrl, base).toString()
  } catch {
    return maybeUrl
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0',
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`Request failed ${res.status} for ${url}`)
  return res.text()
}

async function fetchArrayBuffer(url, referer = JL_RESULTS_URL) {
  const res = await fetch(url, {
    headers: {
      Accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream,*/*',
      'User-Agent': 'Mozilla/5.0',
      Referer: referer,
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`File download failed ${res.status} for ${url}`)

  const contentType = res.headers.get('content-type') || ''
  if (contentType.toLowerCase().includes('text/html')) {
    const text = await res.text()
    throw new Error(`Expected workbook but got HTML from ${url}. Preview: ${text.slice(0, 160).replace(/\s+/g, ' ')}`)
  }

  return res.arrayBuffer()
}

function extractLinks(html, baseUrl) {
  return [...String(html || '').matchAll(/href\s*=\s*"([^"]+)"/gi)]
    .map((m) => absolutizeUrl(baseUrl, m[1]))
    .filter(Boolean)
}

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12',
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function toIso(year, month, day) {
  return `${year}-${month}-${pad(day)}`
}

function extractDateFromCard(text) {
  const m = String(text || '').match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})\b/i)
  if (!m) return null
  const month = MONTHS[norm(m[1])]
  if (!month) return null
  return toIso(m[3], month, m[2])
}

function rowsToLabelMap(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = norm(row?.[1] || row?.[0])
    if (key) map.set(key, row)
  }
  return map
}

function pickRow(map, variants) {
  for (const variant of variants) {
    const wanted = norm(variant)
    for (const [key, row] of map.entries()) {
      if (key === wanted || key.includes(wanted)) return row
    }
  }
  return null
}

function isValidVISheet(rows) {
  const text = rows.flat().join(' ').toLowerCase()
  if (/front|index|contents/.test(text.slice(0, 300))) return false
  return (
    text.includes('labour') &&
    text.includes('conservative') &&
    (text.includes('reform') || text.includes('ref')) &&
    (text.includes('lib dem') || text.includes('liberal democrat'))
  )
}

function findWholeSampleColumn(rows) {
  for (const row of rows.slice(0, 12)) {
    for (let i = 1; i < row.length; i += 1) {
      if (norm(row[i]) === 'whole sample') return i
      if (norm(row[i]) === 'total') return i
    }
  }
  return null
}

function buildValuesForColumn(labelMap, col) {
  const getVal = (variants) => {
    const row = pickRow(labelMap, variants)
    return row ? safeNumber(row[col]) : null
  }

  return {
    ref: getVal(['reform uk', 'reform']),
    lab: getVal(['labour']),
    con: getVal(['conservative', 'conservatives']),
    grn: getVal(['green party', 'green', 'greens']),
    ld: getVal(['liberal democrats', 'lib dem', 'lib dems', 'liberal democrat']),
    rb: getVal(['restore britain']),
    snp: getVal(['snp', 'scottish national party']),
    pc: getVal(['plaid cymru', 'plaid']),
    oth: getVal(['other', 'others']),
  }
}

function scoreColumn(values) {
  const coreKeys = ['ref', 'lab', 'con', 'ld', 'grn']
  const core = coreKeys.map((k) => values[k]).filter((v) => typeof v === 'number')
  const total = core.reduce((a, b) => a + b, 0)

  if (values.lab == null || values.con == null) return -999
  if (core.length < 3) return -999
  if (total < 40 || total > 110) return -999

  let score = 0
  score += core.length * 10
  score += Math.max(0, 110 - Math.abs(85 - total))
  if (values.ref != null) score += 5
  if (values.ld != null) score += 3
  if (values.grn != null) score += 3
  return score
}

function parseCoverMetadata(workbook, publishedAt) {
  const coverName = workbook.SheetNames.find((name) => /cover/i.test(name))
  if (!coverName) {
    return {
      fieldworkStart: null,
      fieldworkEnd: publishedAt || null,
      sample: null,
      mode: null,
    }
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[coverName], {
    header: 1,
    raw: false,
    defval: '',
  })

  const findValue = (label) => {
    const row = rows.find((entry) => norm(entry?.[0]) === norm(label))
    return row ? String(row[1] || '').trim() : ''
  }

  const fieldworkText = findValue('Fieldwork:')
  const sampleText = findValue('Sample size:')
  const modeText = findValue('Sampling mode:')

  let fieldworkStart = null
  let fieldworkEnd = publishedAt || null

  let m = fieldworkText.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\s*[-–]\s*([A-Za-z]{3,9})?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})\b/i)
  if (m) {
    const month1 = MONTHS[norm(m[1])]
    const month2 = MONTHS[norm(m[3] || m[1])]
    if (month1 && month2) {
      fieldworkStart = toIso(m[5], month1, m[2])
      fieldworkEnd = toIso(m[5], month2, m[4])
    }
  }

  return {
    fieldworkStart,
    fieldworkEnd,
    sample: safeNumber(sampleText),
    mode: modeText || null,
  }
}

function resolvePublishedAt(publishedAt, fieldworkEnd) {
  if (!publishedAt) return fieldworkEnd || null
  if (!fieldworkEnd) return publishedAt

  const publishedMs = Date.parse(`${publishedAt}T00:00:00Z`)
  const fieldworkEndMs = Date.parse(`${fieldworkEnd}T00:00:00Z`)
  if (!Number.isFinite(publishedMs) || !Number.isFinite(fieldworkEndMs)) {
    return publishedAt
  }

  const ageDays = Math.abs(publishedMs - fieldworkEndMs) / 86400000
  return ageDays > 14 ? fieldworkEnd : publishedAt
}

function parseFromWorkbook(buffer, sourceUrl, publishedAt) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const cover = parseCoverMetadata(workbook, publishedAt)
  const resolvedPublishedAt = resolvePublishedAt(publishedAt, cover.fieldworkEnd)

  let best = null

  for (const name of workbook.SheetNames) {
    if (/front|index|contents/i.test(name)) continue

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      raw: false,
      defval: '',
    })

    if (!rows || rows.length < 5) continue
    if (!isValidVISheet(rows)) continue

    const labelMap = rowsToLabelMap(rows)
    const wholeSampleCol = findWholeSampleColumn(rows)
    if (wholeSampleCol == null) continue

    const values = buildValuesForColumn(labelMap, wholeSampleCol)
    const score = scoreColumn(values)
    if (score < 0) continue

    if (!best || score > best.score) {
      best = { sheetName: name, col: wholeSampleCol, values, score }
    }
  }

  if (!best) {
    throw new Error(`No valid VI sheet/column found. Sheets: ${workbook.SheetNames.join(', ')}`)
  }

  const core = [best.values.ref, best.values.lab, best.values.con, best.values.ld, best.values.grn]
    .filter((v) => typeof v === 'number')
  const total = core.reduce((a, b) => a + b, 0)
  const isCompleteEnough =
    core.length >= 5 &&
    cover.fieldworkStart &&
    cover.fieldworkEnd &&
    cover.sample

  return {
    id: `jl-partners-${slugify(cover.fieldworkEnd || publishedAt || sourceUrl)}`,
    pollster: 'JL Partners',
    isBpcMember: true,
    fieldworkStart: cover.fieldworkStart,
    fieldworkEnd: cover.fieldworkEnd || publishedAt || null,
    publishedAt: resolvedPublishedAt,
    date: cover.fieldworkEnd || resolvedPublishedAt || null,
    sample: cover.sample,
    method: 'Workbook poll',
    mode: cover.mode,
    commissioner: null,
    sourceUrl,
    source: `JL Partners workbook · ${best.sheetName} · whole sample`,
    ref: best.values.ref ?? null,
    lab: best.values.lab ?? null,
    con: best.values.con ?? null,
    grn: best.values.grn ?? null,
    ld: best.values.ld ?? null,
    rb: best.values.rb ?? null,
    snp: best.values.snp ?? null,
    pc: best.values.pc ?? null,
    oth: best.values.oth ?? null,
    confidence: isCompleteEnough ? 'high' : 'medium',
    verificationStatus: 'verified',
    sourceType: 'jl partners',
    _debugCoreTotal: total,
  }
}

function extractCards(html) {
  const cards = []
  const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>[\s\S]*?(?:Tables?\s+available\s+here|Table\s+available\s+here|Full tables available here|Full tables here)/gi
  let m
  while ((m = re.exec(String(html || ''))) !== null) {
    cards.push({ title: stripTags(m[1]), meta: stripTags(m[2]), chunk: m[0] })
  }
  return cards
}

function isVotingIntentionCard(card) {
  const title = norm(card?.title)
  const meta = norm(card?.meta)
  const links = extractWorkbookLinksFromChunk(card?.chunk || '', JL_RESULTS_URL)
  return (
    title.includes('voting intention') ||
    meta.includes('voting intention') ||
    links.some((url) => /(?:voting[_ -]?intention|\bvi\b)/i.test(url))
  )
}

function cardDateScore(card) {
  return extractDateFromCard(`${card?.title || ''} ${card?.meta || ''}`) || ''
}

function extractWorkbookLinksFromChunk(chunk, baseUrl) {
  return extractLinks(chunk, baseUrl).filter((url) => /\.(xlsx|xls)(\?|$)/i.test(url))
}

export async function fetchJLPartnersPolls() {
  const html = await fetchText(JL_RESULTS_URL)
  const cards = extractCards(html)
    .filter(isVotingIntentionCard)
    .sort((a, b) => cardDateScore(b).localeCompare(cardDateScore(a)))

  if (!cards.length) throw new Error('Could not find JL Partners voting intention entries')

  const seen = new Set()
  const polls = []

  for (const card of cards) {
    const publishedAt = extractDateFromCard(`${card.title} ${card.meta}`)
    const workbookLinks = extractWorkbookLinksFromChunk(card.chunk, JL_RESULTS_URL)
      .sort((a, b) => Number(/(?:voting[_ -]?intention|\bvi\b)/i.test(b)) - Number(/(?:voting[_ -]?intention|\bvi\b)/i.test(a)))

    for (const link of workbookLinks) {
      if (seen.has(link)) continue
      seen.add(link)
      try {
        const buffer = await fetchArrayBuffer(link, JL_RESULTS_URL)
        const poll = parseFromWorkbook(buffer, link, publishedAt)
        if (poll) polls.push(poll)
      } catch (err) {
        console.warn(`[jlpartners] skip ${link}: ${err.message}`)
      }
    }

    if (polls.length >= MAX_HISTORY) break
  }

  const deduped = []
  const ids = new Set()
  for (const poll of polls) {
    if (!poll?.id || ids.has(poll.id)) continue
    ids.add(poll.id)
    deduped.push(poll)
  }

  deduped.sort((a, b) => String(b?.publishedAt || b?.fieldworkEnd || '').localeCompare(String(a?.publishedAt || a?.fieldworkEnd || '')))

  if (!deduped.length) throw new Error('Could not build any JL Partners voting intention history')

  return deduped.slice(0, MAX_HISTORY)
}

export async function fetchJLPartnersPoll() {
  const polls = await fetchJLPartnersPolls()
  return polls[0] || null
}

export default fetchJLPartnersPolls
