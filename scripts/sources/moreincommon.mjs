import * as XLSX from 'xlsx'

const MIC_TABLES_URL = 'https://www.moreincommon.org.uk/our-work/polling-tables/'
const MAX_HISTORY_PAGES = 24
const MAX_POLLS = 40

function norm(value) {
  return String(value || '').trim().toLowerCase()
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

function extractLinks(html, baseUrl) {
  const matches = [...String(html || '').matchAll(/href\s*=\s*"([^"]+)"/gi)]
  return matches
    .map((m) => m[1])
    .filter(Boolean)
    .map((href) => absolutizeUrl(baseUrl, href))
}

function rowsToLabelMap(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = String(row?.[0] || '').trim().toLowerCase()
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

function parseMicPageYear(pageUrl) {
  const m = String(pageUrl || '').match(/(20\d{2})/i)
  return m ? m[1] : null
}

function parseMicFileDate(link, fallbackYear = null) {
  const l = String(link || '').toLowerCase()

  const monthNames = {
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

  let m =
    l.match(/(\d{1,2})-(january|february|march|april|may|june|july|august|september|october|november|december)(?:-(\d{4}))?/) ||
    l.match(/(january|february|march|april|may|june|july|august|september|october|november|december)-(\d{1,2})(?:-(\d{4}))?/) ||
    l.match(/(\d{4})-(\d{2})-(\d{2})/)

  if (!m) return null

  if (m.length === 4 && /^\d{4}$/.test(m[1]) && /^\d{2}$/.test(m[2]) && /^\d{2}$/.test(m[3])) {
    return `${m[1]}-${m[2]}-${m[3]}`
  }

  if (isNaN(Number(m[1]))) {
    const month = monthNames[m[1]]
    const day = String(m[2]).padStart(2, '0')
    const year = m[3] || fallbackYear
    return year ? `${year}-${month}-${day}` : null
  }

  const day = String(m[1]).padStart(2, '0')
  const month = monthNames[m[2]]
  const year = m[3] || fallbackYear
  return year ? `${year}-${month}-${day}` : null
}

function scoreDocPage(link) {
  const l = norm(link)
  let score = 0
  if (l.includes('/our-work/polling-tables/')) score += 5
  if (l.includes('polling-tables')) score += 3
  if (l.includes('2026')) score += 3
  if (l.includes('2025')) score += 2
  if (l.includes('2024')) score += 1
  if (l.includes('april')) score += 2
  if (l.includes('march')) score += 2
  return score
}

function isRealWorkbookLink(link) {
  const l = norm(link)
  return (
    (l.endsWith('.xlsx') || l.endsWith('.xls')) &&
    !l.endsWith('/#') &&
    !l.endsWith('#') &&
    !l.includes('/our-work/polling-tables/')
  )
}

function scoreVotingFile(link, fallbackYear = null) {
  const l = norm(link)
  let score = 0
  if (!isRealWorkbookLink(link)) return -999
  if (l.includes('voting-intention') || l.includes('votingintention')) score += 10
  if (parseMicFileDate(link, fallbackYear)) score += 8

  if (l.includes('senedd')) score -= 50
  if (l.includes('welsh')) score -= 50
  if (l.includes('wales')) score -= 50
  if (l.includes('scotland')) score -= 50
  if (l.includes('scottish')) score -= 50

  if (l.includes('approval')) score -= 10
  if (l.includes('economy')) score -= 10
  if (l.includes('sexuality')) score -= 10
  if (l.includes('tracker')) score -= 3
  return score
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
      Referer: MIC_TABLES_URL,
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`File download failed ${res.status} for ${url}`)

  const contentType = res.headers.get('content-type') || ''
  if (contentType.toLowerCase().includes('text/html')) {
    const text = await res.text()
    throw new Error(`Expected xlsx but got HTML from ${url}. Preview: ${text.slice(0, 160).replace(/\s+/g, ' ')}`)
  }

  return { buffer: await res.arrayBuffer(), contentType }
}

function findBestSheetName(sheetNames) {
  const lower = sheetNames.map((s) => ({ actual: s, n: norm(s) }))

  const allowed = lower.filter(
    (s) =>
      s.n.includes('votingintention') &&
      !s.n.includes('raw') &&
      !s.n.includes('sexuality') &&
      !s.n.includes('senedd') &&
      !s.n.includes('welsh') &&
      !s.n.includes('wales') &&
      !s.n.includes('scotland') &&
      !s.n.includes('scottish'),
  )

  const exactOrder = [
    'votingintention (likely voters)',
    'votingintention (headline)',
    'votingintention (final)',
    'votingintention',
    'votingforced',
  ]

  for (const wanted of exactOrder) {
    const found = allowed.find((s) => s.n === wanted)
    if (found) return found.actual
  }

  return allowed[0]?.actual || null
}

function findAllColumnIndex(rows) {
  for (const row of rows.slice(0, 12)) {
    const idx = row.findIndex((v) => norm(v) === 'all')
    if (idx >= 1) return idx
  }
  return 1
}

function buildPollFromWorkbook(buffer, sourceFile, sourcePage) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = findBestSheetName(workbook.SheetNames)
  if (!sheetName) throw new Error(`Could not find Westminster voting intention sheet. Found: ${workbook.SheetNames.join(', ')}`)

  const lowerSheet = norm(sheetName)
  const lowerFile = norm(sourceFile)
  if (
    lowerSheet.includes('senedd') ||
    lowerSheet.includes('welsh') ||
    lowerSheet.includes('wales') ||
    lowerSheet.includes('scotland') ||
    lowerSheet.includes('scottish') ||
    lowerFile.includes('senedd') ||
    lowerFile.includes('welsh') ||
    lowerFile.includes('wales') ||
    lowerFile.includes('scotland') ||
    lowerFile.includes('scottish')
  ) {
    throw new Error(`Rejected non-Westminster workbook: ${sourceFile} / ${sheetName}`)
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' })
  const labelMap = rowsToLabelMap(rows)
  const col = findAllColumnIndex(rows)

  const getVal = (variants) => {
    const row = pickRow(labelMap, variants)
    return row ? parsePercent(row[col]) : null
  }

  const weightedRow = pickRow(labelMap, ['weighted n'])
  const adjustmentsRow = pickRow(labelMap, ['adjustments:'])
  const year = parseMicPageYear(sourcePage)
  const publishedAt = parseMicFileDate(sourceFile, year)
  if (!publishedAt) throw new Error(`Rejected workbook with null date: ${sourceFile}`)

  const poll = {
    id: `more-in-common-${slugify(publishedAt || sourceFile)}`,
    pollster: 'More in Common',
    isBpcMember: true,
    fieldworkStart: null,
    fieldworkEnd: publishedAt,
    publishedAt,
    date: publishedAt,
    sample: weightedRow ? safeNumber(weightedRow[col]) : null,
    method: adjustmentsRow ? String(adjustmentsRow[col] || '').trim() || 'Workbook poll' : 'Workbook poll',
    mode: null,
    commissioner: null,
    sourceUrl: sourceFile,
    source: `More in Common workbook · ${sheetName}`,
    sourceType: 'more in common',
    verificationStatus: 'verified',
    confidence: 'high',
    prompted: false,
    mrp: false,
    ref: getVal(['reform uk', 'reform']),
    lab: getVal(['labour']),
    con: getVal(['conservative']),
    grn: getVal(['the green party', 'green']),
    ld: getVal(['liberal democrat', 'liberal democrats', 'lib dem', 'lib dems']),
    rb: getVal(['restore britain']),
    snp: getVal(['scottish national party (snp)', 'snp']),
  }

  const hasCore = [poll.ref, poll.lab, poll.con, poll.grn, poll.ld].some((v) => typeof v === 'number')
  if (!hasCore) throw new Error(`Parsed workbook but did not find Westminster core party values in sheet ${sheetName}`)

  return poll
}

function dedupeById(polls) {
  const map = new Map()
  for (const poll of polls || []) {
    if (!poll?.id) continue
    if (!map.has(poll.id)) map.set(poll.id, poll)
  }
  return [...map.values()].sort((a, b) => String(b?.publishedAt || b?.fieldworkEnd || '').localeCompare(String(a?.publishedAt || a?.fieldworkEnd || '')))
}

async function fetchPagePolls(sourcePage) {
  const pageYear = parseMicPageYear(sourcePage)
  const docHtml = await fetchText(sourcePage)
  const docLinks = extractLinks(docHtml, sourcePage)

  const rankedFiles = docLinks
    .filter((link) => isRealWorkbookLink(link))
    .map((link) => ({ link, score: scoreVotingFile(link, pageYear), parsedDate: parseMicFileDate(link, pageYear) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if ((b.parsedDate || '') !== (a.parsedDate || '')) return String(b.parsedDate || '').localeCompare(String(a.parsedDate || ''))
      return b.score - a.score
    })

  const polls = []
  for (const file of rankedFiles) {
    try {
      const { buffer } = await fetchArrayBuffer(file.link)
      const poll = buildPollFromWorkbook(buffer, file.link, sourcePage)
      if (poll) polls.push(poll)
    } catch {
      // keep going
    }
  }

  return dedupeById(polls)
}

export async function fetchMoreInCommonPolls() {
  const tablesHtml = await fetchText(MIC_TABLES_URL)
  const topLinks = extractLinks(tablesHtml, MIC_TABLES_URL)

  const candidatePages = topLinks
    .filter((link) => norm(link).includes('/our-work/polling-tables/'))
    .filter((link) => norm(link) !== norm(MIC_TABLES_URL))
    .filter((link) => !norm(link).endsWith('#'))
    .map((link) => ({ link, score: scoreDocPage(link) }))
    .sort((a, b) => b.score - a.score)

  const uniquePages = []
  const seenPages = new Set()
  for (const item of candidatePages) {
    if (seenPages.has(item.link)) continue
    seenPages.add(item.link)
    uniquePages.push(item.link)
    if (uniquePages.length >= MAX_HISTORY_PAGES) break
  }

  if (!uniquePages.length) throw new Error('Could not find More in Common polling tables pages')

  const allPolls = []
  for (const page of uniquePages) {
    try {
      const pagePolls = await fetchPagePolls(page)
      allPolls.push(...pagePolls)
      if (allPolls.length >= MAX_POLLS) break
    } catch {
      // keep going
    }
  }

  const deduped = dedupeById(allPolls).slice(0, MAX_POLLS)
  if (!deduped.length) throw new Error('Could not build any More in Common poll history from workbook pages')
  return deduped
}

export async function fetchMoreInCommonPoll() {
  const polls = await fetchMoreInCommonPolls()
  return polls[0] || null
}

export default fetchMoreInCommonPolls
