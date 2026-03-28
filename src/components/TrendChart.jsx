import { useState } from 'react'
import { R, EZ } from '../constants'

export function TrendLine({ data, color, width = 120, height = 40 }) {
  const vals = data.filter(v => v !== null && v !== undefined)
  if (vals.length < 2) return null
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * width).toFixed(1)},${((1 - (v - min) / range) * height).toFixed(1)}`).join(' ')
  const lastPt = pts.split(' ').pop()
  const [lx, ly] = lastPt.split(',').map(parseFloat)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="4" fill={color}/>
    </svg>
  )
}

export default function TrendChart({ T, trends, parties }) {
  const mainParties = parties.filter(p => !['Other','SNP','Plaid Cymru'].includes(p.name))
  const [active, setActive] = useState(mainParties.map(p => p.name))

  const W=320, H=160, PAD_L=28, PAD_B=24, PAD_T=12, PAD_R=8
  const allVals = trends.flatMap(t => mainParties.filter(p => active.includes(p.name)).map(p => t[p.name] || null).filter(v => v !== null))
  const minV = Math.max(0, Math.min(...allVals) - 2)
  const maxV = Math.min(45, Math.max(...allVals) + 2)
  const cw = (W - PAD_L - PAD_R) / (trends.length - 1)
  const ch = (H - PAD_T - PAD_B) / (maxV - minV)

  const pts = (name) => trends.map((t, i) => {
    const v = t[name]
    if (v === null || v === undefined) return null
    return { x: PAD_L + i * cw, y: H - PAD_B - (v - minV) * ch }
  })

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, paddingBottom:12 }}>
        {mainParties.map(p => (
          <div key={p.name} onClick={() => setActive(a => a.includes(p.name) ? a.filter(x => x !== p.name) : [...a, p.name])}
            style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px 5px 8px', borderRadius:R.pill, background:active.includes(p.name) ? p.color+'22' : T.c1, color:active.includes(p.name) ? p.color : T.tl, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:active.includes(p.name) ? p.color : '#999' }}/>
            {p.abbr}
          </div>
        ))}
      </div>
      <div style={{ background:T.c0, borderRadius:R.sm, padding:14, overflowX:'auto' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:'block', minWidth:W }}>
          {[0,10,20,30,40].filter(v => v >= minV && v <= maxV).map(v => (
            <g key={v}>
              <line x1={PAD_L} x2={W-PAD_R} y1={H-PAD_B-(v-minV)*ch} y2={H-PAD_B-(v-minV)*ch} stroke={T.tl} strokeOpacity={0.2} strokeWidth={1}/>
              <text x={PAD_L-4} y={H-PAD_B-(v-minV)*ch+4} fontSize={8} fill={T.tl} textAnchor="end">{v}</text>
            </g>
          ))}
          {trends.map((t, i) => (
            <text key={i} x={PAD_L+i*cw} y={H-4} fontSize={8} fill={T.tl} textAnchor="middle">{t.month?.slice(0,3)}</text>
          ))}
          {mainParties.filter(p => active.includes(p.name)).map(p => {
            const points = pts(p.name)
            const segments = []
            let seg = []
            points.forEach(pt => { if (pt) { seg.push(pt) } else if (seg.length) { segments.push(seg); seg = [] } })
            if (seg.length) segments.push(seg)
            return segments.map((s, si) => (
              <polyline key={p.name+si} points={s.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')} fill="none" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            ))
          })}
          {mainParties.filter(p => active.includes(p.name)).map(p => {
            const last = pts(p.name).filter(Boolean).pop()
            const v = trends[trends.length-1]?.[p.name]
            if (!last || !v) return null
            return (
              <g key={p.name}>
                <circle cx={last.x} cy={last.y} r={4} fill={p.color}/>
                <text x={last.x+6} y={last.y+4} fontSize={9} fill={p.color} fontWeight="700">{v}%</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
