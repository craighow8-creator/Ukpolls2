const POLYMARKET_BASE = 'https://gamma-api.polymarket.com'
const POLYMARKET_SITE_BASE = 'https://polymarket.com'

const CONFIGURED_UK_POLITICAL_MARKET_SOURCES = [
  {
    id: 'polymarket-uk-election-called',
    sourceUrl: `${POLYMARKET_BASE}/events/slug/uk-election-called-by`,
    electionType: 'general-election',
    includeMarketSlugs: ['will-the-next-uk-election-is-called-by-june-30-2026'],
  },
  {
    id: 'polymarket-starmer-out',
    sourceUrl: `${POLYMARKET_BASE}/events/slug/starmer-out-in-2025`,
    electionType: 'leadership',
    includeMarketSlugs: [
      'starmer-out-by-june-30-2026-862-594-548',
      'starmer-out-by-december-31-2026-936-416-977-234',
    ],
  },
]

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
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

function normalizeMarket(event, market, sourceUpdatedAt, source = {}) {
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
    category: source.electionType || cleanText(event?.category || market?.category || 'Politics'),
    source: 'Polymarket',
    sourceUrl: buildMarketUrl(event, market),
    marketType: 'prediction-market',
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

export async function runPolymarketPredictionRefresh({ logger = console } = {}) {
  const fetchedAt = new Date().toISOString()
  let fetchedCount = 0
  let rejectedCount = 0
  const failedSources = []
  const markets = []

  for (const source of CONFIGURED_UK_POLITICAL_MARKET_SOURCES) {
    try {
      const event = await fetchJson(source.sourceUrl, logger)
      if (!event || typeof event !== 'object' || event.active === false || event.closed || event.archived) {
        rejectedCount += 1
        continue
      }

      fetchedCount += 1
      const include = new Set((source.includeMarketSlugs || []).map(String))
      const eventMarkets = Array.isArray(event.markets) ? event.markets : []
      for (const market of eventMarkets) {
        if (!market || typeof market !== 'object') {
          rejectedCount += 1
          continue
        }
        if (market.active === false || market.closed || market.archived) {
          rejectedCount += 1
          continue
        }
        if (include.size && !include.has(String(market.slug || ''))) {
          rejectedCount += 1
          continue
        }

        const normalized = normalizeMarket(event, market, fetchedAt, source)
        if (normalized) {
          markets.push(normalized)
        } else {
          rejectedCount += 1
        }
      }
    } catch (error) {
      failedSources.push({ id: source.id, reason: error?.message || String(error) })
    }
  }

  markets.sort((a, b) => {
    const av = (a.volume || 0) + (a.liquidity || 0)
    const bv = (b.volume || 0) + (b.liquidity || 0)
    return bv - av
  })

  const curatedMarkets = markets

  return {
    source: 'Polymarket',
    sourceUrl: POLYMARKET_BASE,
    updatedAt: fetchedAt,
    markets: curatedMarkets,
    failedSources,
    meta: {
      source: 'Polymarket',
      sourceUrl: POLYMARKET_BASE,
      updatedAt: fetchedAt,
      fetchedCount,
      matchedCount: curatedMarkets.length,
      rejectedCount,
      failedSourceCount: failedSources.length,
      eventCount: fetchedCount,
      marketCount: curatedMarkets.length,
      totalMatchedCount: markets.length,
      freshnessLabel: curatedMarkets.length ? 'Live' : 'Empty',
    },
  }
}
