import React from 'react'

function ToneCard({ T, item, index }) {
  const accent = item?.accent || (index === 0 ? T.pr : T.tl)

  return (
    <div
      style={{
        borderRadius: 18,
        padding: '18px 18px 16px',
        background: T.c0 || '#fff',
        border: `1px solid ${accent}22`,
        minHeight: 176,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: accent,
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        {item.kicker}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          lineHeight: 1.15,
          color: T.th,
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        {item.title}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 500,
          lineHeight: 1.65,
          color: T.tm,
          textAlign: 'center',
        }}
      >
        {item.body}
      </div>
    </div>
  )
}

export default function BriefingPanel({ T, title, subtitle, items = [], style = {} }) {
  const visibleItems = items.filter(Boolean).slice(0, 2)
  if (!visibleItems.length) return null

  return (
    <div
      style={{
        borderRadius: 18,
        padding: '16px',
        background: T.c0 || '#fff',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: T.tl,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      {subtitle ? (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.55,
            color: T.tm,
            textAlign: 'center',
            marginBottom: 14,
          }}
        >
          {subtitle}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: visibleItems.length === 1 ? '1fr' : '1fr 1fr',
          gap: 12,
        }}
      >
        {visibleItems.map((item, index) => (
          <ToneCard key={item.key || index} T={T} item={item} index={index} />
        ))}
      </div>
    </div>
  )
}
