const WIKIPEDIA_PAGE_TITLE = 'Opinion_polling_for_the_next_United_Kingdom_general_election'
const WIKIPEDIA_SOURCE_URL =
  'https://en.wikipedia.org/wiki/Opinion_polling_for_the_next_United_Kingdom_general_election'

const TARGET_YEARS = [2026, 2025, 2024]

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&minus;/gi, '-')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function stripTags(html) {
  return decodeHtmlEntities(
    String(html || '')
      .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' / ')
      .replace(/<\/?(?:span|a|b|strong|i|em|small|div|p|abbr)[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[[^\]]*]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function normaliseText(text) {
  return stripTags(text).toLowerCase().replace(/\s+/g, ' ').trim()
}

function safeIdPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractNumber(value) {
  const text = stripTags(value).replace(/,/g, '')
  if (!text || text === '–' || text === '-') return null
  const match = text.match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  return Number(match[0])
}

function extractSample(value) {
  const text = stripTags(value).replace(/,/g, '')
  const match = text.match(/\d{3,6}/)
  return match ? Number(match[0]) : null
}

function parseCells(rowHtml) {
  const cellRegex = /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi
  const cells = []
  let match
  while ((match = cellRegex.exec(rowHtml)) !== null) {
    cells.push(match[2])
  }
  return cells
}

function parseRows(tableHtml) {
  const rows = []
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
  let match
  while ((match = rowRegex.exec(tableHtml)) !== null) {
    const cells = parseCells(match[1])
    if (cells.length) rows.push(cells)
  }
  return rows
}

function extractWikitables(html) {
  const tables = []
  const regex = /<table\b[^>]*class="[^"]*\bwikitable\b[^"]*"[^>]*>[\s\S]*?<\/table>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    tables.push(match[0])
  }
  return tables
}

function isTargetHeaderRow(cells) {
  const text = cells.map(normaliseText).join(' | ')
  return (
    text.includes('date') &&
    text.includes('pollster') &&
    text.includes('client') &&
    text.includes('sample') &&
    (text.includes('lab') || text.includes('labour')) &&
    (text.includes('con') || text.includes('conservative')) &&
    (text.includes('ref') || text.includes('reform'))
  )
}

function looksLikeMainPollRow(cells) {
  if (!Array.isArray(cells) || cells.length !== 14) return false
  if (!/\d/.test(stripTags(cells[0]))) return false
  if (!stripTags(cells[1])) return false
  return true
}

function normalisePollster(rawPollster) {
  const value = normaliseText(rawPollster)
  if (!value) return null

  const aliases = [
    ['yougov', 'YouGov'],
    ['more in common', 'More in Common'],
    ['opinium', 'Opinium'],
    ['ipsos', 'Ipsos'],
    ['find out now', 'Find Out Now'],
    ['focaldata', 'Focaldata'],
    ['lord ashcroft', 'Lord Ashcroft Polls'],
    ['ashcroft', 'Lord Ashcroft Polls'],
    ['verian', 'Verian'],
    ['techne', 'Techne'],
    ['jl partners', 'JL Partners'],
    ['j.l. partners', 'JL Partners'],
    ['deltapoll', 'Deltapoll'],
    ['survation', 'Survation'],
    ['bmg', 'BMG Research'],
    ['freshwater', 'Freshwater Strategy'],
    ['good growth foundation', 'Good Growth Foundation'],
    ['whitestone', 'Whitestone Insight'],
    ['we think', 'We Think'],
    ['stonehaven', 'Stonehaven'],
  ]

  for (const [needle, label] of aliases) {
    if (value.includes(needle)) return label
  }

  return stripTags(rawPollster)
}

function maybeRollBackOneYear(iso, now) {
  if (!iso) return null
  const ts = Date.parse(`${iso}T00:00:00Z`)
  if (Number.isNaN(ts)) return iso

  const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000
  if (ts <= now.getTime() + fortyFiveDaysMs) return iso

  const d = new Date(ts)
  d.setUTCFullYear(d.getUTCFullYear() - 1)
  return d.toISOString().slice(0, 10)
}

function parseUkDateRange(dateText, year, now = new Date()) {
  const text = stripTags(dateText)
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

  const monthMap = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  }

  function toIso(y, monthKey, day) {
    const month = monthMap[String(monthKey || '').toLowerCase()]
    if (!month) return null
    return `${y}-${month}-${String(day).padStart(2, '0')}`
  }

  let fieldworkStart = null
  let fieldworkEnd = null

  let m = text.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/)
  if (m) {
    fieldworkStart = toIso(m[4], m[3], m[1])
    fieldworkEnd = toIso(m[4], m[3], m[2])
  } else {
    m = text.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s*-\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/)
    if (m) {
      fieldworkStart = toIso(m[5], m[2], m[1])
      fieldworkEnd = toIso(m[5], m[4], m[3])
    } else {
      m = text.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/)
      if (m) {
        fieldworkStart = toIso(m[3], m[2], m[1])
        fieldworkEnd = fieldworkStart
      } else {
        m = text.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]{3,9})/)
        if (m) {
          fieldworkStart = toIso(year, m[3], m[1])
          fieldworkEnd = toIso(year, m[3], m[2])
        } else {
          m = text.match(/(\d{1,2})\s+([A-Za-z]{3,9})/)
          if (m) {
            fieldworkStart = toIso(year, m[2], m[1])
            fieldworkEnd = fieldworkStart
          }
        }
      }
    }
  }

  fieldworkStart = maybeRollBackOneYear(fieldworkStart, now)
  fieldworkEnd = maybeRollBackOneYear(fieldworkEnd, now)

  return { fieldworkStart, fieldworkEnd }
}

function rowToPollRecord(cells, year, now = new Date()) {
  const pollster = normalisePollster(cells[1])
  if (!pollster) return null

  const { fieldworkStart, fieldworkEnd } = parseUkDateRange(cells[0], year, now)
  const recordDate = fieldworkEnd || fieldworkStart
  if (!recordDate) return null

  const record = {
    id: `${safeIdPart(pollster)}-${recordDate}`,
    pollster,
    publishedAt: recordDate,
    fieldworkStart,
    fieldworkEnd,
    sample: extractSample(cells[4]),
    sourceUrl: WIKIPEDIA_SOURCE_URL,
    source: 'Wikipedia national poll tracker',
    lab: extractNumber(cells[5]),
    con: extractNumber(cells[6]),
    ref: extractNumber(cells[7]),
    ld: extractNumber(cells[8]),
    grn: extractNumber(cells[9]),
    snp: extractNumber(cells[10]),
    pc: extractNumber(cells[11]),
    oth: extractNumber(cells[12]),
    rb: null,
  }

  const values = [record.lab, record.con, record.ref, record.ld, record.grn, record.snp, record.pc, record.oth]
  const total = values.filter((v) => v != null).reduce((a, b) => a + b, 0)

  if (total > 105) return null

  return record
}

function dedupeRecords(records) {
  const byId = new Map()
  for (const record of records) {
    if (!record) continue
    if (!byId.has(record.id)) byId.set(record.id, record)
  }
  return Array.from(byId.values()).sort((a, b) => {
    const aDate = a.fieldworkEnd || a.fieldworkStart || ''
    const bDate = b.fieldworkEnd || b.fieldworkStart || ''
    return bDate.localeCompare(aDate)
  })
}

async function wikiApi(params) {
  const url = new URL('https://en.wikipedia.org/w/api.php')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')
  url.searchParams.set('origin', '*')

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PolitiscopeWikipediaIngestor/4.0',
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Wikipedia request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchSectionList() {
  const json = await wikiApi({
    action: 'parse',
    page: WIKIPEDIA_PAGE_TITLE,
    prop: 'sections',
    redirects: '1',
  })
  return json?.parse?.sections || []
}

async function fetchSectionHtml(sectionIndex) {
  const json = await wikiApi({
    action: 'parse',
    page: WIKIPEDIA_PAGE_TITLE,
    prop: 'text',
    section: sectionIndex,
    redirects: '1',
  })
  return json?.parse?.text || ''
}

function findYearSectionIndexes(sections) {
  const result = new Map()
  for (const section of sections) {
    const line = String(section?.line || '').trim()
    const index = section?.index
    for (const year of TARGET_YEARS) {
      if (line === String(year) && index != null && !result.has(year)) {
        result.set(year, index)
      }
    }
  }
  return result
}

function extractRecordsFromSectionHtml(sectionHtml, year, now = new Date()) {
  const tables = extractWikitables(sectionHtml)
  for (const tableHtml of tables) {
    const rows = parseRows(tableHtml)
    if (!rows.length || !rows.some(isTargetHeaderRow)) continue

    const records = rows
      .filter(looksLikeMainPollRow)
      .map((row) => rowToPollRecord(row, year, now))
      .filter(Boolean)

    if (records.length) return records
  }
  return []
}

export async function fetchWikipediaPolls() {
  const sections = await fetchSectionList()
  const yearIndexes = findYearSectionIndexes(sections)
  const allRecords = []
  const now = new Date()

  for (const year of TARGET_YEARS) {
    const sectionIndex = yearIndexes.get(year)
    if (!sectionIndex) continue
    const html = await fetchSectionHtml(sectionIndex)
    allRecords.push(...extractRecordsFromSectionHtml(html, year, now))
  }

  return dedupeRecords(allRecords)
}

export async function fetchWikipediaPoll() {
  const polls = await fetchWikipediaPolls()
  return polls[0] || null
}

export default fetchWikipediaPolls
