import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pdfParseModule = require('pdf-parse')
const pdfParse = pdfParseModule?.default || pdfParseModule?.pdf || pdfParseModule

const BASE = 'https://deltapoll.co.uk'
const POLLS_LIBRARY_URL = `${BASE}/polls-library`
const FALLBACK_ARTICLE_URLS = [
  `${BASE}/polls/mirror-end-of-year-260105`,
]
const MAX_HISTORY = 12

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12',
}

const PARTY_LABELS = {
  con: ['Conservative'],
  lab: ['Labour'],
  ld: ['Liberal Democrat', 'Liberal Democrats', 'Lib Dem', 'Lib Dems'],
  ref: ['Reform UK', 'Reform Party', 'Reform'],
  grn: ['Green', 'Green Party'],
  snp: ['Scottish National Party (SNP)', 'Scottish National Party', 'SNP'],
  pc: ['Plaid Cymru (PC)', 'Plaid Cymru'],
  oth: ['Other', 'Some other party or independent', 'Other / DK'],
}

const CORE_KEYS = ['con', 'lab', 'ld', 'ref', 'grn']

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

function cleanHtml(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#8211;|&ndash;/gi, '–')
    .replace(/&#8217;|&#039;|&apos;/gi, "'")
    .replace(/&#038;|&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function stripTags(value) {
  return cleanHtml(String(value || ''))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:p|div|li|h1|h2|h3|h4|section|article|span|strong|em|b|small|a)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const raw = String(value).trim().replace(/%/g, '').replace(/,/g, '')
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
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
      'Accept-Language': 'en-GB,en;q=0.9',
      'User-Agent': 'Mozilla/5.0',
      Referer: BASE,
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`Request failed ${res.status} for ${url}`)
  return res.text()
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/pdf,application/octet-stream,*/*',
      'Accept-Language': 'en-GB,en;q=0.9',
      'User-Agent': 'Mozilla/5.0',
      Referer: BASE,
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`Request failed ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

function extractLinks(html, baseUrl) {
  return [...String(html || '').matchAll(/href\s*=\s*["']([^"']+)["']/gi)]
    .map((m) => cleanHtml(m[1]))
    .map((u) => absolutizeUrl(baseUrl, u))
    .filter(Boolean)
}

function isPollArticle(url) {
  const l = norm(url)
  if (!l.startsWith(`${BASE}/polls/`)) return false
  if (/\.(pdf|xls|xlsx|jpg|jpeg|png|svg|webp)(\?|$)/i.test(l)) return false
  return true
}

function isLikelyPoliticalPage(articleText, url) {
  const t = norm(articleText)
  const u = norm(url)
  if (u.includes('mirror-end-of-year')) return true
  if (u.includes('voting-intention') || u.includes('general-election') || u.includes('westminster')) return true
  return (
    t.includes('voting intention') ||
    t.includes('general election') ||
    t.includes('westminster') ||
    (t.includes('reform uk') && t.includes('labour') && t.includes('conservative'))
  )
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function toIso(year, month, day) {
  return `${year}-${month}-${pad(day)}`
}

function extractPublishedAtFromArticle(html, url = '') {
  let m = String(html || '').match(/(?:datetime|datePublished)["':\s>]+(20\d{2}-\d{2}-\d{2})/i)
  if (m) return m[1]

  const text = stripTags(html)
  m = text.match(/\bDate Published\b\s*(\d{2})\/(\d{2})\/(20\d{2})/i)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`

  m = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/)
  if (m) {
    const month = MONTHS[norm(m[2])]
    if (month) return toIso(m[3], month, m[1])
  }

  m = String(url || '').match(/(\d{2})(\d{2})(\d{2})$/)
  if (m) return `20${m[1]}-${m[2]}-${m[3]}`
  return null
}

function extractClientFromArticle(text) {
  const m = String(text || '').match(/\bClient\b\s*([^\n]+)/i)
  return m ? m[1].trim() : null
}

function extractPdfUrl(html, articleUrl) {
  const links = extractLinks(html, articleUrl)
  return links.find((link) => /\.pdf(\?|$)/i.test(link)) || null
}

function extractSampleAndFieldwork(text, publishedAt) {
  const sampleMatch =
    text.match(/\bSample Size:\s*([\d,]{3,6})\b/i) ||
    text.match(/\bDeltapoll interviewed\s+([\d,]{3,6})\s+/i)

  const sample = sampleMatch ? safeNumber(sampleMatch[1]) : null

  let m = text.match(/\bFieldwork:\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+to\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})?\s+(20\d{2})\b/i)
  if (m) {
    const month1 = MONTHS[norm(m[2])]
    const month2 = MONTHS[norm(m[4] || m[2])]
    if (month1 && month2) {
      return {
        sample,
        fieldworkStart: toIso(m[5], month1, m[1]),
        fieldworkEnd: toIso(m[5], month2, m[3]),
      }
    }
  }

  m = text.match(/\bbetween\s+(\d{1,2})(?:st|nd|rd|th)?\s+and\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(20\d{2})\b/i)
  if (m) {
    const month = MONTHS[norm(m[3])]
    if (month) {
      return {
        sample,
        fieldworkStart: toIso(m[4], month, m[1]),
        fieldworkEnd: toIso(m[4], month, m[2]),
      }
    }
  }

  if (publishedAt) return { sample, fieldworkStart: publishedAt, fieldworkEnd: publishedAt }
  return { sample, fieldworkStart: null, fieldworkEnd: null }
}

function isPoliticalPdf(pdfText) {
  const t = norm(pdfText)
  return (
    t.includes('voting intention') ||
    t.includes('general election') ||
    (t.includes('conservative') && t.includes('labour') && (t.includes('reform') || t.includes('liberal democrat')))
  )
}

function pdfLines(pdfText) {
  return String(pdfText || '')
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function lineHasAnyLabel(line, labels) {
  const l = norm(line)
  return labels.some((label) => l.includes(norm(label)))
}

function isNumericLine(line) {
  return /^\s*\d{1,2}(?:\.\d)?\s*%?\s*$/.test(String(line || ''))
}

function extractSameLineNumber(line, label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`${esc}\\s+(\\d{1,2}(?:\\.\\d)?)\\s*%?\\b`, 'i')
  const m = String(line || '').match(re)
  if (!m) return null
  const n = safeNumber(m[1])
  return n != null && n >= 0 && n <= 100 ? n : null
}

function extractStrictValue(blockLines, labels) {
  for (let i = 0; i < blockLines.length; i += 1) {
    const line = blockLines[i]
    for (const label of labels) {
      const sameLine = extractSameLineNumber(line, label)
      if (sameLine != null) return sameLine

      if (lineHasAnyLabel(line, [label])) {
        const next = blockLines[i + 1] || ''
        if (isNumericLine(next)) {
          const n = safeNumber(next)
          if (n != null && n >= 0 && n <= 100) return n
        }
      }
    }
  }
  return null
}

function scoreBlock(lines, start, end) {
  const block = lines.slice(start, end)
  const joined = block.join('\n')
  let score = 0
  for (const key of CORE_KEYS) {
    if (lineHasAnyLabel(joined, PARTY_LABELS[key])) score += 1
  }
  if (/q1\./i.test(joined)) score += 1
  if (/voting intention|general election/i.test(joined)) score += 1
  return score
}

function findStrictTableBlock(lines) {
  let best = null

  for (let start = 0; start < lines.length; start += 1) {
    for (let size = 8; size <= 28; size += 1) {
      const end = Math.min(lines.length, start + size)
      const score = scoreBlock(lines, start, end)
      if (score < 5) continue

      const block = lines.slice(start, end)
      const values = {
        con: extractStrictValue(block, PARTY_LABELS.con),
        lab: extractStrictValue(block, PARTY_LABELS.lab),
        ld: extractStrictValue(block, PARTY_LABELS.ld),
        ref: extractStrictValue(block, PARTY_LABELS.ref),
        grn: extractStrictValue(block, PARTY_LABELS.grn),
      }

      const foundCore = Object.values(values).filter((v) => typeof v === 'number').length
      if (foundCore < 4) continue

      if (!best || score > best.score || (score === best.score && foundCore > best.foundCore)) {
        best = { start, end, score, foundCore, block }
      }
    }
  }

  return best?.block || null
}

function extractValuesFromPdf(pdfText) {
  const lines = pdfLines(pdfText)
  const block = findStrictTableBlock(lines)
  if (!block) {
    return { con: null, lab: null, ld: null, ref: null, grn: null, snp: null, pc: null, oth: null }
  }

  return {
    con: extractStrictValue(block, PARTY_LABELS.con),
    lab: extractStrictValue(block, PARTY_LABELS.lab),
    ld: extractStrictValue(block, PARTY_LABELS.ld),
    ref: extractStrictValue(block, PARTY_LABELS.ref),
    grn: extractStrictValue(block, PARTY_LABELS.grn),
    snp: extractStrictValue(block, PARTY_LABELS.snp),
    pc: extractStrictValue(block, PARTY_LABELS.pc),
    oth: extractStrictValue(block, PARTY_LABELS.oth),
  }
}

function hasEnoughData(values) {
  const core = [values.ref, values.lab, values.con, values.ld, values.grn].filter((v) => typeof v === 'number')
  const total = core.reduce((a, b) => a + b, 0)
  return values.lab != null && values.con != null && core.length >= 3 && total >= 40 && total <= 110
}

async function parsePdfPoll(articleUrl, pdfUrl, articleHtml) {
  if (typeof pdfParse !== 'function') {
    throw new Error(`pdf-parse loader resolved to ${typeof pdfParse}, not function`)
  }

  const articleText = stripTags(articleHtml)
  const publishedAt = extractPublishedAtFromArticle(articleHtml, articleUrl)
  const client = extractClientFromArticle(articleText)
  const meta = extractSampleAndFieldwork(articleText, publishedAt)

  const buffer = await fetchBuffer(pdfUrl)
  const parsed = await pdfParse(buffer)
  const pdfText = parsed?.text || ''

  if (!isPoliticalPdf(pdfText)) {
    throw new Error('PDF does not look like a Westminster VI poll')
  }

  const values = extractValuesFromPdf(pdfText)

  if (!hasEnoughData(values)) {
    throw new Error(`Could not extract enough Westminster VI values from PDF: ${JSON.stringify(values)}`)
  }

  return {
    id: `deltapoll-${slugify(meta.fieldworkEnd || publishedAt || articleUrl)}`,
    pollster: 'Deltapoll',
    isBpcMember: true,
    fieldworkStart: meta.fieldworkStart || null,
    fieldworkEnd: meta.fieldworkEnd || publishedAt || null,
    publishedAt: publishedAt || meta.fieldworkEnd || null,
    date: meta.fieldworkEnd || publishedAt || null,
    sample: meta.sample || null,
    method: 'PDF scrape',
    mode: null,
    commissioner: client || null,
    sourceUrl: pdfUrl,
    source: `Deltapoll PDF · ${pdfUrl}`,
    ref: values.ref ?? null,
    lab: values.lab ?? null,
    con: values.con ?? null,
    ld: values.ld ?? null,
    grn: values.grn ?? null,
    snp: values.snp ?? null,
    pc: values.pc ?? null,
    oth: values.oth ?? null,
    confidence: 'high',
    sourceType: 'deltapoll',
  }
}

async function collectArticleUrls() {
  const urls = new Set(FALLBACK_ARTICLE_URLS)

  try {
    const html = await fetchText(POLLS_LIBRARY_URL)
    for (const link of extractLinks(html, POLLS_LIBRARY_URL)) {
      if (isPollArticle(link)) urls.add(link)
    }
  } catch (error) {
    console.warn(`[deltapoll] polls-library fetch failed: ${error.message}`)
  }

  return unique([...urls]).slice(0, MAX_HISTORY * 3)
}

export async function fetchDeltapollPolls() {
  const articleUrls = await collectArticleUrls()
  const polls = []

  for (const url of articleUrls) {
    try {
      const html = await fetchText(url)
      const articleText = stripTags(html)
      if (!isLikelyPoliticalPage(articleText, url)) continue

      const pdfUrl = extractPdfUrl(html, url)
      if (!pdfUrl) throw new Error('No PDF link found on poll page')

      const poll = await parsePdfPoll(url, pdfUrl, html)
      if (poll && !polls.find((p) => p.id === poll.id)) polls.push(poll)
    } catch (error) {
      console.warn(`[deltapoll] skip ${url}: ${error.message}`)
    }

    if (polls.length >= MAX_HISTORY) break
  }

  polls.sort((a, b) => String(b.publishedAt || b.fieldworkEnd || '').localeCompare(String(a.publishedAt || a.fieldworkEnd || '')))

  if (!polls.length) {
    throw new Error('Could not build any Deltapoll voting intention history')
  }

  return polls.slice(0, MAX_HISTORY)
}

export async function fetchDeltapollPoll() {
  const polls = await fetchDeltapollPolls()
  return polls[0] || null
}

export default fetchDeltapollPolls
