import * as XLSX from 'xlsx'

const FINDOUTNOW_PAGE_URL = 'https://findoutnow.co.uk/blog/voting-intention-18th-march-2026/'

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
      Referer: FINDOUTNOW_PAGE_URL,
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
  const mJson = String(html || '').match(/"datePublished"\s*:\s*"([^"]+)"/i)
  if (mJson) return String(mJson[1]).slice(0, 10)

  const m1 = String(html || '').match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(20\d{2})\b/)
  if (m1) {
    const months = {
      january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
      july:'07', august:'08', september:'09', october:'10', november:'11', december:'12'
    }
    const month = months[String(m1[2]).toLowerCase()]
    if (month) return `${m1[3]}-${month}-${String(m1[1]).padStart(2,'0')}`
  }

  return null
}

function extractTablesUrl(html) {
  const direct = String(html || '').match(/https?:\/\/cms\.findoutnow\.co\.uk\/[^"' \t\r\n>]+\.xlsx(?:\?[^"' \t\r\n>]*)?/i)
  if (direct) return direct[0]

  const sentenceMatch = String(html || '').match(
    /Full\s+data\s+tables[\s\S]{0,400}?<a[^>]+href=["']([^"']+)["']/i
  )
  if (sentenceMatch) return absolutizeUrl(FINDOUTNOW_PAGE_URL, sentenceMatch[1])

  const hereMatch = String(html || '').match(
    /data\s+tables[\s\S]{0,200}?here[\s\S]{0,120}?href=["']([^"']+)["']/i
  )
  if (hereMatch) return absolutizeUrl(FINDOUTNOW_PAGE_URL, hereMatch[1])

  const links = [...String(html || '').matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  for (const [, href, inner] of links) {
    const text = cleanText(inner)
    const url = absolutizeUrl(FINDOUTNOW_PAGE_URL, href)
    if (/cms\.findoutnow\.co\.uk/i.test(url) && /\.xlsx(\?|$)/i.test(url)) return url
    if (/\.xlsx(\?|$)/i.test(url)) return url
    if (/full data tables/i.test(text)) return url
  }

  return null
}

function parseWorkbookDate(url) {
  const months = {
    january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
    july:'07', august:'08', september:'09', october:'10', november:'11', december:'12',
    jan:'01', feb:'02', mar:'03', apr:'04', jun:'06', jul:'07', aug:'08', sep:'09', sept:'09', oct:'10', nov:'11', dec:'12'
  }

  let m = String(url || '').match(/(\d{1,2})(?:st|nd|rd|th)?[-\s]*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)[-\s]*(20\d{2})/i)
  if (m) {
    return `${m[3]}-${months[m[2].toLowerCase()]}-${String(m[1]).padStart(2, '0')}`
  }

  m = String(url || '').match(/(20\d{2})\/(\d{2})\/(\d{1,2})/i)
  if (m) {
    return `${m[1]}-${m[2]}-${String(m[3]).padStart(2, '0')}`
  }

  return null
}

function chooseSheetName(sheetNames) {
  const scored = sheetNames.map((name) => {
    const n = norm(name)
    let score = 0
    if (n === 'headline vi') score += 20
    if (n.includes('headline')) score += 12
    if (n.includes('vi')) score += 10
    if (n.includes('voting')) score += 6
    return { name, score }
  }).sort((a, b) => b.score - a.score)

  return scored[0]?.name || sheetNames[0] || null
}

function rowsToMap(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = norm(row?.[0])
    if (key) map.set(key, row)
  }
  return map
}

function firstNumeric(row) {
  if (!row) return null
  for (let i = 1; i < row.length; i++) {
    const v = row[i]
    if (typeof v === 'number') return v
    const n = safeNumber(v)
    if (n != null) return n
  }
  return null
}

function parseSampleFromHtml(text) {
  const m = String(text || '').match(/sample of\s+([\d,]+)\s+GB adults/i)
  return m ? safeNumber(m[1]) : null
}

function parseWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = chooseSheetName(workbook.SheetNames)
  if (!sheetName) throw new Error('Could not find Find Out Now worksheet')

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: '',
  })

  const map = rowsToMap(rows)

  const values = {
    con: firstNumeric(map.get('conservative')),
    lab: firstNumeric(map.get('labour')),
    ld: firstNumeric(map.get('liberal democrats')) ?? firstNumeric(map.get('liberal democrat')),
    ref: firstNumeric(map.get('reform uk')) ?? firstNumeric(map.get('reform')),
    grn: firstNumeric(map.get('green party')) ?? firstNumeric(map.get('green')),
    snp: firstNumeric(map.get('scottish national party (snp)')) ?? firstNumeric(map.get('snp')),
  }

  const hasCore = [values.ref, values.lab, values.con, values.grn, values.ld].some((v) => typeof v === 'number')
  if (!hasCore) {
    throw new Error(`Find Out Now workbook parsed but no core party values found in sheet ${sheetName}`)
  }

  return { sheetName, values }
}

export async function fetchFindOutNowPoll() {
  const html = await fetchText(FINDOUTNOW_PAGE_URL)
  const tablesUrl = extractTablesUrl(html)

  if (!tablesUrl) {
    throw new Error('Could not find Find Out Now data tables link on page')
  }

  const buffer = await fetchArrayBuffer(tablesUrl)
  const parsed = parseWorkbook(buffer)
  const publishedAt = parsePublishedDate(html) || parseWorkbookDate(tablesUrl)
  const fieldworkEnd = parseWorkbookDate(tablesUrl)
  const fieldworkStart = fieldworkEnd

  const text = cleanText(html)

  return {
    id: `find-out-now-${slugify(publishedAt || fieldworkEnd || 'latest')}`,
    pollster: 'Find Out Now',
    isBpcMember: true,
    fieldworkStart,
    fieldworkEnd,
    publishedAt,
    date: fieldworkEnd || publishedAt || null,
    sample: parseSampleFromHtml(text),
    method: "Turnout adjusted, don't know respondents squeezed",
    mode: 'Online',
    commissioner: 'Find Out Now',
    sourceUrl: FINDOUTNOW_PAGE_URL,
    source: `Find Out Now voting intention page · ${parsed.sheetName} · ${tablesUrl}`,
    ref: parsed.values.ref,
    lab: parsed.values.lab,
    con: parsed.values.con,
    grn: parsed.values.grn,
    ld: parsed.values.ld,
    rb: null,
    snp: parsed.values.snp,
  }
}

export default fetchFindOutNowPoll
