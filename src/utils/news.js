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

const HTML_ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '-',
  mdash: '-',
  hellip: '...',
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
}

function decodeHtmlEntities(text) {
  return String(text || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const key = String(entity || '').toLowerCase()

    if (key.startsWith('#x')) {
      const code = Number.parseInt(key.slice(2), 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }

    if (key.startsWith('#')) {
      const code = Number.parseInt(key.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }

    return HTML_ENTITY_MAP[key] ?? match
  })
}

export function cleanNewsDisplayText(value, options = {}) {
  const { maxLength = 0 } = options
  if (value == null) return ''

  let text = String(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|ul|ol|h[1-6]|blockquote)>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')

  text = decodeHtmlEntities(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!maxLength || text.length <= maxLength) return text

  const clipped = text.slice(0, maxLength).trimEnd()
  const boundary = clipped.lastIndexOf(' ')
  return `${(boundary > maxLength * 0.6 ? clipped.slice(0, boundary) : clipped).trimEnd()}...`
}

function titleCaseNewsLabel(value) {
  const clean = cleanNewsDisplayText(value)
  if (!clean) return ''

  return clean
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase()
      return lower.length <= 3 ? lower.toUpperCase() : `${lower[0].toUpperCase()}${lower.slice(1)}`
    })
    .join(' ')
}

export function normaliseNewsSourceName(value) {
  const clean = cleanNewsDisplayText(value)
  const lower = clean.toLowerCase()
  if (!clean) return ''

  if (lower.includes('bbc')) return 'BBC'
  if (lower.includes('guardian')) return 'Guardian'
  if (lower.includes('sky')) return 'Sky'
  if (lower.includes('channel 4') || lower.includes('channel4')) return 'Channel 4 News'
  if (lower.includes('telegraph')) return 'Telegraph'
  if (lower.includes('gb news') || lower.includes('gbnews')) return 'GB News'
  if (lower.includes('independent')) return 'Independent'
  if (lower.includes('financial times') || lower === 'ft') return 'FT'

  return clean
}

export function normaliseNewsTag(value) {
  const clean = cleanNewsDisplayText(value)
  const lower = clean.toLowerCase()
  if (!clean) return ''

  if (lower === 'poll' || lower === 'polling') return 'Polling'
  if (lower === 'election' || lower === 'elections') return 'Elections'
  if (lower === 'party' || lower === 'parties') return 'Party'
  if (lower === 'policy' || lower === 'policies') return 'Policy'
  if (lower === 'government' || lower === 'govt') return 'Government'
  if (lower === 'parliament' || lower === 'parliamentary') return 'Parliament'
  if (lower === 'economy' || lower === 'economic') return 'Economy'
  if (lower === 'foreign affairs' || lower === 'foreign' || lower === 'world' || lower === 'international') {
    return 'Foreign Affairs'
  }
  if (lower === 'campaign' || lower === 'campaigns') return 'Campaign'

  return titleCaseNewsLabel(clean)
}

export function formatNewsSourceList(sources = [], maxVisible = 3) {
  const clean = [...new Set((sources || []).map((s) => normaliseNewsSourceName(s)).filter(Boolean))]
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
        ? 'REFRESHED FEED'
        : tone === 'recent'
          ? 'LATEST FEED'
          : tone === 'stale'
            ? 'NEEDS REVIEW'
            : 'NEWS FEED',
    shortLabel: tone === 'live' ? 'Refreshed recently' : tone === 'stale' ? 'Needs review' : 'Latest',
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
  const rawClusters = Array.isArray(base.clusteredStories) ? base.clusteredStories : []
  const rawNarratives = Array.isArray(base.narrativeSignals) ? base.narrativeSignals : []

  const items = [...rawItems]
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const displayHeadline = cleanNewsDisplayText(item.title, { maxLength: 220 })
      const displaySummary = cleanNewsDisplayText(
        item.description || item.summary || item.excerpt || item.body,
        { maxLength: 420 },
      )
      const descriptionDisplay = cleanNewsDisplayText(item.description, { maxLength: 420 })
      const summaryDisplay = cleanNewsDisplayText(item.summary || item.excerpt || item.body, { maxLength: 420 })
      const sourceDisplay = normaliseNewsSourceName(item.source || item.sourceName || item.publisher)
      const tagDisplay = normaliseNewsTag(item.tag || item.category || item.section)
      const smartTags = Array.isArray(item.tags)
        ? item.tags.map((tag) => cleanNewsDisplayText(tag, { maxLength: 40 })).filter(Boolean)
        : []

      return {
        ...item,
        displayHeadline: displayHeadline || cleanNewsDisplayText(item.summary, { maxLength: 220 }) || 'Latest UK politics update',
        displaySummary,
        descriptionDisplay,
        summaryDisplay,
        sourceDisplay,
        tagDisplay,
        smartTags,
        primarySmartTag: cleanNewsDisplayText(item.primarySmartTag || smartTags[0] || '', { maxLength: 40 }),
        whyItMattersDisplay: cleanNewsDisplayText(item.whyItMatters, { maxLength: 150 }),
        clusterSources: Array.isArray(item.clusterSources)
          ? item.clusterSources.map((source) => normaliseNewsSourceName(source)).filter(Boolean)
          : [],
        clusterTitleDisplay: cleanNewsDisplayText(item.clusterTitle, { maxLength: 220 }),
        clusterSummaryDisplay: cleanNewsDisplayText(item.clusterSummary, { maxLength: 180 }),
        clusterArticles: Array.isArray(item.clusterArticles) ? item.clusterArticles : [],
      }
    })
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))

  const clusteredStories = rawClusters
    .filter((cluster) => cluster && typeof cluster === 'object')
    .map((cluster) => ({
      ...cluster,
      clusterTitleDisplay: cleanNewsDisplayText(cluster.clusterTitle, { maxLength: 220 }),
      clusterSummaryDisplay: cleanNewsDisplayText(cluster.clusterSummary, { maxLength: 180 }),
      clusterSources: Array.isArray(cluster.clusterSources)
        ? cluster.clusterSources.map((source) => normaliseNewsSourceName(source)).filter(Boolean)
        : [],
      articles: Array.isArray(cluster.articles) ? cluster.articles : [],
    }))

  const narrativeSignals = rawNarratives
    .filter((signal) => signal && typeof signal === 'object')
    .map((signal) => ({
      ...signal,
      titleDisplay: cleanNewsDisplayText(signal.title, { maxLength: 90 }),
      dominantEntitiesDisplay: Array.isArray(signal.dominantEntities)
        ? signal.dominantEntities.map((entity) => cleanNewsDisplayText(entity, { maxLength: 40 })).filter(Boolean)
        : [],
      dominantTagsDisplay: Array.isArray(signal.dominantTags)
        ? signal.dominantTags.map((tag) => cleanNewsDisplayText(tag, { maxLength: 40 })).filter(Boolean)
        : [],
    }))

  const sourceNames = [...new Set(items.map((item) => item.sourceDisplay).filter(Boolean))]
  const latestPublishedAt = items[0]?.publishedAt || null
  const meta = base.meta && typeof base.meta === 'object' ? base.meta : {}
  const updatedAt = meta.updatedAt || base.fetchedAt || latestPublishedAt || null

  return {
    items,
    clusteredStories,
    narrativeSignals,
    meta: {
      ...meta,
      clusterDiagnostics: base.clusterDiagnostics || meta.clusterDiagnostics || null,
      narrativeDiagnostics: base.narrativeDiagnostics || meta.narrativeDiagnostics || null,
      updatedAt,
      fetchedAt: base.fetchedAt || meta.fetchedAt || updatedAt,
      storyCount: Number.isFinite(meta.storyCount) ? meta.storyCount : items.length,
      sourceCount: Number.isFinite(meta.sourceCount) ? meta.sourceCount : sourceNames.length,
      sources: Array.isArray(meta.sources) && meta.sources.length
        ? meta.sources.map((source) => normaliseNewsSourceName(source)).filter(Boolean)
        : sourceNames,
      latestPublishedAt: meta.latestPublishedAt || latestPublishedAt,
      latestHeadline: cleanNewsDisplayText(meta.latestHeadline || items[0]?.displayHeadline || items[0]?.title, { maxLength: 220 }),
      headlines: Array.isArray(meta.headlines) && meta.headlines.length
        ? meta.headlines.map((headline) => cleanNewsDisplayText(headline, { maxLength: 220 })).filter(Boolean)
        : items.slice(0, 3).map((item) => item.displayHeadline).filter(Boolean),
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
      supportingLine: 'Stories refresh regularly from approved UK politics sources.',
      sourceLine: '',
      statusLabel: 'NEWS FEED',
      statusTone: 'quiet',
      tag: 'Latest',
      sourceCount: 0,
      storyCount: 0,
      freshnessLabel: '',
      teaser: 'Latest UK political reporting will appear here when the feed refreshes.',
      ctaLabel: 'Open news feed',
    }
  }

  const liveParts = []
  if (freshness.relativeTime) liveParts.push(`Refreshed ${freshness.relativeTime}`)
  if (meta.sourceCount) liveParts.push(`${meta.sourceCount} sources`)
  if (sourceLine) liveParts.push(sourceLine)
  if (meta.storyCount) liveParts.push(`${meta.storyCount} stories`)

  return {
    headline: latest.displayHeadline,
    supportingLine: liveParts.join(' · ') || 'Newest politics stories first',
    sourceLine,
    statusLabel: freshness.statusLabel,
    statusTone: freshness.tone,
    tag: latest.tagDisplay || freshness.shortLabel,
    sourceCount: meta.sourceCount || sources.length,
    storyCount: meta.storyCount || items.length,
    freshnessLabel: freshness.relativeTime ? `Refreshed ${freshness.relativeTime}` : '',
    teaser:
      latest.displaySummary ||
      (freshness.isLive
        ? 'Track the latest UK political reporting from approved sources.'
        : 'Stories refresh regularly from approved UK politics sources.'),
    ctaLabel: 'Open news feed',
  }
}

export function getNewsErrorState(payload, hasCachedItems = false) {
  const { meta } = normaliseNewsPayload(payload)
  const freshness = getNewsFreshnessState(meta)
  const suffix = freshness.relativeTime ? ` from ${freshness.relativeTime}` : ''

  return {
    title: 'News feed temporarily unavailable',
    body: hasCachedItems
      ? `Showing the last available update${suffix}. Try again shortly.`
      : `Try again shortly${suffix ? `, or check back after the feed refreshes` : ''}.`,
    banner: hasCachedItems
      ? `News refresh temporarily unavailable. Showing the last available update${suffix}.`
      : 'News refresh temporarily unavailable. Try again shortly.',
  }
}
