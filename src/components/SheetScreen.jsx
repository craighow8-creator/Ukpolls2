import { useRef, useState, useEffect } from 'react'

export default function SheetScreen({ children, T, onClose }) {
  const [dragging, setDragging] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const startY = useRef(0)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e) => {
      const delta = Math.max(0, e.clientY - startY.current)
      setDragY(delta)
    }

    const handleMouseUp = () => {
      setDragging(false)
      setDragY((current) => {
        if (current > 120) {
          setDismissed(true)
          window.setTimeout(onClose, 320)
          return current
        }
        return 0
      })
    }

    const handleTouchMove = (e) => {
      const touch = e.touches[0]
      if (!touch) return
      const delta = Math.max(0, touch.clientY - startY.current)
      setDragY(delta)
    }

    const handleTouchEnd = () => {
      setDragging(false)
      setDragY((current) => {
        if (current > 120) {
          setDismissed(true)
          window.setTimeout(onClose, 320)
          return current
        }
        return 0
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragging, onClose])

  const beginDrag = (clientY) => {
    startY.current = clientY
    setDragging(true)
    setDragY(0)
  }

  const translateY = dismissed ? '100%' : dragging ? `${dragY}px` : '0px'
  const transition = dragging ? 'none' : 'transform 0.38s cubic-bezier(0.32,0.72,0,1)'

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.28)',
          animation: 'fadeIn 0.2s ease forwards',
        }}
      />

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${translateY})`,
          transition,
          width: '100%',
          maxWidth: 1440,
          height: '100dvh',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          background: T.sf || T.c0,
          borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
          animation: dismissed ? 'none' : 'sheetUp 0.42s cubic-bezier(0.32,0.72,0,1) forwards',
        }}
      >
        <div
          onMouseDown={(e) => beginDrag(e.clientY)}
          onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
          style={{
            flexShrink: 0,
            minHeight: 56,
            padding: '14px 0 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            cursor: 'grab',
            touchAction: 'none',
            position: 'relative',
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: 40,
              height: 5,
              borderRadius: 999,
              background: T.tl,
              opacity: 0.35,
            }}
          />
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: T.c1,
            border: '1px solid rgba(255,255,255,0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.tm}
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            paddingBottom: 60,
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetUp { from { transform: translateX(-50%) translateY(100%) } to { transform: translateX(-50%) translateY(0) } }
      `}</style>
    </>
  )
}