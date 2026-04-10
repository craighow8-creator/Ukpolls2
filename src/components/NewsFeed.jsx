import React, { useState, useEffect } from 'react'
import { WORKER, APP_TOKEN, R } from '../constants'

export default function NewsFeed({ T }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    fetch(`${WORKER}/news`, { headers: { 'X-App-Token': APP_TOKEN } })
      .then(r => r.json())
      .then(d => { setArticles((d.articles || []).slice(0, 20)); setLoading(false) })
      .catch(() => { setErr('Could not load news'); setLoading(false) })
  }, [])

  if (loading) return <div style={{ textAlign:'center', padding:32, color:T.tl }}>Loading news…</div>
  if (err)     return <div style={{ textAlign:'center', padding:32, color:T.tl }}>{err}</div>

  return (
    <div>
      {articles.map((a, i) => (
        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{ display:'block', textDecoration:'none' }}>
          <div style={{ background:T.c0, backdropFilter:'blur(40px)', borderRadius:20, padding:'14px 16px', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:800, color:T.pr, letterSpacing:.5, textTransform:'uppercase', marginBottom:4 }}>{a.source}</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.th, lineHeight:1.4 }}>{a.title}</div>
                {a.summary && <div style={{ fontSize:13, fontWeight:500, color:T.tm, marginTop:4, lineHeight:1.5 }}>{a.summary}</div>}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.tl} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}



