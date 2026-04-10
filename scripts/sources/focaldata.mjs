import * as XLSX from 'xlsx'

const BASE = 'https://www.focaldata.com'
const BLOG_URL = `${BASE}/blog`
const DISCOVERY_URLS = [
  BLOG_URL,
  `${BASE}/data-services`,
]
const MAX_ARTICLES = 24

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
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
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

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0',
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

function extractArticleSlugs(html) {
  return [...String(html || '').matchAll(/\b(westminster-voting-intention-[a-z0-9-]+)\b/gi)]
    .map((m) => norm(m[1]))
    .filter(Boolean)
}

function isFocalArticle(url) {
  const l = norm(url)
  if (!l.startsWith('https://www.focaldata.com/blog/')) return false
  if (l === 'https://www.focaldata.com/blog') return false
  if (l.includes('/authors/') || l.includes('/topics/') || l.includes('/category/')) return false
  if (/\.(css|js|png|jpg|jpeg|svg|webp|pdf|xls|xlsx)(\?|$)/i.test(l)) return false
  return l.includes('westminster-voting-intention')
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

function extractPublishedAt(html) {
  const text = stripTags(html)

  let m = String(html).match(/datetime=["'](20\d{2}-\d{2}-\d{2})/i)
  if (m) return m[1]

  m = text.match(/\b([A-Za-z]{3,9})\s+(\d{1,2}),\s*(20\d{2})\b/)
  if (m) {
    const month = MONTHS[norm(m[1])]
    return month ? toIso(m[3], month, m[2]) : null
  }

  m = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/)
  if (m) {
    const month = MONTHS[norm(m[2])]
    return month ? toIso(m[3], month, m[1]) : null
  }

  return null
}

function extractFieldworkAndSample(html) {
  const text = stripTags(html)

  const sampleM =
    text.match(/sample size of\s+([\d,]+)/i) ||
    text.match(/sample size[: ]\s*([\d,]+)/i) ||
    text.match(/with a sample size of\s+([\d,]+)/i)

  const sample = sampleM ? safeNumber(sampleM[1]) : null

  let m = text.match(/conducted(?: between| from)?\s+([A-Za-z]{3,9})\s+(\d{1,2})\s*[–-]\s*([A-Za-z]{3,9})?\s*(\d{1,2}),?\s*(20\d{2})/i)
  if (m) {
    const month1 = MONTHS[norm(m[1])]
    const month2 = MONTHS[norm(m[3] || m[1])]
    if (month1 && month2) {
      return {
        fieldworkStart: toIso(m[5], month1, m[2]),
        fieldworkEnd: toIso(m[5], month2, m[4]),
        sample,
      }
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null, sample }
}

function extractPartyValue(text, labels) {
  for (const label of labels) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`${esc}[^\\d\\n\\r]{0,40}?on\\s+(\\d{1,2})%`, 'i'),
      new RegExp(`${esc}[^\\d\\n\\r]{0,40}?(\\d{1,2})%`, 'i'),
      new RegExp(`${esc}[: ]+(\\d{1,2})%`, 'i'),
      new RegExp(`${esc}[^\\d\\n\\r]{0,24}?(\\d{1,2})(?!\\d)`, 'i'),
    ]
    for (const pat of patterns) {
      const m = text.match(pat)
      if (m) {
        const n = safeNumber(m[1])
        if (n != null && n >= 0 && n <= 100) return n
      }
    }
  }
  return null
}

function extractPartyValuesFromText(htmlOrText) {
  const text = stripTags(htmlOrText)

  return {
    ref: extractPartyValue(text, ['Reform UK', 'Reform']),
    lab: extractPartyValue(text, ['Labour']),
    con: extractPartyValue(text, ['Conservative', 'Conservatives']),
    ld: extractPartyValue(text, ['Liberal Democrat', 'Liberal Democrats', 'Lib Dem', 'Lib Dems']),
    grn: extractPartyValue(text, ['Green Party', 'Greens', 'Green']),
    rb: extractPartyValue(text, ['Restore Britain']),
    snp: extractPartyValue(text, ['SNP']),
    pc: extractPartyValue(text, ['Plaid Cymru']),
    oth: extractPartyValue(text, ['Others', 'Other']),
  }
}

function parseFieldworkRange(text) {
  const value = stripTags(text)

  let m = value.match(/\b(\d{1,2})\s*[–-]\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/)
  if (m) {
    const month = MONTHS[norm(m[3])]
    if (month) {
      return {
        fieldworkStart: toIso(m[4], month, m[1]),
        fieldworkEnd: toIso(m[4], month, m[2]),
      }
    }
  }

  m = value.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s*[–-]\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/)
  if (m) {
    const month1 = MONTHS[norm(m[2])]
    const month2 = MONTHS[norm(m[4])]
    if (month1 && month2) {
      return {
        fieldworkStart: toIso(m[5], month1, m[1]),
        fieldworkEnd: toIso(m[5], month2, m[3]),
      }
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null }
}

function toPct(value) {
  const number = safeNumber(value)
  if (number == null) return null
  const percent = number >= 0 && number <= 1 ? number * 100 : number
  return Math.round(percent)
}

function extractWorkbookUrl(html, articleUrl) {
  return extractLinks(html, articleUrl).find((url) => /\.(xlsx|xls)(\?|$)/i.test(url)) || null
}

function findInfoValue(rows, label) {
  const index = rows.findIndex((row) => norm(row?.[0]) === norm(label))
  if (index < 0) return ''
  return String(rows[index]?.[1] || '').trim()
}

function extractWorkbookMetadata(workbook, publishedAt) {
  const infoName = workbook.SheetNames.find((name) => norm(name) === 'info')
  if (!infoName) {
    return {
      fieldworkStart: null,
      fieldworkEnd: null,
      sample: null,
    }
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[infoName], {
    header: 1,
    raw: false,
    defval: '',
  })

  const datesConducted = findInfoValue(rows, 'Dates conducted')
  const sampleSize = findInfoValue(rows, 'Sample size')
  const parsedDates = parseFieldworkRange(datesConducted || publishedAt || '')

  return {
    fieldworkStart: parsedDates.fieldworkStart,
    fieldworkEnd: parsedDates.fieldworkEnd,
    sample: safeNumber(sampleSize),
  }
}

function extractCombinedVotingIntentionValues(workbook) {
  const tablesName = workbook.SheetNames.find((name) => norm(name) === 'tables')
  if (!tablesName) throw new Error('Missing Tables sheet')

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[tablesName], {
    header: 1,
    raw: false,
    defval: '',
  })

  const sectionIndex = rows.findIndex((row) =>
    /combined voting intention/i.test(String(row?.[0] || ''))
  )
  if (sectionIndex < 0) throw new Error('Missing combined voting intention table')

  const headers = (rows[sectionIndex + 2] || []).map((cell) => String(cell || '').trim())
  const totalIndex = headers.findIndex((cell) => norm(cell) === 'total')
  if (totalIndex < 0) throw new Error('Missing Total column in combined voting intention table')

  const values = {}
  let otherRawTotal = 0

  for (let i = sectionIndex + 3; i < rows.length; i += 1) {
    const label = String(rows[i]?.[0] || '').trim()
    if (!label) continue
    if (/^column n$/i.test(label) || /^column population$/i.test(label)) break

    const rawValue = safeNumber(rows[i]?.[totalIndex])
    if (rawValue == null) continue

    if (/^reform uk$/i.test(label)) values.ref = toPct(rawValue)
    else if (/^labour$/i.test(label)) values.lab = toPct(rawValue)
    else if (/^conservative$/i.test(label)) values.con = toPct(rawValue)
    else if (/^green party$/i.test(label)) values.grn = toPct(rawValue)
    else if (/^liberal democrats$/i.test(label)) values.ld = toPct(rawValue)
    else if (/^scottish national party \(snp\)$/i.test(label)) values.snp = toPct(rawValue)
    else if (/^plaid cymru$/i.test(label)) values.pc = toPct(rawValue)
    else if (/^restore britain$/i.test(label)) values.rb = toPct(rawValue)
    else if (
      /^an independent candidate$/i.test(label) ||
      /^some other party$/i.test(label) ||
      /^workers party$/i.test(label) ||
      /^your party$/i.test(label)
    ) {
      otherRawTotal += rawValue
    }
  }

  if (otherRawTotal > 0) values.oth = toPct(otherRawTotal)
  return values
}

function buildPollFromValues(values, sourceUrl, fallback) {
  const coreCount = ['ref', 'lab', 'con', 'grn', 'ld'].filter((k) => typeof values[k] === 'number').length
  if (values.lab == null || values.con == null) {
    throw new Error('Missing core Westminster parties')
  }

  const publishedAt = fallback.publishedAt || fallback.fieldworkEnd || null
  const fieldworkStart = fallback.fieldworkStart || null
  const fieldworkEnd = fallback.fieldworkEnd || publishedAt || null

  return {
    id: `focaldata-${slugify(fieldworkEnd || publishedAt || sourceUrl)}`,
    pollster: 'Focaldata',
    isBpcMember: true,
    fieldworkStart,
    fieldworkEnd,
    publishedAt,
    date: fieldworkEnd || publishedAt || null,
    sample: fallback.sample ?? null,
    method: 'Online poll',
    mode: 'Online',
    commissioner: null,
    sourceUrl: fallback.articleUrl,
    source: `Focaldata Westminster VI · ${sourceUrl}`,
    ref: values.ref ?? null,
    lab: values.lab ?? null,
    con: values.con ?? null,
    grn: values.grn ?? null,
    ld: values.ld ?? null,
    snp: values.snp ?? null,
    pc: values.pc ?? null,
    oth: values.oth ?? null,
    rb: values.rb ?? null,
    sourceType: 'focaldata',
    confidence:
      coreCount >= 5 &&
      fallback.publishedAt &&
      fallback.fieldworkStart &&
      fallback.fieldworkEnd &&
      fallback.sample
        ? 'high'
        : 'medium',
    verificationStatus: coreCount >= 5 ? 'verified' : 'flagged',
  }
}

async function fetchArticlePoll(articleUrl) {
  const html = await fetchText(articleUrl)
  const text = stripTags(html)

  if (!/westminster voting intention/i.test(text)) {
    throw new Error(`Not a Westminster VI article: ${articleUrl}`)
  }

  const publishedAt = extractPublishedAt(html)
  const workbookUrl = extractWorkbookUrl(html, articleUrl)

  let values = null
  let fieldwork = null

  if (workbookUrl) {
    try {
      const workbook = XLSX.read(await fetchBuffer(workbookUrl), { type: 'buffer' })
      values = extractCombinedVotingIntentionValues(workbook)
      fieldwork = extractWorkbookMetadata(workbook, publishedAt)
    } catch (err) {
      console.warn('[focaldata] workbook parse fallback:', workbookUrl, '-', err.message)
    }
  }

  if (!values) values = extractPartyValuesFromText(html)
  if (!fieldwork) fieldwork = extractFieldworkAndSample(html)

  return buildPollFromValues(values, workbookUrl || articleUrl, {
    articleUrl,
    publishedAt,
    fieldworkStart: fieldwork.fieldworkStart,
    fieldworkEnd: fieldwork.fieldworkEnd,
    sample: fieldwork.sample,
  })
}

function dedupeById(polls) {
  const map = new Map()
  for (const poll of polls || []) {
    if (!poll?.id) continue
    if (!map.has(poll.id)) map.set(poll.id, poll)
  }
  return [...map.values()].sort((a, b) =>
    String(b?.publishedAt || b?.fieldworkEnd || '').localeCompare(String(a?.publishedAt || a?.fieldworkEnd || '')),
  )
}

export async function fetchFocaldataPolls() {
  const articleCandidates = []
  const seen = new Set()

  const discovered = new Set()

  for (const discoveryUrl of DISCOVERY_URLS) {
    const html = await fetchText(discoveryUrl)
    const links = extractLinks(html, discoveryUrl).filter(isFocalArticle)
    for (const link of links) discovered.add(link)
    for (const slug of extractArticleSlugs(html)) {
      discovered.add(`${BASE}/blog/${slug}`)
    }
  }

  const seeded = [
    `${BASE}/blog/westminster-voting-intention-greens-surge-after-by-election-win`,
    `${BASE}/blog/westminster-voting-intention-reforms-lead-drops-to-5-points`,
    ...discovered,
  ]

  for (const link of seeded) {
    if (!isFocalArticle(link)) continue
    if (seen.has(link)) continue
    seen.add(link)
    articleCandidates.push(link)
    if (articleCandidates.length >= MAX_ARTICLES) break
  }

  const polls = []
  for (const articleUrl of articleCandidates) {
    try {
      const poll = await fetchArticlePoll(articleUrl)
      if (poll) polls.push(poll)
    } catch (e) {
      console.log('[focaldata] failed:', articleUrl, '-', e.message)
    }
  }

  return dedupeById(polls)
}

export async function fetchFocaldataPoll() {
  const polls = await fetchFocaldataPolls()
  return polls[0] || null
}

export default fetchFocaldataPolls
