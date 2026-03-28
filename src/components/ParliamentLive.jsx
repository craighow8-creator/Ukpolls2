import { useState, useEffect } from 'react'
import { R, SP, EZ } from '../constants'
import { InfoButton } from './InfoGlyph'
import { haptic } from '../components/ui'

// Parliament sitting schedule - Commons
const COMMONS_TIMES = {
  1: { label:'Monday',    start:'14:30', end:'22:30', pmqs: false },
  2: { label:'Tuesday',   start:'11:30', end:'19:00', pmqs: false },
  3: { label:'Wednesday', start:'11:30', end:'19:00', pmqs: true, pmqsTime:'12:00' },
  4: { label:'Thursday',  start:'09:30', end:'17:30', pmqs: false },
  5: { label:'Friday',    start:'09:30', end:'14:30', pmqs: false },
}

// Recess dates 2025-26
const RECESSES = [
  { start: new Date('2025-12-19'), end: new Date('2026-01-05') },
  { start: new Date('2026-02-13'), end: new Date('2026-02-23') },
  { start: new Date('2026-04-02'), end: new Date('2026-04-19') },
  { start: new Date('2026-05-22'), end: new Date('2026-06-01') },
  { start: new Date('2026-07-23'), end: new Date('2026-09-07') },
]

function isInRecess(date) {
  return RECESSES.some(r => date >= r.start && date <= r.end)
}

function getParliamentStatus() {
  const now   = new Date()
  const day   = now.getDay() // 0=Sun, 1=Mon...
  const hour  = now.getHours()
  const min   = now.getMinutes()
  const time  = hour * 60 + min

  if (isInRecess(now)) {
    return { sitting: false, reason: 'recess', label: 'Parliament in recess' }
  }

  const schedule = COMMONS_TIMES[day]
  if (!schedule) {
    // Weekend
    const nextMon = new Date(now)
    nextMon.setDate(now.getDate() + (day === 0 ? 1 : 8 - day))
    return { sitting: false, reason: 'weekend', label: 'Not sitting', nextSitting: `Monday ${COMMONS_TIMES[1].start}` }
  }

  const [sh, sm] = schedule.start.split(':').map(Number)
  const [eh, em] = schedule.end.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin   = eh * 60 + em

  if (time >= startMin && time <= endMin) {
    // Currently sitting
    const isPMQs = schedule.pmqs && time >= 12*60 && time <= 12*60+30
    return {
      sitting: true,
      label: isPMQs ? 'Prime Minister\'s Questions' : 'House of Commons sitting',
      pmqs: isPMQs,
      endsAt: schedule.end,
    }
  }

  if (time < startMin) {
    return { sitting: false, reason: 'before', label: `Sitting starts ${schedule.start}`, nextSitting: `Today ${schedule.start}` }
  }

  // After today's sitting — find next day
  const nextDay = Object.entries(COMMONS_TIMES).find(([d]) => +d > day)
  const nextLabel = nextDay
    ? `${nextDay[1].label} ${nextDay[1].start}`
    : `Monday ${COMMONS_TIMES[1].start}`
  return { sitting: false, reason: 'after', label: 'Sitting ended', nextSitting: nextLabel }
}

// Recent Hansard highlights — hardcoded, updated via admin
const HANSARD = [
  { date: '20 Mar', topic: 'Immigration Bill — Report Stage', chamber: 'Commons', significance: 'high' },
  { date: '19 Mar', topic: 'Prime Minister\'s Questions', chamber: 'Commons', significance: 'high' },
  { date: '18 Mar', topic: 'Spring Statement debate', chamber: 'Commons', significance: 'high' },
  { date: '18 Mar', topic: 'National Security Bill — Second Reading', chamber: 'Lords', significance: 'medium' },
  { date: '17 Mar', topic: 'Affordable Homes debate', chamber: 'Commons', significance: 'medium' },
]

// Semicircle seat chart
function SeatChart({ parties, T }) {
  const sorted = [...parties].filter(p=>p.seats>0).sort((a,b)=>b.seats-a.seats)
  const total  = sorted.reduce((s,p)=>s+p.seats,0)
  const MAJORITY = 326
  const cx = 120, cy = 110, r = 90, strokeW = 28

  let cumulative = 0
  const arcs = sorted.map(p => {
    const frac  = p.seats / total
    const start = cumulative
    cumulative += frac
    return { ...p, start, end: cumulative, frac }
  })

  const polarToCart = (angle, radius) => ({
    x: cx + radius * Math.cos(Math.PI + angle * Math.PI),
    y: cy + radius * Math.sin(Math.PI + angle * Math.PI),
  })

  const describeArc = (start, end, r) => {
    if (end - start >= 1) return ''
    const s  = polarToCart(start, r)
    const e  = polarToCart(end, r)
    const lg = (end - start) > 0.5 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${e.x} ${e.y}`
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.tl, marginBottom:8, textAlign:'center' }}>
        MRP seat projection · majority at 326
      </div>
      <svg width={240} height={120} viewBox={`0 0 240 120`}>
        {/* Track */}
        <path
          d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={T.c1} strokeWidth={strokeW} strokeLinecap="butt"
        />
        {/* Party arcs */}
        {arcs.map((p, i) => (
          <path
            key={i}
            d={describeArc(p.start, p.end, r)}
            fill="none"
            stroke={p.color}
            strokeWidth={strokeW}
            strokeLinecap="butt"
          />
        ))}
        {/* Majority marker */}
        {(() => {
          const majFrac = MAJORITY / total
          const pt = polarToCart(majFrac, r)
          const pt2 = polarToCart(majFrac, r - strokeW/2 - 4)
          return <line x1={pt.x} y1={pt.y} x2={pt2.x} y2={pt2.y} stroke={T.th} strokeWidth={2} opacity={0.4}/>
        })()}
        {/* Centre label */}
        <text x={cx} y={cy-10} textAnchor="middle" fontSize={11} fontWeight={700} fill={T.tl} fontFamily="Outfit,sans-serif">650</text>
        <text x={cx} y={cy+4} textAnchor="middle" fontSize={9} fill={T.tl} fontFamily="Outfit,sans-serif">seats</text>
      </svg>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:4 }}>
        {sorted.map((p,i)=>(
          <span key={i} style={{ fontSize:13, fontWeight:700, color:p.color }}>{p.abbr} {p.seats}</span>
        ))}
      </div>
    </div>
  )
}

export default function ParliamentLive({ T, parties, onExpand }) {
  const [status, setStatus] = useState(getParliamentStatus)
  const [tick,   setTick]   = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getParliamentStatus())
      setTick(t => t+1)
    }, 60000) // update every minute
    return () => clearInterval(interval)
  }, [])

  const mainParties = parties.filter(p => p.seats > 0)

  return (
    <div onClick={() => { haptic(8); onExpand?.() }} style={{ cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>

      {/* Live / not sitting header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, justifyContent:'center' }}>
        {status.sitting ? (
          <>
            <div style={{
              width:8, height:8, borderRadius:'50%', background:'#E4003B', flexShrink:0,
              boxShadow:'0 0 0 0 #E4003B',
              animation:'livePulse 1.5s ease-in-out infinite',
            }}/>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:'#E4003B' }}>Live</div>
          </>
        ) : (
          <div style={{ width:8, height:8, borderRadius:'50%', background:T.tl, opacity:0.4, flexShrink:0 }}/>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ fontSize:13, fontWeight:700, letterSpacing:1, color:T.tl, textTransform:'uppercase' }}>{status.pmqs ? 'PMQs · House of Commons' : 'Parliament'}</div>{status.pmqs && <InfoButton id="pmqs" T={T} size={14}/>}</div>
      </div>

      {status.sitting ? (
        /* SITTING — show current business */
        <>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:20, fontWeight:700, color:T.th, letterSpacing:-0.3, lineHeight:1.3 }}>
              {status.label}
            </div>
            {status.endsAt && (
              <div style={{ fontSize:13, fontWeight:600, color:T.tl, marginTop:4 }}>
                Sitting until {status.endsAt}
              </div>
            )}
          </div>
          {/* Recent business */}
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.tl, marginBottom:8, textAlign:'center' }}>
            Recent business
          </div>
          {HANSARD.slice(0,3).map((h,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:i<2?`0.5px solid ${T.c1}`:'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:h.significance==='high'?'#E4003B':T.tl, flexShrink:0 }}/>
              <div style={{ flex:1, fontSize:13, fontWeight:500, color:T.tm, lineHeight:1.4 }}>{h.topic}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.tl }}>{h.date}</div>
            </div>
          ))}
        </>
      ) : (
        /* NOT SITTING — next sitting + seat chart */
        <>
          {status.nextSitting && (
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.tl, marginBottom:4 }}>
                Next sitting
              </div>
              <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.5, color:T.th }}>{status.nextSitting}</div>
              <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:2 }}>{status.label}</div>
            </div>
          )}
          {status.reason === 'recess' && (
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:20, fontWeight:700, color:T.th }}>Parliament in recess</div>
            </div>
          )}
          {/* Hansard recent */}
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.tl, marginBottom:8, textAlign:'center' }}>
            Recent business
          </div>
          {HANSARD.slice(0,3).map((h,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:i<2?`0.5px solid ${T.c1}`:'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:h.significance==='high'?'#E4003B':T.tl, flexShrink:0 }}/>
              <div style={{ flex:1, fontSize:13, fontWeight:500, color:T.tm, lineHeight:1.3 }}>{h.topic}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.tl }}>{h.date}</div>
            </div>
          ))}
          {/* Seat chart */}
          <div style={{ marginTop:20, padding:'16px 0 0', borderTop:`0.5px solid ${T.c1}` }}>
            <SeatChart parties={mainParties} T={T}/>
          </div>
        </>
      )}

      <div style={{ textAlign:'center', marginTop:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:T.pr }}>Watch Parliament TV →</span>
      </div>

      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(228,0,59,0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(228,0,59,0); }
          100% { box-shadow: 0 0 0 0 rgba(228,0,59,0); }
        }
      `}</style>
    </div>
  )
}
