import React, { useState, useEffect, useRef } from 'react'

// Left cluster heights (3 cols) and right cluster heights (3 cols)
// Each profile: [L1,L2,L3, R1,R2,R3] as % of container height
// Upper 25-40% positioning — decorative not interactive zone
const PROFILES = [
  [88, 72, 55,  60, 80, 92], // london
  [95, 68, 50,  55, 85, 78], // manchester
  [72, 90, 62,  88, 65, 82], // birmingham
  [92, 75, 58,  70, 88, 65], // edinburgh
  [80, 65, 72,  92, 72, 85], // cardiff
  [85, 92, 60,  75, 60, 90], // sheffield
]

// Column widths as % of their respective side
const L_WIDTHS = [38, 32, 30]  // 3 left columns
const R_WIDTHS = [30, 32, 38]  // 3 right columns (mirror)

export function CitySkyline({ color = '#000000' }) {
  const [idx,    setIdx]    = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setIdx(i => (i + 1) % PROFILES.length)
        setFading(false)
      }, 1400)
    }, 8000)
    return () => clearInterval(timerRef.current)
  }, [])

  const p = PROFILES[idx]
  // Left heights: p[0],p[1],p[2] — Right heights: p[3],p[4],p[5]

  // Use transform:scaleY instead of animating height.
  // scaleY is GPU-composited — no layout reflow, no screen flash on mobile.
  const colStyle = (heightPct) => ({
    height:          '100%',
    transformOrigin: 'bottom',
    transform:       `scaleY(${heightPct / 100})`,
    background:      color,
    opacity:         0.32,
    transition:      'transform 2.5s ease-in-out',
    willChange:      'transform',
    flexShrink:      0,
  })

  return (
    <div style={{
      position:      'fixed',
      top:           0,
      left:          0,
      right:         0,
      // Upper 30% of screen — decorative zone
      height:        '100vh',
      zIndex:        2,
      pointerEvents: 'none',
      opacity:       fading ? 0 : 1,
      transition:    'opacity 1.4s ease-in-out',
      willChange:    'opacity',
      filter:        'blur(10px)',
      display:       'flex',
      alignItems:    'flex-end',
      justifyContent:'space-between',
      // Fade top transparent, solid at 40%, then fade again at bottom
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 75%, transparent 100%)',
      maskImage:       'linear-gradient(to bottom, transparent 0%, black 15%, black 75%, transparent 100%)',
    }}>
      {/* LEFT cluster — hugs left edge */}
      <div style={{
        display:    'flex',
        alignItems: 'flex-end',
        height:     '100%',
        width:      '22%',
        flexShrink: 0,
      }}>
        {[p[0],p[1],p[2]].map((h,i) => (
          <div key={i} style={{ ...colStyle(h), width: `${L_WIDTHS[i]}%` }}/>
        ))}
      </div>

      {/* CENTRE — completely empty, 56% wide */}
      <div style={{ flex: 1 }}/>

      {/* RIGHT cluster — hugs right edge */}
      <div style={{
        display:    'flex',
        alignItems: 'flex-end',
        height:     '100%',
        width:      '22%',
        flexShrink: 0,
      }}>
        {[p[3],p[4],p[5]].map((h,i) => (
          <div key={i} style={{ ...colStyle(h), width: `${R_WIDTHS[i]}%` }}/>
        ))}
      </div>
    </div>
  )
}

export default CitySkyline



