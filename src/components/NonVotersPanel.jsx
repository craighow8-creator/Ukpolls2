import { R } from '../constants'
import { Hdr, STitle, ScrollArea, GlassBlock } from './ui'

export default function NonVotersPanel({ T, nonVoters }) {
  if (!nonVoters) return null
  const { headline, insight, source, groups } = nonVoters
  const max = Math.max(...groups.map(g => g.pct))

  return (
    <div>
      <GlassBlock T={T} style={{ marginBottom:8 }}>
        <div style={{ fontSize:16, fontWeight:700, color:T.th, marginBottom:4 }}>{headline}</div>
        <div style={{ fontSize:13, fontWeight:500, color:T.tm, lineHeight:1.6 }}>{insight}</div>
        {source && <div style={{ fontSize:13, fontWeight:600, color:T.tl, marginTop:8 }}>Source: {source}</div>}
      </GlassBlock>
      {groups.map((g, i) => (
        <div key={i} style={{ background:T.c0, backdropFilter:'blur(40px)', borderRadius:20, padding:'12px 16px', marginBottom:7 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.th }}>{g.label}</div>
            <div style={{ fontSize:14, fontWeight:800, color:g.color }}>{g.pct}%</div>
          </div>
          <div style={{ height:8, background:T.sf, borderRadius:999, overflow:'hidden' }}>
            <div style={{ width:`${Math.round(g.pct/max*100)}%`, height:'100%', background:g.color, borderRadius:999 }}/>
          </div>
        </div>
      ))}
    </div>
  )
}
