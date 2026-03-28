// Horizontal swipe navigation between related items
// Used on Leader and Party screens

import { useCallback, useRef } from 'react'
import { haptic } from '../components/ui'

export function useSwipeNav({ items, currentIdx, onNavigate }) {
  const startX = useRef(null)
  const startY = useRef(null)

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current)

    // Only trigger if horizontal swipe > 60px and not mostly vertical
    if (Math.abs(dx) > 60 && dy < 40) {
      if (dx < 0 && currentIdx < items.length - 1) {
        haptic(6)
        onNavigate(currentIdx + 1)
      } else if (dx > 0 && currentIdx > 0) {
        haptic(6)
        onNavigate(currentIdx - 1)
      }
    }
    startX.current = null
    startY.current = null
  }, [currentIdx, items, onNavigate])

  // Keyboard left/right arrows on desktop
  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight' && currentIdx < items.length - 1) {
      haptic(6); onNavigate(currentIdx + 1)
    }
    if (e.key === 'ArrowLeft' && currentIdx > 0) {
      haptic(6); onNavigate(currentIdx - 1)
    }
  }, [currentIdx, items, onNavigate])

  return { onTouchStart, onTouchEnd, onKeyDown }
}
