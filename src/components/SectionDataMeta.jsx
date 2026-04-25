import React from 'react'
import { formatTs } from '../data/store'

const TONE_STYLES = {
  live: { labelColor: '#E4003B', bg: '#E4003B12', border: '#E4003B2A' },
  'semi-live': { labelColor: '#12B7D4', bg: '#12B7D412', border: '#12B7D42A' },
  maintained: { labelColor: '#0F766E', bg: '#0F766E12', border: '#0F766E2A' },
  derived: { labelColor: '#7C3AED', bg: '#7C3AED12', border: '#7C3AED2A' },
  static: { labelColor: '#6B7280', bg: '#6B728012', border: '#6B72802A' },
  cached: { labelColor: '#B45309', bg: '#B4530912', border: '#B453092A' },
  quiet: { labelColor: '#7A7A7A', bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.08)' },
}

export default function SectionDataMeta({ T, section, style = {} }) {
  if (!section) return null

  const tone = TONE_STYLES[section.tone] || TONE_STYLES.quiet
  const updatedAt = section.updatedAt ? formatTs(section.updatedAt) : null
  const source = section.source || null
  const parts = []

  if (section.label) parts.push(section.label)
  if (updatedAt) parts.push(updatedAt)
  if (source) parts.push(source)
  if (section.fallback) parts.push('fallback')

  if (!parts.length) return null

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        padding: '6px 10px',
        borderRadius: 999,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: T.th,
        fontSize: 11.5,
        fontWeight: 700,
        lineHeight: 1.35,
        ...style,
      }}
    >
      <span style={{ color: tone.labelColor, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {section.label}
      </span>
      {updatedAt ? <span style={{ color: T.tl }}>{updatedAt}</span> : null}
      {source ? <span style={{ color: T.tm }}>{source}</span> : null}
      {section.fallback ? <span style={{ color: T.tl }}>fallback</span> : null}
    </div>
  )
}
