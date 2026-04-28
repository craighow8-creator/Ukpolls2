import * as XLSX from 'xlsx'

const YOUGOV_DOWNLOAD_URL =
  'https://api-test.yougov.com/public-data/v5/uk/trackers/voting-intention/download/'

const YOUGOV_TRACKER_URL = 'https://yougov.com/en-gb/trackers/voting-intention'
const YOUGOV_ARTICLES_URL = 'https://yougov.com/en-gb/articles'
const SHEET_NAME = 'All adults'

const PARTY_ROW_MAP = {
  Con: 'con',
  Lab: 'lab',
  'Lib Dem': 'ld',
  SNP: 'snp',
  'Plaid Cymru': 'pc',
  'Reform UK': 'ref',
  Green: 'grn',
  Other: 'oth',
}

const ARTICLE_PARTY_MAP = {
  'reform uk': 'ref',
  'conservatives': 'con',
  'conservative': 'con',
  'labour': 'lab',
  'greens': 'grn',
  'green': 'grn',
  'lib dems': 'ld',
  'liberal democrats': 'ld',
  'lib dem': 'ld',
  'restore britain': 'rb',
  'snp': 'snp',
  'plaid cymru': 'pc',
  'other': 'oth',
  'some other party': 'oth',
  'your party': 'yp',
}

function safeNumber(v) {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

function normalisePct(value) {
  if (value == null || value === '') return null

  const num = Number(value)
  if (!Number.isFinite(num)) return null

  if (num >= 0 && num <= 1) return Math.round(num * 100)
  if (num >= 0 && num <= 100) return Math.round(num)

  return null
}

function slugify(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseIsoDate(value) {
  const text = String(value || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

function formatIsoDate(day, month, year) {
  const months = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  }
  const mm = months[String(month || '').trim().toLowerCase()]
  if (!mm) return null
  return `${year}-${mm}-${String(day).padStart(2, '0')}`
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLatestArticleUrls(html) {
  const urls = []
  const seen = new Set()
  const matches = [
    ...String(html || '').matchAll(/href=["']([^"']*\/en-gb\/articles\/[^"']*voting-intention[^"']*)["']/gi),
    ...String(html || '').matchAll(/https?:\/\/yougov\.com\/en-gb\/articles\/[^"'\s<>]*voting-intention[^"'\s<>]*/gi),
  ]

  for (const match of matches) {
    const rawUrl = Array.isArray(match) ? match[1] || match[0] : match
    try {
      const url = new URL(String(rawUrl || '').replace(/\\\//g, '/'), 'https://yougov.com').toString()
      if (seen.has(url)) continue
      seen.add(url)
      urls.push(url)
    } catch {
      continue
    }
  }

  return urls
}

function extractLatestArticleUrl(html) {
  return extractLatestArticleUrls(html)[0] || null
}

function validatePollShape(poll) {
  const partyKeys = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp', 'pc', 'oth']
  let total = 0
  let count = 0

  for (const key of partyKeys) {
    const value = poll?.[key]
    if (value == null) continue
    if (!Number.isFinite(value) || value < 0 || value > 100) return false
    total += value
    count += 1
  }

  if (poll?.lab == null || poll?.con == null) return false
  if (count < 4) return false
  if (total > 105) return false
  return true
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0',
      Referer: YOUGOV_TRACKER_URL,
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`YouGov text fetch failed ${res.status} for ${url}`)
  }

  return res.text()
}

async function fetchWorkbookBuffer() {
  const res = await fetch(YOUGOV_DOWNLOAD_URL, {
    headers: {
      Accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
      'User-Agent': 'Mozilla/5.0',
      Referer: YOUGOV_TRACKER_URL,
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`YouGov workbook download failed ${res.status}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.toLowerCase().includes('text/html')) {
    const text = await res.text()
    throw new Error(`Expected workbook but got HTML. Preview: ${text.slice(0, 160).replace(/\s+/g, ' ')}`)
  }

  return res.arrayBuffer()
}

function loadRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })

  if (!workbook.Sheets[SHEET_NAME]) {
    throw new Error(`Missing expected YouGov sheet "${SHEET_NAME}". Found: ${workbook.SheetNames.join(', ')}`)
  }

  return XLSX.utils.sheet_to_json(workbook.Sheets[SHEET_NAME], {
    header: 1,
    raw: true,
    defval: '',
  })
}

function findHeaderRowIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 15); i += 1) {
    const row = Array.isArray(rows[i]) ? rows[i] : []
    const dates = row.slice(1).map(parseIsoDate).filter(Boolean)
    if (dates.length >= 5) return i
  }
  return 0
}

function buildRowMap(rows, startIndex = 0) {
  const map = new Map()

  for (const row of rows.slice(startIndex)) {
    if (!Array.isArray(row) || !row.length) continue
    const key = String(row[0] || '').trim()
    if (!key) continue
    map.set(key, row)
  }

  return map
}

function buildWorkbookPoll(date, rowMap, columnIndex) {
  const values = {}

  for (const [sourceRowName, targetKey] of Object.entries(PARTY_ROW_MAP)) {
    const row = rowMap.get(sourceRowName)
    values[targetKey] = row ? normalisePct(row[columnIndex]) : null
  }

  const sampleRow = rowMap.get('Unweighted base') || rowMap.get('Weighted base') || null
  const sample = sampleRow ? safeNumber(sampleRow[columnIndex]) : null

  const poll = {
    id: `yougov-${slugify(date)}`,
    pollster: 'YouGov',
    isBpcMember: true,
    date,
    publishedAt: date,
    fieldworkStart: null,
    fieldworkEnd: date,
    sample,
    method: 'Weekly tracker',
    mode: 'Online',
    commissioner: null,
    sourceUrl: YOUGOV_TRACKER_URL,
    source: `YouGov voting intention tracker · workbook · ${YOUGOV_DOWNLOAD_URL}`,
    ref: values.ref ?? null,
    lab: values.lab ?? null,
    con: values.con ?? null,
    grn: values.grn ?? null,
    ld: values.ld ?? null,
    snp: values.snp ?? null,
    pc: values.pc ?? null,
    oth: values.oth ?? null,
    rb: null,
  }

  return validatePollShape(poll) ? poll : null
}

function extractLatestArticlePoll(html, url) {
  const text = htmlToText(html)

  const titleDate =
    String(html).match(/Voting intention,\s*(\d{1,2})-(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})/i) ||
    text.match(/Voting intention,\s*(\d{1,2})-(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})/i)

  if (!titleDate) {
    throw new Error('Could not find YouGov article date range')
  }

  const fieldworkStart = formatIsoDate(titleDate[1], titleDate[3], titleDate[4])
  const fieldworkEnd = formatIsoDate(titleDate[2], titleDate[3], titleDate[4])

  const publishedMatch = String(html).match(/>\s*(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})\s*</)
  const publishedAt = publishedMatch
    ? formatIsoDate(publishedMatch[1], publishedMatch[2], publishedMatch[3])
    : fieldworkEnd

  const values = {
    ref: null, lab: null, con: null, grn: null, ld: null,
    rb: null, snp: null, pc: null, oth: null, yp: null,
  }

  const bulletMatches = [...text.matchAll(/([A-Za-z][A-Za-z '\-]+?):\s*(\d{1,2})%/g)]
  for (const match of bulletMatches) {
    const label = String(match[1] || '').trim().toLowerCase()
    const value = safeNumber(match[2])
    const target = ARTICLE_PARTY_MAP[label]
    if (!target || value == null) continue
    values[target] = value
  }

  if (values.oth == null && values.yp != null) {
    values.oth = values.yp
  }

  const poll = {
    id: `yougov-${slugify(fieldworkEnd)}`,
    pollster: 'YouGov',
    isBpcMember: true,
    date: fieldworkEnd,
    publishedAt,
    fieldworkStart,
    fieldworkEnd,
    sample: null,
    method: 'Weekly tracker',
    mode: 'Online',
    commissioner: 'The Times and Sky News',
    sourceUrl: url,
    source: `YouGov voting intention article · ${url}`,
    ref: values.ref,
    lab: values.lab,
    con: values.con,
    grn: values.grn,
    ld: values.ld,
    snp: values.snp,
    pc: values.pc,
    oth: values.oth,
    rb: values.rb,
  }

  if (!validatePollShape(poll)) {
    throw new Error(`Article poll failed validation: ${JSON.stringify({
      ref: poll.ref, lab: poll.lab, con: poll.con, grn: poll.grn, ld: poll.ld, rb: poll.rb, snp: poll.snp, pc: poll.pc, oth: poll.oth
    })}`)
  }

  return poll
}

function dedupeAndSortPolls(polls = []) {
  const byKey = new Map()

  for (const poll of polls) {
    if (!poll) continue
    const key = poll.id || `${poll.pollster || 'YouGov'}-${poll.fieldworkEnd || poll.date || poll.publishedAt || ''}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, poll)
      continue
    }

    const existingIsWorkbook = String(existing.source || '').includes('workbook')
    const incomingIsArticle = String(poll.source || '').includes('article')
    if (existingIsWorkbook && incomingIsArticle) {
      byKey.set(key, poll)
    }
  }

  return [...byKey.values()].sort((a, b) =>
    String(b?.publishedAt || b?.fieldworkEnd || b?.date || '').localeCompare(
      String(a?.publishedAt || a?.fieldworkEnd || a?.date || ''),
    ),
  )
}

async function fetchYouGovLatestArticlePoll() {
  const candidates = []

  for (const sourceUrl of [YOUGOV_TRACKER_URL, YOUGOV_ARTICLES_URL]) {
    try {
      const html = await fetchText(sourceUrl)
      candidates.push(...extractLatestArticleUrls(html))
    } catch (e) {
      console.warn(`YouGov article index fetch failed for ${sourceUrl}`, e)
    }
  }

  candidates.push(`${YOUGOV_ARTICLES_URL}/54492-voting-intention-6-7-april-2026-ref-24-con-19-lab-16-grn-16-ld-13`)

  const seen = new Set()
  for (const articleUrl of candidates) {
    if (!articleUrl || seen.has(articleUrl)) continue
    seen.add(articleUrl)

    try {
      const articleHtml = await fetchText(articleUrl)
      return extractLatestArticlePoll(articleHtml, articleUrl)
    } catch (e) {
      console.warn(`YouGov article parse failed for ${articleUrl}`, e)
    }
  }

  return null
}

export async function fetchYouGovPolls() {
  const polls = []

  try {
    const buffer = await fetchWorkbookBuffer()
    const rows = loadRows(buffer)
    const headerRowIndex = findHeaderRowIndex(rows)
    const headerRow = rows[headerRowIndex] || []
    const rowMap = buildRowMap(rows, headerRowIndex + 1)

    for (const requiredRow of Object.keys(PARTY_ROW_MAP)) {
      if (!rowMap.has(requiredRow)) {
        throw new Error(`YouGov workbook missing expected row "${requiredRow}"`)
      }
    }

    for (let col = 1; col < headerRow.length; col += 1) {
      const date = parseIsoDate(headerRow[col])
      if (!date) continue

      const poll = buildWorkbookPoll(date, rowMap, col)
      if (poll) polls.push(poll)
    }
  } catch (e) {
    console.warn('YouGov history failed', e)
  }

  try {
    const latestArticlePoll = await fetchYouGovLatestArticlePoll()
    if (latestArticlePoll) polls.push(latestArticlePoll)
  } catch (e) {
    console.warn('YouGov latest article merge failed', e)
  }

  return dedupeAndSortPolls(polls)
}

export async function fetchYouGovPoll() {
  try {
    const articlePoll = await fetchYouGovLatestArticlePoll()
    if (articlePoll) return articlePoll
  } catch (e) {
    console.warn('YouGov latest article parse failed, falling back to workbook', e)
  }

  const polls = await fetchYouGovPolls()
  return polls[0] || null
}

export default fetchYouGovPolls
