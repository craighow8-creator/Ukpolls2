import { useState, useEffect } from 'react'
import { WORKER, APP_TOKEN, R } from '../constants'

export default function AIBriefing({ T, partyName, partyColor: pc, parties, meta }) {
  const [q, setQ] = useState('')
  const [out, setOut] = useState(null)
  const [loading, setLoading] = useState(false)

  const chips = [
    'Is Reform UK a protest party or a governing party?',
    'Why are the Greens surging?',
    'What does Restore Britain actually stand for?',
    'Can Labour recover before 2029?',
    'What will happen at the May 2026 elections?',
    'Who is likely to be the next PM?',
  ]

  const buildCtx = () => {
    const sorted = [...parties].sort((a,b) => b.pct - a.pct)
    const snap = sorted.filter(p => p.name !== 'Other').map(p => `${p.name} ${p.pct}%`).join(', ')
    return `You are a neutral, expert UK political analyst. Today is ${meta.fetchDate}. Current polls: ${snap}. ${meta.context || ''} Answer in clear, engaging prose. Be politically neutral but don't shy away from hard truths. Max 200 words.`
  }

  const askPartyBriefing = async (party, color) => {
    const question = `Give me a straight-talking, balanced briefing on why someone would vote ${party} in the UK. Structure it exactly like this:\nWHAT THEY STAND FOR\nKEY POLICIES\nTHE CASE FOR\nTHE CASE AGAINST\nWHO VOTES FOR THEM\nBe completely politically neutral. Max 350 words total.`
    setLoading(true); setOut(null)
    try {
      const resp = await fetch(WORKER, { method:'POST', headers:{'Content-Type':'application/json','X-App-Token':APP_TOKEN}, body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:600, system:buildCtx(), messages:[{role:'user',content:question}] }) })
      const data = await resp.json()
      const text = data?.content?.[0]?.text
      if (text) setOut({ text, type:'party', color })
    } catch(e) { setOut({ text:'Error: '+e.message, type:'err' }) }
    setLoading(false)
  }

  const ask = async (question) => {
    if (!question?.trim()) return
    setLoading(true); setOut(null)
    try {
      const resp = await fetch(WORKER, { method:'POST', headers:{'Content-Type':'application/json','X-App-Token':APP_TOKEN}, body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:400, system:buildCtx(), messages:[{role:'user',content:question}] }) })
      const data = await resp.json()
      const text = data?.content?.[0]?.text
      if (text) setOut({ text, type:'general' })
    } catch(e) { setOut({ text:'Error: '+e.message, type:'err' }) }
    setLoading(false)
  }

  useEffect(() => { if (partyName && pc) askPartyBriefing(partyName, pc) }, [partyName])

  const renderOut = () => {
    if (!out) return null
    if (out.type === 'party') {
      const lines = out.text.split('\n')
      return (
        <div style={{ background:T.c0, borderRadius:R.card, overflow:'hidden', border:`1px solid ${out.color}22` }}>
          <div style={{ background:out.color+'12', padding:'14px 18px', borderBottom:`1px solid ${out.color}22` }}>
            <div style={{ fontSize:13, fontWeight:800, color:out.color, letterSpacing:1.2, textTransform:'uppercase' }}>Party Briefing</div>
          </div>
          <div style={{ padding:'16px 18px' }}>
            {lines.map((line, i) => {
              if (!line.trim()) return <div key={i} style={{ height:8 }}/>
              if (line.match(/^(WHAT THEY STAND FOR|KEY POLICIES|THE CASE FOR|THE CASE AGAINST|WHO VOTES FOR THEM)/i))
                return <div key={i} style={{ fontSize:13, fontWeight:800, letterSpacing:1.2, textTransform:'uppercase', color:out.color, margin:'14px 0 6px', borderBottom:`1.5px solid ${out.color}22`, paddingBottom:4 }}>{line}</div>
              if (line.match(/^[•\-]|\d+\./))
                return <div key={i} style={{ display:'flex', gap:8, margin:'4px 0', fontSize:14, lineHeight:1.6, color:T.th }}><span style={{ color:out.color, flexShrink:0, fontWeight:700 }}>▸</span><span>{line.replace(/^[•\-\d+.]+\s*/,'')}</span></div>
              return <div key={i} style={{ fontSize:14, lineHeight:1.7, color:T.th, margin:'3px 0' }}>{line}</div>
            })}
          </div>
        </div>
      )
    }
    return (
      <div style={{ background:T.c0, borderRadius:R.card, padding:'18px 20px' }}>
        <div style={{ fontSize:14, lineHeight:1.7, color:T.th }}>
          {out.text.split('\n\n').map((para,i) => <p key={i} style={{ marginBottom:10 }}>{para}</p>)}
        </div>
      </div>
    )
  }

  return (
    <div>
      {!partyName && (
        <>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:12, scrollbarWidth:'none' }}>
            {chips.map((c,i) => (
              <div key={i} onClick={() => ask(c)} style={{ flexShrink:0, padding:'8px 14px', borderRadius:R.pill, background:T.c1, color:T.tm, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>{c}</div>
            ))}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {parties.filter(p => p.name !== 'Other').map(p => (
              <div key={p.name} onClick={() => askPartyBriefing(p.name, p.color)} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px 6px 8px', borderRadius:R.pill, background:p.color+'22', color:p.color, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:p.color }}/>
                Why vote {p.abbr}?
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(q)} placeholder="Ask anything about UK politics…" style={{ flex:1, padding:'12px 16px', background:T.c0, border:'none', borderRadius:R.pill, fontSize:14, fontWeight:500, outline:'none', backdropFilter:'blur(40px)', color:T.th, fontFamily:"'Outfit',sans-serif" }}/>
            <button onClick={() => ask(q)} style={{ padding:'12px 20px', background:T.pr, border:'none', borderRadius:R.pill, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>Ask</button>
          </div>
        </>
      )}
      {loading && <div style={{ textAlign:'center', padding:24, color:T.tl }}>⏳ Thinking…</div>}
      {renderOut()}
    </div>
  )
}
