import * as XLSX from 'xlsx'

const FEED_URL = 'https://lordashcroftpolls.com/feed/'
const ARTICLE_LIMIT = 16

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

const PARTY_ROWS = [
  { key: 'con', labels: ['Conservative'] },
  { key: 'lab', labels: ['Labour'] },
  { key: 'ld', labels: ['Liberal Democrat', 'Liberal Democrats', 'Lib Dem'] },
  { key: 'ref', labels: ['Reform UK'] },
  { key: 'grn', labels: ['Green Party', 'Green'] },
  { key: 'snp', labels: ['Scottish National Party (SNP)', 'Scottish National Party', 'SNP'] },
  { key: 'pc', labels: ['Plaid Cymru'] },
  { key: 'oth', labels: ['Other'] },
]

function cleanText(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const n = Number(String(value).replace(/[^0-9.-]/g, ''))
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
  try {
    return new URL(href, base).toString()
  } catch {
    return href
  }
}

function toIsoDate(day, monthName, year) {
  const mm = MONTHS[String(monthName || '').trim().toLowerCase()]
  if (!mm) return null
  const dd = String(Number(day)).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function parsePublishedDate(html) {
  const match =
    String(html || '').match(/<time[^>]+datetime=["'](20\d{2}-\d{2}-\d{2})/i) ||
    String(html || '').match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})\b/i)

  if (!match) return null
  if (match[1] && /^\d{4}-\d{2}-\d{2}$/.test(match[1])) return match[1]
  return toIsoDate(match[1], match[2], match[3])
}

function parseFeedItems(xml) {
  const items = []
  const matches = [...String(xml || '').matchAll(/<item\b[\s\S]*?<\/item>/gi)]

  for (const match of matches) {
    const block = match[0]
    const title = cleanText(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '')
    const link = cleanText(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '')
    if (!title || !link) continue
    items.push({ title, link })
  }

  return items
}

function extractTablesUrl(html, articleUrl) {
  const links = [...String(html || '').matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]

  for (const match of links) {
    const href = match[1]
    const label = cleanText(match[2])
    if (/^full data tables$/i.test(label)) {
      return absolutize(articleUrl, href)
    }
  }

  for (const match of links) {
    const href = match[1]
    if (/wp-content\/uploads\/.+\.(?:xls|xlsx)(?:\?.*)?$/i.test(href)) {
      return absolutize(articleUrl, href)
    }
  }

  return null
}

function parseFieldwork(text) {
  const source = cleanText(text)

  const sameMonth = source.match(
    /fieldwork:\s*(\d{1,2})(?:st|nd|rd|th)?\s*[-–]\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(20\d{2})/i,
  )
  if (sameMonth) {
    return {
      fieldworkStart: toIsoDate(sameMonth[1], sameMonth[3], sameMonth[4]),
      fieldworkEnd: toIsoDate(sameMonth[2], sameMonth[3], sameMonth[4]),
    }
  }

  const crossMonth = source.match(
    /fieldwork:\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*[-–]\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(20\d{2})/i,
  )
  if (crossMonth) {
    return {
      fieldworkStart: toIsoDate(crossMonth[1], crossMonth[2], crossMonth[5]),
      fieldworkEnd: toIsoDate(crossMonth[3], crossMonth[4], crossMonth[5]),
    }
  }

  return { fieldworkStart: null, fieldworkEnd: null }
}

function findViSheet(workbook) {
  return workbook.SheetNames.find((name) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: true, defval: '' })
    return rows.some((row) => cleanText(row?.[0]).toUpperCase() === 'CURRENT WESTMINSTER VOTING INTENTION')
  }) || workbook.SheetNames[0]
}

function rebasePartyValues(values) {
  const ordered = PARTY_ROWS
    .map(({ key }) => ({ key, value: values[key] }))
    .filter(({ value }) => value != null)

  const total = ordered.reduce((sum, { value }) => sum + value, 0)
  if (total <= 0) return values

  const scaled = ordered.map(({ key, value }, index) => {
    const exact = (value * 100) / total
    const whole = Math.floor(exact)
    return {
      key,
      index,
      whole,
      fraction: exact - whole,
    }
  })

  let remainder = 100 - scaled.reduce((sum, { whole }) => sum + whole, 0)
  scaled.sort((a, b) => {
    if (b.fraction !== a.fraction) return b.fraction - a.fraction
    return a.index - b.index
  })

  const rebased = { ...values }
  for (const item of scaled) {
    rebased[item.key] = item.whole
  }

  for (const item of scaled) {
    if (remainder <= 0) break
    rebased[item.key] += 1
    remainder -= 1
  }

  return rebased
}

function extractPartyValueRows(rows) {
  const markerIndex = rows.findIndex((row) => cleanText(row?.[0]).toUpperCase() === 'CURRENT WESTMINSTER VOTING INTENTION')
  if (markerIndex === -1) return null

  const values = {}
  const searchRows = rows.slice(markerIndex, markerIndex + 32)

  for (const party of PARTY_ROWS) {
    const row = searchRows.find((candidate) => {
      const label = cleanText(candidate?.[0]).toLowerCase()
      return party.labels.some((wanted) => label === cleanText(wanted).toLowerCase())
    })

    values[party.key] = row ? safeNumber(row[1]) : null
  }

  const undecidedRow = searchRows.find((candidate) => {
    const label = cleanText(candidate?.[0]).toLowerCase()
    return (
      label === "don't know / wnv" ||
      label === 'dont know / wnv' ||
      label === "don't know / didn't vote" ||
      label === 'dont know / didnt vote' ||
      label === "don't know / did not vote" ||
      label === 'dont know / did not vote'
    )
  })
  const undecided = undecidedRow ? safeNumber(undecidedRow[1]) : null

  return { values, undecided }
}

function extractPollFromWorkbook(buffer, articleUrl, tablesUrl, publishedAt) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = findViSheet(workbook)
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: '' })

  const sampleLine = rows.find((row) => /sample size:/i.test(cleanText(row?.[0])))
  const fieldworkLine = rows.find((row) => /fieldwork:/i.test(cleanText(row?.[0])))

  const sample = safeNumber(sampleLine?.[0])
  const { fieldworkStart, fieldworkEnd } = parseFieldwork(fieldworkLine?.[0] || '')
  const extracted = extractPartyValueRows(rows)

  if (!extracted) return null
  let { values, undecided } = extracted
  if ([values.con, values.lab, values.ref, values.grn, values.ld].some((value) => value == null)) return null

  const populated = Object.values(values).filter((value) => value != null).length
  const total = Object.values(values).reduce((sum, value) => sum + (value || 0), 0)

  if (populated < 4) return null
  if (total <= 0 || total > 105) return null
  if ((undecided || 0) > 0 && total < 90) {
    values = rebasePartyValues(values)
  }

  const usableDate = fieldworkEnd || fieldworkStart || publishedAt || null
  if (!usableDate) return null

  return {
    id: `lord-ashcroft-polls-${slugify(publishedAt || usableDate)}`,
    pollster: 'Lord Ashcroft Polls',
    pollsterId: 'lord_ashcroft',
    isBpcMember: false,
    publishedAt: publishedAt || fieldworkEnd || fieldworkStart || null,
    fieldworkStart,
    fieldworkEnd,
    sample,
    method: null,
    mode: null,
    commissioner: null,
    sourceUrl: articleUrl,
    source: `Lord Ashcroft Polls · tables ${tablesUrl}`,
    sourceType: 'lord ashcroft',
    ingestedAt: new Date().toISOString(),
    verificationStatus: 'verified',
    confidence: 'high',
    suspect: false,
    con: values.con,
    lab: values.lab,
    ld: values.ld,
    ref: values.ref,
    grn: values.grn,
    snp: values.snp,
    pc: values.pc,
    rb: null,
    oth: values.oth,
    prompted: false,
    mrp: false,
  }
}

function recordFingerprint(record) {
  return [
    record.fieldworkStart || '',
    record.fieldworkEnd || '',
    record.sample == null ? '' : String(record.sample),
    record.ref == null ? '' : String(record.ref),
    record.lab == null ? '' : String(record.lab),
    record.con == null ? '' : String(record.con),
    record.grn == null ? '' : String(record.grn),
    record.ld == null ? '' : String(record.ld),
    record.snp == null ? '' : String(record.snp),
    record.pc == null ? '' : String(record.pc),
    record.oth == null ? '' : String(record.oth),
  ].join('|')
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'User-Agent': 'Mozilla/5.0',
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

async function fetchBuffer(url, referer) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
      'Accept-Language': 'en-GB,en;q=0.9',
      'User-Agent': 'Mozilla/5.0',
      Referer: referer,
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`Workbook fetch failed ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function fetchLordAshcroftPolls({ limit = ARTICLE_LIMIT } = {}) {
  const feedXml = await fetchText(FEED_URL)
  const items = parseFeedItems(feedXml).slice(0, limit)
  const byFingerprint = new Map()

  for (const item of items) {
    try {
      const articleHtml = await fetchText(item.link)
      const tablesUrl = extractTablesUrl(articleHtml, item.link)
      if (!tablesUrl) continue

      const workbookBuffer = await fetchBuffer(tablesUrl, item.link)
      const record = extractPollFromWorkbook(
        workbookBuffer,
        item.link,
        tablesUrl,
        parsePublishedDate(articleHtml),
      )

      if (record) {
        const fingerprint = recordFingerprint(record)
        const existing = byFingerprint.get(fingerprint)
        if (!existing || String(record.publishedAt || '').localeCompare(String(existing.publishedAt || '')) > 0) {
          byFingerprint.set(fingerprint, record)
        }
      }
    } catch (error) {
      console.warn(`[lordAshcroft] skipped ${item.link}: ${error.message}`)
    }
  }

  return [...byFingerprint.values()].sort((a, b) => {
    const aScore = a.publishedAt || a.fieldworkEnd || a.fieldworkStart || ''
    const bScore = b.publishedAt || b.fieldworkEnd || b.fieldworkStart || ''
    return bScore.localeCompare(aScore)
  })
}

export default fetchLordAshcroftPolls
