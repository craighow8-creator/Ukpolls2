import React, { useState, useEffect, useRef } from 'react'
import { R, EZ } from '../constants'

const CENSUS_DATA = [
  {
    year: 1991,
    groups: [
      { label: 'White British', pct: 94.5, color: '#0087DC' },
      { label: 'Asian', pct: 2.7, color: '#FAA61A' },
      { label: 'Black', pct: 1.6, color: '#02A95B' },
      { label: 'Mixed / Other', pct: 1.2, color: '#9333ea' },
    ],
    note: 'First Census to record ethnicity',
  },
  {
    year: 2001,
    groups: [
      { label: 'White British', pct: 91.3, color: '#0087DC' },
      { label: 'Asian', pct: 4.0, color: '#FAA61A' },
      { label: 'Black', pct: 2.0, color: '#02A95B' },
      { label: 'Mixed / Other', pct: 2.7, color: '#9333ea' },
    ],
    note: 'Post-EU expansion migration begins',
  },
  {
    year: 2011,
    groups: [
      { label: 'White British', pct: 87.2, color: '#0087DC' },
      { label: 'Asian', pct: 6.8, color: '#FAA61A' },
      { label: 'Black', pct: 3.0, color: '#02A95B' },
      { label: 'Mixed / Other', pct: 3.0, color: '#9333ea' },
    ],
    note: 'White British falls below 90% for first time',
  },
  {
    year: 2021,
    groups: [
      { label: 'White British', pct: 81.0, color: '#0087DC' },
      { label: 'Asian', pct: 9.3, color: '#FAA61A' },
      { label: 'Black', pct: 4.2, color: '#02A95B' },
      { label: 'Mixed / Other', pct: 5.5, color: '#9333ea' },
    ],
    note: 'Largest shift in any Census decade',
  },
]

export default function EthnicityChart({ T }) {
  const [idx, setIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef()
  const data = CENSUS_DATA[idx]

  const goTo = (i) => {
    setAnimating(true)
    setTimeout(() => { setIdx(i); setAnimating(false) }, 250)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % CENSUS_DATA.length)
    }, 3000)
    return () => clearInterval(timerRef.current)
  }, [])

  const size = 180
  const cx = size / 2, cy = size / 2, r = 72, ir = 44
  let angle = -90

  const slices = data.groups.map(g => {
    const sweep = (g.pct / 100) * 360
    const start = angle
    angle += sweep
    return { ...g, startAngle: start, endAngle: angle }
  })

  const polarToXY = (deg, radius) => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const arc = (s) => {
    const s1 = polarToXY(s.startAngle, r)
    const s2 = polarToXY(s.endAngle, r)
    const i1 = polarToXY(s.startAngle, ir)
    const i2 = polarToXY(s.endAngle, ir)
    const large = s.endAngle - s.startAngle > 180 ? 1 : 0
    return `M ${s1.x} ${s1.y} A ${r} ${r} 0 ${large} 1 ${s2.x} ${s2.y} L ${i2.x} ${i2.y} A ${ir} ${ir} 0 ${large} 0 ${i1.x} ${i1.y} Z`
  }

  return (
    <div style={{ background: T.c0, borderRadius: R.card, padding: '20px', marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: T.tl, marginBottom: 12 }}>
        UK Census — Ethnic Composition
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        {/* Donut chart */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: animating ? 0 : 1, transition: `opacity 0.25s ${EZ}`, flexShrink: 0 }}>
          {slices.map((s, i) => (
            <path key={i} d={arc(s)} fill={s.color} opacity={0.9}/>
          ))}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight={200} fill={T.th}>{data.year}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fontWeight={600} fill={T.tl}>Census</text>
        </svg>

        {/* Legend */}
        <div style={{ flex: 1 }}>
          {data.groups.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.th }}>{g.label}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: g.color, letterSpacing: -0.5 }}>{g.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      {data.note && (
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginBottom: 12 }}>💡 {data.note}</div>
      )}

      {/* Year selector dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        {CENSUS_DATA.map((d, i) => (
          <div
            key={i}
            onClick={() => { clearInterval(timerRef.current); goTo(i) }}
            style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 999, background: i === idx ? T.pr : T.tl + '40', cursor: 'pointer', transition: `width 0.3s ${EZ}, background 0.3s ${EZ}` }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        {CENSUS_DATA.map((d, i) => (
          <div key={i} onClick={() => { clearInterval(timerRef.current); goTo(i) }} style={{ fontSize: 13, fontWeight: i === idx ? 800 : 600, color: i === idx ? T.pr : T.tl, cursor: 'pointer' }}>{d.year}</div>
        ))}
      </div>
    </div>
  )
}



