import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { API_BASE } from '../constants'
import { parseJsonResponse } from '../utils/http'
import { formatNewsSourceList, formatRelativeNewsTime, normaliseNewsPayload } from '../utils/news'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

function Badge({ children, color, subtle = false }) {
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
      }}
    >
      {children}
    </span>
  )
}

function ScrollAwayHeader({ T, meta, loading }) {
  const count = meta?.storyCount || 0
  const sourceCount = meta?.sourceCount || 0
  const sources = formatNewsSourceList(meta?.sources || [])
  const freshness = formatRelativeNewsTime(meta?.updatedAt || meta?.latestPublishedAt)

  return (
    <div style={{ padding: '8px 16px 10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <Badge color={T.pr}>{loading ? 'Updating...' : `${count} stories`}</Badge>
        <Badge color={T.tl} subtle>{sourceCount ? `${sourceCount} sources` : 'UK politics live'}</Badge>
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        News
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
          width: '100%',
          marginTop: 6,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
          Live UK politics wire{freshness ? ` · updated ${freshness}` : ''}{sources ? ` · ${sources}` : ''}
        </div>
        <InfoButton id="news_feed" T={T} size={20} />
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

function NewsCard({ T, item, big }) {
  const color = tagColor(item.tag, T)

  return (
    <motion.div
      {...TAP}
      onClick={() => {
        if (!item.url) return
        haptic(6)
        window.open(item.url, '_blank', 'noopener,noreferrer')
      }}
      style={{
        borderRadius: big ? 16 : 14,
        padding: big ? '16px' : '12px 14px',
        marginBottom: big ? 12 : 8,
        background: T.c0 || '#fff',
        border: `1px solid ${color}22`,
        cursor: item.url ? 'pointer' : 'default',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {big ? (
        <div
          style={{
            height: 3,
            background: color,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        />
      ) : null}

      <div style={{ paddingTop: big ? 8 : 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: big ? 8 : 5,
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {item.tag ? (
              <span
                style={{
                  fontSize: 12,
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
                {item.tag}
              </span>
            ) : null}

            <span style={{ fontSize: 13, fontWeight: 700, color: T.tl }}>
              {item.source}
            </span>
          </div>

          <span style={{ fontSize: 13, fontWeight: 600, color: T.tl, flexShrink: 0 }}>
            {formatRelativeNewsTime(item.publishedAt)}
          </span>
        </div>

        <div
          style={{
            fontSize: big ? 16 : 14,
            fontWeight: 700,
            color: T.th,
            lineHeight: 1.45,
          }}
        >
          {item.title}
        </div>

        {big && (item.description || item.summary) ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 550,
              color: T.tm,
              lineHeight: 1.45,
            }}
          >
            {item.description || item.summary}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function EmptyState({ T, title, body }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '16px',
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{title}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 6, lineHeight: 1.55 }}>
        {body}
      </div>
    </div>
  )
}

export function NewsScreen({ T, news }) {
  const initialPayload = useMemo(() => normaliseNewsPayload(news), [news])
  const [payload, setPayload] = useState(initialPayload)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialPayload.items.length) setPayload(initialPayload)
  }, [initialPayload])

  useEffect(() => {
    let cancelled = false

    async function loadNews() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch(`${API_BASE}/api/news`, {
          headers: { Accept: 'application/json' },
        })
        const data = await parseJsonResponse(res, 'News request')
        const nextPayload = normaliseNewsPayload(data)

        if (!cancelled) {
          setPayload(nextPayload)
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} meta={meta} loading={loading} />

      <div style={{ padding: '12px 16px 40px' }}>
        {loading && !items.length ? (
          <EmptyState
            T={T}
            title="Loading live politics news"
            body="Pulling the latest UK politics stories now."
          />
        ) : null}

        {!loading && error ? (
          <EmptyState
            T={T}
            title="News feed unavailable"
            body={error}
          />
        ) : null}

        {!loading && !error && heroItem ? (
          <>
            <NewsCard T={T} item={heroItem} big />
            {rest.map((item, i) => (
              <NewsCard key={`${item.url || item.title}-${i}`} T={T} item={item} big={false} />
            ))}
          </>
        ) : null}

        {!loading && !error && !heroItem ? (
          <EmptyState
            T={T}
            title="No live stories found"
            body="No matching UK politics stories are available from the current source list right now."
          />
        ) : null}
      </div>
    </div>
  )
}

export default NewsScreen
