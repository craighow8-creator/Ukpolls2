import { useState } from 'react'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'

const TABS = [{key:'overview',label:'Overview'},{key:'breakdown',label:'Breakdown'},{key:'visas',label:'Visas'},{key:'parties',label:'Party views'}]

function StatCard({ T, label, value, sub, color, change, icon }) {
  return (
    <div style={{
      borderRadius:14, padding:'16px 18px',
      background:T.c0,
      border:`1px solid ${color||T.pr}44`
      ,
      position:'relative', overflow:'hidden'
    }}>
      <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:T.tl, marginBottom:8, position:'relative', zIndex:1 }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.02em', color:color||T.hero, lineHeight:1, position:'relative', zIndex:1 }}>{value}</div>
      {sub && <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:4, position:'relative', zIndex:1 }}>{sub}</div>}
      {change && (
        <div style={{ fontSize:13, fontWeight:600, color:change.startsWith('▼')?'#02A95B':'#E4003B', marginTop:6, position:'relative', zIndex:1 }}>{change}</div>
      )}
    </div>
  )
}

export default function MigrationScreen({ T, nav, migration }) {
  const [tab, setTab] = useState('overview')
  const M = migration || {}

  const fmt = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}m` : n >= 1000 ? `${(n/1000).toFixed(0)}k` : `${n}`

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:T.sf }}>
      <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:32, fontWeight:700, letterSpacing:-1, color:T.th }}>Net Migration</div>
          <div style={{ fontSize:13, fontWeight:500, color:T.tl }}>{M.fetchYear||'ONS · Year ending June 2025'}</div>
        </div>
        <InfoButton id="migration_net" T={T} size={22}/>
      </div>
      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T}/>
      <ScrollArea>

        {tab === 'overview' && (
          <>
            {/* Hero stat */}
            <div style={{ borderRadius:14, padding:24, marginBottom:14, background:T.c0, border:`1px solid ${T.pr}44`, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:`${T.pr}07`, pointerEvents:'none' }}/>
              <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.06em', color:T.tl, marginBottom:8, position:'relative', zIndex:1 }}>Current net migration</div>
              <div style={{ fontSize:64, fontWeight:700, letterSpacing:'-0.02em', color:T.hero, lineHeight:1, position:'relative', zIndex:1 }}>
                {fmt(M.netTotal||204000)}
              </div>
              <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:6, position:'relative', zIndex:1 }}>Year ending June 2025</div>
              {/* Trend bar — peak to now */}
              <div style={{ marginTop:16, position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, color:T.tl, marginBottom:4 }}>
                  <span>2023 peak: {fmt(M.netPrev2||944000)}</span>
                  <span>Now: {fmt(M.netTotal||204000)}</span>
                </div>
                <div style={{ height:8, borderRadius:999, background:T.c1||'rgba(0,0,0,0.08)', overflow:'hidden' }}>
                  <div style={{ width:`${Math.round((M.netTotal||204000)/(M.netPrev2||944000)*100)}%`, height:'100%', background:T.pr, borderRadius:999 }}/>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:'#02A95B', marginTop:6 }}>
                  ▼ Down {Math.round(((M.netPrev2||944000)-(M.netTotal||204000))/(M.netPrev2||944000)*100)}% from 2023 peak
                </div>
              </div>
            </div>

            {/* Stat grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <StatCard T={T} label="2023 net" value={fmt(M.netPrev2||944000)} sub="ONS peak" color="#E4003B" change="▲ Historical high"/>
              <StatCard T={T} label="2024 net" value={fmt(M.netPrev||649000)} sub="Revised ONS" color="#F97316" change="▼ Down from peak"/>
              <StatCard T={T} label="2025 net" value={fmt(M.netTotal||204000)} sub="Latest estimate" color="#02A95B" change="▼ Falling"/>
              <StatCard T={T} label="Target" value="<100k" sub="Government aim" color={T.pr}/>
            </div>
          </>
        )}

        {tab === 'breakdown' && (
          <>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.06em', color:T.tl, marginBottom:10, textAlign:'center' }}>Top source countries (inflow)</div>
            {(M.byNationality||[]).map((n,i) => {
              const max = Math.max(...(M.byNationality||[]).map(x=>x.inflow||0))
              return (
                <div key={i} style={{ borderRadius:12, padding:'12px 16px', marginBottom:8, background:T.c0, border:`1px solid ${T.cardBorder||'rgba(0,0,0,0.08)'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:T.th }}>{n.name}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:n.net<0?'#02A95B':T.pr }}>{n.net<0?`${fmt(Math.abs(n.net))} net out`:fmt(n.inflow)}</div>
                  </div>
                  <div style={{ height:5, borderRadius:999, background:'rgba(0,0,0,0.07)', overflow:'hidden', marginBottom:4 }}>
                    <div style={{ width:`${((n.inflow||0)/max)*100}%`, height:'100%', background:n.net<0?'#02A95B':T.pr, borderRadius:999 }}/>
                  </div>
                  <div style={{ fontSize:13, fontWeight:500, color:T.tl }}>{n.type}</div>
                </div>
              )
            })}
          </>
        )}

        {tab === 'visas' && (
          <>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.06em', color:T.tl, marginBottom:10, textAlign:'center' }}>By visa route</div>
            {(M.byVisa||[]).map((v,i) => {
              const max = Math.max(...(M.byVisa||[]).map(x=>x.granted||x.count||0))
              const val = v.granted||v.count||0
              return (
                <div key={i} style={{ borderRadius:12, padding:'12px 16px', marginBottom:8, background:T.c0, border:`1px solid ${T.cardBorder||'rgba(0,0,0,0.08)'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.th }}>{v.type||v.route}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.pr }}>{fmt(val)}</div>
                  </div>
                  <div style={{ height:5, borderRadius:999, background:'rgba(0,0,0,0.07)', overflow:'hidden' }}>
                    <div style={{ width:`${(val/max)*100}%`, height:'100%', background:T.pr, borderRadius:999 }}/>
                  </div>
                  {v.change && <div style={{ fontSize:13, fontWeight:600, color:v.change>0?'#E4003B':'#02A95B', marginTop:4 }}>{v.change>0?'+':''}{v.change}% vs prev year</div>}
                </div>
              )
            })}
          </>
        )}

        {tab === 'parties' && (
          <>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.06em', color:T.tl, marginBottom:10, textAlign:'center' }}>Party positions</div>
            {[
              { party:'Reform UK', color:'#12B7D4', position:'Reduce net migration to zero. Deport all illegal migrants immediately. Leave ECHR. End overseas student dependants. One-in one-out policy.' },
              { party:'Labour', color:'#E4003B', position:'Reduce net migration through visa reform. End care worker visa overseas recruitment. Reform student visa rules. Increase immigration enforcement.' },
              { party:'Conservative', color:'#0087DC', position:'Target net migration below 100,000. Stricter visa controls. Limit student dependants. Faster asylum decisions and removals.' },
              { party:'Green', color:'#02A95B', position:'Safe and legal routes as alternative to dangerous crossings. Scrap detention centres. Restore legal aid for asylum cases. Clear backlog humanely.' },
              { party:'Lib Dem', color:'#FAA61A', position:'Fair asylum system with faster processing. Oppose Rwanda scheme. Controlled legal migration. Integration support for new arrivals.' },
            ].map((p,i) => (
              <div key={i} style={{ borderRadius:14, padding:'16px 18px', marginBottom:10, background:T.c0, border:`1px solid ${p.color}44`, position:'relative', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, position:'relative', zIndex:1 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }}/>
                  <div style={{ fontSize:14, fontWeight:700, color:p.color }}>{p.party}</div>
                </div>
                <div style={{ fontSize:13, fontWeight:500, color:T.tm, lineHeight:1.7, position:'relative', zIndex:1 }}>{p.position}</div>
              </div>
            ))}
          </>
        )}

        <div style={{ height:40 }}/>
      </ScrollArea>
    </div>
  )
}
