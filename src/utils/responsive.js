import { useState, useEffect } from 'react'

export function useResponsive() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 430)

  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  return {
    w,
    isMobile:  w < 480,
    isTabletSm: w >= 480 && w < 768,
    isTabletLg: w >= 768 && w < 1024,
    isDesktop:  w >= 1024,
    isWide:     w >= 1440,
    cols: w < 480 ? 2 : w < 768 ? 3 : w < 1024 ? 4 : w < 1440 ? 5 : 6,
    gutter: w < 480 ? 12 : w < 768 ? 16 : w < 1024 ? 20 : 24,
    cardPad: w < 480 ? 16 : w < 768 ? 18 : 20,
    heroSize: w < 480 ? '88px' : w < 768 ? '100px' : w < 1024 ? '110px' : '130px',
    silScale: w < 480 ? 1 : w < 768 ? 1.1 : w < 1024 ? 1.2 : 1.4,
  }
}

// Grid span helpers — converts 1x1/2x1/2x2 to column/row spans
export function gridSpan(size, cols) {
  if (size === '2x2') return { gridColumn: cols >= 4 ? 'span 2' : '1/-1', gridRow: 'span 2' }
  if (size === '2x1') return { gridColumn: cols >= 3 ? 'span 2' : '1/-1' }
  return {}
}
