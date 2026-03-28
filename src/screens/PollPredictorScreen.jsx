import { useState, useEffect } from 'react'
import { ScrollArea, StickyPills, haptic } from '../components/ui'

const STORAGE_KEY = 'politiscope_predictor'

function loadPredictions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch(e) { return {} }
}
function savePredictions(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch(e) {}
}

const EVENTS = [
  {
    id:'super_thursday_2026',
    title:'Super Thursday 2026',
    date:'7 May 2026',
    type:'council',
    question:'Which party wins the most councils on 7 May?',
    options:['Reform UK','Labour','Conservative','Hung (no clear winner)'],
    resolved:false,
    result:null,
  },
  {
    id:'horsham_2026',
    title:'Horsham By-election',
    date:'TBC 2026',
    type:'byelection',
    question:'Who wins Horsham?',
    options:['Conservative','Lib Dem','Reform UK','Labour'],
    resolved:false,
    result:null,
  },
  {
    id:'reform_may_polls',
    title:'Reform % · May 2026 avg',
    date:'31 May 2026',
    type:'polling',
    question:'Will Reform UK poll above 28% in May?',
    options:['Yes — above 28%','No — 28% or below'],
    resolved:false,
    result:null,
  },
  {
    id:'next_ge_winner',
    title:'Next General Election',
    date:'By Jan 2030',
    type:'election',
    question:'Which party wins most seats at the next GE?',
    options:['Reform UK','Labour','Conservative','Hung parliament'],
    resolved:false,
    result:null,
  },
]

const TYPE_COLORS = {
  council:'#12B7D4', byelection:'#E4003B', polling:'#02A95B', election:'#012169',
}

const TABS = [
  { key:'predict', label:'Make Predictions' },
  { key:'history', label:'My Record'        },
]

export default function PollPredictorScreen({ T, nav }) {
  const [tab, setTab]       = useState('predict')
  const [predictions, setPredictions] = useState(loadPredictions)
  const [justSaved, setJustSaved]   = useState(null)

  const isDark  = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const cardBg  = isDark ? '#0d1a24' : '#ffffff'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  const predict = (eventId, option) => {
    haptic(10)
    const updated = { ...predictions, [eventId]: { option, timestamp: Date.now() } }
    setPredictions(updated)
    savePredictions(updated)
    setJustSaved(eventId)
    setTimeout(() => setJustSaved(null), 1500)
  }

  const pending   = EVENTS.filter(e => !e.resolved)
  const resolved  = EVENTS.filter(e => e.resolved)
  const predicted = EVENTS.filter(e => predictions[e.id])
  const correct   = resolved.filter(e => predictions[e.id]?.option === e.result).length
  const accuracy  = resolved.length > 0 ? Math.round(correct / resolved.length * 100) : null

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:T.sf }}>

      <div style={{ padding:'16px 18px 0', flexShrink:0 }}>
        <div style={{ fontSize:26, fontWeight:800, letterSpacing:-0.8, color:T.th, lineHeight:1 }}>Poll Predictor</div>
        <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:4 }}>Make your predictions · track your record</div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T}/>

      <ScrollArea>

        {tab === 'predict' && (
          <>
            {/* Stats bar */}
            {predicted.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  { label:'Predicted', value:predicted.length },
                  { label:'Resolved', value:resolved.length },
                  { label:'Accuracy', value: accuracy !== null ? `${accuracy}%` : '—' },
                ].map((s,i) => (
                  <div key={i} style={{ borderRadius:12, padding:'10px 8px', background:cardBg, border:`1px solid ${border}`, textAlign:'center' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.tl, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{s.label}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:T.th }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {pending.map((event, i) => {
              const myPick = predictions[event.id]?.option
              const typeColor = TYPE_COLORS[event.type] || T.pr
              const saved = justSaved === event.id
              return (
                <div key={i} style={{ borderRadius:14, background:cardBg, border:`1px solid ${typeColor}28`, overflow:'hidden', marginBottom:12 }}>
                  <div style={{ height:3, background:typeColor }}/>
                  <div style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:typeColor, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:3 }}>
                          {event.type} · {event.date}
                        </div>
                        <div style={{ fontSize:16, fontWeight:800, color:T.th, lineHeight:1.3 }}>{event.title}</div>
                        <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:4, lineHeight:1.5 }}>{event.question}</div>
                      </div>
                      {saved && (
                        <div style={{ fontSize:13, fontWeight:800, color:'#02A95B', padding:'3px 8px', borderRadius:999, background:'#D0F5E4', flexShrink:0, marginLeft:8 }}>
                          Saved ✓
                        </div>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:10 }}>
                      {event.options.map((opt, j) => {
                        const chosen = myPick === opt
                        return (
                          <div
                            key={j}
                            onClick={() => predict(event.id, opt)}
                            style={{
                              borderRadius:10, padding:'10px 12px', cursor:'pointer',
                              background: chosen ? `${typeColor}18` : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              border: `2px solid ${chosen ? typeColor : border}`,
                              fontSize:13, fontWeight: chosen ? 700 : 500,
                              color: chosen ? typeColor : T.tm,
                              textAlign:'center', lineHeight:1.4,
                              WebkitTapHighlightColor:'transparent',
                              transition:'background 0.15s, border-color 0.15s',
                            }}
                          >
                            {chosen && <span style={{ marginRight:4 }}>✓</span>}
                            {opt}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}

            <div style={{ borderRadius:12, padding:'12px 14px', background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', border:`1px solid ${border}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.tl, lineHeight:1.6 }}>
                Your predictions are saved locally. When events resolve, your accuracy score updates automatically.
              </div>
            </div>
            <div style={{ height:32 }}/>
          </>
        )}

        {tab === 'history' && (
          <>
            {predicted.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:T.tl }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🎯</div>
                <div style={{ fontSize:16, fontWeight:700, color:T.th, marginBottom:6 }}>No predictions yet</div>
                <div style={{ fontSize:13, fontWeight:500, lineHeight:1.6 }}>Make your first prediction on the Predict tab</div>
              </div>
            ) : (
              predicted.map((event, i) => {
                const myPick = predictions[event.id]?.option
                const isCorrect = event.resolved && myPick === event.result
                const isWrong   = event.resolved && myPick !== event.result
                const typeColor = TYPE_COLORS[event.type] || T.pr
                return (
                  <div key={i} style={{ borderRadius:14, background:cardBg, border:`1px solid ${isCorrect?'#02A95B':isWrong?'#E4003B':border}`, overflow:'hidden', marginBottom:10 }}>
                    <div style={{ height:3, background:isCorrect?'#02A95B':isWrong?'#E4003B':typeColor }}/>
                    <div style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:typeColor, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:3 }}>
                            {event.date}
                          </div>
                          <div style={{ fontSize:15, fontWeight:800, color:T.th }}>{event.title}</div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.tl, marginTop:4 }}>
                            Your pick: <span style={{ color:T.th }}>{myPick}</span>
                          </div>
                          {event.resolved && (
                            <div style={{ fontSize:13, fontWeight:600, color:isCorrect?'#02A95B':'#C8102E', marginTop:4 }}>
                              {isCorrect ? '✓ Correct!' : `✗ Wrong — result was ${event.result}`}
                            </div>
                          )}
                          {!event.resolved && (
                            <div style={{ fontSize:13, fontWeight:600, color:T.tl, marginTop:4 }}>Pending · result not yet known</div>
                          )}
                        </div>
                        <div style={{ fontSize:24 }}>{isCorrect?'✅':isWrong?'❌':'⏳'}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div style={{ height:32 }}/>
          </>
        )}

      </ScrollArea>
    </div>
  )
}
