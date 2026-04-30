import React, { useState } from 'react'
import { SP } from '../constants'
import { ScrollArea, haptic } from '../components/ui'
import { PortraitAvatar } from '../utils/portraits'

const QUOTES = [
  { quote: "Net zero is the greatest act of economic self-harm in modern political history.", leader:"Nigel Farage", party:"Reform UK", source:"Reform UK conference 2023" },
  { quote: "We need to stop the boats. Not slow them down. Stop them.", leader:"Nigel Farage", party:"Reform UK", source:"Reform UK campaign launch 2024" },
  { quote: "Change takes time. But it is coming.", leader:"Keir Starmer", party:"Labour", source:"Labour Party conference 2024" },
  { quote: "The NHS is broken. We inherited a £22 billion black hole.", leader:"Keir Starmer", party:"Labour", source:"House of Commons 2024" },
  { quote: "We need to earn back the trust of the British people.", leader:"Kemi Badenoch", party:"Conservative", source:"Conservative leadership speech 2024" },
  { quote: "The Conservative Party is the party of aspiration and opportunity.", leader:"Kemi Badenoch", party:"Conservative", source:"Conservative Party conference 2024" },
  { quote: "The climate crisis is the defining challenge of our generation.", leader:"Zack Polanski", party:"Green", source:"Green Party conference 2024" },
  { quote: "We need a Green New Deal that creates jobs and tackles inequality.", leader:"Zack Polanski", party:"Green", source:"Green Party manifesto 2024" },
  { quote: "Britain deserves better than the two-party system that has failed us.", leader:"Ed Davey", party:"Lib Dem", source:"Lib Dem conference 2024" },
  { quote: "People are being let down by a system that only works for the privileged few.", leader:"Ed Davey", party:"Lib Dem", source:"Lib Dem campaign 2024" },
  { quote: "Scotland's future should be determined by the people of Scotland.", leader:"John Swinney", party:"SNP", source:"SNP conference 2024" },
  { quote: "We must restore Britain's sovereignty and rebuild our national pride.", leader:"Rupert Lowe", party:"Restore Britain", source:"Restore Britain launch 2026" },
  { quote: "Working people have been left behind for too long. That ends now.", leader:"Keir Starmer", party:"Labour", source:"Labour manifesto launch 2024" },
  { quote: "Immigration without integration is not diversity — it's division.", leader:"Nigel Farage", party:"Reform UK", source:"Reform UK 2024" },
  { quote: "The NHS needs reform, not just more money.", leader:"Kemi Badenoch", party:"Conservative", source:"Conservative debate 2024" },
  { quote: "We are the only party serious about tackling the climate emergency.", leader:"Zack Polanski", party:"Green", source:"Green Party 2024" },
  { quote: "Proportional representation would make every vote count.", leader:"Ed Davey", party:"Lib Dem", source:"Lib Dem 2024" },
  { quote: "This government inherited chaos. We are bringing order.", leader:"Keir Starmer", party:"Labour", source:"PMQs 2025" },
]

const LEADERS = [
  { name:"Nigel Farage",  party:"Reform UK",      color:"#12B7D4" },
  { name:"Keir Starmer",  party:"Labour",         color:"#E4003B" },
  { name:"Kemi Badenoch", party:"Conservative",   color:"#0087DC" },
  { name:"Zack Polanski", party:"Green",          color:"#02A95B" },
  { name:"Ed Davey",      party:"Lib Dem",        color:"#FAA61A" },
  { name:"John Swinney",  party:"SNP",            color:"#C4922A" },
]

function getTodayIndex() {
  const d = new Date()
  return (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % QUOTES.length
}

function getOptions(correctLeader) {
  const wrong = LEADERS.filter(l => l.name !== correctLeader).sort(() => Math.random()-0.5).slice(0,3)
  const correct = LEADERS.find(l => l.name === correctLeader) || { name: correctLeader, party:'', color:'#888' }
  return [...wrong, correct].sort(() => Math.random()-0.5)
}

const STORAGE_KEY = 'politiscope_quotematch'

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch(e) { return {} }
}
function saveStats(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch(e) {}
}

function getMidnightCountdown() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24,0,0,0)
  const diff = midnight - now
  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hrs}h ${mins}m`
}

function getStableOptions(todayIdx, quoteLeader) {
  try {
    const stored = JSON.parse(localStorage.getItem('qm_options_' + todayIdx))
    if (stored && stored.length === 4) return stored
  } catch(e) {}
  const opts = getOptions(quoteLeader)
  try { localStorage.setItem('qm_options_' + todayIdx, JSON.stringify(opts)) } catch(e) {}
  return opts
}

export default function QuoteMatchScreen({ T, nav }) {
  const todayIdx = getTodayIndex()
  const quote    = QUOTES[todayIdx]
  const initStats = loadStats()
  const todayKey  = `day_${todayIdx}`

  const [options]  = useState(() => getStableOptions(todayIdx, quote.leader))
  const [chosen,   setChosen]  = useState(initStats[todayKey] || null)
  const [streak,   setStreak]  = useState(initStats.streak  || 0)
  const [total,    setTotal]   = useState(initStats.total   || 0)
  const [correct,  setCorrect] = useState(initStats.correct || 0)

  const answered  = !!chosen
  const revealed  = answered
  const isCorrect = chosen === quote.leader
  const isDark    = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const cardBg    = isDark ? '#0d1a24' : '#ffffff'
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  const handleAnswer = (leaderName) => {
    if (answered) return
    haptic(leaderName === quote.leader ? 15 : 8)
    setChosen(leaderName)
    const newCorrect = correct + (leaderName === quote.leader ? 1 : 0)
    const newTotal   = total + 1
    const newStreak  = leaderName === quote.leader ? streak + 1 : 0
    setCorrect(newCorrect)
    setTotal(newTotal)
    setStreak(newStreak)
    saveStats({ ...initStats, [todayKey]: leaderName, streak: newStreak, total: newTotal, correct: newCorrect })
  }

  const share = () => {
    const emoji = isCorrect ? '✅' : '❌'
    const url = 'https://politiscope.co.uk'
    const text = `${emoji} Politiscope Quote Match\n\n"${quote.quote.slice(0,60)}..."\n\nStreak: ${streak} 🔥 · Accuracy: ${total>0?Math.round(correct/total*100):0}%\n\n${url}`
    navigator.share?.({ title:'Politiscope', text, url }).catch(() => navigator.clipboard?.writeText(text))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:T.sf }}>

      {/* Header */}
      <div style={{ padding:'16px 18px 0', flexShrink:0 }}>
        <div style={{ fontSize:26, fontWeight:800, letterSpacing:-0.8, color:T.th, lineHeight:1 }}>Quote Match</div>
        <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:4 }}>Daily · Who said it?</div>
      </div>

      <ScrollArea>

        {/* Stats — only after first play */}
        {total > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              { label:'Streak', value:`${streak}🔥` },
              { label:'Accuracy', value:`${Math.round(correct/total*100)}%` },
              { label:'Played', value:total },
            ].map((s,i) => (
              <div key={i} style={{ borderRadius:14, padding:'12px 10px', background:cardBg, border:`1px solid ${border}`, textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:T.tl, marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.th }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quote card */}
        <div style={{ borderRadius:14, padding:'20px 20px 22px', background:cardBg, border:`1px solid ${border}`, marginBottom:14, textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-10, left:16, fontSize:100, color:T.tl, opacity:0.06, lineHeight:1, userSelect:'none', fontFamily:'Georgia,serif' }}>"</div>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:T.tl, marginBottom:14 }}>Who said this?</div>
          <div style={{ fontSize:17, fontWeight:600, color:T.th, lineHeight:1.7, fontStyle:'italic', position:'relative', zIndex:1 }}>
            "{quote.quote}"
          </div>
          {revealed && (
            <div style={{ marginTop:18, padding:'10px 18px', borderRadius:999, background:isCorrect?'#D0F5E4':'#FAD5DB', display:'inline-block' }}>
              <div style={{ fontSize:14, fontWeight:700, color:isCorrect?'#02A95B':'#C8102E' }}>
                {isCorrect ? '✓ Correct!' : '✗ Wrong'} — {quote.leader}, {quote.party}
              </div>
            </div>
          )}
          {revealed && (
            <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:8 }}>{quote.source}</div>
          )}
        </div>

        {/* Answer grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          {options.map((l, i) => {
            const isChosen  = chosen === l.name
            const isAnswer  = l.name === quote.leader
            const showRight = revealed && isAnswer
            const showWrong = revealed && isChosen && !isAnswer
            return (
              <div
                key={i}
                onClick={() => handleAnswer(l.name)}
                style={{
                  borderRadius:14, padding:14,
                  background: showRight ? '#D0F5E4' : showWrong ? '#FAD5DB' : cardBg,
                  border: `2px solid ${showRight ? '#02A95B' : showWrong ? '#C8102E' : border}`,
                  cursor: answered ? 'default' : 'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                  WebkitTapHighlightColor:'transparent',
                  opacity: revealed && !isAnswer && !isChosen ? 0.45 : 1,
                  transition: `background 0.2s, border-color 0.2s, opacity 0.2s`,
                }}
              >
                <PortraitAvatar name={l.name} color={l.color} size={52} radius={26}/>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:700, color: showRight ? '#02A95B' : showWrong ? '#C8102E' : T.th }}>{l.name}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:l.color, marginTop:2 }}>{l.party}</div>
                </div>
                {showRight && <div style={{ fontSize:14 }}>✓</div>}
                {showWrong && <div style={{ fontSize:14 }}>✗</div>}
              </div>
            )
          })}
        </div>

        {/* Post-answer */}
        {revealed && (
          <button
            onClick={share}
            style={{ width:'100%', background:isCorrect?'#02A95B':'#C8102E', border:'none', borderRadius:999, padding:'14px', fontSize:15, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:"'Outfit',sans-serif", WebkitTapHighlightColor:'transparent', marginBottom:10 }}
          >
            Share result →
          </button>
        )}

        {revealed && (
          <div style={{ textAlign:'center', padding:'12px', borderRadius:12, background:cardBg, border:`1px solid ${border}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.th, marginBottom:3 }}>Come back tomorrow for the next quote</div>
            <div style={{ fontSize:13, fontWeight:500, color:T.tl }}>New quote in {getMidnightCountdown()} · resets at midnight</div>
          </div>
        )}

        {!revealed && (
          <div style={{ textAlign:'center', marginTop:4, color:T.tl, fontSize:13, fontWeight:500 }}>
            New quote every day · resets at midnight
          </div>
        )}

        <div style={{ height:32 }}/>
      </ScrollArea>
    </div>
  )
}



