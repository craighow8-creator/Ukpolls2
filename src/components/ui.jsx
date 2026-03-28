import { useState } from 'react'
import { R, SP, EZ, TYPE, SPACING } from '../constants'

// ── Haptic ────────────────────────────────────────────────
export const haptic = (ms = 8) => {
  try { navigator.vibrate?.(ms) } catch(e) {}
}

// ── Press feedback ────────────────────────────────────────
export function usePress() {
  const [p, setP] = useState(false)
  return {
    pressed: p,
    h: {
      onMouseDown:  () => setP(true),
      onMouseUp:    () => setP(false),
      onMouseLeave: () => setP(false),
      onTouchStart: () => setP(true),
      onTouchEnd:   () => setP(false),
    }
  }
}

// ── Bento Card ────────────────────────────────────────────
export function BentoCard({
  children, onClick, T,
  wide, tall, size,
  style = {}, updated = false,
  interactive = false,
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const { pressed, h } = usePress()
  const isClickable = !!onClick
  const cardRef = useState(null)

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = (e.clientX - rect.left) / rect.width  - 0.5
    const cy = (e.clientY - rect.top)  / rect.height - 0.5
    setTilt({ x: cy * 4, y: cx * -4 })
  }
  const resetTilt = () => setTilt({ x: 0, y: 0 })

  const handleClick = () => {
    if (onClick) { haptic(8); onClick() }
  }

  return (
    <div
      {...(isClickable ? h : {})}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{
        perspective: '800px',
        gridColumn: wide || size === '2x1' || size === '2x2' ? (size === '2x2' ? undefined : 'span 2') : undefined,
        gridRow:    size === '2x2' ? 'span 2' : undefined,
        borderRadius: R.card,
        background: T.c0,
        border:`1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}`,
        boxShadow: [
          ``,
          `inset -1px -1px 0 rgba(0,0,0,0.04)`,
          updated ? `0 0 0 2px ${T.pr}44` : '',
          interactive ? `0 0 0 2px ${T.pr}33` : '',
        ].filter(Boolean).join(', '),
        padding: SPACING.cardPad,
        minHeight: size === '2x2' ? 280 : tall ? 200 : wide || size === '2x1' ? 100 : 140,
        position: 'relative',
        overflow: 'hidden',
        cursor: isClickable ? 'pointer' : 'default',
        transform: pressed ? 'scale(0.98)' : `scale(1) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: `transform 0.16s ${SP}, box-shadow 0.3s ${EZ}`,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        backgroundColor: T.cardTint
          ? `color-mix(in srgb, ${T.c0}, ${T.cardTint})`
          : T.c0,
        ...style,
      }}
    >
      {children}
      {isClickable && (
        <div style={{
          position:'absolute', top:14, right:14,
          fontSize:13, color: T.tl,
          opacity: 0.5, fontWeight:600,
          pointerEvents:'none',
        }}>›</div>
      )}
    </div>
  )
}

// ── Card Label (top-left) ─────────────────────────────────
export function CardLabel({ children, T }) {
  return (
    <div style={{
      ...TYPE.bentoLabel,
      fontSize: TYPE.bentoLabel.fontSize + 'px',
      color: T.tm,
      marginBottom: 8,
      textTransform: 'uppercase',
      textAlign: 'center',
    }}>
      {children}
    </div>
  )
}

// ── Card Primary metric (dead centre) ─────────────────────
export function CardMetric({ children, T, color, size }) {
  return (
    <div style={{
      ...TYPE.bentoPrimary,
      fontSize: (size || TYPE.bentoPrimary.fontSize) + 'px',
      color: color || T.hero || T.th,
      textAlign: 'center',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  )
}

// ── Card secondary text (bottom-right) ───────────────────
export function CardSub({ children, T }) {
  return (
    <div style={{
      ...TYPE.bentoSecond,
      fontSize: TYPE.bentoSecond.fontSize + 'px',
      color: T.tl,
      textAlign: 'right',
      marginTop: 'auto',
    }}>
      {children}
    </div>
  )
}

// ── Sticky Pills ──────────────────────────────────────────
export function StickyPills({ pills, active, onSelect, T, accentColor }) {
  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const [scrollRef, setScrollRef] = useState(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = (el) => {
    if (!el) return
    const maxScrollLeft = el.scrollWidth - el.clientWidth
    setCanScrollLeft(el.scrollLeft > 6)
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 6)
  }

  const bindRef = (el) => {
    setScrollRef(el)
    if (el) requestAnimationFrame(() => updateScrollState(el))
  }

  const scrollByAmount = (dir) => {
    if (!scrollRef) return
    scrollRef.scrollBy({
      left: dir * 160,
      behavior: 'smooth',
    })
    requestAnimationFrame(() => updateScrollState(scrollRef))
    haptic(6)
  }

  const pillBg = isDark ? 'rgba(255,255,255,0.10)' : '#F2F2F2'
  const pillText = isDark ? 'rgba(255,255,255,0.78)' : T.tm
  const activeBg = accentColor || '#012169'
  const shellBg = T.sf
  const leftFade = isDark
    ? 'linear-gradient(to right, rgba(13,26,36,1), rgba(13,26,36,0))'
    : 'linear-gradient(to right, rgba(245,247,250,1), rgba(245,247,250,0))'
  const rightFade = isDark
    ? 'linear-gradient(to left, rgba(13,26,36,1), rgba(13,26,36,0))'
    : 'linear-gradient(to left, rgba(245,247,250,1), rgba(245,247,250,0))'

  const arrowBgEnabled = isDark ? 'rgba(255,255,255,0.08)' : '#ECEFF3'
  const arrowBgDisabled = isDark ? 'rgba(255,255,255,0.04)' : '#F5F7F9'
  const arrowColorEnabled = isDark ? 'rgba(255,255,255,0.7)' : T.tl
  const arrowColorDisabled = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)'

  return (
    <div
      data-no-swipe
      style={{
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: shellBg,
        padding: '6px 16px 10px',
      }}
    >
      {(canScrollLeft || canScrollRight) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 6,
            marginBottom: 6,
            minHeight: 24,
          }}
        >
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll pills left"
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              border: 'none',
              cursor: canScrollLeft ? 'pointer' : 'default',
              background: canScrollLeft ? arrowBgEnabled : arrowBgDisabled,
              color: canScrollLeft ? arrowColorEnabled : arrowColorDisabled,
              opacity: canScrollLeft ? 1 : 0.65,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            disabled={!canScrollRight}
            aria-label="Scroll pills right"
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              border: 'none',
              cursor: canScrollRight ? 'pointer' : 'default',
              background: canScrollRight ? arrowBgEnabled : arrowBgDisabled,
              color: canScrollRight ? arrowColorEnabled : arrowColorDisabled,
              opacity: canScrollRight ? 1 : 0.65,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            ›
          </button>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          minHeight: 42,
        }}
      >
        {canScrollLeft && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 24,
              pointerEvents: 'none',
              background: leftFade,
              zIndex: 2,
            }}
          />
        )}

        {canScrollRight && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 24,
              pointerEvents: 'none',
              background: rightFade,
              zIndex: 2,
            }}
          />
        )}

        <div
          ref={bindRef}
          onScroll={(e) => updateScrollState(e.currentTarget)}
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            touchAction: 'pan-x',
            WebkitOverflowScrolling: 'touch',
            minWidth: 0,
            width: '100%',
          }}
        >
          <style>{`::-webkit-scrollbar{display:none}`}</style>

          {pills.map((pill, i) => {
            const isActive = active === (pill.key || pill.label)

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  haptic(6)
                  onSelect(pill.key || pill.label)
                }}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  borderRadius: R.pill,
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  background: isActive ? activeBg : pillBg,
                  color: isActive ? '#ffffff' : pillText,
                  border: 'none',
                  transition: 'background 0.15s, color 0.15s, transform 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.1,
                }}
              >
                {pill.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Horizontal Snap Carousel ──────────────────────────────
export function SnapCarousel({ children, T, style = {} }) {
  return (
    <div
      data-no-swipe
      style={{
        display:'flex', gap:10,
        overflowX:'auto',
        overscrollBehavior:'contain',
        scrollSnapType:'x mandatory',
        touchAction:'pan-x',
        WebkitOverflowScrolling:'touch',
        padding:'4px 2px 8px',
        scrollbarWidth:'none',
        ...style,
      }}
    >
      <style>{`::-webkit-scrollbar{display:none}`}</style>
      {children}
    </div>
  )
}

// ── Snap Item ─────────────────────────────────────────────
export function SnapItem({ children, style = {} }) {
  return (
    <div style={{ scrollSnapAlign:'start', flexShrink:0, ...style }}>
      {children}
    </div>
  )
}

// ── Screen title ──────────────────────────────────────────
export function STitle({ children, T, sub }) {
  return (
    <div style={{ padding:'16px 18px 0', flexShrink:0 }}>
      <div style={{ fontSize:26, fontWeight:800, letterSpacing:-0.8, color:T.th, lineHeight:1 }}>{children}</div>
      {sub && <div style={{ fontSize:14, fontWeight:500, color:T.tl, marginTop:4 }}>{sub}</div>}
    </div>
  )
}

// ── Section label ─────────────────────────────────────────
export const SectionLabel = ({ children, T }) => (
  <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.06em', color:T.tl, padding:'12px 0 8px' }}>
    {children}
  </div>
)

// ── Scroll area ───────────────────────────────────────────
export function ScrollArea({ children, style = {} }) {
  return (
    <div style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', padding:'10px 14px 32px', overscrollBehavior:'contain', scrollbarWidth:'none', ...style }}>
      <style>{`::-webkit-scrollbar{display:none}`}</style>
      {children}
    </div>
  )
}

// ── Glass block ───────────────────────────────────────────
export const GlassBlock = ({ children, T, style = {} }) => (
  <div style={{
    background: T.c0,
    borderRadius: R.sm,
    border:`1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}`,
    padding:'16px 18px',
    ...style,
  }}>
    {children}
  </div>
)

// ── Back button ───────────────────────────────────────────
export function BackBtn({ onClick, T }) {
  const { pressed, h } = usePress()
  return (
    <button
      {...h} onClick={() => { haptic(6); onClick() }}
      style={{
        width:44, height:44, background:T.c0,
        border:`1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}`,
        borderRadius:R.pill,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', flexShrink:0,
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition:`transform 0.15s ${SP}`,
        WebkitTapHighlightColor:'transparent', outline:'none',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.th} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M5 12l7 7M5 12l7-7"/>
      </svg>
    </button>
  )
}

// ── Push header ───────────────────────────────────────────
export function PushHeader({ back, title, T }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'52px 20px 0', flexShrink:0 }}>
      <BackBtn onClick={back} T={T}/>
      <div style={{ fontSize:14, fontWeight:600, color:T.tl, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
        {title}
      </div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────
export const Badge = ({ children, up, down, T }) => {
  const bg  = up ? '#D0F5E4' : down ? '#FAD5DB' : T.c1
  const col = up ? '#02A95B' : down ? '#C8102E' : T.tl
  return (
    <div style={{ fontSize:13, fontWeight:800, padding:'3px 9px', borderRadius:R.pill, background:bg, color:col, display:'inline-block' }}>
      {children}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────
export function Toast({ msg, T }) {
  return (
    <div style={{
      position:'fixed', bottom:36, left:'50%', transform:'translateX(-50%)',
      background:T.th, color:T.sf,
      padding:'12px 24px', borderRadius:R.pill,
      fontSize:15, fontWeight:700, fontFamily:"'Outfit',sans-serif",
      pointerEvents:'none', whiteSpace:'nowrap', zIndex:9999,
      opacity: msg ? 1 : 0, transition:'opacity 0.3s',
      boxShadow: 'none',
    }}>
      {msg}
    </div>
  )
}

// ── Hdr (legacy compat) ───────────────────────────────────
export function Hdr({ back, title, T }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'52px 20px 0', flexShrink:0 }}>
      {back && <BackBtn onClick={back} T={T}/>}
      <div style={{ fontSize:14, fontWeight:600, color:T.tl }}>{title}</div>
    </div>
  )
}

// ── Card (legacy compat) ──────────────────────────────────
export function Card({ children, onClick, T, style = {}, wide }) {
  return (
    <BentoCard onClick={onClick} T={T} wide={wide} style={style}>
      {children}
    </BentoCard>
  )
}