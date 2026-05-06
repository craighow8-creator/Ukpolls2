import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import React from 'react'

const ICON_SHARE  = 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13'
const ICON_INFO   = 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8h.01M12 12v4'
const ICON_SUN    = 'M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'
const ICON_MOON   = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'
const ICON_SHIELD = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'

function SvgIcon({ d, color, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function SwipeDownSheet({ onClose, sheetBg, children }) {
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 200], [1, 0])

  const handleDragEnd = (_, info) => {
    if (info.velocity.y > 300 || info.offset.y > 120) {
      animate(y, 400, { type: 'spring', stiffness: 400, damping: 36, onComplete: onClose })
    } else {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 36 })
    }
  }

  return (
    <motion.div
      style={{
        y,
        background: sheetBg,
        borderRadius: '20px 20px 0 0',
        paddingBottom: `calc(16px + env(safe-area-inset-bottom))`,
        width: '100%', maxWidth: 520,
        boxShadow: '0 -2px 20px rgba(0,0,0,0.18)',
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.4 }}
      onDrag={(_, info) => y.set(Math.max(0, info.offset.y))}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  )
}

export default function MenuSheet({ open, onClose, T, onAbout, onShare, dark, onToggleDark }) {
  if (!open) return null

  // Always solid — T.sf is always opaque regardless of theme/dark mode
  const sheetBg    = T.sf
  const divider    = T.cardBorder || (dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)')
  const rowHover   = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
  const iconBg     = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'
  const closeBg    = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'

  // Compute admin URL from current page origin + base path
  const adminUrl = (() => {
    try {
      const url = new URL(window.location.href)
      // Strip anything after the base path and append admin.html
      const base = url.pathname.replace(/\/[^/]*$/, '') // strip trailing filename if any
      const basePath = base.endsWith('/') ? base : base + '/'
      return url.origin + basePath + 'admin.html'
    } catch {
      return '/admin.html'
    }
  })()

  const items = [
    {
      icon: ICON_SHARE,
      label: 'Share Politiscope',
      sub: 'Send polls snapshot to friends',
      fn: () => { onClose(); setTimeout(onShare, 180) },
    },
    {
      icon: ICON_INFO,
      label: 'About & Sources',
      sub: 'Data sources · version info',
      fn: () => { onClose(); setTimeout(onAbout, 180) },
    },
    {
      icon: dark ? ICON_SUN : ICON_MOON,
      label: dark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      sub: dark ? 'Use light background' : 'Use dark background',
      fn: () => { onToggleDark(); onClose() },
    },
  ]

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.50)',
        zIndex: 600,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <SwipeDownSheet onClose={onClose} sheetBg={sheetBg}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.14)',
          margin: '14px auto 8px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 18px 12px',
          borderBottom: `1px solid ${divider}`,
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.th }}>
            Politiscope
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: closeBg,
              border: 'none', cursor: 'pointer', outline: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={T.th} strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main actions */}
        <div style={{ padding: '6px 0' }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.fn}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                WebkitTapHighlightColor: 'transparent',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SvgIcon d={item.icon} color={T.pr} size={19} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.th, lineHeight: 1.2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 2 }}>
                  {item.sub}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Admin — below divider, intentionally understated */}
        <div style={{ borderTop: `1px solid ${divider}`, padding: '10px 0 4px' }}>
          <button
            onClick={() => {
              onClose()
              // Small delay so sheet closes before new tab opens
              setTimeout(() => window.open(adminUrl, '_blank', 'noopener'), 100)
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 18px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              WebkitTapHighlightColor: 'transparent',
              textAlign: 'left',
              opacity: 0.55,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SvgIcon d={ICON_SHIELD} color={T.tl} size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.tl }}>
                Admin Panel
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 1 }}>
                Opens in new tab · authorised account required
              </div>
            </div>
          </button>
        </div>
      </SwipeDownSheet>
    </div>
  )
}



