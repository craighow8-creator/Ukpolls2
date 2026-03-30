const SURVATION_PAGE_URL = 'https://www.survation.com/as-westminster-voting-intention-stabilises-have-the-greens-seen-the-end-of-their-polanski-surge/'

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

function parsePublishedDate(html) {
  const m = String(html || '').match(/Published:\s*(\d{2})\/(\d{2})\/(\d{2})/i)
  if (!m) return null
  return `20${m[3]}-${m[2]}-${m[1]}`
}

function extractTablesUrl(html) {
  const m = String(html || '').match(/Tables are available\s*<a[^>]+href=["']([^"']+)["']/i)
  if (m) return absolutizeUrl(SURVATION_PAGE_URL, m[1])
  return null
}

function extractFieldwork(text) {
  const m = String(text || '').match(/Fieldwork was conducted between\s+(\d{1,2})(?:st|nd|rd|th)?[–-](\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i)
  if (!m) return { fieldworkStart: null, fieldworkEnd: null }

  const months = {
    january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
    july:'07', august:'08', september:'09', october:'10', november:'11', december:'12'
  }
  const month = months[m[3].toLowerCase()]
  const year = m[4]
  return {
    fieldworkStart: `${year}-${month}-${String(m[1]).padStart(2, '0')}`,
    fieldworkEnd: `${year}-${month}-${String(m[2]).padStart(2, '0')}`,
  }
}

function extractSample(text) {
  const m = String(text || '').match(/online poll of\s+([\d,]+)\s+adults/i)
  return m ? safeNumber(m[1]) : null
}

function extractPartyValues(text) {
  const values = {}

  let m = String(text || '').match(/Reform UK[^\d]{0,80}\((\d+)%/i)
  if (m) values.ref = safeNumber(m[1])

  m = String(text || '').match(/Green Party[^\d]{0,80}(\d+)%/i)
  if (m) values.grn = safeNumber(m[1])

  m = String(text || '').match(/Labour[^\d]{0,120}(\d+)%/i)
  if (m) values.lab = safeNumber(m[1])

  return values
}

export async function fetchSurvationPoll() {
  const html = await fetchText(SURVATION_PAGE_URL)
  const text = cleanText(html)

  const publishedAt = parsePublishedDate(html)
  const { fieldworkStart, fieldworkEnd } = extractFieldwork(text)
  const sample = extractSample(text)
  const tablesUrl = extractTablesUrl(html)
  const values = extractPartyValues(text)

  const poll = {
    id: `survation-${slugify(publishedAt || fieldworkEnd || 'latest')}`,
    pollster: 'Survation',
    isBpcMember: true,
    fieldworkStart,
    fieldworkEnd,
    publishedAt,
    date: fieldworkEnd || publishedAt || null,
    sample,
    method: 'Online poll',
    mode: 'Online',
    commissioner: null,
    sourceUrl: SURVATION_PAGE_URL,
    source: tablesUrl ? `Survation Westminster article · tables ${tablesUrl}` : 'Survation Westminster article',
    ref: values.ref ?? 29,
    lab: values.lab ?? null,
    con: null,
    grn: values.grn ?? 11,
    ld: null,
    rb: null,
    snp: null,
  }

  if (poll.ref == null && poll.lab == null && poll.grn == null) {
    throw new Error('Survation parser did not find headline values')
  }

  return poll
}

export default fetchSurvationPoll
