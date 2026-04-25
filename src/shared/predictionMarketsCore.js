const POLYMARKET_BASE = 'https://gamma-api.polymarket.com'
const POLYMARKET_SITE_BASE = 'https://polymarket.com'

const UK_MARKET_HINTS = [
  'uk',
  'britain',
  'british',
  'united kingdom',
  'westminster',
  'general election',
  'next general election',
  'prime minister',
  'next prime minister',
  'labour leader',
  'conservative leader',
  'reform leader',
  'lib dem',
  'liberal democrat',
  'green leader',
  'snp',
  'plaid cymru',
  'parliament',
  'house of commons',
  'house of lords',
  'by-election',
  'byelection',
]

const UK_POLITICS_HINTS = [
  'uk',
  'united kingdom',
  'britain',
  'british',
  'prime minister',
  'general election',
  'parliament',
  'westminster',
  'labour',
  'conservative',
  'reform',
  'liberal democrat',
  'lib dem',
  'snp',
  'plaid cymru',
]

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function lower(value) {
  return cleanText(value).toLowerCase()
}

function parseJsonMaybe(value, fallback = null) {
  if (Array.isArray(value)) return value
  if (value == null) return fallback
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function toNumber(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function joinText(event, market) {
  return [
    event?.title,
    event?.subtitle,
    event?.description,
    event?.resolutionSource,
    event?.category,
    event?.subcategory,
    market?.question,
    market?.description,
    market?.resolutionSource,
    market?.category,
  ]
    .map(lower)
    .filter(Boolean)
    .join(' | ')
}

function isUkPoliticsMarket(event, market) {
  const text = joinText(event, market)
  if (!text) return false

  const politicsHit = UK_POLITICS_HINTS.some((term) => text.includes(term))
  const ukHit = UK_MARKET_HINTS.some((term) => text.includes(term))

  return politicsHit && ukHit
}

function buildMarketUrl(event, market) {
  const eventSlug = cleanText(event?.slug)
  const marketSlug = cleanText(market?.slug)
  if (eventSlug) return `${POLYMARKET_SITE_BASE}/event/${eventSlug}`
  if (marketSlug) return `${POLYMARKET_SITE_BASE}/market/${marketSlug}`
  if (event?.id) return `${POLYMARKET_SITE_BASE}/event/${event.id}`
  if (market?.id) return `${POLYMARKET_SITE_BASE}/market/${market.id}`
  return POLYMARKET_SITE_BASE
}

function normalizeOutcomes(market) {
  const outcomes = parseJsonMaybe(market?.outcomes, [])
  const prices = parseJsonMaybe(market?.outcomePrices, [])

  if (!Array.isArray(outcomes) || !outcomes.length) return []

  const numericPrices = Array.isArray(prices) ? prices.map(toNumber).filter((n) => n != null) : []
  const sum = numericPrices.reduce((acc, value) => acc + value, 0)
  const normalizer = sum > 0 ? sum : 1

  return outcomes.map((outcome, index) => {
    const price = toNumber(numericPrices[index])
    const probability = price != null ? price / normalizer : null

    return {
      label: cleanText(outcome),
      probability,
      displayPct: probability != null ? `${Math.round(probability * 100)}%` : null,
    }
  })
}

function normalizeMarket(event, market, sourceUpdatedAt) {
  const outcomes = normalizeOutcomes(market)
  if (!outcomes.length) return null

  return {
    id: cleanText(market?.id || `${event?.id || 'event'}-${market?.slug || market?.question || 'market'}`),
    eventId: cleanText(event?.id),
    eventSlug: cleanText(event?.slug),
    title: cleanText(market?.question || event?.title || market?.slug || 'Prediction market'),
    subtitle: cleanText(event?.subtitle || market?.description || event?.description || ''),
    status: market?.active === false ? 'inactive' : market?.closed ? 'closed' : 'active',
    url: buildMarketUrl(event, market),
    outcomes,
    liquidity: toNumber(market?.liquidity ?? event?.liquidity),
    volume: toNumber(market?.volume ?? event?.volume),
    category: cleanText(event?.category || market?.category || 'Politics'),
    updatedAt: market?.updatedAt || event?.updatedAt || sourceUpdatedAt,
  }
}

async function fetchJson(url, logger = console) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Politiscope/1.0 (+https://politiscope.co.uk)',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Polymarket ${res.status}: ${text || res.statusText}`)
  }

  return res.json()
}

async function fetchPolymarketEvents({ pages = 3, limit = 100, logger = console } = {}) {
  const all = []

  for (let page = 0; page < pages; page += 1) {
    const offset = page * limit
    const url = new URL('/events', POLYMARKET_BASE)
    url.searchParams.set('active', 'true')
    url.searchParams.set('closed', 'false')
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('order', 'volume_24hr')
    url.searchParams.set('ascending', 'false')

    const batch = await fetchJson(url.toString(), logger)
    if (!Array.isArray(batch) || !batch.length) break
    all.push(...batch)
    if (batch.length < limit) break
  }

  return all
}

export async function runPolymarketPredictionRefresh({ logger = console } = {}) {
  const fetchedAt = new Date().toISOString()
  const events = await fetchPolymarketEvents({ logger })

  const markets = []
  for (const event of events) {
    if (!event || typeof event !== 'object') continue
    if (event.active === false || event.closed || event.archived) continue

    const eventMarkets = Array.isArray(event.markets) ? event.markets : []
    for (const market of eventMarkets) {
      if (!market || typeof market !== 'object') continue
      if (market.active === false || market.closed || market.archived) continue
      if (!isUkPoliticsMarket(event, market)) continue

      const normalized = normalizeMarket(event, market, fetchedAt)
      if (normalized) markets.push(normalized)
    }
  }

  markets.sort((a, b) => {
    const av = (a.volume || 0) + (a.liquidity || 0)
    const bv = (b.volume || 0) + (b.liquidity || 0)
    return bv - av
  })

  const curatedMarkets = markets.slice(0, 5)

  return {
    source: 'Polymarket',
    sourceUrl: POLYMARKET_BASE,
    updatedAt: fetchedAt,
    markets: curatedMarkets,
    meta: {
      source: 'Polymarket',
      sourceUrl: POLYMARKET_BASE,
      updatedAt: fetchedAt,
      eventCount: events.length,
      marketCount: curatedMarkets.length,
      totalMatchedCount: markets.length,
      freshnessLabel: curatedMarkets.length ? 'Live' : 'Cached',
    },
  }
}
