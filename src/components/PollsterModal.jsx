import { R } from '../constants'
import { POLLSTER_INFO } from '../utils/pollsterInfo'

export default function PollsterModal({ pollster, onClose, T }) {
  if (!pollster) return null
  const info = POLLSTER_INFO[pollster]
  if (!info) return null

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'flex-end' }}>
      <div style={{ background:T.c0, backdropFilter:'blur(40px)', borderRadius:'28px 28px 0 0', padding:`24px 20px calc(24px + env(safe-area-inset-bottom))`, width:'100%', maxWidth:480, margin:'0 auto' }}>
        <div style={{ width:36, height:4, background:T.tl+'40', borderRadius:999, margin:'0 auto 20px' }}/>
        <div style={{ fontSize:13, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:T.pr, marginBottom:6 }}>Pollster Info</div>
        <div style={{ fontSize:22, fontWeight:700, color:T.th, marginBottom:4 }}>{pollster}</div>
        <div style={{ fontSize:13, fontWeight:600, color:T.tl, marginBottom:16 }}>{info.summary}</div>
        <div style={{ background:T.c1, borderRadius:16, padding:'14px 16px', marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:500, color:T.tm, lineHeight:1.7, whiteSpace:'pre-line' }}>{info.body}</div>
        </div>
        <div style={{ fontSize:13, fontWeight:600, color:T.tl, marginBottom:16 }}>Member of: {info.source}</div>
        <button onClick={onClose} style={{ width:'100%', padding:14, background:T.c1, color:T.tl, border:'none', borderRadius:R.pill, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>Close</button>
      </div>
    </div>
  )
}
