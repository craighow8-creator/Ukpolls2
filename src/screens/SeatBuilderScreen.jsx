import { useState, useMemo } from 'react'
import { ScrollArea, StickyPills, haptic } from '../components/ui'

// MRP-style seat calculation using proportional + tactical adjustment
// Based on 2024 GE results as baseline
const BASELINE = {
  'Reform UK':    { pct: 14.3, seats: 5   },
  'Labour':       { pct: 33.7, seats: 412 },
  'Conservative': { pct: 23.7, seats: 121 },
  'Green':        { pct: 6.7,  seats: 4   },
  'Lib Dem':      { pct: 12.2, seats: 72  },
  'SNP':          { pct: 2.5,  seats: 9   },
  'Restore Britain': { pct: 0, seats: 0   },
  'Other':        { pct: 6.9,  seats: 27  },
}

const TOTAL_SEATS = 650

// Simple but decent seat projection using vote share shift from 2024 baseline
function projectSeats(partyVotes) {
  const results = {}
  let totalAllocated = 0

  const parties = Object.keys(partyVotes).filter(p => p !== 'Other')
  
  parties.forEach(party => {
    const base = BASELINE[party] || { pct: 0, seats: 0 }
    const swing = partyVotes[party] - base.pct
    // Seats move more than proportional due to FPTP
    const multiplier = party === 'Labour' || party === 'Conservative' ? 3.2 :
                       party === 'Reform UK' ? 4.1 :
                       party === 'Restore Britain' ? 3.8 : 1.8
    const rawSeats = Math.max(0, Math.round(base.seats + (swing * multiplier)))
    results[party] = rawSeats
    totalAllocated += rawSeats
  })

  // Scale to 623 (non-Other) and fix Other at 27
  const scale = 623 / Math.max(1, totalAllocated)
  parties.forEach(p => {
    results[p] = Math.round(results[p] * scale)
  })
  results['Other'] = 27

  // Ensure total = 650
  const total = Object.values(results).reduce((s, v) => s + v, 0)
  const diff = TOTAL_SEATS - total
  const biggest = parties.sort((a,b) => results[b] - results[a])[0]
  if (biggest) results[biggest] = Math.max(0, results[biggest] + diff)

  return results
}

const PARTIES = [
  { name:'Reform UK',       abbr:'REF', color:'#12B7D4', min:5,  max:50, step:1 },
  { name:'Labour',          abbr:'LAB', color:'#E4003B', min:10, max:50, step:1 },
  { name:'Conservative',    abbr:'CON', color:'#0087DC', min:5,  max:45, step:1 },
  { name:'Green',           abbr:'GRN', color:'#02A95B', min:2,  max:30, step:1 },
  { name:'Lib Dem',         abbr:'LD',  color:'#FAA61A', min:5,  max:30, step:1 },
  { name:'SNP',             abbr:'SNP', color:'#C4922A', min:1,  max:8,  step:1 },
  { name:'Restore Britain', abbr:'RB',  color:'#1a4a9e', min:0,  max:20, step:1 },
]

const MAJORITY = 326

const TABS = [
  { key:'builder', label:'Seat Builder' },
  { key:'compare', label:'Scenarios'   },
]

const SCENARIOS = [
  { name:'Current polls',   votes:{ 'Reform UK':27,'Labour':19,'Conservative':18,'Green':16,'Lib Dem':12,'SNP':3,'Restore Britain':7 } },
  { name:'2024 result',     votes:{ 'Reform UK':14,'Labour':34,'Conservative':24,'Green':7,'Lib Dem':12,'SNP':3,'Restore Britain':0 } },
  { name:'Reform majority', votes:{ 'Reform UK':38,'Labour':18,'Conservative':14,'Green':10,'Lib Dem':9,'SNP':2,'Restore Britain':5 } },
  { name:'Lab recovery',    votes:{ 'Reform UK':22,'Labour':32,'Conservative':16,'Green':12,'Lib Dem':11,'SNP':3,'Restore Britain':4 } },
  { name:'Hung parliament', votes:{ 'Reform UK':25,'Labour':22,'Conservative':19,'Green':14,'Lib Dem':11,'SNP':3,'Restore Britain':6 } },
]

function SeatBar({ results, T }) {
  const sorted = Object.entries(results)
    .filter(([,v]) => v > 0)
    .sort(([,a],[,b]) => b-a)
  const colors = {
    'Reform UK':'#12B7D4','Labour':'#E4003B','Conservative':'#0087DC',
    'Green':'#02A95B','Lib Dem':'#FAA61A','SNP':'#C4922A',
    'Restore Britain':'#1a4a9e','Other':'#6b7280',
  }
  return (
    <div>
      <div style={{ height:14, borderRadius:999, overflow:'hidden', display:'flex', marginBottom:8 }}>
        {sorted.map(([name, seats],i) => (
          <div key={i} style={{ width:`${(seats/TOTAL_SEATS)*100}%`, background:colors[name]||'#888', height:'100%' }}/>
        ))}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 10px' }}>
        {sorted.map(([name, seats],i) => (
          <div key={i} style={{ fontSize:13, fontWeight:800, color:colors[name]||'#888' }}>
            {name.split(' ')[0]} {seats}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SeatBuilderScreen({ T, nav }) {
  const [tab, setTab] = useState('builder')
  const [votes, setVotes] = useState({
    'Reform UK':27,'Labour':19,'Conservative':18,'Green':16,
    'Lib Dem':12,'SNP':3,'Restore Britain':7,
  })
  const [loadedScenario, setLoadedScenario] = useState(null)

  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const cardBg = isDark ? '#0d1a24' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  const total = Object.values(votes).reduce((s,v) => s+v, 0)
  const remaining = 100 - total
  const results = useMemo(() => projectSeats(votes), [votes])
  const leader = Object.entries(results).filter(([k])=>k!=='Other').sort(([,a],[,b])=>b-a)[0]
  const hasOverallMajority = leader && leader[1] >= MAJORITY
  const leaderColor = {
    'Reform UK':'#12B7D4','Labour':'#E4003B','Conservative':'#0087DC',
    'Green':'#02A95B','Lib Dem':'#FAA61A','SNP':'#C4922A',
    'Restore Britain':'#1a4a9e',
  }[leader?.[0]] || T.pr

  const setVote = (name, val) => {
    haptic(4)
    setVotes(v => ({ ...v, [name]: +val }))
    setLoadedScenario(null)
  }

  const loadScenario = (s) => {
    haptic(8)
    setVotes(s.votes)
    setLoadedScenario(s.name)
    setTab('builder')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:T.sf }}>

      <div style={{ padding:'16px 18px 0', flexShrink:0 }}>
        <div style={{ fontSize:26, fontWeight:800, letterSpacing:-0.8, color:T.th, lineHeight:1 }}>Seat Builder</div>
        <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:4 }}>Set vote shares · see projected seats</div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T}/>

      <ScrollArea>

        {tab === 'builder' && (
          <>
            {/* Result summary card */}
            <div style={{ borderRadius:14, background:cardBg, border:`2px solid ${leaderColor}44`, overflow:'hidden', marginBottom:14 }}>
              <div style={{ height:4, background:leaderColor }}/>
              <div style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.tl, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:3 }}>
                      Projected result
                    </div>
                    <div style={{ fontSize:20, fontWeight:800, color:leaderColor }}>
                      {leader?.[0]} · {leader?.[1]} seats
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:hasOverallMajority ? '#02A95B' : '#E4003B', marginTop:2 }}>
                      {hasOverallMajority
                        ? `Overall majority by ${(leader[1] - MAJORITY)} seats`
                        : `${MAJORITY - (leader?.[1]||0)} short of majority — hung parliament`}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.tl, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:3 }}>Vote total</div>
                    <div style={{ fontSize:20, fontWeight:800, color:remaining === 0 ? '#02A95B' : remaining < 0 ? '#E4003B' : T.th }}>
                      {total}%
                    </div>
                    <div style={{ fontSize:13, color:T.tl }}>{remaining > 0 ? `${remaining}% unallocated` : remaining < 0 ? `${Math.abs(remaining)}% over` : 'Balanced ✓'}</div>
                  </div>
                </div>
                <SeatBar results={results} T={T}/>
              </div>
            </div>

            {loadedScenario && (
              <div style={{ fontSize:13, fontWeight:600, color:T.tl, textAlign:'center', marginBottom:10 }}>
                Loaded: {loadedScenario} · adjust sliders to customise
              </div>
            )}

            {/* Sliders */}
            {PARTIES.map((p, i) => (
              <div key={i} style={{ borderRadius:14, background:cardBg, border:`1px solid ${p.color}28`, overflow:'hidden', marginBottom:8 }}>
                <div style={{ height:3, background:p.color }}/>
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:p.color }}>{p.abbr}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:p.color }}>{votes[p.name]}%</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.tl }}>
                      → <span style={{ color:p.color }}>{results[p.name] || 0} seats</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={p.min} max={p.max} step={p.step}
                    value={votes[p.name]}
                    onChange={e => setVote(p.name, e.target.value)}
                    style={{ width:'100%', accentColor:p.color }}
                  />
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                    <span style={{ fontSize:12, color:T.tl }}>{p.min}%</span>
                    <span style={{ fontSize:12, color:T.tl }}>{p.max}%</span>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ borderRadius:12, padding:'12px 14px', background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', border:`1px solid ${border}`, marginTop:4 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.tl, lineHeight:1.6 }}>
                Seat projections use a swing model from the 2024 general election baseline. FPTP magnifies small vote changes into large seat swings. This is illustrative — actual results depend on constituency geography.
              </div>
            </div>

            <div style={{ height:32 }}/>
          </>
        )}

        {tab === 'compare' && (
          <>
            <div style={{ fontSize:13, fontWeight:700, color:T.tl, letterSpacing:'0.06em', marginBottom:10 }}>
              Tap a scenario to load it into the builder
            </div>
            {SCENARIOS.map((s, i) => {
              const r = projectSeats(s.votes)
              const lead = Object.entries(r).filter(([k])=>k!=='Other').sort(([,a],[,b])=>b-a)[0]
              const lColor = {
                'Reform UK':'#12B7D4','Labour':'#E4003B','Conservative':'#0087DC',
                'Green':'#02A95B','Lib Dem':'#FAA61A',
              }[lead?.[0]] || '#888'
              const majority = lead && lead[1] >= MAJORITY
              return (
                <div
                  key={i}
                  onClick={() => loadScenario(s)}
                  style={{ borderRadius:14, background:cardBg, border:`1px solid ${lColor}28`, overflow:'hidden', marginBottom:10, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}
                >
                  <div style={{ height:3, background:lColor }}/>
                  <div style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:15, fontWeight:800, color:T.th }}>{s.name}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:lColor, marginTop:2 }}>
                          {lead?.[0]} leads · {lead?.[1]} seats
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, color:majority?'#02A95B':'#E4003B', marginTop:2 }}>
                          {majority ? `Majority by ${lead[1]-MAJORITY}` : `Hung parliament`}
                        </div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.tl, padding:'4px 8px', borderRadius:999, background:isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)' }}>
                        Load →
                      </div>
                    </div>
                    <SeatBar results={r} T={T}/>
                  </div>
                </div>
              )
            })}
            <div style={{ height:32 }}/>
          </>
        )}

      </ScrollArea>
    </div>
  )
}
