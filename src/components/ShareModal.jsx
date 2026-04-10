import React, { useState } from 'react'
import { R } from '../constants'

export default function ShareModal({ open, onClose, T, text, appUrl, title = 'Politiscope' }) {
  const [copied, setCopied] = useState(false)
  if (!open) return null

  const shareText = (text || '') + `\n\n🇬🇧 Politiscope — Your Full View on UK Politics\n${appUrl}`

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareText) } catch (e) {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toX  = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.slice(0,280))}`, '_blank'); onClose() }
  const toWA = () => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank'); onClose() }
  const toFB = () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(text||'')}`, '_blank'); onClose() }
  const native = async () => {
    onClose()
    setTimeout(async () => {
      if (navigator.share) { try { await navigator.share({ title, text: shareText }) } catch (e) {} }
      else copy()
    }, 150)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:T.c0, backdropFilter:'blur(40px)', borderRadius:'28px 28px 0 0', padding:`24px 20px calc(24px + env(safe-area-inset-bottom))`, width:'100%', maxWidth:480, boxShadow: 'none' }}>
        <div style={{ width:36, height:4, background:T.tl+'40', borderRadius:999, margin:'0 auto 20px' }}/>
        <div style={{ fontSize:13, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:T.tl, marginBottom:6 }}>Share</div>
        <div style={{ fontSize:22, fontWeight:700, color:T.th, marginBottom:16 }}>Politiscope</div>
        <div style={{ background:T.c1, borderRadius:16, padding:'14px 16px', fontSize:13, color:T.th, lineHeight:1.6, marginBottom:18, maxHeight:100, overflowY:'auto', fontStyle:'italic' }}>
          {shareText.slice(0,200)}{shareText.length > 200 ? '…' : ''}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, gridAutoFlow:'dense', marginBottom:10 }}>
          <button onClick={toX}  style={btnStyle('#000')}>X / Twitter</button>
          <button onClick={toWA} style={btnStyle('#25D366')}>WhatsApp</button>
          <button onClick={toFB} style={btnStyle('#1877F2')}>Facebook</button>
          <button onClick={copy} style={{ ...btnStyle(T.c0), color:T.th, border:`2px solid ${T.tl}40` }}>{copied ? '✓ Copied!' : '📋 Copy'}</button>
        </div>
        <button onClick={native} style={{ ...btnStyle(T.pr), width:'100%', marginBottom:8 }}>🔗 More apps (Reddit, Telegram…)</button>
        <button onClick={onClose} style={{ ...btnStyle(T.c1), width:'100%', color:T.tl }}>Dismiss</button>
      </div>
    </div>
  )
}

const btnStyle = (bg) => ({
  padding: 14, borderRadius: 999, border: 'none', background: bg,
  color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
  fontFamily: "'Outfit',sans-serif",
})


