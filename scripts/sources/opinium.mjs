import { URL } from 'node:url'

const ARCHIVE_URL = 'https://www.opinium.com/resource-center/'
const ARTICLE_RE = /\/resource-center\/((?:opinium-)?voting-intention-[^"'?#]+)\/?/i
const MONTHS = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
}
const PARTY_PATTERNS = [
  { key: 'ref', names: ['reform uk', 'reform'] },
  { key: 'lab', names: ['labour'] },
  { key: 'con', names: ['conservative', 'conservatives'] },
  { key: 'ld', names: ['lib dem', 'lib dems', 'liberal democrat', 'liberal democrats'] },
  { key: 'grn', names: ['green', 'greens'] },
]

function safeIdPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:p|div|li|h1|h2|h3|h4|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function parseDayMonthYear(text) {
  const m = String(text || '').match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i)
  if (!m) return null
  const dd = String(Number(m[1])).padStart(2, '0')
  const mm = MONTHS[m[2].toLowerCase()]
  const yyyy = m[3]
  return mm ? `${yyyy}-${mm}-${dd}` : null
}

function toIsoDate(day, monthName, year) {
  const dd = String(Number(day)).padStart(2, '0')
  const mm = MONTHS[String(monthName || '').toLowerCase()]
  return mm ? `${year}-${mm}-${dd}` : null
}

function extractSurveyDetails(text) {
  const body = String(text || '')

  let sample = null
  const sampleMatch = body.match(/\b(?:sample of|among|survey of)\s+([\d,]{3,6})\b/i)
  if (sampleMatch) {
    const parsed = Number(String(sampleMatch[1]).replace(/,/g, ''))
    sample = Number.isFinite(parsed) ? parsed : null
  }

  let fieldworkStart = null
  let fieldworkEnd = null

  let match = body.match(/\bbetween\s+(\d{1,2})(?:st|nd|rd|th)?\s+and\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(20\d{2})\b/i)
  if (match) {
    fieldworkStart = toIsoDate(match[1], match[3], match[4])
    fieldworkEnd = toIsoDate(match[2], match[3], match[4])
  } else {
    match = body.match(/\bbetween\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+and\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(20\d{2})\b/i)
    if (match) {
      fieldworkStart = toIsoDate(match[1], match[2], match[5])
      fieldworkEnd = toIsoDate(match[3], match[4], match[5])
    } else {
      match = body.match(/\bon\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(20\d{2})\b/i)
      if (match) {
        fieldworkStart = toIsoDate(match[1], match[2], match[3])
        fieldworkEnd = fieldworkStart
      }
    }
  }

  return { sample, fieldworkStart, fieldworkEnd }
}

function parsePublishedDate(html, text) {
  const dt = String(html || '').match(/<time[^>]+datetime=["'](\d{4}-\d{2}-\d{2})/i)
  if (dt) return dt[1]

  const patterns = [
    /\b(?:Mon|Tue|Tues|Wed|Thu|Thur|Fri|Sat|Sun)\s+(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/i,
    /\bPublished\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(\d{4})\b/i,
  ]
  for (const pat of patterns) {
    const m = String(text || '').match(pat)
    if (m) {
      const dd = String(Number(m[1])).padStart(2, '0')
      const mm = MONTHS[m[2].toLowerCase()]
      const yyyy = m[3]
      if (mm) return `${yyyy}-${mm}-${dd}`
    }
  }
  return null
}


function extractArticleLinks(html) {
  const urls = new Map()
  const re = /href=["']([^"']+)["']/gi
  let match
  while ((match = re.exec(String(html || ''))) !== null) {
    const href = match[1]
    if (!ARTICLE_RE.test(href)) continue
    const abs = new URL(href, ARCHIVE_URL).toString()
    urls.set(abs, abs)
  }
  return [...urls.values()]
}

function extractTitleDate(text, url) {
  const fromText = parseDayMonthYear(text)
  if (fromText) return fromText
  const decoded = decodeURIComponent(String(url || '').split('/').filter(Boolean).pop() || '')
    .replace(/-/g, ' ')
  return parseDayMonthYear(decoded)
}

function clampPublished(publishedAt, fieldworkEnd) {
  if (!publishedAt) return fieldworkEnd || null
  if (!fieldworkEnd) return publishedAt
  return publishedAt < fieldworkEnd ? fieldworkEnd : publishedAt
}

function pickFirstValid(matches) {
  for (const n of matches) {
    if (n == null) continue
    if (n < 0 || n > 100) continue
    return n
  }
  return null
}

function extractPartyValue(text, names) {
  const samples = []
  for (const name of names) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`${esc}[^\\d%]{0,35}(\\d{1,2})%`, 'i'),
      new RegExp(`${esc}[^\\d%]{0,35}on\\s+(\\d{1,2})`, 'i'),
      new RegExp(`${esc}[^\\d%]{0,35}at\\s+(\\d{1,2})`, 'i'),
      new RegExp(`(\\d{1,2})%[^\\n]{0,50}${esc}`, 'i'),
    ]
    for (const pat of patterns) {
      const m = String(text || '').match(pat)
      if (m) samples.push(Number(m[1]))
    }
  }
  return pickFirstValid(samples)
}

function extractLeadText(fullText) {
  const text = String(fullText || '')
  const idx = text.toLowerCase().indexOf('approval')
  const cut = idx > 300 ? text.slice(0, idx) : text
  return cut.slice(0, 2400)
}

function makeRecord(articleUrl, html) {
  const text = htmlToText(html)
  const h1 = String(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')
  const titleText = htmlToText(h1) || text.split('\n')[0] || ''
  const survey = extractSurveyDetails(text)
  const fieldworkEnd = survey.fieldworkEnd || extractTitleDate(titleText, articleUrl)
  const fieldworkStart = survey.fieldworkStart || null
  if (!fieldworkEnd) return null

  const publishedAt = clampPublished(parsePublishedDate(html, text), fieldworkEnd)
  const leadText = extractLeadText(text)

  const values = {}
  for (const party of PARTY_PATTERNS) {
    values[party.key] = extractPartyValue(leadText, party.names)
  }

  const populated = Object.values(values).filter((v) => typeof v === 'number').length
  const total = Object.values(values).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
  if (populated < 4) return null
  if (total <= 0 || total > 100) return null

  return {
    id: `opinium-${fieldworkEnd}`,
    pollster: 'Opinium',
    pollsterId: 'opinium',
    isBpcMember: true,
    client: null,
    publishedAt,
    fieldworkStart,
    fieldworkEnd,
    sample: Number.isFinite(survey.sample) ? survey.sample : null,
    method: 'online',
    mode: 'Online',
    commissioner: null,
    sourceType: 'opinium',
    sourceUrl: articleUrl,
    source: `Opinium · ${articleUrl}`,
    ingestedAt: new Date().toISOString(),
    verificationStatus: 'verified',
    confidence: 'high',
    suspect: false,
    lab: values.lab ?? null,
    con: values.con ?? null,
    ref: values.ref ?? null,
    ld: values.ld ?? null,
    grn: values.grn ?? null,
    snp: null,
    pc: null,
    rb: null,
    oth: null,
    prompted: false,
    mrp: false,
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'PolitiscopeOpiniumIngestor/1.1',
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`)
  return await res.text()
}

export async function fetchOpiniumPolls({ limit = 16 } = {}) {
  const archiveHtml = await fetchText(ARCHIVE_URL)
  const articleUrls = extractArticleLinks(archiveHtml).slice(0, limit)
  const records = []

  for (const url of articleUrls) {
    try {
      const html = await fetchText(url)
      const record = makeRecord(url, html)
      if (record) records.push(record)
    } catch (error) {
      console.warn(`[opinium] skipped ${url}: ${error.message}`)
    }
  }

  const byId = new Map()
  for (const record of records) {
    const existing = byId.get(record.id)
    if (!existing || (record.publishedAt || '') > (existing.publishedAt || '')) byId.set(record.id, record)
  }

  return [...byId.values()].sort((a, b) => (b.fieldworkEnd || '').localeCompare(a.fieldworkEnd || ''))
}

export default fetchOpiniumPolls
