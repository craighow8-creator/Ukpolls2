const TECHNE_TRACKER_URL = 'https://www.techneuk.com/tracker/'

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

function monthNumber(name) {
  const map = {
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
  return map[String(name || '').toLowerCase()] || null
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

async function fetchPdfText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/pdf,*/*',
      'User-Agent': 'Mozilla/5.0',
      Referer: TECHNE_TRACKER_URL,
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`Methodology download failed ${res.status} for ${url}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  let text = ''
  for (let i = 0; i < uint8.length; i++) {
    const c = uint8[i]
    if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
      text += String.fromCharCode(c)
    } else {
      text += ' '
    }
  }
  return text.replace(/\s+/g, ' ')
}

function findSectionHtml(html, headingText, nextHeadingText) {
  const re = new RegExp(
    `<h[1-6][^>]*>\\s*${headingText}\\s*<\\/h[1-6]>([\\s\\S]*?)<h[1-6][^>]*>\\s*${nextHeadingText}\\s*<\\/h[1-6]>`,
    'i',
  )
  const m = String(html || '').match(re)
  return m ? m[1] : null
}

function extractPartyValue(sectionHtml, variants) {
  const text = cleanText(sectionHtml)
  for (const variant of variants) {
    const re = new RegExp(`${variant}\\s*:\\s*(\\d+)%`, 'i')
    const m = text.match(re)
    if (m) return safeNumber(m[1])
  }
  return null
}

function extractSampleSize(html) {
  const text = cleanText(html)
  const m = text.match(/questioned\s+([\d,]+)\s+individuals/i)
  return m ? safeNumber(m[1]) : null
}

function extractDownloadLinks(html) {
  const links = [...String(html || '').matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*Download\s*<\/a>/gis)]
    .map((m) => absolutizeUrl(TECHNE_TRACKER_URL, m[1]))

  return {
    dataUrl: links.find((u) => /data/i.test(u)) || null,
    methodUrl: links.find((u) => /methodology/i.test(u)) || null,
  }
}

function extractPdfDateFromUrl(url) {
  const m = String(url || '').match(/(20\d{2})-(\d{1,2})-(\d{1,2})/i)
  if (!m) return null
  return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`
}

function extractFieldworkFromPdfText(pdfText) {
  const m = String(pdfText || '').match(
    /FIELDWORK:\s*([A-Z]+)\s+(\d{1,2})(?:ST|ND|RD|TH)?\s*[-–]\s*([A-Z]+)?\s*(\d{1,2})(?:ST|ND|RD|TH)?\s*(20\d{2})/i,
  )

  if (!m) return { fieldworkStart: null, fieldworkEnd: null }

  const startMonth = monthNumber(m[1])
  const startDay = String(m[2]).padStart(2, '0')
  const endMonth = monthNumber(m[3] || m[1])
  const endDay = String(m[4]).padStart(2, '0')
  const year = m[5]

  return {
    fieldworkStart: `${year}-${startMonth}-${startDay}`,
    fieldworkEnd: `${year}-${endMonth}-${endDay}`,
  }
}

function extractMethodAndModeFromPdfText(pdfText) {
  const sampleType = String(pdfText || '').match(/TYPE OF SAMPLE:\s*([^:]+?)\s+SAMPLE SIZE:/i)
  const interviews = String(pdfText || '').match(/INTERVIEWS:\s*([^:]+?)\s+QUESTIONNAIRE:/i)

  return {
    method: sampleType ? cleanText(sampleType[1]) : 'Tracker poll',
    mode: interviews ? cleanText(interviews[1]) : null,
  }
}

export async function fetchTechnePoll() {
  const html = await fetchText(TECHNE_TRACKER_URL)

  const westminsterSection = findSectionHtml(
    html,
    'Westminster Voting Intentions',
    'Public Confidence',
  )

  if (!westminsterSection) {
    throw new Error('Could not find Westminster Voting Intentions section on Techne tracker page')
  }

  const { dataUrl, methodUrl } = extractDownloadLinks(html)

  let fieldworkStart = null
  let fieldworkEnd = null
  let method = 'Tracker poll'
  let mode = null
  let publishedAt = extractPdfDateFromUrl(methodUrl || dataUrl || '') || null

  if (methodUrl) {
    try {
      const pdfText = await fetchPdfText(methodUrl)
      const fw = extractFieldworkFromPdfText(pdfText)
      fieldworkStart = fw.fieldworkStart
      fieldworkEnd = fw.fieldworkEnd

      const mm = extractMethodAndModeFromPdfText(pdfText)
      method = mm.method || method
      mode = mm.mode || mode
    } catch {
      // keep page-derived fallback values
    }
  }

  const poll = {
    id: `techne-${slugify(publishedAt || fieldworkEnd || fieldworkStart || 'latest')}`,
    pollster: 'Techne',
    isBpcMember: true,
    fieldworkStart,
    fieldworkEnd,
    publishedAt: publishedAt || fieldworkEnd || null,
    date: fieldworkEnd || publishedAt || null,
    sample: extractSampleSize(html),
    method,
    mode,
    commissioner: 'Techne UK',
    sourceUrl: TECHNE_TRACKER_URL,
    source: dataUrl ? `Techne tracker · data PDF ${dataUrl}` : 'Techne tracker',
    ref: extractPartyValue(westminsterSection, ['Reform UK', 'Reform']),
    lab: extractPartyValue(westminsterSection, ['Labour']),
    con: extractPartyValue(westminsterSection, ['Conservatives', 'Conservative']),
    grn: extractPartyValue(westminsterSection, ['Greens', 'Green']),
    ld: extractPartyValue(westminsterSection, ['Lib Dems', 'Liberal Democrats']),
    rb: null,
    snp: extractPartyValue(westminsterSection, ['SNP']),
  }

  const hasCore = [poll.ref, poll.lab, poll.con, poll.grn, poll.ld, poll.snp].some(
    (v) => typeof v === 'number',
  )

  if (!hasCore) {
    throw new Error('Techne parser did not find core party values on tracker page')
  }

  return poll
}

export default fetchTechnePoll
