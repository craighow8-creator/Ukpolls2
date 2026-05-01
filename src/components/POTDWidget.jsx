import React, { useState, useEffect } from 'react'
import { WORKER, APP_TOKEN, R } from '../constants'
import { LS, getDeviceId } from '../utils/helpers'
import { parseJsonResponse } from '../utils/http'
import PartyIdentityMark from './PartyIdentityMark'
import { PortraitAvatar } from '../utils/portraits'

const POTD_QUESTIONS = [
  { id:'q_vote',   q:'If there was a general election tomorrow, who would you vote for?',      opts:['Reform UK','Labour','Conservative','Green','Lib Dem','Restore Britain','SNP / Plaid','Would not vote'] },
  { id:'q_winner', q:'Who do you think will win the most seats at the next general election?', opts:['Reform UK','Labour','Conservative','Green','Lib Dem','Restore Britain','No idea'] },
  { id:'q_pm',     q:'Who would make the best Prime Minister right now?',                      opts:['Keir Starmer','Nigel Farage','Kemi Badenoch','Zack Polanski','Ed Davey','Rupert Lowe'] },
  { id:'q_issue',  q:'What is the most important issue facing the UK?',                        opts:['Immigration','NHS','Economy','Housing','Climate','Crime'] },
  { id:'q_reform', q:'Is Reform UK a genuine governing force or a protest party?',             opts:['Genuine force','Protest party','Too early to say','Neither'] },
  { id:'q_lab',    q:'Do you think Labour will recover in the polls?',                         opts:['Yes, definitely','Probably','Unlikely','No chance'] },
]

function getTodayQ() {
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return POTD_QUESTIONS[day % POTD_QUESTIONS.length]
}

function isPartyQuestion(question) {
  return ['q_vote', 'q_winner'].includes(question?.id)
}

function isLeaderQuestion(question) {
  return question?.id === 'q_pm'
}

function findLeaderByName(leaders = [], name = '') {
  const key = String(name || '').trim().toLowerCase()
  return leaders.find((leader) => String(leader?.name || '').trim().toLowerCase() === key) || null
}

function OptionIdentity({ T, question, option, leaders = [], size = 30 }) {
  if (isPartyQuestion(question)) {
    return <PartyIdentityMark party={option} size={size} />
  }
  if (isLeaderQuestion(question)) {
    const leader = findLeaderByName(leaders, option)
    return <PortraitAvatar name={option} color={leader?.color || T.pr} size={size} radius={Math.round(size / 2)} />
  }
  return null
}

export default function POTDWidget({ T, leaders = [] }) {
  const q = getTodayQ()
  const [voted, setVoted] = useState(LS.get('potd_' + q.id))
  const [results, setResults] = useState(null)

  useEffect(() => { if (voted) loadResults() }, [voted])

  const loadResults = async () => {
    try {
      const r = await fetch(`${WORKER}/potd-results?qid=${encodeURIComponent(q.id)}`, { headers: { 'X-App-Token': APP_TOKEN } })
      setResults(await parseJsonResponse(r, 'Poll of the Day results'))
    } catch(e) {}
  }

  const vote = async (opt) => {
    LS.set('potd_' + q.id, opt)
    setVoted(opt)
    try {
      const r = await fetch(`${WORKER}/potd-vote`, { method:'POST', headers:{'Content-Type':'application/json','X-App-Token':APP_TOKEN}, body: JSON.stringify({ qid:q.id, option:opt, deviceId:getDeviceId() }) })
      const data = await parseJsonResponse(r, 'Poll of the Day vote')
      setResults(data.votes || null)
    } catch(e) {}
  }

  if (!voted) {
    return (
      <div style={{ background:T.c0, backdropFilter:'blur(40px)', borderRadius:28, padding:'20px 20px 16px' }}>
        <div style={{ fontSize:13, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:T.pr, marginBottom:10 }}>🗳 Poll of the Day</div>
        <div style={{ fontSize:16, fontWeight:700, color:T.th, lineHeight:1.4, marginBottom:14 }}>{q.q}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {q.opts.map((opt, i) => (
            <button key={i} onClick={() => vote(opt)} style={{ padding:'12px 16px', borderRadius:14, border:`2px solid ${T.pr}30`, background:T.c1, fontSize:14, fontWeight:700, color:T.th, textAlign:'left', cursor:'pointer', fontFamily:"'Outfit',sans-serif", display:'flex', alignItems:'center', gap:10 }}>
              <OptionIdentity T={T} question={q} option={opt} leaders={leaders} />
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const total = results ? q.opts.reduce((s, o) => s + (results[o] || 0), 0) : 0
  const sorted = q.opts.map(o => ({ opt:o, pct: total > 0 ? Math.round((results?.[o] || 0) / total * 100) : 0, count: results?.[o] || 0 })).sort((a,b) => b.pct - a.pct)

  return (
    <div style={{ background:T.c0, backdropFilter:'blur(40px)', borderRadius:28, padding:'20px 20px 16px' }}>
      <div style={{ fontSize:13, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:T.pr, marginBottom:8 }}>🗳 Poll of the Day — Results</div>
      <div style={{ fontSize:15, fontWeight:700, color:T.th, lineHeight:1.4, marginBottom:4 }}>{q.q}</div>
      <div style={{ fontSize:13, fontWeight:600, color:T.tl, marginBottom:14 }}>Your answer: <strong style={{ color:T.pr }}>{voted}</strong> · {total.toLocaleString()} vote{total !== 1 ? 's' : ''}</div>
      {sorted.map((r, i) => {
        const isMe = r.opt === voted
        return (
          <div key={i} style={{ marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:8, minWidth:0, fontSize:14, fontWeight:isMe?800:600, color:isMe?T.pr:T.th }}>
                <OptionIdentity T={T} question={q} option={r.opt} leaders={leaders} size={24} />
                <span>{r.opt}{isMe ? ' ✓' : ''}</span>
              </span>
              <span style={{ fontSize:14, fontWeight:800, color:T.pr }}>{r.pct}%</span>
            </div>
            <div style={{ height:6, background:T.sf, borderRadius:999, overflow:'hidden' }}>
              <div style={{ width:`${r.pct}%`, height:'100%', background:isMe?T.pr:T.pr+'55', borderRadius:999, transition:'width 0.6s ease' }}/>
            </div>
          </div>
        )
      })}
      <div style={{ fontSize:13, fontWeight:600, color:T.tl, marginTop:10 }}>Live results · New question daily</div>
    </div>
  )
}



