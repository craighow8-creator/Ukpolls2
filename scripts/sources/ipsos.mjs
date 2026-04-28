/**
 * ipsos.mjs — Ipsos Political Monitor ingestion
 *
 * Exports:
 *   fetchIpsosPolls()  → Poll[]   archive-first, many rows, newest-first
 *   fetchIpsosPoll()   → Poll     latest only (fallback / convenience)
 */

const BASE         = 'https://www.ipsos.com'
const ARCHIVE_URL  = `${BASE}/en-uk/political-monitor-archive`
const TOPIC_URL    = `${BASE}/en-uk/topic/political-monitor`
const KNOWN_LATEST = `${BASE}/en-uk/reform-hold-6-point-lead-over-labour-and-conservatives`

const HISTORY_LIMIT = 20
const CONCURRENCY = 4

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      Accept:            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://www.ipsos.com/',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function cleanText(html) {
  return String(html || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const n = Number(String(value).trim().replace(/%/g, '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function absolutize(base, href) {
  try { return new URL(href, base).toString() } catch { return href }
}

function parseArchiveUrls(html) {
  const urls = []
  const linkRe = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = linkRe.exec(html)) !== null) {
    const href  = m[1]
    const label = cleanText(m[2])

    if (!href.startsWith('/en-uk/') && !href.startsWith('https://www.ipsos.com/en-uk/')) continue
    if (!/political monitor/i.test(label)) continue
    if (/prediction poll|scottish|welsh/i.test(label)) continue
    if (/archive|older.surveys/i.test(href)) continue
    if (href.startsWith('https://www.google.')) continue

    const url = absolutize(BASE, href)
    if (!urls.includes(url)) urls.push(url)
  }
  return urls
}

function parseTopicUrls(html) {
  const excluded = new Set([
    '/en-uk/topic/political-monitor',
    '/en-uk/insights-hub',
    '/en-uk/about-us',
    '/en-uk/contact',
    '/en-uk/careers-at-ipsos',
  ])
  const re   = /href=["'](\/en-uk\/[a-z0-9][a-z0-9-]+)["']/gi
  const seen = []
  let m
  while ((m = re.exec(html)) !== null) {
    const path = m[1]
    if (!seen.includes(path) && !excluded.has(path) && !path.startsWith('/en-uk/topic/')) {
      seen.push(path)
    }
  }
  return seen.map(p => absolutize(BASE, p))
}

const MONTH_MAP = {
  january:'01', february:'02', march:'03',    april:'04',
  may:'05',     june:'06',     july:'07',      august:'08',
  september:'09', october:'10', november:'11', december:'12',
}
const MO = Object.keys(MONTH_MAP).join('|')

function extractPublishedDate(html) {
  const s = html.match(/\b(\d{2})\.(\d{2})\.(\d{2})\b/)
  if (s) return `20${s[3]}-${s[2]}-${s[1]}`

  const text = cleanText(html)
  const l = text.match(new RegExp(`\\b(\\d{1,2})\\s+(${MO})\\s+(20\\d{2})\\b`, 'i'))
  if (l) return `${l[3]}-${MONTH_MAP[l[2].toLowerCase()]}-${String(l[1]).padStart(2,'0')}`

  return null
}

function extractFieldwork(text) {
  const a = text.match(
    new RegExp(
      `(\\d{1,2})(?:st|nd|rd|th)?\\s*[-–]\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MO})\\s+(20\\d{2})`,
      'i'
    )
  )
  if (a) {
    const mo = MONTH_MAP[a[3].toLowerCase()]
    return {
      fieldworkStart: `${a[4]}-${mo}-${String(a[1]).padStart(2,'0')}`,
      fieldworkEnd:   `${a[4]}-${mo}-${String(a[2]).padStart(2,'0')}`,
    }
  }

  const b = text.match(
    new RegExp(
      `(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MO})\\s*[-–]\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MO})\\s+(20\\d{2})`,
      'i'
    )
  )
  if (b) {
    return {
      fieldworkStart: `${b[5]}-${MONTH_MAP[b[2].toLowerCase()]}-${String(b[1]).padStart(2,'0')}`,
      fieldworkEnd:   `${b[5]}-${MONTH_MAP[b[4].toLowerCase()]}-${String(b[3]).padStart(2,'0')}`,
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null }
}

function extractSample(text) {
  const m = text.match(/(?:probability\s+)?sample\s+of\s+([\d,]+)\s+British\s+adults/i)
  return m ? safeNumber(m[1]) : null
}

function daysBetween(startIso, endIso) {
  if (!startIso || !endIso) return null
  const start = new Date(`${startIso}T00:00:00Z`)
  const end = new Date(`${endIso}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  return Math.round((end - start) / (24 * 60 * 60 * 1000))
}

function extractPartyValues(text) {
  const result = {}

  const summaryLine = text.match(
    /Reform\s+UK\s+(\d+)%[^.]*?Labour\s+(\d+)%[^.]*?Conservatives?\s+(\d+)%/i
  )
  if (summaryLine) {
    result.ref = safeNumber(summaryLine[1])
    result.lab = safeNumber(summaryLine[2])
    result.con = safeNumber(summaryLine[3])

    const grn = text.match(/Green\s+[Pp]arty\s+(\d+)%/i) || text.match(/Greens?\s+(\d+)%/i)
    if (grn) result.grn = safeNumber(grn[1])

    const ld = text.match(/Liberal\s+Democrats?\s+(\d+)%/i) || text.match(/Lib\s+Dems?\s+(\d+)%/i)
    if (ld) result.ld = safeNumber(ld[1])

    const oth = text.match(/Others?\s+(\d+)%/i)
    if (oth) result.oth = safeNumber(oth[1])

    return result
  }

  const patterns = {
    ref: [/Reform\s+UK\s+(\d+)%/i,          /Reform\s+(?:are\s+)?(?:on\s+)?(\d+)%/i],
    lab: [/Labour\s+(\d+)%/i,                /Labour\s+(?:on\s+)?(\d+)%/i],
    con: [/Conservatives?\s+(\d+)%/i,         /Conservative\s+Party\s+(\d+)%/i],
    grn: [/Green\s+[Pp]arty\s+(\d+)%/i,      /Greens?\s+(\d+)%/i],
    ld:  [/Liberal\s+Democrats?\s+(\d+)%/i,   /Lib\s+Dems?\s+(\d+)%/i],
    oth: [/Others?\s+(\d+)%/i],
  }
  for (const [key, pats] of Object.entries(patterns)) {
    for (const pat of pats) {
      const m = text.match(pat)
      if (m) { result[key] = safeNumber(m[1]); break }
    }
  }

  return result
}

function extractTablesUrl(html) {
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const label = cleanText(m[2])
    if (/download\s+(pdf|the\s+tables)/i.test(label) || /tables\s+here/i.test(label)) {
      return absolutize(ARCHIVE_URL, m[1])
    }
  }
  return null
}

async function parseArticle(url) {
  let html
  try {
    html = await fetchText(url)
  } catch (err) {
    console.warn(`[ipsos] skip ${url}: ${err.message}`)
    return null
  }

  const text = cleanText(html)

  const looksLikePoliticalMonitor =
    /political monitor/i.test(text) ||
    /reform\s+uk\s+\d+%/i.test(text) ||
    /labour\s+\d+%/i.test(text) ||
    /conservatives?\s+\d+%/i.test(text)

  if (!looksLikePoliticalMonitor) {
    return null
  }

  const publishedAt = extractPublishedDate(html)
  let { fieldworkStart, fieldworkEnd } = extractFieldwork(text)

  // Ipsos pages include related/latest article teasers in the same HTML. If an
  // old page appears to have future fieldwork, that date came from page chrome.
  const fieldworkAfterPublicationDays = daysBetween(publishedAt, fieldworkEnd)
  if (fieldworkAfterPublicationDays != null && fieldworkAfterPublicationDays > 14) {
    fieldworkStart = null
    fieldworkEnd = null
  }

  const sample = extractSample(text)
  const values = extractPartyValues(text)
  const tablesUrl = extractTablesUrl(html)

  const hasCore = ['ref','lab','con','grn','ld'].some(k => typeof values[k] === 'number')
  if (!hasCore) {
    return null
  }

  const date = fieldworkEnd || publishedAt || null

  return {
    id:             `ipsos-${slugify(fieldworkEnd || publishedAt || url)}`,
    pollster:       'Ipsos',
    isBpcMember:    true,
    fieldworkStart: fieldworkStart ?? null,
    fieldworkEnd:   fieldworkEnd   ?? null,
    publishedAt:    publishedAt    ?? null,
    date,
    sample:         sample         ?? null,
    method:         'Political Monitor',
    mode:           fieldworkEnd && fieldworkEnd >= '2025-06-01'
                      ? 'Online random probability panel'
                      : 'Telephone',
    commissioner:   null,
    sourceUrl:      url,
    source:         tablesUrl
                      ? `Ipsos Political Monitor · tables ${tablesUrl}`
                      : 'Ipsos Political Monitor',
    ref:  values.ref  ?? null,
    lab:  values.lab  ?? null,
    con:  values.con  ?? null,
    grn:  values.grn  ?? null,
    ld:   values.ld   ?? null,
    oth:  values.oth  ?? null,
    rb:   null,
    snp:  null,
  }
}

function dedupePolls(polls) {
  const byId = new Map()

  for (const poll of polls || []) {
    if (!poll?.id) continue
    const existing = byId.get(poll.id)
    if (!existing || String(poll?.publishedAt || '') > String(existing?.publishedAt || '')) {
      byId.set(poll.id, poll)
    }
  }

  return [...byId.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export async function fetchIpsosPolls() {
  let articleUrls = []

  try {
    const archiveHtml = await fetchText(ARCHIVE_URL)
    articleUrls = parseArchiveUrls(archiveHtml)
    console.log(`[ipsos] archive: found ${articleUrls.length} article links`)
  } catch (err) {
    console.warn(`[ipsos] archive page failed (${err.message}), trying topic page`)
    try {
      const topicHtml = await fetchText(TOPIC_URL)
      articleUrls = parseTopicUrls(topicHtml)
      console.log(`[ipsos] topic page: found ${articleUrls.length} article links`)
    } catch (err2) {
      console.warn(`[ipsos] topic page also failed (${err2.message}), using known latest URL`)
      articleUrls = [KNOWN_LATEST]
    }
  }

  const targets = [KNOWN_LATEST, ...articleUrls.filter((url) => url !== KNOWN_LATEST)].slice(0, HISTORY_LIMIT)
  const rows = await mapConcurrent(targets, CONCURRENCY, parseArticle)

  const polls = dedupePolls(rows.filter(Boolean))

  if (polls.length === 0) {
    throw new Error('[ipsos] fetchIpsosPolls: no valid poll rows recovered')
  }

  return polls
}

export async function fetchIpsosPoll() {
  const polls = await fetchIpsosPolls()
  return polls[0]
}

export default fetchIpsosPolls
