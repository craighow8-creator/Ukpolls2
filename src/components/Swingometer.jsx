import React from 'react'
export default function Swingometer({ fromColor, toColor, fromParty, toParty, swingPts, needed, T }) {
  const MAX = 35
  const angle = Math.min(swingPts / MAX * 90, 90)
  const rad = (angle - 90) * Math.PI / 180
  const cx = 100, cy = 100, r = 70
  const nx = cx + r * Math.cos(rad), ny = cy + r * Math.sin(rad)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0' }}>
      <svg width={200} height={110} viewBox="0 0 200 110">
        <path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke={fromColor} strokeWidth={10} strokeLinecap="round" opacity={0.3}/>
        <path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke={toColor}   strokeWidth={10} strokeLinecap="round" opacity={0.3}/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={swingPts >= needed ? toColor : fromColor} strokeWidth={4} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={6} fill={T.th}/>
        <text x={30}  y={112} fontSize={10} fill={fromColor} fontWeight="700" textAnchor="middle">{fromParty}</text>
        <text x={170} y={112} fontSize={10} fill={toColor}   fontWeight="700" textAnchor="end">{toParty}</text>
        <text x={cx}  y={80}  fontSize={14} fill={T.th} fontWeight="300" textAnchor="middle">{swingPts}pt</text>
      </svg>
      <div style={{ fontSize:13, fontWeight:600, color:T.tm, marginTop:4 }}>{needed}pt needed for {toParty} gain</div>
    </div>
  )
}


