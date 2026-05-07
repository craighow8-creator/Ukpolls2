import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { API_BASE } from '../constants'
import { parseJsonResponse } from '../utils/http'
import {
  cleanNewsDisplayText,
  formatNewsSourceList,
  formatRelativeNewsTime,
  getNewsErrorState,
  getNewsFreshnessState,
  normaliseNewsPayload,
} from '../utils/news'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

function getNewsPayloadFreshnessMs(payload) {
  const normalised = normaliseNewsPayload(payload)
  const tsValue = normalised.meta?.fetchedAt || normalised.meta?.updatedAt
  if (!tsValue) return null
  const ts = new Date(tsValue).getTime()
  return Number.isFinite(ts) ? ts : null
}

function shouldUseIncomingNewsPayload(incoming, current) {
  const nextPayload = normaliseNewsPayload(incoming)
  if (!nextPayload.items.length) return false

  const currentPayload = normaliseNewsPayload(current)
  if (!currentPayload.items.length) return true

  const nextTs = getNewsPayloadFreshnessMs(nextPayload)
  const currentTs = getNewsPayloadFreshnessMs(currentPayload)

  if (nextTs == null && currentTs == null) return true
  if (nextTs == null) return false
  if (currentTs == null) return true
  return nextTs >= currentTs
}

function Badge({ children, color, subtle = false, style }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color,
        background: subtle ? `${color}12` : `${color}1F`,
        border: `1px solid ${color}2B`,
        borderRadius: 999,
        padding: '4px 9px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function MetaPill({ T, label, value, accent }) {
  return (
    <div
      style={{
        minWidth: 90,
        padding: '10px 12px',
        borderRadius: 16,
        background: T.sf,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent || T.th, marginTop: 3, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  )
}

function StatusBanner({ T, children }) {
  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 16,
        padding: '12px 14px',
        background: `${T.pr}10`,
        border: `1px solid ${T.pr}22`,
        color: T.th,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  )
}

function EmptyState({ T, title, body }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: '18px 16px',
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: T.th }}>{title}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 6, lineHeight: 1.55 }}>
        {body}
      </div>
    </div>
  )
}

function SectionLabel({ T, children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.tl,
        margin: '18px 0 10px',
      }}
    >
      {children}
    </div>
  )
}

function NewsHero({ T, meta, heroItem }) {
  const freshness = getNewsFreshnessState(meta)
  const sourceSummary = formatNewsSourceList(meta?.sources || [], 4)
  const liveColor = freshness.tone === 'live' ? '#E4003B' : freshness.tone === 'stale' ? T.tl : T.pr
  const title = 'UK politics feed'
  const leadContext = cleanNewsDisplayText(heroItem?.displaySummary || heroItem?.summaryDisplay, { maxLength: 180 })
  const summaryLine = sourceSummary
    ? `${sourceSummary}${meta?.storyCount ? ` · ${meta.storyCount} stories in view` : ''}`
    : meta?.storyCount
      ? `${meta.storyCount} stories in view`
      : 'Multi-source Westminster and campaign reporting'

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        padding: '18px 18px 20px',
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <InfoButton id="news_feed" T={T} size={20} />
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl }}>
          Westminster, campaigns, parties
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            color: T.th,
            lineHeight: 0.98,
            marginTop: 8,
          }}
        >
          {title}
        </div>

        <div style={{ fontSize: 14, fontWeight: 550, color: T.tm, lineHeight: 1.5, marginTop: 10 }}>
          {summaryLine}
        </div>

        {heroItem?.displayHeadline ? (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl }}>
              Leading now
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.th, lineHeight: 1.4, marginTop: 6 }}>
              {heroItem.displayHeadline}
            </div>
            {leadContext ? (
              <div style={{ fontSize: 13, fontWeight: 550, color: T.tm, lineHeight: 1.5, marginTop: 7 }}>
                {leadContext}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {heroItem.sourceDisplay ? <Badge color={T.tl} subtle>{heroItem.sourceDisplay}</Badge> : null}
              {heroItem.tagDisplay ? <Badge color={liveColor} subtle>{heroItem.tagDisplay}</Badge> : null}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          {meta?.storyCount ? <MetaPill T={T} label="Stories" value={meta.storyCount} accent={T.th} /> : null}
          {meta?.sourceCount ? <MetaPill T={T} label="Sources" value={meta.sourceCount} accent={liveColor} /> : null}
          {freshness.relativeTime ? <MetaPill T={T} label="Freshness" value={freshness.relativeTime} accent={T.pr} /> : null}
        </div>
      </div>
    </div>
  )
}

function tagColor(tag, T) {
  switch (tag) {
    case 'Polling':
      return '#12B7D4'
    case 'Elections':
      return '#7A52F4'
    case 'Party':
      return '#E4003B'
    case 'Policy':
      return '#02A95B'
    case 'Government':
      return '#0F766E'
    case 'Parliament':
      return '#8B5CF6'
    case 'Economy':
      return '#B45309'
    case 'Foreign Affairs':
      return '#2563EB'
    case 'Campaign':
      return '#DB2777'
    default:
      return T.pr
  }
}

function NewsCard({ T, item, big = false }) {
  const color = tagColor(item.tagDisplay || item.tag, T)
  const publishedLabel = formatRelativeNewsTime(item.publishedAt) || 'Latest'
  const summary = item.displaySummary
  const title = item.displayHeadline || 'Latest UK politics update'
  const source = item.sourceDisplay
  const tag = item.tagDisplay
  const smartTag = item.primarySmartTag || item.smartTags?.[0] || ''
  const showWhyItMatters = Boolean(item.whyItMattersDisplay && (big || Number(item.importanceScore) >= 10))
  const compactMeta = [source, publishedLabel].filter(Boolean).join(' · ')

  return (
    <motion.div
      {...TAP}
      onClick={() => {
        if (!item.url) return
        haptic(6)
        window.open(item.url, '_blank', 'noopener,noreferrer')
      }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: big ? 20 : 18,
        padding: big ? '18px 18px 16px' : '14px 16px 13px',
        marginBottom: big ? 0 : 10,
        background: T.c0 || '#fff',
        border: `1px solid ${color}22`,
        cursor: item.url ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: big ? 5 : 4,
          background: color,
        }}
      />

      <div style={{ paddingLeft: big ? 8 : 6 }}>
        {big ? (
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl, marginBottom: 10 }}>
            Lead story
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: big ? 10 : 7,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {smartTag ? (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 850,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color,
                  background: `${color}18`,
                  border: `1px solid ${color}35`,
                  borderRadius: 999,
                  padding: '3px 8px',
                }}
              >
                {smartTag}
              </span>
            ) : null}

            {tag ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color,
                  background: `${color}12`,
                  border: `1px solid ${color}2B`,
                  borderRadius: 999,
                  padding: '3px 8px',
                }}
              >
                {tag}
              </span>
            ) : null}

            {source ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: T.th }}>
                {source}
              </span>
            ) : null}
          </div>

          {!big ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: T.tl, flexShrink: 0 }}>
              {publishedLabel}
            </span>
          ) : null}
        </div>

        {big && compactMeta ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: T.tl, lineHeight: 1.4, marginBottom: 8 }}>
            {compactMeta}
          </div>
        ) : null}

        <div
          style={{
            fontSize: big ? 20 : 15,
            fontWeight: 750,
            color: T.th,
            lineHeight: big ? 1.28 : 1.42,
            letterSpacing: big ? '-0.02em' : '-0.01em',
          }}
        >
          {title}
        </div>

        {summary ? (
          <div
            style={{
              marginTop: big ? 10 : 8,
              fontSize: big ? 14 : 13,
              fontWeight: 550,
              color: T.tm,
              lineHeight: 1.55,
              display: '-webkit-box',
              WebkitLineClamp: big ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
          {summary}
          </div>
        ) : null}

        {showWhyItMatters ? (
          <div
            style={{
              marginTop: big ? 10 : 8,
              fontSize: big ? 13 : 12.5,
              fontWeight: 700,
              color: T.th,
              lineHeight: 1.45,
              background: `${color}0F`,
              border: `1px solid ${color}1F`,
              borderRadius: 12,
              padding: big ? '9px 10px' : '8px 9px',
            }}
          >
            {item.whyItMattersDisplay}
          </div>
        ) : null}

        {item.url && big ? (
          <div style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 12 }}>
            Read story ↗
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

export function NewsScreen({ T, news }) {
  const initialPayload = useMemo(() => normaliseNewsPayload(news), [news])
  const [payload, setPayload] = useState(initialPayload)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialPayload.items.length) {
      setPayload((current) => (
        shouldUseIncomingNewsPayload(initialPayload, current) ? initialPayload : current
      ))
    }
  }, [initialPayload])

  useEffect(() => {
    let cancelled = false

    async function loadNews() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch(`${API_BASE}/api/news`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        const data = await parseJsonResponse(res, 'News request')
        const nextPayload = normaliseNewsPayload(data)

        if (!cancelled) {
          setPayload((current) => (
            shouldUseIncomingNewsPayload(nextPayload, current) ? nextPayload : current
          ))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load news.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadNews()

    return () => {
      cancelled = true
    }
  }, [])

  const items = payload.items
  const meta = payload.meta
  const heroItem = items[0] || null
  const rest = useMemo(() => items.slice(1), [items])
  const safeError = useMemo(() => getNewsErrorState(payload, items.length > 0), [payload, items.length])
  const showCachedWarning = Boolean(error && items.length)
  const showHardError = Boolean(!loading && error && !items.length)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <div style={{ padding: '12px 16px 40px' }}>
        <NewsHero T={T} meta={meta} heroItem={heroItem} />

        {loading && !items.length ? (
          <div style={{ marginTop: 14 }}>
            <EmptyState
              T={T}
              title="Loading politics feed"
              body="Pulling the latest UK politics stories now."
            />
          </div>
        ) : null}

        {showCachedWarning ? (
          <StatusBanner T={T}>{safeError.banner}</StatusBanner>
        ) : null}

        {showHardError ? (
          <div style={{ marginTop: 14 }}>
            <EmptyState
              T={T}
              title={safeError.title}
              body={safeError.body}
            />
          </div>
        ) : null}

        {!loading && !error && !heroItem ? (
          <div style={{ marginTop: 14 }}>
            <EmptyState
              T={T}
              title="No current stories found"
              body="No matching UK politics stories are available from the current source list right now."
            />
          </div>
        ) : null}

        {heroItem ? (
          <>
            <SectionLabel T={T}>Lead story</SectionLabel>
            <NewsCard T={T} item={heroItem} big />

            {rest.length ? <SectionLabel T={T}>Latest reporting</SectionLabel> : null}

            <div style={{ contentVisibility: 'auto' }}>
              {rest.map((item, i) => (
                <NewsCard key={`${item.url || item.title}-${i}`} T={T} item={item} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default NewsScreen
