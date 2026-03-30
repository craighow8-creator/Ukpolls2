import * as XLSX from 'xlsx'

const FOCALDATA_PAGE_URL = 'https://www.focaldata.com/blog/westminster-voting-intention-reforms-lead-drops-to-5-points'

function cleanText(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function norm(value) {
  return cleanText(value).toLowerCase()
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

  if (!res.ok) {
    throw new Error(`Request failed ${res.status} for ${url}`)
  }

  return res.text()
}

async function fetchArrayBuffer(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream,*/*',
      'User-Agent': 'Mozilla/5.0',
      Referer: FOCALDATA_PAGE_URL,
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`File download failed ${res.status} for ${url}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.toLowerCase().includes('text/html')) {
    const text = await res.text()
    throw new Error(`Expected workbook but got HTML from ${url}. Preview: ${text.slice(0, 160).replace(/\s+/g, ' ')}`)
  }

  return await res.arrayBuffer()
}

function parsePublishedDate(html) {
  const byJson = String(html || '').match(/"datePublished"\s*:\s*"([^"]+)"/i)
  if (byJson) return String(byJson[1]).slice(0, 10)

  const byTime = String(html || '').match(/<time[^>]+datetime=["']([^"']+)["']/i)
  if (byTime) return String(byTime[1]).slice(0, 10)

  return null
}

function extractDataTablesUrl(html) {
  const directXlsx = String(html || '').match(/https?:\/\/[^"'\s>]+\.xlsx(?:\?[^"'\s>]*)?/i)
  if (directXlsx) return directXlsx[0]

  const sentenceMatch = String(html || '').match(
    /Data tables can be downloaded[\s\S]{0,300}?<a[^>]+href=["']([^"']+)["']/i
  )
  if (sentenceMatch) {
    return absolutizeUrl(FOCALDATA_PAGE_URL, sentenceMatch[1])
  }

  const links = [...String(html || '').matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  for (const [, href, inner] of links) {
    const url = absolutizeUrl(FOCALDATA_PAGE_URL, href)
    const text = cleanText(inner)
    if (/\.xlsx(\?|$)/i.test(url) || /\.xls(\?|$)/i.test(url)) {
      return url
    }
    if (/data tables/i.test(text) && (/\.xlsx(\?|$)/i.test(url) || /\.xls(\?|$)/i.test(url) || /hubspotusercontent/i.test(url))) {
      return url
    }
  }

  return null
}

function monthNumber(name) {
  const map = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  }
  return map[String(name || '').toLowerCase()] || null
}

function parseFieldworkFromUrl(url) {
  const m = String(url || '').match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s*(20\d{2})/i)
  if (!m) return { fieldworkStart: null, fieldworkEnd: null }

  const alias = {
    jan: 'january', feb: 'february', mar: 'march', apr: 'april', jun: 'june',
    jul: 'july', aug: 'august', sep: 'september', sept: 'september', oct: 'october',
    nov: 'november', dec: 'december'
  }

  const monthName = alias[m[3].toLowerCase()] || m[3].toLowerCase()
  const month = monthNumber(monthName)
  const year = m[4]

  return {
    fieldworkStart: `${year}-${month}-${String(m[1]).padStart(2, '0')}`,
    fieldworkEnd: `${year}-${month}-${String(m[2]).padStart(2, '0')}`,
  }
}

function chooseBestSheetName(sheetNames) {
  const scored = sheetNames.map((name) => {
    const n = norm(name)
    let score = 0
    if (n.includes('westminster')) score += 8
    if (n.includes('voting')) score += 6
    if (n.includes('intention')) score += 6
    if (n === 'vi') score += 10
    if (n.includes('headline')) score += 5
    if (n.includes('tables')) score += 1
    return { name, score }
  }).sort((a, b) => b.score - a.score)

  return scored[0]?.name || sheetNames[0] || null
}

function findHeaderTable(rows) {
  const variants = {
    ref: ['reform uk', 'reform'],
    lab: ['labour'],
    con: ['conservative', 'conservatives'],
    grn: ['green', 'greens'],
    ld: ['lib dem', 'lib dems', 'liberal democrat', 'liberal democrats'],
    snp: ['snp', 'scottish national party'],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map((v) => norm(v))
    const indexMap = {}

    for (const [key, names] of Object.entries(variants)) {
      const idx = row.findIndex((cell) => names.some((name) => cell === name || cell.includes(name)))
      if (idx >= 0) indexMap[key] = idx
    }

    if (Object.keys(indexMap).length < 4) continue

    for (let j = i + 1; j <= Math.min(i + 5, rows.length - 1); j++) {
      const next = rows[j]
      const values = {}
      let found = 0

      for (const [key, idx] of Object.entries(indexMap)) {
        const num = safeNumber(next[idx])
        if (num != null) {
          values[key] = num
          found += 1
        }
      }

      if (found >= 4) return values
    }
  }

  return null
}

function findLabelRows(rows) {
  const pick = (wanted) => {
    for (const row of rows) {
      const first = norm(row?.[0])
      if (!first) continue
      if (wanted.some((name) => first === name || first.includes(name))) {
        const num = row.map((v) => safeNumber(v)).find((n) => n != null)
        if (num != null) return num
      }
    }
    return null
  }

  return {
    ref: pick(['reform uk', 'reform']),
    lab: pick(['labour']),
    con: pick(['conservative', 'conservatives']),
    grn: pick(['green', 'greens']),
    ld: pick(['liberal democrat', 'liberal democrats', 'lib dem', 'lib dems']),
    snp: pick(['snp', 'scottish national party']),
  }
}

function findSample(rows) {
  for (const row of rows) {
    const key = norm(row?.[0])
    if (!key) continue
    if (key.includes('weighted base') || key.includes('weighted n') || key === 'base' || key.includes('sample')) {
      const num = row.map((v) => safeNumber(v)).find((n) => n != null && n > 100)
      if (num != null) return num
    }
  }
  return null
}

function parseWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = chooseBestSheetName(workbook.SheetNames)
  if (!sheetName) throw new Error('Could not find worksheet in Focaldata workbook')

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: '',
  })

  const headerValues = findHeaderTable(rows)
  const labelValues = findLabelRows(rows)
  const values = {
    ref: headerValues?.ref ?? labelValues.ref ?? null,
    lab: headerValues?.lab ?? labelValues.lab ?? null,
    con: headerValues?.con ?? labelValues.con ?? null,
    grn: headerValues?.grn ?? labelValues.grn ?? null,
    ld: headerValues?.ld ?? labelValues.ld ?? null,
    snp: headerValues?.snp ?? labelValues.snp ?? null,
  }

  const hasCore = [values.ref, values.lab, values.con, values.grn, values.ld].some((v) => typeof v === 'number')
  if (!hasCore) {
    throw new Error(`Focaldata workbook parsed but no core party values found in sheet ${sheetName}`)
  }

  return {
    sample: findSample(rows),
    values,
    sheetName,
  }
}

export async function fetchFocaldataPoll() {
  const html = await fetchText(FOCALDATA_PAGE_URL)
  const publishedAt = parsePublishedDate(html)
  const dataTablesUrl = extractDataTablesUrl(html)

  if (!dataTablesUrl) {
    throw new Error('Could not find Focaldata data tables link on page')
  }

  const buffer = await fetchArrayBuffer(dataTablesUrl)
  const parsed = parseWorkbook(buffer)
  const fieldwork = parseFieldworkFromUrl(dataTablesUrl)

  return {
    id: `focaldata-${slugify(publishedAt || fieldwork.fieldworkEnd || 'latest')}`,
    pollster: 'Focaldata',
    isBpcMember: true,
    fieldworkStart: fieldwork.fieldworkStart,
    fieldworkEnd: fieldwork.fieldworkEnd,
    publishedAt,
    date: fieldwork.fieldworkEnd || publishedAt || null,
    sample: parsed.sample,
    method: 'Online poll',
    mode: 'Online',
    commissioner: null,
    sourceUrl: FOCALDATA_PAGE_URL,
    source: `Focaldata voting intention page · ${parsed.sheetName} · ${dataTablesUrl}`,
    ref: parsed.values.ref,
    lab: parsed.values.lab,
    con: parsed.values.con,
    grn: parsed.values.grn,
    ld: parsed.values.ld,
    rb: null,
    snp: parsed.values.snp,
  }
}

export default fetchFocaldataPoll
