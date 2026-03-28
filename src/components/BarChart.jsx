import { R, EZ } from '../constants'

const PARTY_COLORS = { ref:'#12B7D4', lab:'#C8102E', con:'#0087DC', grn:'#02A95B', ld:'#FAA61A', rb:'#1a4a9e' }

export default function BarChart({ groups, T, partyKeys = ['ref','grn','lab','con','ld'] }) {
  return (
    <div>
      {groups.map((g, i) => {
        const vals = partyKeys.map(k => ({ k, v: g[k] || 0, c: PARTY_COLORS[k] || '#999' })).sort((a,b) => b.v - a.v)
        const max = vals[0]?.v || 1
        return (
          <div key={i} style={{ background:T.c0, borderRadius:R.sm, padding:'14px 16px', marginBottom:8 }}>
            <div style={{ fontSize:14, fontWeight:800, color:T.th, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{g.label}</span>
              {g.note && <span style={{ fontSize:13, fontWeight:600, color:T.tl, maxWidth:'50%', textAlign:'right', lineHeight:1.3 }}>{g.note}</span>}
            </div>
            {vals.map((p, j) => (
              <div key={j} style={{ display:'flex', alignItems:'center', gap:8, marginBottom: j < vals.length-1 ? 7 : 0 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:p.c, flexShrink:0 }}/>
                <div style={{ width:40, fontSize: j===0?14:12, fontWeight: j===0?900:700, color:p.c, flexShrink:0 }}>{p.k.toUpperCase()}</div>
                <div style={{ flex:1, background:T.sf, borderRadius:R.pill, height: j===0?12:8, overflow:'hidden' }}>
                  <div style={{ width:`${Math.round(p.v/max*100)}%`, height:'100%', background:p.c, borderRadius:R.pill, transition:`width 0.6s ${EZ}` }}/>
                </div>
                <div style={{ width:32, textAlign:'right', fontSize: j===0?14:12, fontWeight:900, color:p.c }}>{p.v}%</div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
