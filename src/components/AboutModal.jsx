import React from 'react'
import { R, APP_VERSION, APP_UPDATED } from '../constants'

export default function AboutModal({ open, onClose, T, dark, onToggleDark }) {
  if (!open) return null

  const panelBg = dark ? '#101925' : '#f4f7fb'
  const cardBg = dark ? '#182231' : '#e9eef2'
  const borderCol = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const headingCol = T.th
  const bodyCol = T.tm
  const mutedCol = T.tl
  const toggleBg = dark ? '#243246' : '#cfcfcf'

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'flex-end'
      }}
    >
      <div
        style={{
          background: panelBg,
          borderRadius: '20px 20px 0 0',
          borderTop: `1px solid ${borderCol}`,
          padding: `24px 20px calc(32px + env(safe-area-inset-bottom))`,
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: mutedCol + '40',
            borderRadius: 999,
            margin: '0 auto 20px'
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: `1px solid ${borderCol}`
          }}
        >
          <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 12 }}>
            <defs>
              <clipPath id="am_circ"><circle cx="36" cy="36" r="34" /></clipPath>
              <radialGradient id="am_bg" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#0d4a5c" />
                <stop offset="100%" stopColor="#020c12" />
              </radialGradient>
            </defs>
            <circle cx="36" cy="36" r="34" fill="url(#am_bg)" />
            <g clipPath="url(#am_circ)">
              <line x1="2" y1="2" x2="70" y2="70" stroke="white" strokeWidth="11.5" />
              <line x1="70" y1="2" x2="2" y2="70" stroke="white" strokeWidth="11.5" />
              <line x1="2" y1="2" x2="70" y2="70" stroke="#C8102E" strokeWidth="6.5" />
              <line x1="70" y1="2" x2="2" y2="70" stroke="#C8102E" strokeWidth="6.5" />
              <rect x="2" y="31" width="68" height="10" fill="white" />
              <rect x="31" y="2" width="10" height="68" fill="white" />
              <rect x="2" y="33" width="68" height="6" fill="#C8102E" />
              <rect x="33" y="2" width="6" height="68" fill="#C8102E" />
            </g>
            <circle cx="36" cy="36" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          </svg>

          <div style={{ fontSize: 26, fontWeight: 800, color: headingCol, letterSpacing: -0.5, marginBottom: 3 }}>
            Politiscope
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: mutedCol, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Your Full View on UK Politics
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              fontWeight: 700,
              color: headingCol,
              textAlign: 'center'
            }}
          >
            Version {APP_VERSION} · Updated {APP_UPDATED}
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 500, color: bodyCol, lineHeight: 1.7, marginBottom: 20 }}>
          A UK politics app tracking polls, elections, leaders, demographics and political market signals in one place. Built to make political information clearer, easier to follow and easier to compare.
        </div>

        <div
          style={{
            background: cardBg,
            borderRadius: 18,
            border: `1px solid ${borderCol}`,
            padding: '16px 18px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: headingCol }}>
              {dark ? '🌙 Dark mode' : '☀️ Light mode'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: mutedCol, marginTop: 2 }}>
              Tap to switch
            </div>
          </div>

          <div
            onClick={onToggleDark}
            style={{
              width: 52,
              height: 30,
              borderRadius: 999,
              background: toggleBg,
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.3s',
              flexShrink: 0
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: dark ? 24 : 3,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.3s'
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: cardBg,
            borderRadius: 18,
            border: `1px solid ${borderCol}`,
            padding: '16px 18px',
            marginBottom: 12
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: headingCol, marginBottom: 10 }}>
            📊 Data sources
          </div>

          {[
            { label: 'Polls', source: 'British Polling Council · 7-poll rolling average' },
            { label: 'Seat projection', source: 'Uniform swing model · Electoral Calculus MRP' },
            { label: 'Leader favourability', source: 'YouGov political favourability ratings' },
            { label: 'Political markets', source: 'Maintained rows with source/date labels' },
            { label: 'Net migration', source: 'ONS · Year ending June 2025' },
            { label: 'Channel crossings', source: 'Home Office / Migration Observatory 2025' },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: headingCol, minWidth: 110, flexShrink: 0 }}>
                {d.label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: bodyCol }}>
                {d.source}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: mutedCol, textAlign: 'center', marginBottom: 20 }}>
          Free · No ads · No tracking
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 14,
            background: T.pr,
            color: '#fff',
            border: 'none',
            borderRadius: R.pill,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

