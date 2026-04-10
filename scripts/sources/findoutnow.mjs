import * as XLSX from 'xlsx'

const BLOG_URL = 'https://findoutnow.co.uk/blog/'
const MAX_PAGES = 8
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

  if (!res.ok) {
    throw new Error(`Request failed ${res.status} for ${url}`)
  }

  return res.text()
}

async function fetchArrayBuffer(url, referer = BLOG_URL) {
  const res = await fetch(url, {
    headers: {
      Accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream,*/*',
      'User-Agent': 'Mozilla/5.0',
      Referer: referer,
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`File download failed ${res.status} for ${url}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.toLowerCase().includes('text/html')) {
    const text = await res.text()
    throw new Error(
      `Expected workbook but got HTML from ${url}. Preview: ${text.slice(0, 160).replace(/\s+/g, ' ')}`,
    )
  }

  return res.arrayBuffer()
}

function extractLinks(html, baseUrl) {
  return [...String(html || '').matchAll(/href\s*=\s*"([^"]+)"/gi)]
    .map((m) => absolutizeUrl(baseUrl, m[1]))
    .filter(Boolean)
}

function isMainVotingIntentionArticle(url) {
  const l = norm(url)
  if (!l.includes('/blog/')) return false
  if (!l.includes('voting-intention')) return false
  if (l.includes('restore-britain')) return false
  if (l.includes('your-party')) return false
  if (l.includes('scotland') || l.includes('scottish') || l.includes('senedd') || l.includes('welsh') || l.includes('wales')) return false
  if (l.includes('mrp') || l.includes('favourability') || l.includes('approval')) return false
  return true
}

function scoreArticleUrl(url) {
  const l = norm(url)
  let score = 0
  if (l.startsWith('https://findoutnow.co.uk/blog/')) score += 5
  if (l.includes('voting-intention')) score += 5
  if (l.includes('2026')) score += 3
  if (l.includes('2025')) score += 2
  if (l.includes('2024')) score += 1
  return score
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

function shiftIsoDays(isoDate, days) {
  if (!isoDate) return null
  const d = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function parseArticleSlugDateRange(articleUrl, fallbackYear = null) {
  const pathname = (() => {
    try {
      return new URL(articleUrl).pathname
    } catch {
      return String(articleUrl || '')
    }
  })()

  const slug = pathname.replace(/\/+$/, '').split('/').pop() || ''

  let m = slug.match(/voting-intention-(\d{1,2})(?:st|nd|rd|th)?-(?:to|and)-(\d{1,2})(?:st|nd|rd|th)?-([a-z]{3,9})(?:-(20\d{2}))?$/i)
  if (m) {
    const [, startDay, endDay, monthToken, explicitYear] = m
    const month = MONTHS[norm(monthToken)]
    const year = explicitYear || fallbackYear
    if (!month || !year) return { fieldworkStart: null, fieldworkEnd: null, year: explicitYear || fallbackYear || null }
    return {
      fieldworkStart: toIso(year, month, startDay),
      fieldworkEnd: toIso(year, month, endDay),
      year,
    }
  }

  m = slug.match(/voting-intention-(\d{1,2})(?:st|nd|rd|th)?-([a-z]{3,9})(?:-(20\d{2}))?$/i)
  if (m) {
    const [, day, monthToken, explicitYear] = m
    const month = MONTHS[norm(monthToken)]
    const year = explicitYear || fallbackYear
    if (!month || !year) return { fieldworkStart: null, fieldworkEnd: null, year: explicitYear || fallbackYear || null }
    const iso = toIso(year, month, day)
    return {
      fieldworkStart: iso,
      fieldworkEnd: iso,
      year,
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null, year: fallbackYear || null }
}

function extractPublishedAt(html) {
  const text = stripTags(html)
  const m = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9}),?\s+(20\d{2})\s*\|/i)
  if (!m) return null
  const month = MONTHS[norm(m[2])]
  return month ? toIso(m[3], month, m[1]) : null
}

function extractFieldworkAndSample(html, fallbackYear = null) {
  const text = stripTags(html)
  const sampleM = text.match(/sample of\s+([\d,]+)\s+GB adults/i)
  const sample = sampleM ? safeNumber(sampleM[1]) : null

  let m = text.match(/sample of\s+[\d,]+\s+GB adults on\s+(\d{1,2})(?:st|nd|rd|th)?\s+to\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:\s+(20\d{2}))?/i)
  if (m) {
    const month = MONTHS[norm(m[3])]
    const year = m[4] || fallbackYear
    if (month && year) {
      return {
        fieldworkStart: toIso(year, month, m[1]),
        fieldworkEnd: toIso(year, month, m[2]),
        sample,
      }
    }
  }

  m = text.match(/sample of\s+[\d,]+\s+GB adults on\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:\s+(20\d{2}))?/i)
  if (m) {
    const month = MONTHS[norm(m[2])]
    const year = m[3] || fallbackYear
    if (month && year) {
      const iso = toIso(year, month, m[1])
      return { fieldworkStart: iso, fieldworkEnd: iso, sample }
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null, sample }
}

function parseWorkbookDate(url) {
  const u = norm(url)
  const m = u.match(/\/uploads\/(20\d{2})\/(\d{2})\/([0-9]{1,2})(?:st|nd|rd|th)?-([a-z]+)-vi-find-out-now\.xlsx$/i)
  if (!m) return null
  const year = m[1]
  const month = MONTHS[norm(m[4])]
  if (!month) return null
  return toIso(year, month, m[3])
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

function findBestSheetName(sheetNames) {
  const ranked = sheetNames
    .map((name) => ({ actual: name, n: norm(name) }))
    .filter((s) => !/scotland|scottish|senedd|welsh|wales|raw|crosstab|crossbreak/i.test(s.n))

  const exactOrder = [
    'voting intention',
    'headline voting intention',
    'westminster voting intention',
    'votingintention',
    'vi',
  ]

  for (const wanted of exactOrder) {
    const found = ranked.find((s) => s.n === wanted)
    if (found) return found.actual
  }

  const fuzzy = ranked.find((s) => /voting\s*intention|votingintention|\bvi\b/i.test(s.n))
  return fuzzy?.actual || ranked[0]?.actual || null
}

function findAllColumnIndex(rows) {
  for (const row of rows.slice(0, 16)) {
    const idx = row.findIndex((v) => {
      const n = norm(v)
      return n === 'all' || n === 'gb' || n === 'all adults'
    })
    if (idx >= 1) return idx
  }
  return 1
}

function buildPollFromWorkbook(buffer, sourceUrl, fallback) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = findBestSheetName(workbook.SheetNames)
  if (!sheetName) throw new Error(`Could not find Find Out Now VI sheet. Found: ${workbook.SheetNames.join(', ')}`)

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: '',
  })

  const labelMap = rowsToLabelMap(rows)
  const col = findAllColumnIndex(rows)

  const getVal = (variants) => {
    const row = pickRow(labelMap, variants)
    return row ? safeNumber(row[col]) : null
  }

  const sampleRow =
    pickRow(labelMap, ['weighted n']) ||
    pickRow(labelMap, ['weighted base']) ||
    pickRow(labelMap, ['weighted sample']) ||
    pickRow(labelMap, ['sample'])

  const values = {
    ref: getVal(['reform uk', 'reform']),
    lab: getVal(['labour']),
    con: getVal(['conservative', 'conservatives']),
    grn: getVal(['green party', 'green', 'greens']),
    ld: getVal(['liberal democrats', 'lib dem', 'lib dems', 'liberal democrat']),
    snp: getVal(['snp', 'scottish national party']),
    pc: getVal(['plaid cymru', 'plaid']),
    oth: getVal(['other', 'others']),
    rb: getVal(['restore britain']),
  }

  const coreCount = ['ref', 'lab', 'con', 'grn', 'ld'].filter((k) => typeof values[k] === 'number').length
  if (values.lab == null || values.con == null || coreCount < 3) {
    throw new Error(`Parsed workbook but did not find enough Westminster VI values in sheet ${sheetName}`)
  }

  let publishedAt = fallback.publishedAt || parseWorkbookDate(sourceUrl) || fallback.fieldworkEnd || null
  let fieldworkStart = fallback.fieldworkStart || null
  let fieldworkEnd = fallback.fieldworkEnd || publishedAt || null

  // HARD FIX: prevent bogus future dates
  if (publishedAt && fieldworkEnd) {
    const pub = new Date(publishedAt)
    const end = new Date(fieldworkEnd)

    // if fieldworkEnd is more than 7 days AFTER publishedAt → broken → fix it
    const diffDays = (end - pub) / (1000 * 60 * 60 * 24)

    if (diffDays > 7) {
      fieldworkEnd = publishedAt
      fieldworkStart = publishedAt
    }
  }

  return {
    id: `find-out-now-${slugify(fieldworkEnd || publishedAt || sourceUrl)}`,
    pollster: 'Find Out Now',
    isBpcMember: true,
    fieldworkStart,
    fieldworkEnd,
    publishedAt,
    date: fieldworkEnd || publishedAt || null,
    sample: sampleRow ? safeNumber(sampleRow[col]) : fallback.sample,
    method: 'Turnout adjusted; Don\'t know squeezed',
    mode: 'Online',
    commissioner: null,
    sourceUrl: fallback.articleUrl,
    source: `Find Out Now voting intention tracker · ${sourceUrl}`,
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
}



function extractLatestSeriesValue(text, labels, allLabelsPattern) {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s+([\\d\\s+\\-]{3,40}?)(?=${allLabelsPattern}|How does Find Out Now differ|Our methodology|Full data tables|This poll was initiated|$)`, 'i')
    const m = text.match(re)
    if (!m) continue
    const nums = [...String(m[1]).matchAll(/\d{1,2}/g)].map((x) => Number(x[0]))
    if (nums.length >= 2) {
      return nums[nums.length - 2]
    }
    if (nums.length === 1) {
      return nums[0]
    }
  }
  return null
}

function buildPollFromArticleText(articleUrl, html, fallback) {
  const text = cleanHtml(String(html || ''))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h\d>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/[ ]+/g, ' ')
    .trim()

  const labelsPattern = '(?:Conservative|Labour|Reform UK|Liberal Democrats|Green Party|Greens?)'

  const values = {
    con: extractLatestSeriesValue(text, ['Conservative', 'Conservatives'], labelsPattern),
    lab: extractLatestSeriesValue(text, ['Labour'], labelsPattern),
    ref: extractLatestSeriesValue(text, ['Reform UK', 'Reform'], labelsPattern),
    ld: extractLatestSeriesValue(text, ['Liberal Democrats', 'Liberal Democrat', 'Lib Dems', 'Lib Dem'], labelsPattern),
    grn: extractLatestSeriesValue(text, ['Green Party', 'Greens', 'Green'], labelsPattern),
  }

  const coreCount = ['ref', 'lab', 'con', 'grn', 'ld'].filter((k) => typeof values[k] === 'number').length
  if (values.lab == null || values.con == null || coreCount < 3) {
    throw new Error(`No workbook link and article fallback could not extract enough Westminster VI values for ${articleUrl}`)
  }

  const publishedAt = fallback.publishedAt || fallback.fieldworkEnd || null
  const fieldworkStart = fallback.fieldworkStart || null
  const fieldworkEnd = fallback.fieldworkEnd || publishedAt || null

  const total = [values.ref, values.lab, values.con, values.ld, values.grn]
    .filter((v) => typeof v === 'number')
    .reduce((sum, v) => sum + v, 0)

  if (total > 110) {
    throw new Error(`Rejected article fallback poll with invalid core total ${total}`)
  }

  return {
    id: `find-out-now-${slugify(fieldworkEnd || publishedAt || articleUrl)}`,
    pollster: 'Find Out Now',
    isBpcMember: true,
    fieldworkStart,
    fieldworkEnd,
    publishedAt,
    date: fieldworkEnd || publishedAt || null,
    sample: fallback.sample,
    method: 'Turnout adjusted; Don\'t know squeezed',
    mode: 'Online',
    commissioner: null,
    sourceUrl: articleUrl,
    source: 'Find Out Now voting intention tracker · article text fallback',
    ref: values.ref ?? null,
    lab: values.lab ?? null,
    con: values.con ?? null,
    grn: values.grn ?? null,
    ld: values.ld ?? null,
    snp: null,
    pc: null,
    oth: null,
    rb: null,
  }
}

function extractWorkbookUrl(html, articleUrl) {
  const links = extractLinks(html, articleUrl)
  return (
    links.find((link) => /cms\.findoutnow\.co\.uk\/app\/uploads\/.+\.xlsx$/i.test(link) && /-vi-find-out-now\.xlsx$/i.test(link)) ||
    null
  )
}

async function fetchArticlePoll(articleUrl) {
  const html = await fetchText(articleUrl)
  const publishedAt = extractPublishedAt(html)
  const fallbackYear = publishedAt ? publishedAt.slice(0, 4) : null
  const fieldwork = extractFieldworkAndSample(html, fallbackYear)
  const workbookUrl = extractWorkbookUrl(html, articleUrl)

  if (!workbookUrl) {
    return buildPollFromArticleText(articleUrl, html, {
      articleUrl,
      publishedAt,
      fieldworkStart: fieldwork.fieldworkStart,
      fieldworkEnd: fieldwork.fieldworkEnd,
      sample: fieldwork.sample,
    })
  }

  const buffer = await fetchArrayBuffer(workbookUrl, articleUrl)
  return buildPollFromWorkbook(buffer, workbookUrl, {
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
  return [...map.values()].sort((a, b) => String(b?.publishedAt || b?.fieldworkEnd || '').localeCompare(String(a?.publishedAt || a?.fieldworkEnd || '')))
}

export async function fetchFindOutNowPolls() {
  const pages = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    pages.push(page === 1 ? BLOG_URL : `${BLOG_URL}?page=${page}`)
  }

  const articleCandidates = []
  const seen = new Set()

  for (const pageUrl of pages) {
    let html
    try {
      html = await fetchText(pageUrl)
    } catch {
      continue
    }

    const links = extractLinks(html, pageUrl)
      .filter(isMainVotingIntentionArticle)

    for (const link of links) {
      if (seen.has(link)) continue
      seen.add(link)
      articleCandidates.push(link)
      if (articleCandidates.length >= MAX_HISTORY) break
    }

    if (articleCandidates.length >= MAX_HISTORY) break
  }

  const polls = []
  for (const articleUrl of articleCandidates.slice(0, MAX_HISTORY)) {
    try {
      const poll = await fetchArticlePoll(articleUrl)
      if (poll) polls.push(poll)
    } catch (err) {
      console.warn(`[findoutnow] skip ${articleUrl}: ${err.message}`)
    }
  }

  return dedupeById(polls)
}

export async function fetchFindOutNowPoll() {
  const polls = await fetchFindOutNowPolls()
  return polls[0] || null
}

export default fetchFindOutNowPolls
