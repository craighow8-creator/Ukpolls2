import { useRef, useCallback } from 'react'

/**
 * useSwipeNav — horizontal swipe for screen navigation
 * 
 * Rules:
 * - Only triggers if horizontal movement > vertical (avoids conflict with vertical scroll)
 * - Only triggers if touch started outside a scrollable pill/chip row
 * - Dead zone: 30px from edges (avoids browser back-swipe conflict)
 * - Minimum swipe distance: 80px, minimum velocity: 0.3px/ms
 * - Does NOT interfere with horizontal ScrollArea children (pills, carousels)
 */
export function useSwipeNav({ onSwipeLeft, onSwipeRight }) {
  const state = useRef({
    startX: 0, startY: 0, startTime: 0,
    locked: null, // 'h' | 'v' | null
    blocked: false,
  })

  const SCROLLABLE_SELECTORS = [
    '[data-no-swipe]',
    '.no-swipe',
    '[style*="overflow-x:auto"]',
    '[style*="overflow-x: auto"]',
    '[style*="overflowX"]',
  ]

  const isInsideScrollable = (el) => {
    let node = el
    while (node && node !== document.body) {
      if (node.dataset?.noSwipe !== undefined) return true
      const style = window.getComputedStyle(node)
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') return true
      node = node.parentElement
    }
    return false
  }

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    state.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      locked: null,
      blocked: isInsideScrollable(e.target),
    }
  }, [])

  const onTouchMove = useCallback((e) => {
    if (state.current.blocked) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - state.current.startX)
    const dy = Math.abs(touch.clientY - state.current.startY)

    if (!state.current.locked) {
      if (dx > 8 || dy > 8) {
        state.current.locked = dx > dy ? 'h' : 'v'
      }
    }
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (state.current.blocked || state.current.locked !== 'h') return

    const touch = e.changedTouches[0]
    const dx = touch.clientX - state.current.startX
    const dt = Date.now() - state.current.startTime
    const velocity = Math.abs(dx) / dt
    const EDGE_DEAD = 30
    const startX = state.current.startX

    // Ignore if started near screen edge (browser back gesture zone)
    if (startX < EDGE_DEAD || startX > window.innerWidth - EDGE_DEAD) return

    if (Math.abs(dx) > 80 && velocity > 0.3) {
      if (dx < 0 && onSwipeLeft)  onSwipeLeft()
      if (dx > 0 && onSwipeRight) onSwipeRight()
    }
  }, [onSwipeLeft, onSwipeRight])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
