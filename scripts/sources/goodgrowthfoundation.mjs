import * as XLSX from 'xlsx'

const ARCHIVE_URL = 'https://www.goodgrowthfoundation.co.uk/polling-archive'

const MONTHS = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
}

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

function stripTags(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function absolutizeUrl(base, maybeUrl) {
  try {
    return new URL(maybeUrl, base).toString()
  } catch {
    return maybeUrl
  }
}

function safeNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const raw = String(value).trim().replace(/%/g, '').replace(/,/g, '')
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function parsePercent(value) {
  return safeNumber(value)
}

function pad(day) {
  return String(Number(day)).padStart(2, '0')
}

function toIso(year, monthName, day) {
  const month = MONTHS[norm(monthName)]
  if (!month) return null
  return `${year}-${month}-${pad(day)}`
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

async function fetchArrayBuffer(url) {
  const res = await fetch(url, {
    headers: {
      Accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream,*/*',
      'User-Agent': 'Mozilla/5.0',
      Referer: ARCHIVE_URL,
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

function extractArchiveEntries(html) {
  const entries = []
  const re = /<h4[^>]*>([\s\S]*?)<\/h4>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<p[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"/gi
  let match

  while ((match = re.exec(String(html || ''))) !== null) {
    const heading = stripTags(match[1])
    const description = stripTags(match[2])
    const workbookUrl = absolutizeUrl(ARCHIVE_URL, match[3])

    if (!/voting intention/i.test(heading)) continue
    if (!/\.xlsx?$/i.test(workbookUrl)) continue

    entries.push({ heading, description, workbookUrl })
  }

  return entries
}

function parseDescriptionSample(text) {
  const match = String(text || '').match(/poll of\s+([\d,]+)/i)
  return match ? safeNumber(match[1]) : null
}

function parseDescriptionFieldwork(text) {
  let match = String(text || '').match(/between the\s+(\d{1,2})(?:st|nd|rd|th)?\s+of\s+([A-Za-z]+)\s+and the\s+(\d{1,2})(?:st|nd|rd|th)?\s+of\s+([A-Za-z]+)\s+(20\d{2})/i)
  if (match) {
    return {
      fieldworkStart: toIso(match[5], match[2], match[1]),
      fieldworkEnd: toIso(match[5], match[4], match[3]),
    }
  }

  match = String(text || '').match(/between the\s+(\d{1,2})(?:st|nd|rd|th)?\s+and the\s+(\d{1,2})(?:st|nd|rd|th)?\s+of\s+([A-Za-z]+)\s+(20\d{2})/i)
  if (match) {
    return {
      fieldworkStart: toIso(match[4], match[3], match[1]),
      fieldworkEnd: toIso(match[4], match[3], match[2]),
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null }
}

function parseCoverSample(rows) {
  for (const row of rows.slice(0, 24)) {
    const text = row.map((cell) => String(cell || '')).join(' ')
    const match = text.match(/Sample:\s*([\d,]+)/i)
    if (match) return safeNumber(match[1])
  }
  return null
}

function parseCoverFieldwork(rows) {
  for (const row of rows.slice(0, 24)) {
    const text = row.map((cell) => String(cell || '')).join(' ').replace(/\s+/g, ' ').trim()

    let match = text.match(/Fieldwork:\s*(\d{1,2})(?:st|nd|rd|th)?\s*([A-Za-z]+)\s*[–-]\s*(\d{1,2})(?:st|nd|rd|th)?\s*([A-Za-z]+)\s*(20\d{2})/i)
    if (match) {
      return {
        fieldworkStart: toIso(match[5], match[2], match[1]),
        fieldworkEnd: toIso(match[5], match[4], match[3]),
      }
    }

    match = text.match(/Fieldwork:\s*(\d{1,2})(?:st|nd|rd|th)?\s*[–-]\s*(\d{1,2})(?:st|nd|rd|th)?\s*([A-Za-z]+)\s*(20\d{2})/i)
    if (match) {
      return {
        fieldworkStart: toIso(match[4], match[3], match[1]),
        fieldworkEnd: toIso(match[4], match[3], match[2]),
      }
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null }
}

function findTableSheetName(sheetNames) {
  const wanted = sheetNames.find((name) => norm(name) === 'tables')
  if (wanted) return wanted

  return sheetNames.find((name) => {
    const lower = norm(name)
    return lower === 't1' || lower.includes('table')
  }) || null
}

function findTotalColumnIndex(rows) {
  for (const row of rows.slice(0, 8)) {
    const index = row.findIndex((cell) => norm(cell) === 'total')
    if (index >= 1) return index
  }
  return 1
}

function extractHeadlineTableRows(rows) {
  const start = rows.findIndex((row) => norm(row?.[0]).includes('q:ggfheadlinevi'))
  if (start < 0) return rows

  const afterStart = rows.slice(start)
  const nextQuestion = afterStart.slice(1).findIndex((row) => /^q:/i.test(String(row?.[0] || '').trim()))
  if (nextQuestion < 0) return afterStart

  return afterStart.slice(0, nextQuestion + 1)
}

function rowsToLabelMap(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = norm(row?.[0])
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

function buildPollFromWorkbook(buffer, workbookUrl, fallback = {}) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const coverName = workbook.SheetNames.find((name) => norm(name) === 'cover') || workbook.SheetNames[0]
  const tableName = findTableSheetName(workbook.SheetNames)
  if (!tableName) throw new Error(`Could not find voting-intention table sheet. Found: ${workbook.SheetNames.join(', ')}`)

  const coverRows = XLSX.utils.sheet_to_json(workbook.Sheets[coverName], { header: 1, raw: false, defval: '' })
  const tableRows = extractHeadlineTableRows(
    XLSX.utils.sheet_to_json(workbook.Sheets[tableName], { header: 1, raw: false, defval: '' })
  )

  const sample = parseCoverSample(coverRows) ?? fallback.sample ?? null
  const coverFieldwork = parseCoverFieldwork(coverRows)
  const fieldworkStart = coverFieldwork.fieldworkStart || fallback.fieldworkStart || null
  const fieldworkEnd = coverFieldwork.fieldworkEnd || fallback.fieldworkEnd || null
  const publishedAt = fieldworkEnd || fieldworkStart || null

  const col = findTotalColumnIndex(tableRows)
  const labelMap = rowsToLabelMap(tableRows)

  const getVal = (variants) => {
    const row = pickRow(labelMap, variants)
    return row ? parsePercent(row[col]) : null
  }

  const values = {
    ref: getVal(['reform uk', 'reform uk ']),
    lab: getVal(['labour', 'labour ']),
    con: getVal(['conservative']),
    grn: getVal(['green', 'green ']),
    ld: getVal(['liberal democrat', 'liberal democrat ']),
    snp: getVal(['snp']),
    pc: getVal(['plaid cymru']),
    oth: getVal(['other']),
  }

  const coreCount = ['ref', 'lab', 'con', 'grn', 'ld'].filter((key) => typeof values[key] === 'number').length
  if (coreCount < 3 || values.lab == null || values.con == null) {
    throw new Error(`Parsed workbook but did not find enough Westminster VI values in ${tableName}`)
  }

  return {
    id: `good-growth-foundation-${fieldworkEnd || publishedAt}`,
    pollster: 'Good Growth Foundation',
    isBpcMember: true,
    publishedAt,
    fieldworkStart,
    fieldworkEnd,
    date: fieldworkEnd || publishedAt || null,
    sample,
    method: 'Online poll',
    mode: 'Online',
    commissioner: null,
    sourceUrl: workbookUrl,
    source: `Good Growth Foundation polling archive · ${ARCHIVE_URL}`,
    sourceType: 'good growth foundation',
    verificationStatus: 'verified',
    confidence: 'high',
    ingestedAt: new Date().toISOString(),
    suspect: false,
    prompted: false,
    mrp: false,
    ref: values.ref ?? null,
    lab: values.lab ?? null,
    con: values.con ?? null,
    grn: values.grn ?? null,
    ld: values.ld ?? null,
    rb: null,
    snp: values.snp ?? null,
    pc: values.pc ?? null,
    oth: values.oth ?? null,
  }
}

export async function fetchGoodGrowthFoundationPolls() {
  const html = await fetchText(ARCHIVE_URL)
  const entries = extractArchiveEntries(html)
  const polls = []

  for (const entry of entries) {
    try {
      const buffer = await fetchArrayBuffer(entry.workbookUrl)
      const fallback = {
        sample: parseDescriptionSample(entry.description),
        ...parseDescriptionFieldwork(entry.description),
      }
      const poll = buildPollFromWorkbook(buffer, entry.workbookUrl, fallback)
      if (poll) polls.push(poll)
    } catch (error) {
      console.warn(`[goodgrowthfoundation] skip ${entry.workbookUrl}: ${error.message}`)
    }
  }

  const byId = new Map()
  for (const poll of polls) {
    const existing = byId.get(poll.id)
    if (!existing || String(poll.publishedAt || '').localeCompare(String(existing.publishedAt || '')) > 0) {
      byId.set(poll.id, poll)
    }
  }

  return [...byId.values()].sort((a, b) => String(b.publishedAt || b.fieldworkEnd || '').localeCompare(String(a.publishedAt || a.fieldworkEnd || '')))
}

export async function fetchGoodGrowthFoundationPoll() {
  const polls = await fetchGoodGrowthFoundationPolls()
  return polls[0] || null
}

export default fetchGoodGrowthFoundationPolls
