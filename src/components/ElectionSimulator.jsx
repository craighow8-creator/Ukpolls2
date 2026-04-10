import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SP, EZ } from '../constants'
import { haptic } from '../components/ui'

// FPTP seat projection — simplified Butler model
// Based on uniform national swing from 2024 results
const BASE_2024 = {
  'Reform UK': { pct: 14.3, seats: 5 },
  'Labour':    { pct: 33.7, seats: 412 },
  'Conservative': { pct: 23.7, seats: 121 },
  'Green':     { pct: 6.7,  seats: 4 },
  'Lib Dem':   { pct: 12.2, seats: 72 },
  'SNP':       { pct: 2.5,  seats: 9 },
  'Restore Britain': { pct: 0, seats: 0 },
}

const CURRENT = {
  'Reform UK': 27, 'Labour': 19, 'Conservative': 18,
  'Green': 16, 'Lib Dem': 12, 'SNP': 3, 'Restore Britain': 7,
}

const COLORS = {
  'Reform UK': '#12B7D4', 'Labour': '#E4003B', 'Conservative': '#0087DC',
  'Green': '#02A95B', 'Lib Dem': '#FAA61A', 'SNP': '#C4922A', 'Restore Britain': '#7C3AED',
}

const ABBRV = {
  'Reform UK': 'REF', 'Labour': 'LAB', 'Conservative': 'CON',
  'Green': 'GRN', 'Lib Dem': 'LD', 'SNP': 'SNP', 'Restore Britain': 'RB',
}

const MAJORITY = 326
const TOTAL    = 650

// Simplified UNS (Uniform National Swing) seat projection
function projectSeats(pollShares) {
  const seats = {}
  let total = 0

  Object.keys(BASE_2024).forEach(party => {
    const base     = BASE_2024[party]
    const current  = pollShares[party] || 0
    const swing    = current - CURRENT[party]
    // UNS: apply swing proportionally to base seats
    const swingFactor = 1 + (swing / Math.max(base.pct, 5)) * 0.6
    const projected = Math.max(0, Math.round(base.seats * swingFactor))
    seats[party] = projected
    total += projected
  })

  // Normalise to 650
  const scale = TOTAL / Math.max(total, 1)
  Object.keys(seats).forEach(p => {
    seats[p] = Math.round(seats[p] * scale)
  })

  return seats
}

function getMajority(seats) {
  const sorted = Object.entries(seats).sort(([,a],[,b]) => b-a)
  const top = sorted[0]
  if (!top) return { status: 'Unknown', party: null, seats: 0 }
  if (top[1] >= MAJORITY) {
    return { status: 'MAJORITY', party: top[0], seats: top[1], majority: top[1] - MAJORITY }
  }
  return { status: 'HUNG', party: top[0], seats: top[1], shortfall: MAJORITY - top[1] }
}

export default function ElectionSimulator({ T, parties }) {
  const mainParties  = parties.filter(p => !['Other'].includes(p.name))
  const leading      = [...mainParties].sort((a,b) => b.pct - a.pct)[0]

  const [adjusted, setAdjusted] = useState(() => {
    const obj = {}
    mainParties.forEach(p => { obj[p.name] = p.pct })
    return obj
  })

  const [dragging,   setDragging]   = useState(false)
  const [showShare,  setShowShare]  = useState(false)
  const sliderRef = useRef()

  const projected  = projectSeats(adjusted)
  const majorityInfo = getMajority(projected)
  const leadingParty = mainParties.find(p => p.name === majorityInfo.party)

  const isHung     = majorityInfo.status === 'HUNG'
  const isMajority = majorityInfo.status === 'MAJORITY'

  // Show share button when interesting threshold hit
  useEffect(() => {
    setShowShare(isHung || (isMajority && majorityInfo.majority <= 10))
  }, [isHung, isMajority, majorityInfo.majority])

  const handleSlider = useCallback((party, value) => {
    haptic(4)
    setAdjusted(prev => {
      const diff     = value - prev[party]
      const others   = mainParties.filter(p => p.name !== party)
      const newVals  = { ...prev, [party]: value }
      // Redistribute change across other parties proportionally
      const totalOther = others.reduce((s, p) => s + prev[p.name], 0)
      others.forEach(p => {
        const share = totalOther > 0 ? prev[p.name] / totalOther : 1 / others.length
        newVals[p.name] = Math.max(1, Math.round((prev[p.name] - diff * share) * 10) / 10)
      })
      return newVals
    })
  }, [mainParties])

  const reset = () => {
    haptic(10)
    const obj = {}
    mainParties.forEach(p => { obj[p.name] = p.pct })
    setAdjusted(obj)
    setShowShare(false)
  }

  const statusColor = isHung ? '#D97706' : leadingParty?.color || T.pr
  const statusBg    = isHung ? '#FEF3C7' : `${leadingParty?.color}18` || `${T.pr}18`

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Status banner */}
      <div style={{
        background: statusBg,
        border: `1px solid ${statusColor}44`,
        borderRadius: 20, padding: '14px 20px',
        marginBottom: 16, textAlign: 'center',
        transition: `background 0.8s ${EZ}, border-color 0.8s ${EZ}`,
      }}>
        {isHung ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#D97706', marginBottom: 4 }}>⚠ Hung Parliament</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#92400E' }}>
              {majorityInfo.party} needs {majorityInfo.shortfall} more seats
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: statusColor, marginBottom: 4 }}>
              {leadingParty?.name} Majority
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: statusColor }}>
              +{majorityInfo.majority} seat majority
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 2 }}>
              {projected[majorityInfo.party]} / {MAJORITY} needed
            </div>
          </>
        )}
      </div>

      {/* Seat bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: T.tl, marginBottom: 6, textAlign: 'center' }}>
          Projected seats · 650 · majority at 326
        </div>
        <div style={{ height: 16, borderRadius: 999, background: T.c1, overflow: 'hidden', display: 'flex', position: 'relative', transition: `all 0.6s ${EZ}` }}>
          {Object.entries(projected).sort(([,a],[,b]) => b-a).map(([party, seats], i) => (
            <div
              key={party}
              style={{
                width: `${Math.round(seats / TOTAL * 100)}%`,
                height: '100%',
                background: COLORS[party] || '#888',
                transition: `width 0.6s ${EZ}`,
                flexShrink: 0,
              }}
            />
          ))}
          {/* Majority line */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'rgba(0,0,0,0.3)', transform: 'translateX(-50%)' }}/>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {Object.entries(projected).filter(([,s]) => s > 0).sort(([,a],[,b]) => b-a).map(([party, seats]) => (
            <span key={party} style={{ fontSize: 13, fontWeight: 700, color: COLORS[party] || '#888', transition: `color 0.4s` }}>
              {ABBRV[party] || party.slice(0,3).toUpperCase()} {seats}
            </span>
          ))}
        </div>
      </div>

      {/* Sliders — drag to adjust polls */}
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: T.tl, marginBottom: 10, textAlign: 'center' }}>
        Drag to adjust polls
      </div>
      {mainParties.sort((a,b) => b.pct - a.pct).map((p, i) => {
        const val = adjusted[p.name] || p.pct
        const original = p.pct
        const diff = Math.round((val - original) * 10) / 10
        return (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }}/>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.th }}>{p.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {diff !== 0 && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: diff > 0 ? '#02A95B' : '#C8102E', background: diff > 0 ? '#D0F5E4' : '#FAD5DB', padding: '2px 7px', borderRadius: 999 }}>
                    {diff > 0 ? '+' : ''}{diff}
                  </span>
                )}
                <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: p.color, minWidth: 44, textAlign: 'right' }}>
                  {Math.round(val)}%
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.tl, minWidth: 40, textAlign: 'right' }}>
                  {projected[p.name] || 0} seats
                </span>
              </div>
            </div>
            <input
              type="range" min="1" max="50" step="1"
              value={Math.round(val)}
              onChange={e => handleSlider(p.name, +e.target.value)}
              onMouseDown={() => setDragging(true)}
              onMouseUp={() => { setDragging(false); haptic(8) }}
              onTouchStart={() => setDragging(true)}
              onTouchEnd={() => { setDragging(false); haptic(8) }}
              style={{ width: '100%', accentColor: p.color, cursor: 'grab' }}
            />
          </div>
        )
      })}

      {/* Reset + share */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          onClick={reset}
          style={{ flex: 1, background: T.c1, border: `1px solid ${T.cardBorder||'rgba(0,0,0,0.08)'}`, borderRadius: 999, padding: '12px', fontSize: 13, fontWeight: 700, color: T.th, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", WebkitTapHighlightColor: 'transparent' }}
        >
          Reset to current polls
        </button>
        {showShare && (
          <button
            onClick={() => {
              haptic(15)
              const text = isHung
                ? `What if there was a UK election tomorrow? HUNG PARLIAMENT — ${majorityInfo.party} largest party with ${projected[majorityInfo.party]} seats, ${majorityInfo.shortfall} short of a majority. Play with the numbers at politiscope.`
                : `What if there was a UK election tomorrow? ${majorityInfo.party} MAJORITY of +${majorityInfo.majority} seats. Play with the numbers at politiscope.`
              navigator.share?.({ title: 'Politiscope', text }).catch(() =>
                navigator.clipboard?.writeText(text)
              )
            }}
            style={{ flex: 1, background: leadingParty?.color || T.pr, border: 'none', borderRadius: 999, padding: '12px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", WebkitTapHighlightColor: 'transparent', animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            Share this scenario →
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  )
}



