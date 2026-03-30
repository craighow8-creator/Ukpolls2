const IPSOS_TOPIC_URL = 'https://www.ipsos.com/en-uk/topic/political-monitor'
const IPSOS_ARTICLE_URL = 'https://www.ipsos.com/en-uk/reform-uk-holds-7-point-lead-over-labour-greens-5-points'

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

function extractLatestArticleUrl(topicHtml) {
  const m = String(topicHtml || '').match(/###\s*<a[^>]+href=["']([^"']+)["'][^>]*>\s*Reform UK holds 7-point lead over Labour, Greens up 5 points/i)
  if (m) return absolutizeUrl(IPSOS_TOPIC_URL, m[1])
  return IPSOS_ARTICLE_URL
}

function extractPublishedDate(articleHtml) {
  const m = String(articleHtml || '').match(/\b(\d{2})\.(\d{2})\.(\d{2})\b/)
  if (!m) return null
  return `20${m[3]}-${m[2]}-${m[1]}`
}

function extractFieldwork(text) {
  const m = String(text || '').match(/fieldwork carried out\s+(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})/i)
  if (!m) return { fieldworkStart: null, fieldworkEnd: null }

  const monthMap = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  }
  const month = monthMap[m[3].toLowerCase()]
  const year = m[4]

  return {
    fieldworkStart: `${year}-${month}-${String(m[1]).padStart(2, '0')}`,
    fieldworkEnd: `${year}-${month}-${String(m[2]).padStart(2, '0')}`,
  }
}

function extractSample(text) {
  const m = String(text || '').match(/representative probability sample of\s+([\d,]+)\s+British adults/i)
  return m ? safeNumber(m[1]) : null
}

function extractPartyValues(text) {
  const values = {}
  let m = String(text || '').match(/Reform\s+are on\s+(\d+)%/i)
  if (m) values.ref = safeNumber(m[1])

  m = String(text || '').match(/Labour\s+(\d+)%/i)
  if (m) values.lab = safeNumber(m[1])

  m = String(text || '').match(/Conservative\s+(\d+)%/i)
  if (m) values.con = safeNumber(m[1])

  m = String(text || '').match(/Greens\s+(\d+)%/i)
  if (m) values.grn = safeNumber(m[1])

  m = String(text || '').match(/Lib Dems\s+(\d+)%/i)
  if (m) values.ld = safeNumber(m[1])

  m = String(text || '').match(/Others\s+(\d+)%/i)
  if (m) values.oth = safeNumber(m[1])

  return values
}

function extractTablesUrl(html) {
  const links = [...String(html || '').matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  for (const [, href, inner] of links) {
    const text = cleanText(inner)
    if (/download pdf/i.test(text) || /download the tables here/i.test(text)) {
      return absolutizeUrl(IPSOS_ARTICLE_URL, href)
    }
  }
  return null
}

export async function fetchIpsosPoll() {
  const topicHtml = await fetchText(IPSOS_TOPIC_URL)
  const articleUrl = extractLatestArticleUrl(topicHtml)
  const articleHtml = await fetchText(articleUrl)
  const text = cleanText(articleHtml)

  const publishedAt = extractPublishedDate(articleHtml)
  const { fieldworkStart, fieldworkEnd } = extractFieldwork(text)
  const sample = extractSample(text)
  const values = extractPartyValues(text)
  const tablesUrl = extractTablesUrl(articleHtml)

  const poll = {
    id: `ipsos-${slugify(publishedAt || fieldworkEnd || 'latest')}`,
    pollster: 'Ipsos',
    isBpcMember: true,
    fieldworkStart,
    fieldworkEnd,
    publishedAt,
    date: fieldworkEnd || publishedAt || null,
    sample,
    method: 'Political Monitor',
    mode: 'Online random probability panel',
    commissioner: null,
    sourceUrl: articleUrl,
    source: tablesUrl ? `Ipsos Political Monitor · tables ${tablesUrl}` : 'Ipsos Political Monitor',
    ref: values.ref ?? null,
    lab: values.lab ?? null,
    con: values.con ?? null,
    grn: values.grn ?? null,
    ld: values.ld ?? null,
    rb: null,
    snp: null,
  }

  const hasCore = [poll.ref, poll.lab, poll.con, poll.grn, poll.ld].some((v) => typeof v === 'number')
  if (!hasCore) {
    throw new Error('Ipsos parser did not find core party values on latest Political Monitor article')
  }

  return poll
}

export default fetchIpsosPoll
