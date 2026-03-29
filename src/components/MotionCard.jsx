import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useRef } from 'react'
import { haptic } from './ui'
import { useSwipeNav } from '../utils/swipe'

export const CARD_SIZES = {
  small: { cols: 1, rows: 1, minH: 150 },
  wide: { cols: 2, rows: 1, minH: 160 },
  hero: { cols: 2, rows: 2, minH: 340 },
  banner: { cols: 2, rows: 1, minH: 80 },
  tall: { cols: 1, rows: 2, minH: 340 },
}

const SPRING_OPEN = { type: 'spring', stiffness: 350, damping: 32 }
const SPRING_DISMISS = { type: 'spring', stiffness: 400, damping: 36 }

function BrandHeader({ T, onClose }) {
  const logoSrc = `${import.meta.env.BASE_URL}icon-192.png`

  return (
    <div
      style={{
        flexShrink: 0,
        background: T.sf,
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.14)'}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
        padding: '8px 14px 10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 52,
            height: 6,
            borderRadius: 999,
            background: T.tl,
            opacity: 0.22,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: 44,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 0,
            flex: 1,
          }}
        >
          <img
            src={logoSrc}
            alt="Politiscope"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              flexShrink: 0,
              objectFit: 'cover',
            }}
          />

          <div
            style={{
              minWidth: 0,
              lineHeight: 1.05,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: T.th,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Politiscope
            </div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: T.tl,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              The full picture of British politics
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: T.c1,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
            flexShrink: 0,
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
      </div>
    </div>
  )
}

export function ExpandedCard({ layoutId, T, children, onClose }) {
  const y = useMotionValue(0)
  const bgOpacity = useTransform(y, [0, 180], [1, 0])
  const closeTimer = useRef(null)

  const handleDragEnd = (_, info) => {
    if (info.velocity.y > 450 || info.offset.y > 140) {
      animate(y, window.innerHeight, {
        ...SPRING_DISMISS,
        onComplete: onClose,
      })
    } else {
      animate(y, 0, SPRING_DISMISS)
    }
  }

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeNav({
    onSwipeRight: onClose,
    onSwipeLeft: undefined,
  })

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          opacity: bgOpacity,
          position: 'fixed',
          inset: 0,
          zIndex: 299,
          background: 'rgba(0,0,0,0.30)',
        }}
        onClick={onClose}
      />

      <motion.div
        layoutId={layoutId}
        style={{
          y,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '100dvh',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          background: T.sf,
          borderRadius: 0,
          overflow: 'hidden',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.15)',
          willChange: 'transform',
        }}
        transition={SPRING_OPEN}
      >
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.22 }}
          dragMomentum={false}
          onDrag={(_, info) => y.set(Math.max(0, info.offset.y))}
          onDragEnd={handleDragEnd}
          style={{ flexShrink: 0 }}
        >
          <BrandHeader T={T} onClose={onClose} />
        </motion.div>

        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'none',
            paddingBottom: 32,
          }}
        >
          <style>{`::-webkit-scrollbar{display:none}`}</style>
          {children}
        </div>
      </motion.div>
    </>
  )
}

export function BentoCard({ id, size = 'small', T, color, children, onClick, style = {} }) {
  const sz = CARD_SIZES[size] || CARD_SIZES.small
  return (
    <motion.div
      layoutId={id}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      transition={SPRING_OPEN}
      onClick={() => {
        if (onClick) {
          haptic(8)
          onClick()
        }
      }}
      style={{
        gridColumn: sz.cols > 1 ? `span ${sz.cols}` : undefined,
        gridRow: sz.rows > 1 ? `span ${sz.rows}` : undefined,
        minHeight: sz.minH,
        borderRadius: 18,
        background: T.c0,
        border: `1.5px solid ${T.cardBorder || 'rgba(0,0,0,0.09)'}`,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        alignSelf: 'start',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitFontSmoothing: 'antialiased',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

export function CardLabel({ children, T, color }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.04em',
        lineHeight: 1.5,
        textTransform: 'uppercase',
        color: color || T.tm,
        textAlign: 'center',
        WebkitFontSmoothing: 'antialiased',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

export function CardMetric({ children, T, color, size = 28 }) {
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        color: color || T.hero || T.th,
        textAlign: 'center',
        WebkitFontSmoothing: 'antialiased',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  )
}

export function CardSub({ children, T }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.03em',
        lineHeight: 1.5,
        color: T.tl,
        textAlign: 'center',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {children}
    </div>
  )
}