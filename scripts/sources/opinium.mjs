const OPINIUM_PAGE_URL = 'https://www.opinium.com/resource-center/voting-intention-18th-march-2026/'

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

function parseIsoFromSlug(url) {
  const m = String(url || '').match(/(\d{1,2})(?:st|nd|rd|th)?-(january|february|march|april|may|june|july|august|september|october|november|december)-(20\d{2})/i)
  if (!m) return null
  const monthMap = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  }
  return `${m[3]}-${monthMap[m[2].toLowerCase()]}-${String(m[1]).padStart(2, '0')}`
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

function extractDataTablesUrl(html) {
  const links = [...String(html || '').matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  for (const [, href, inner] of links) {
    const text = cleanText(inner)
    if (/data tables/i.test(text)) {
      return absolutizeUrl(OPINIUM_PAGE_URL, href)
    }
  }
  return null
}

function extractSampleAndFieldwork(text) {
  const sampleMatch = text.match(/surveyed\s+([\d,]+)\s+UK adults/i)
  const sample = sampleMatch ? safeNumber(sampleMatch[1]) : null

  const fieldworkMatch = text.match(/between\s+(\d{1,2})(?:st|nd|rd|th)?\s+and\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})/i)
  let fieldworkStart = null
  let fieldworkEnd = null

  if (fieldworkMatch) {
    const monthMap = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    }
    const month = monthMap[fieldworkMatch[3].toLowerCase()]
    const year = fieldworkMatch[4]
    fieldworkStart = `${year}-${month}-${String(fieldworkMatch[1]).padStart(2, '0')}`
    fieldworkEnd = `${year}-${month}-${String(fieldworkMatch[2]).padStart(2, '0')}`
  }

  return { sample, fieldworkStart, fieldworkEnd }
}

function extractOpiniumValues(text) {
  const values = {}

  const reform = text.match(/Reform UK leads the vote share on\s+(\d+)%/i)
  if (reform) values.ref = safeNumber(reform[1])

  const labour = text.match(/Labour remains on\s+(\d+)%/i)
  if (labour) values.lab = safeNumber(labour[1])

  const con = text.match(/Conservatives on\s+(\d+)%/i)
  if (con) values.con = safeNumber(con[1])

  const green = text.match(/Greens hold steady on\s+(\d+)%/i)
  if (green) values.grn = safeNumber(green[1])

  const ld = text.match(/Liberal Democrats rise to\s+(\d+)%/i)
  if (ld) values.ld = safeNumber(ld[1])

  const snp = text.match(/SNP on\s+(\d+)%/i)
  if (snp) values.snp = safeNumber(snp[1])

  return values
}

export async function fetchOpiniumPoll() {
  const html = await fetchText(OPINIUM_PAGE_URL)
  const text = cleanText(html)

  const publishedAt = parseIsoFromSlug(OPINIUM_PAGE_URL)
  const { sample, fieldworkStart, fieldworkEnd } = extractSampleAndFieldwork(text)
  const dataTablesUrl = extractDataTablesUrl(html)
  const values = extractOpiniumValues(text)

  const poll = {
    id: `opinium-${slugify(publishedAt || fieldworkEnd || 'latest')}`,
    pollster: 'Opinium',
    isBpcMember: true,
    fieldworkStart,
    fieldworkEnd,
    publishedAt,
    date: fieldworkEnd || publishedAt || null,
    sample,
    method: 'Online poll',
    mode: 'Online',
    commissioner: null,
    sourceUrl: OPINIUM_PAGE_URL,
    source: dataTablesUrl ? `Opinium voting intention page · data tables ${dataTablesUrl}` : 'Opinium voting intention page',
    ref: values.ref ?? null,
    lab: values.lab ?? null,
    con: values.con ?? null,
    grn: values.grn ?? null,
    ld: values.ld ?? null,
    rb: null,
    snp: values.snp ?? null,
  }

  const hasCore = [poll.ref, poll.lab, poll.con, poll.grn, poll.ld].some(
    (v) => typeof v === 'number',
  )

  if (!hasCore) {
    throw new Error('Opinium parser did not find core party values on page')
  }

  return poll
}

export default fetchOpiniumPoll
