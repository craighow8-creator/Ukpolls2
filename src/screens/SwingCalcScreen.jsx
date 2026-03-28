import { useState } from 'react'
import { ScrollArea, haptic } from '../components/ui'

const BENCHMARKS = [
  { name:'Runcorn & Helsby',  needed:19.8, from:'Labour',       to:'Reform UK', result:'Reform UK WON by 6 votes — May 2025' },
  { name:'Gorton & Denton',   needed:26.7, from:'Labour',       to:'Green',     result:'Green WON — Feb 2026, 5th Green MP' },
  { name:'Kingswood',         needed:14.4, from:'Conservative', to:'Labour',    result:'Labour WON — Feb 2024' },
  { name:'Horsham',           needed:3.4,  from:'Conservative', to:'Lib Dem',   result:'Upcoming — TBC 2026' },
  { name:'Avg Lab marginal',  needed:12.0, from:'Labour',       to:'Reform UK', result:'Typical Red Wall marginal' },
]

export default function SwingCalcScreen({ T, nav, parties }) {
  const mainParties = (parties || []).filter(p => !['Other','SNP','Plaid Cymru'].includes(p.name))
  const [fromParty, setFromParty] = useState('Labour')
  const [toParty,   setToParty]   = useState('Reform UK')
  const [swing,     setSwing]     = useState(0)

  const fp      = mainParties.find(p => p.name === fromParty)
  const tp      = mainParties.find(p => p.name === toParty)
  const fromNew = Math.max(0, Math.round((fp?.pct || 0) - swing))
  const toNew   = Math.min(60, Math.round((tp?.pct || 0) + swing))
  const benchmark   = BENCHMARKS.find(b => b.from === fromParty && b.to === toParty)
  const needed      = benchmark?.needed || null
  const beaten      = needed !== null && swing >= needed

  const isDark  = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const cardBg  = isDark ? '#0d1a24' : '#ffffff'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:T.sf }}>
      <div style={{ padding:'16px 18px 0', flexShrink:0 }}>
        <div style={{ fontSize:26, fontWeight:800, letterSpacing:-0.8, color:T.th, lineHeight:1 }}>Swing Calculator</div>
        <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:4 }}>How many points does it take to change the result?</div>
      </div>

      <ScrollArea>
        {/* Party selectors */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          {[
            { label:'From', val:fromParty, set:setFromParty, exclude:toParty },
            { label:'To',   val:toParty,   set:setToParty,   exclude:fromParty },
          ].map((sel, i) => (
            <div key={i}>
              <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:T.tl, marginBottom:6 }}>{sel.label}</div>
              <select value={sel.val} onChange={e => sel.set(e.target.value)} style={{ width:'100%', padding:'12px 14px', background:cardBg, border:`1px solid ${border}`, borderRadius:12, fontSize:15, fontWeight:700, color:mainParties.find(p=>p.name===sel.val)?.color||T.th, fontFamily:"'Outfit',sans-serif", outline:'none' }}>
                {mainParties.filter(p => p.name !== sel.exclude).map(p => <option key={p.name}>{p.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Calculator card */}
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:16, overflow:'hidden', marginBottom:14 }}>
          <div style={{ height:4, background:tp?.color||T.pr }} />
          <div style={{ padding:'16px 16px 18px' }}>

            {/* Plain English output */}
            <div style={{ padding:'14px 16px', borderRadius:12, background:beaten?`${tp?.color||T.pr}14`:isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)', border:`1px solid ${beaten?(tp?.color||T.pr)+'30':border}`, marginBottom:16 }}>
              {swing === 0 ? (
                <div style={{ fontSize:14, fontWeight:600, color:T.tl, textAlign:'center', lineHeight:1.5 }}>
                  Drag the slider to model a swing from <span style={{ color:fp?.color, fontWeight:800 }}>{fromParty}</span> to <span style={{ color:tp?.color, fontWeight:800 }}>{toParty}</span>
                </div>
              ) : (
                <div style={{ fontSize:15, fontWeight:600, color:T.th, lineHeight:1.6 }}>
                  A <span style={{ fontWeight:800, color:tp?.color||T.pr }}>{swing}pt swing</span> from <span style={{ color:fp?.color, fontWeight:700 }}>{fromParty}</span> to <span style={{ color:tp?.color, fontWeight:700 }}>{toParty}</span> gives <span style={{ color:fp?.color, fontWeight:700 }}>{fromParty} {fromNew}%</span> and <span style={{ color:tp?.color, fontWeight:700 }}>{toParty} {toNew}%</span>{beaten && <span style={{ color:tp?.color, fontWeight:800 }}> — enough to win</span>}
                </div>
              )}
            </div>

            {/* Slider */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.tl, textTransform:'uppercase', letterSpacing:'0.06em' }}>Swing</div>
                <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.02em', color:beaten?tp?.color||T.pr:T.th }}>{swing}pt {beaten?'✓':''}</div>
              </div>
              <input type="range" min="0" max="40" step="1" value={swing} onChange={e=>{haptic(4);setSwing(+e.target.value)}} style={{ width:'100%', accentColor:tp?.color||T.pr }}/>
            </div>

            {/* Vote share boxes */}
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', borderRadius:12, padding:'10px 12px', border:`1px solid ${fp?.color||'#888'}22` }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.tl, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{fp?.abbr||'From'} vote</div>
                <div style={{ fontSize:20, fontWeight:800, color:fp?.color||T.th }}>{fp?.pct||0}% → {fromNew}%</div>
              </div>
              <div style={{ flex:1, background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', borderRadius:12, padding:'10px 12px', border:`1px solid ${tp?.color||'#888'}22` }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.tl, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{tp?.abbr||'To'} vote</div>
                <div style={{ fontSize:20, fontWeight:800, color:tp?.color||T.th }}>{tp?.pct||0}% → {toNew}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Benchmarks */}
        <div style={{ fontSize:13, fontWeight:700, color:T.tl, letterSpacing:'0.06em', marginBottom:10 }}>Real contest benchmarks · tap to load</div>
        {BENCHMARKS.map((ex, i) => {
          const fromP  = mainParties.find(p => p.name===ex.from)
          const toP    = mainParties.find(p => p.name===ex.to)
          const isSame = fromParty===ex.from && toParty===ex.to
          const reached = isSame && swing >= ex.needed
          const gap    = isSame ? Math.max(0, +(ex.needed-swing).toFixed(1)) : null
          return (
            <div key={i} onClick={()=>{haptic(8);setFromParty(ex.from);setToParty(ex.to);setSwing(0)}} style={{ background:reached?`${toP?.color||T.pr}12`:cardBg, border:`${isSame?2:1}px solid ${isSame?(toP?.color||T.pr)+'44':border}`, borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:T.th, marginBottom:3 }}>{ex.name}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.tl }}><span style={{ color:fromP?.color }}>{ex.from}</span>{' → '}<span style={{ color:toP?.color }}>{ex.to}</span></div>
                  <div style={{ fontSize:13, color:T.tl, marginTop:3 }}>{ex.result}</div>
                  {isSame && gap > 0 && <div style={{ fontSize:13, fontWeight:700, color:toP?.color||T.pr, marginTop:5 }}>{gap}pt still needed</div>}
                  {reached && <div style={{ fontSize:13, fontWeight:700, color:toP?.color||T.pr, marginTop:5 }}>✓ Modelled swing exceeds what was needed</div>}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:toP?.color||T.pr }}>{ex.needed}pt</div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.tl }}>needed</div>
                </div>
              </div>
            </div>
          )
        })}
        <div style={{ height:32 }}/>
      </ScrollArea>
    </div>
  )
}
