import { useRef, useState, useEffect } from 'react'
import { SP } from '../constants'

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

  const onHandleStart = (clientY) => {
    startY.current = clientY
    setDragging(true)
    setDragY(0)
  }

  const onHandleMove = (clientY) => {
    if (!dragging) return
    const delta = Math.max(0, clientY - startY.current)
    setDragY(delta)
  }

  const onHandleEnd = () => {
    setDragging(false)
    if (dragY > 120) {
      setDismissed(true)
      setTimeout(onClose, 320)
    } else {
      setDragY(0)
    }
  }

  const translateY = dismissed ? '100%' : dragging ? `${dragY}px` : '0px'
  const transition = dragging ? 'none' : `transform 0.38s cubic-bezier(0.32,0.72,0,1)`

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
          onMouseDown={(e) => onHandleStart(e.clientY)}
          onMouseMove={(e) => onHandleMove(e.clientY)}
          onMouseUp={() => onHandleEnd()}
          onTouchStart={(e) => onHandleStart(e.touches[0].clientY)}
          onTouchMove={(e) => onHandleMove(e.touches[0].clientY)}
          onTouchEnd={() => onHandleEnd()}
          style={{
            flexShrink: 0,
            padding: '14px 0 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'grab',
            touchAction: 'none',
            position: 'relative',
            zIndex: 5,
            minHeight: 54,
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.tm} strokeWidth="2" strokeLinecap="round">
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
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes sheetUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
      `}</style>
    </>
  )
}