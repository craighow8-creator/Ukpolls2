import React from 'react'
import { EZ } from '../constants'

// Transitioning `background` on complex multi-layer radial gradients is not
// GPU-composited and causes layout repaints / screen flash on mobile.
// Instead we render TWO stacked layers and crossfade between them with
// opacity — opacity transitions are always composited on the GPU.

export default function AtmoBg({ T }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      overflow: 'hidden',
    }}>
      {/* Static base gradient — bottom half, never animated */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, transparent 30%, ${T.bgBot} 65%, ${T.sf} 100%)`,
        transition: `background 1.2s ${EZ}`,
        willChange: 'opacity',
      }}/>

      {/* Party colour layer — crossfade via opacity, NOT background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: [
          `radial-gradient(ellipse at 50% 0%, ${T.bgTop} 0%, transparent 65%)`,
          `radial-gradient(ellipse at 0% 25%, ${T.bgTop}cc 0%, transparent 45%)`,
          `radial-gradient(ellipse at 100% 25%, ${T.bgMid}cc 0%, transparent 45%)`,
          `radial-gradient(ellipse at 50% 35%, ${T.bgTop}ee 0%, ${T.bgMid}88 35%, transparent 65%)`,
          `linear-gradient(180deg, ${T.bgTop} 0%, ${T.bgMid} 30%, transparent 65%)`,
        ].join(','),
        transition: `opacity 1.2s ${EZ}`,
        willChange: 'opacity',
      }}/>

      {/* Keep the background clean and non-directional; avoid visible orb bleed. */}
    </div>
  )
}
