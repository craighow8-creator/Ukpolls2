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
  const freshness = formatRelativeNewsTime(meta.updatedAt || meta.latestPublishedAt)
  const latest = items[0] || null

  if (!latest) {
    return {
      headline: 'Live UK politics feed',
      supportingLine: 'Awaiting the next refreshed source pull.',
      tag: 'Live',
      sourceCount: 0,
      storyCount: 0,
    }
  }

  const liveParts = []
  if (freshness) liveParts.push(`Updated ${freshness}`)
  if (sourceLine) liveParts.push(sourceLine)
  if (meta.storyCount) liveParts.push(`${meta.storyCount} stories`)

  return {
    headline: latest.title,
    supportingLine: liveParts.join(' · ') || 'Newest politics stories first',
    tag: latest.tag || 'Live',
    sourceCount: meta.sourceCount || sources.length,
    storyCount: meta.storyCount || items.length,
  }
}
