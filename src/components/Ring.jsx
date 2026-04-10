import React, { useState, useEffect } from 'react'
import { EZ } from '../constants'

export default function Ring({ value, size = 128 }) {
  const r = 50, circ = 2 * Math.PI * r
  const norm = Math.max(0, Math.min(1, (value + 60) / 120))
  const [off, setOff] = useState(circ)

  useEffect(() => {
    const t = setTimeout(() => setOff(circ * (1 - norm)), 100)
    return () => clearTimeout(t)
  }, [value])

  const col = value >= 0 ? '#02A95B' : '#C8102E'

  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r*size/128} fill="none" stroke="#e0e0e0" strokeWidth={8*size/128}/>
        <circle cx={size/2} cy={size/2} r={r*size/128} fill="none" stroke={col} strokeWidth={8*size/128}
          strokeLinecap="round"
          strokeDasharray={circ*(size/128)*(size/128)}
          strokeDashoffset={off*size/128}
          style={{ transition:`stroke-dashoffset 1s ${EZ}` }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:size*0.26, fontWeight:500, letterSpacing:-2, lineHeight:1 }}>
          {value >= 0 ? '+' : ''}{value}
        </div>
        <div style={{ fontSize:size*0.07, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', color:'#999', marginTop:2 }}>
          Net approval
        </div>
      </div>
    </div>
  )
}



