import React from 'react'
import { motion } from 'framer-motion'
import { haptic } from '../components/ui'

const TAP = { whileTap: { opacity: 0.78, scale: 0.992 }, transition: { duration: 0.08 } }

const SECTIONS = [
  {
    key: 'general',
    title: 'General',
    text: 'Westminster timing, format and national election basics.',
  },
  {
    key: 'locals',
    title: 'Locals',
    text: 'Council battlegrounds, control shifts and key authorities to watch.',
  },
  {
    key: 'mayors',
    title: 'Mayors',
    text: 'Metro and council mayor races with visible executive power.',
  },
  {
    key: 'byelections',
    title: 'By-elections',
    text: 'Single-seat contests that can expose sharper political movement.',
  },
  {
    key: 'devolved',
    title: 'Devolved',
    text: 'Holyrood and Senedd races beyond Westminster politics.',
  },
]

function SurfaceCard({ T, children, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: '14px',
        background: T?.c0 || '#fff',
        border: `1px solid ${T?.cardBorder || 'rgba(15, 23, 42, 0.08)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children, T }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T?.tl || '#5f7284',
        textAlign: 'center',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  )
}

function NavCard({ T, title, text, onClick }) {
  return (
    <motion.button
      {...TAP}
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 16,
        padding: '14px 14px 13px',
        background: T?.c0 || '#fff',
        border: `1px solid ${T?.cardBorder || 'rgba(15, 23, 42, 0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: T?.th || '#0f172a',
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: T?.tl || '#5f7284',
              lineHeight: 1.55,
              marginTop: 6,
            }}
          >
            {text}
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: T?.pr || '#12B7D4',
            flexShrink: 0,
          }}
        >
          Open
        </div>
      </div>
    </motion.button>
  )
}

export default function ElectionsScreen({ T = {}, onSelect }) {
  const handleSelect = (key) => {
    haptic?.(6)
    if (typeof onSelect === 'function') onSelect(key)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T?.sf || '#f6fbff',
      }}
    >
      <div style={{ padding: '10px 16px 36px' }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: -1,
            color: T?.th || '#0f172a',
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          Elections
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: T?.th || '#0f172a',
            textAlign: 'center',
            lineHeight: 1.55,
            maxWidth: 520,
            margin: '8px auto 0',
          }}
        >
          The next electoral tests, from Westminster to council chambers.
        </div>

        <div style={{ marginTop: 16 }}>
          <SurfaceCard T={T} style={{ marginBottom: 12 }}>
            <SectionLabel T={T}>What this covers</SectionLabel>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T?.th || '#0f172a',
                lineHeight: 1.7,
                textAlign: 'center',
                maxWidth: 560,
                margin: '0 auto',
              }}
            >
              Elections brings together the main contests shaping the political calendar, from general elections to local,
              mayoral, by-election and devolved races.
            </div>
          </SurfaceCard>

          <div style={{ display: 'grid', gap: 10 }}>
            {SECTIONS.map((section) => (
              <NavCard
                key={section.key}
                T={T}
                title={section.title}
                text={section.text}
                onClick={() => handleSelect(section.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
