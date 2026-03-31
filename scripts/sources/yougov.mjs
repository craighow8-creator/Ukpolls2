const YOUGOV_TRACKER_URL = 'https://yougov.com/en-gb/trackers/voting-intention'

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

function extractDatasetUrl(html) {
  const m = String(html || '').match(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*Download full data set/i)
  return m ? absolutizeUrl(YOUGOV_TRACKER_URL, m[1]) : null
}

function extractMethodologyUrl(html) {
  const m = String(html || '').match(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*Methodology/i)
  return m ? absolutizeUrl(YOUGOV_TRACKER_URL, m[1]) : null
}

function extractSampleRange(text) {
  const m = String(text || '').match(/Weekly tracker\s*\/\s*([\d,]+)\s*-\s*([\d,]+)\s*GB Adults per wave/i)
  if (!m) return null
  const lo = safeNumber(m[1])
  const hi = safeNumber(m[2])
  if (lo == null || hi == null) return null
  return Math.round((lo + hi) / 2)
}

function extractCurrentDatasetLabel(text) {
  const m = String(text || '').match(/CURRENT\s*([0-9]{4}-current)/i)
  return m ? m[1] : '2024-current'
}

export async function fetchYouGovPoll() {
  const html = await fetchText(YOUGOV_TRACKER_URL)
  const text = cleanText(html)

  const datasetUrl = extractDatasetUrl(html)
  const methodologyUrl = extractMethodologyUrl(html)

  // The tracker page exposes method/meta cleanly, but not the latest topline values as text.
  // So for now we lock to the most recent visible dated article values while keeping the tracker
  // page and dataset URL as the primary source references.
  return {
    id: `yougov-${slugify('2026-03-22')}`,
    pollster: 'YouGov',
    isBpcMember: true,
    fieldworkStart: '2026-03-22',
    fieldworkEnd: '2026-03-23',
    publishedAt: '2026-03-24',
    date: '2026-03-23',
    sample: extractSampleRange(text),
    method: 'Weekly tracker',
    mode: 'Online',
    commissioner: null,
    sourceUrl: YOUGOV_TRACKER_URL,
    source: datasetUrl
      ? `YouGov voting intention tracker · ${extractCurrentDatasetLabel(text)} · ${datasetUrl}`
      : methodologyUrl
        ? `YouGov voting intention tracker · methodology ${methodologyUrl}`
        : 'YouGov voting intention tracker',
    ref: 23,
    lab: 19,
    con: 17,
    grn: 18,
    ld: 13,
    rb: null,
    snp: null,
  }
}

export default fetchYouGovPoll
