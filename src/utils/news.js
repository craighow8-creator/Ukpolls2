export function formatRelativeNewsTime(iso) {
  if (!iso) return ''
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return ''

  const diffMs = Date.now() - ts
  const diffMins = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatNewsSourceList(sources = [], maxVisible = 3) {
  const clean = [...new Set((sources || []).map((s) => String(s || '').trim()).filter(Boolean))]
  if (!clean.length) return ''

  const visible = clean.slice(0, maxVisible)
  const extra = clean.length - visible.length

  return `${visible.join(', ')}${extra > 0 ? ` + ${extra} more` : ''}`
}

function getNewsTimestamp(meta = {}) {
  return meta.updatedAt || meta.fetchedAt || meta.latestPublishedAt || null
}

export function getNewsFreshnessState(meta = {}) {
  const updatedAt = getNewsTimestamp(meta)
  const ts = updatedAt ? new Date(updatedAt).getTime() : Number.NaN
  const ageMinutes = Number.isNaN(ts) ? null : Math.max(0, Math.floor((Date.now() - ts) / 60000))
  const relativeTime = formatRelativeNewsTime(updatedAt)

  let tone = 'quiet'
  if (ageMinutes != null) {
    if (ageMinutes <= 180) tone = 'live'
    else if (ageMinutes <= 1440) tone = 'recent'
    else tone = 'stale'
  }

  return {
    updatedAt,
    ageMinutes,
    relativeTime,
    tone,
    isLive: tone === 'live',
    statusLabel:
      tone === 'live'
        ? 'LIVE FEED'
        : tone === 'recent'
          ? 'LATEST FEED'
          : tone === 'stale'
            ? 'LATEST UPDATE'
            : 'NEWS FEED',
    shortLabel: tone === 'live' ? 'LIVE' : 'LATEST',
  }
}

export function normaliseNewsPayload(payload) {
  const base = Array.isArray(payload)
    ? { items: payload }
    : payload && typeof payload === 'object'
      ? payload
      : {}

  const rawItems = Array.isArray(base.items)
    ? base.items
    : Array.isArray(base.newsItems)
      ? base.newsItems
      : []

  const items = [...rawItems]
    .filter((item) => item && typeof item === 'object')
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))

  const sourceNames = [...new Set(items.map((item) => item.source).filter(Boolean))]
  const latestPublishedAt = items[0]?.publishedAt || null
  const meta = base.meta && typeof base.meta === 'object' ? base.meta : {}
  const updatedAt = meta.updatedAt || base.fetchedAt || latestPublishedAt || null

  return {
    items,
    meta: {
      ...meta,
      updatedAt,
      fetchedAt: base.fetchedAt || meta.fetchedAt || updatedAt,
      storyCount: Number.isFinite(meta.storyCount) ? meta.storyCount : items.length,
      sourceCount: Number.isFinite(meta.sourceCount) ? meta.sourceCount : sourceNames.length,
      sources: Array.isArray(meta.sources) && meta.sources.length ? meta.sources : sourceNames,
      latestPublishedAt: meta.latestPublishedAt || latestPublishedAt,
      latestHeadline: meta.latestHeadline || items[0]?.title || '',
      headlines: Array.isArray(meta.headlines) && meta.headlines.length
        ? meta.headlines
        : items.slice(0, 3).map((item) => item.title).filter(Boolean),
    },
  }
}

export function buildHomeNewsBriefing(payload) {
  const { items, meta } = normaliseNewsPayload(payload)
  const sources = Array.isArray(meta.sources) ? meta.sources : []
  const sourceLine = formatNewsSourceList(sources)
  const freshness = getNewsFreshnessState(meta)
  const latest = items[0] || null

  if (!latest) {
    return {
      headline: 'UK politics news feed',
      supportingLine: 'Tap in for the latest available reporting and source mix.',
      sourceLine: '',
      statusLabel: 'NEWS FEED',
      statusTone: 'quiet',
      tag: 'Latest',
      sourceCount: 0,
      storyCount: 0,
      freshnessLabel: '',
      teaser: 'Awaiting the next refreshed source pull.',
      ctaLabel: 'Open news feed',
    }
  }

  const liveParts = []
  if (freshness.relativeTime) liveParts.push(`Updated ${freshness.relativeTime}`)
  if (meta.sourceCount) liveParts.push(`${meta.sourceCount} sources`)
  if (sourceLine) liveParts.push(sourceLine)
  if (meta.storyCount) liveParts.push(`${meta.storyCount} stories`)

  return {
    headline: latest.title,
    supportingLine: liveParts.join(' · ') || 'Newest politics stories first',
    sourceLine,
    statusLabel: freshness.statusLabel,
    statusTone: freshness.tone,
    tag: latest.tag || 'Live',
    sourceCount: meta.sourceCount || sources.length,
    storyCount: meta.storyCount || items.length,
    freshnessLabel: freshness.relativeTime ? `Updated ${freshness.relativeTime}` : '',
    teaser:
      latest.description ||
      latest.summary ||
      (freshness.isLive
        ? 'Track the live political wire with the newest stories and source mix surfaced first.'
        : 'See the latest available reporting, with source breadth and recency surfaced first.'),
    ctaLabel: freshness.isLive ? 'Open live feed' : 'Open news feed',
  }
}

export function getNewsErrorState(payload, hasCachedItems = false) {
  const { meta } = normaliseNewsPayload(payload)
  const freshness = getNewsFreshnessState(meta)
  const suffix = freshness.relativeTime ? ` from ${freshness.relativeTime}` : ''

  return {
    title: 'Live feed temporarily unavailable',
    body: hasCachedItems
      ? `Showing the last available update${suffix}. Try again shortly.`
      : `Try again shortly${suffix ? `, or check back after the feed refreshes` : ''}.`,
    banner: hasCachedItems
      ? `Live refresh temporarily unavailable. Showing the last available update${suffix}.`
      : 'Live refresh temporarily unavailable. Try again shortly.',
  }
}
