import React, { useEffect, useState } from 'react'
import { ScrollArea, haptic } from '../components/ui'

const BENCHMARKS = [
  { name:'Runcorn & Helsby',  needed:19.8, from:'Labour',       to:'Reform UK', result:'Reform UK WON by 6 votes — May 2025' },
  { name:'Gorton & Denton',   needed:26.7, from:'Labour',       to:'Green',     result:'Green WON — Feb 2026, 5th Green MP' },
  { name:'Kingswood',         needed:14.4, from:'Conservative', to:'Labour',    result:'Labour WON — Feb 2024' },
  { name:'Horsham',           needed:3.4,  from:'Conservative', to:'Lib Dem',   result:'Upcoming — TBC 2026' },
  { name:'Avg Lab marginal',  needed:12.0, from:'Labour',       to:'Reform UK', result:'Typical Red Wall marginal' },
]

const EPSILON = 0.05
const CLOSE_BENCHMARK_RANGE = 1


function safeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function roundToTenth(value) {
  return +safeNumber(value).toFixed(1)
}

function formatPoints(value) {
  return `${Math.abs(safeNumber(value)).toFixed(1)} pts`
}

function formatPercent(value) {
  return `${safeNumber(value).toFixed(1)}%`
}

function getCurrentGap(fromParty, toParty) {
  return roundToTenth(safeNumber(fromParty?.pct) - safeNumber(toParty?.pct))
}

function getCurrentStateCopy(fromParty, toParty, gapNow, swingToLevel) {
  if (!fromParty || !toParty) return 'Choose two parties to model the race.'

  if (Math.abs(gapNow) <= EPSILON) {
    return {
      title: 'Race currently level',
      subtext: `No swing is needed for ${toParty.name} to draw level.`,
    }
  }

  if (gapNow > 0) {
    return {
      title: `${fromParty.name} lead ${toParty.name} by ${formatPoints(gapNow)}`,
      subtext: `${toParty.name} would need ${formatPoints(swingToLevel)} swing to draw level.`,
    }
  }

  return {
    title: `${toParty.name} lead ${fromParty.name} by ${formatPoints(gapNow)}`,
    subtext: `${toParty.name} are already ahead in the current baseline.`,
  }
}

function getModelledStateCopy(fromParty, toParty, gapAfter, swing) {
  if (!fromParty || !toParty || swing <= EPSILON) return null

  if (Math.abs(gapAfter) <= EPSILON) {
    return {
      title: 'Race tied after swing',
      subtext: 'The gap has been fully eliminated.',
    }
  }

  if (gapAfter > 0) {
    return {
      title: `${fromParty.name} still lead after swing`,
      subtext: `${toParty.name} close the gap but remain behind.`,
    }
  }

  return {
    title: `${toParty.name} take the lead after swing`,
    subtext: `A swing of ${formatPoints(swing)} would put ${toParty.name} ahead.`,
  }
}

function getMeaningCopy({ fromParty, toParty, gapNow, gapAfter, swing, swingToLevel }) {
  if (!fromParty || !toParty) {
    return 'Choose two parties to compare.'
  }

  if (swing <= EPSILON) {
    return 'This reflects the current polling gap between the parties.'
  }

  if (Math.abs(gapAfter) <= EPSILON) {
    return 'The race becomes highly competitive at this level.'
  }

  if (gapAfter < 0 && gapNow > EPSILON) {
    return 'This level of swing would be enough to change the national lead.'
  }

  if (gapAfter < 0) {
    return `This adds to the lead already held by ${toParty.name}.`
  }

  if (Math.abs(gapAfter) <= 2 || Math.abs(swing - swingToLevel) <= 1) {
    return 'The race becomes highly competitive at this level.'
  }

  return 'The swing narrows the gap but does not change the overall leader.'
}

function getGapStatusLabel(gap, leadingParty, trailingParty) {
  if (Math.abs(gap) <= EPSILON) return 'Tied'
  return gap > 0 ? `${leadingParty} ahead` : `${trailingParty} ahead`
}

function formatGapValue(gap) {
  if (gap === null || gap === undefined) return '—'
  if (Math.abs(gap) <= EPSILON) return 'Tied'
  return formatPoints(gap)
}

function getBenchmarkStatus(isSame, swing, needed) {
  if (!isSame) return 'Tap to load this matchup.'

  const difference = roundToTenth(swing - needed)
  if (Math.abs(difference) <= CLOSE_BENCHMARK_RANGE) return 'Within range of this contest'
  if (difference < 0) return 'Short of the swing needed for this seat'
  return 'Exceeds the swing required here'
}

export default function SwingCalcScreen({ T, nav, parties, pollContext = {} }) {
  const snapshotParties = Array.isArray(pollContext?.partyPollSnapshot)
    ? pollContext.partyPollSnapshot.filter((party) => safeNumber(party?.pct) > 0)
    : []
  const fallbackParties = Array.isArray(parties)
    ? parties.filter((party) => safeNumber(party?.pct) > 0)
    : []
  const sourceParties = snapshotParties.length ? snapshotParties : fallbackParties
  const mainParties = [...sourceParties].sort((a, b) => safeNumber(b?.pct) - safeNumber(a?.pct))
  const [fromParty, setFromParty] = useState('Labour')
  const [toParty,   setToParty]   = useState('Reform UK')
  const [swing,     setSwing]     = useState(0)

  useEffect(() => {
    if (!mainParties.length) return

    const topParty = mainParties[0]?.name || ''
    const secondParty = mainParties.find((party) => party?.name && party.name !== topParty)?.name || topParty
    const hasFromParty = mainParties.some((party) => party?.name === fromParty)
    const hasToParty = mainParties.some((party) => party?.name === toParty)

    if (!hasFromParty || !hasToParty || fromParty === toParty) {
      const nextFromParty = hasFromParty && fromParty !== secondParty ? fromParty : topParty
      const nextToParty =
        hasToParty && toParty !== nextFromParty
          ? toParty
          : mainParties.find((party) => party?.name && party.name !== nextFromParty)?.name || nextFromParty

      setFromParty(nextFromParty)
      setToParty(nextToParty)
      setSwing(0)
    }
  }, [fromParty, toParty, mainParties])

  const fp      = mainParties.find(p => p.name === fromParty)
  const tp      = mainParties.find(p => p.name === toParty)
  const maxSwing = fp ? roundToTenth(Math.max(0, safeNumber(fp?.pct))) : 40

  useEffect(() => {
    setSwing(prev => roundToTenth(Math.min(prev, maxSwing)))
  }, [maxSwing])

  const appliedSwing = roundToTenth(Math.min(swing, maxSwing))
  const fromNew = fp ? roundToTenth(Math.max(0, safeNumber(fp?.pct) - appliedSwing)) : 0
  const toNew   = tp ? roundToTenth(Math.min(100, safeNumber(tp?.pct) + appliedSwing)) : 0
  const benchmark   = BENCHMARKS.find(b => b.from === fromParty && b.to === toParty)
  const needed      = benchmark?.needed || null
  const beaten      = needed !== null && appliedSwing >= needed
  const gapNow      = fp && tp ? getCurrentGap(fp, tp) : null
  const gapAfter    = fp && tp ? roundToTenth(fromNew - toNew) : null
  const swingToLevel = fp && tp ? roundToTenth(Math.max(0, getCurrentGap(fp, tp) / 2)) : null
  const currentState = getCurrentStateCopy(fp, tp, gapNow, swingToLevel)
  const modelledState = getModelledStateCopy(fp, tp, gapAfter, appliedSwing)
  const story = getMeaningCopy({ fromParty: fp, toParty: tp, gapNow, gapAfter, swing: appliedSwing, swingToLevel })
  const benchmarkGap = needed !== null ? roundToTenth(needed - appliedSwing) : null

  const isDark  = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const cardBg  = isDark ? '#0d1a24' : '#ffffff'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:T.sf }}>
      <div style={{ padding:'16px 18px 0', flexShrink:0 }}>
        <div style={{ fontSize:28, fontWeight:800, letterSpacing:-1, color:T.th, lineHeight:1 }}>Swing Calculator</div>
        <div style={{ fontSize:13, fontWeight:500, color:T.tl, marginTop:4 }}>How many points does it take to change the result?</div>
      </div>

      <ScrollArea>
        <div style={{ padding:'12px 16px 32px' }}>
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:16, overflow:'hidden', marginBottom:14 }}>
          <div style={{ height:4, background:tp?.color||T.pr }} />
          <div style={{ padding:'16px 16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.05em', textTransform:'uppercase', color:tp?.color||T.pr, background:`${tp?.color||T.pr}1F`, border:`1px solid ${(tp?.color||T.pr)}2B`, borderRadius:999, padding:'4px 9px' }}>Current state</div>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.05em', textTransform:'uppercase', color:T.tl, background:`${T.tl}12`, border:`1px solid ${T.tl}2B`, borderRadius:999, padding:'4px 9px' }}>{appliedSwing > EPSILON ? 'Modelled state' : 'No swing applied'}</div>
            </div>

            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:T.tl, textAlign:'center', marginBottom:8 }}>
              Baseline reality
            </div>

            <div style={{ fontSize:28, fontWeight:800, letterSpacing:'-0.03em', color:T.th, textAlign:'center', lineHeight:1.15 }}>
              {fp && tp ? currentState.title : 'Choose parties to model the race'}
            </div>

            <div style={{ fontSize:13, fontWeight:600, color:T.tl, textAlign:'center', marginTop:6, lineHeight:1.55 }}>
              {fp && tp ? currentState.subtext : 'Select two parties to compare the current gap and the swing needed to change it.'}
            </div>

            {modelledState && (
              <>
                <div style={{ height:1, background:isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.07)', margin:'14px auto', width:'100%' }} />
                <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:T.tl, textAlign:'center', marginBottom:8 }}>
                  After swing
                </div>
                <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.03em', color:T.th, textAlign:'center', lineHeight:1.2 }}>
                  {modelledState.title}
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:T.tl, textAlign:'center', marginTop:6, lineHeight:1.55 }}>
                  {modelledState.subtext}
                </div>
              </>
            )}

            <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              <div style={{ background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', borderRadius:12, padding:'10px 12px', border:`1px solid ${fp?.color||'#888'}22`, textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:T.tl, marginBottom:4 }}>Current gap</div>
                <div style={{ fontSize:20, fontWeight:800, color:T.th }}>{formatGapValue(gapNow)}</div>
                <div style={{ fontSize:12, fontWeight:700, color:T.tl, marginTop:4 }}>{gapNow !== null ? getGapStatusLabel(gapNow, fp?.name, tp?.name) : '—'}</div>
              </div>
              <div style={{ background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', borderRadius:12, padding:'10px 12px', border:`1px solid ${tp?.color||'#888'}22`, textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:T.tl, marginBottom:4 }}>Swing to level</div>
                <div style={{ fontSize:20, fontWeight:800, color:tp?.color||T.th }}>{swingToLevel !== null ? formatPoints(swingToLevel) : '—'}</div>
                <div style={{ fontSize:12, fontWeight:700, color:T.tl, marginTop:4 }}>{swingToLevel > 0 ? `${tp?.name} to tie` : `${tp?.name} level or ahead`}</div>
              </div>
              <div style={{ background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', borderRadius:12, padding:'10px 12px', border:`1px solid ${tp?.color||'#888'}22`, textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:T.tl, marginBottom:4 }}>After swing</div>
                <div style={{ fontSize:20, fontWeight:800, color:gapAfter < 0 ? (tp?.color||T.pr) : T.th }}>{formatGapValue(gapAfter)}</div>
                <div style={{ fontSize:12, fontWeight:700, color:T.tl, marginTop:4 }}>{appliedSwing > EPSILON ? getGapStatusLabel(gapAfter, fp?.name, tp?.name) : 'Same as current state'}</div>
              </div>
            </div>
          </div>
        </div>

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
              {appliedSwing <= EPSILON ? (
                <div style={{ fontSize:14, fontWeight:600, color:T.tl, textAlign:'center', lineHeight:1.5 }}>
                  No swing is applied. The baseline remains <span style={{ color:fp?.color, fontWeight:800 }}>{fromParty} {formatPercent(fp?.pct)}</span> and <span style={{ color:tp?.color, fontWeight:800 }}>{toParty} {formatPercent(tp?.pct)}</span>.
                </div>
              ) : (
                <div style={{ fontSize:15, fontWeight:600, color:T.th, lineHeight:1.6 }}>
                  Applying <span style={{ fontWeight:800, color:tp?.color||T.pr }}>{formatPoints(appliedSwing)}</span> from <span style={{ color:fp?.color, fontWeight:700 }}>{fromParty}</span> to <span style={{ color:tp?.color, fontWeight:700 }}>{toParty}</span> gives modelled shares of <span style={{ color:fp?.color, fontWeight:700 }}>{fromParty} {formatPercent(fromNew)}</span> and <span style={{ color:tp?.color, fontWeight:700 }}>{toParty} {formatPercent(toNew)}</span>.
                </div>
              )}
            </div>

            {/* Slider */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.tl, textTransform:'uppercase', letterSpacing:'0.06em' }}>Swing ({fromParty} → {toParty})</div>
                <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.02em', color:beaten?tp?.color||T.pr:T.th }}>{formatPoints(appliedSwing)} {beaten?'✓':''}</div>
              </div>
              <input type="range" min="0" max={maxSwing} step="0.1" value={appliedSwing} onChange={e=>{haptic(4);setSwing(roundToTenth(e.target.value))}} style={{ width:'100%', accentColor:tp?.color||T.pr }}/>
              <div style={{ fontSize:12, fontWeight:600, color:T.tl, marginTop:6, textAlign:'center', lineHeight:1.45 }}>
                This transfers vote share directly from {fromParty} to {toParty} in the model.
              </div>
            </div>

            {/* Vote share boxes */}
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', borderRadius:12, padding:'10px 12px', border:`1px solid ${fp?.color||'#888'}22` }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.tl, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{fp?.abbr||'From'} vote</div>
                <div style={{ fontSize:20, fontWeight:800, color:fp?.color||T.th }}>{formatPercent(fp?.pct)} → {formatPercent(fromNew)}</div>
              </div>
              <div style={{ flex:1, background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', borderRadius:12, padding:'10px 12px', border:`1px solid ${tp?.color||'#888'}22` }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.tl, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{tp?.abbr||'To'} vote</div>
                <div style={{ fontSize:20, fontWeight:800, color:tp?.color||T.th }}>{formatPercent(tp?.pct)} → {formatPercent(toNew)}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:16, padding:'16px 16px 18px', marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.tl, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8, textAlign:'center' }}>What this means</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.th, lineHeight:1.55, textAlign:'center', marginBottom:10 }}>
            {story}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:T.tl, lineHeight:1.6, textAlign:'center' }}>
            {needed !== null
              ? `Benchmark for this matchup: ${formatPoints(needed)} required. ${getBenchmarkStatus(true, appliedSwing, needed)}.`
              : appliedSwing <= EPSILON
                ? 'No seat benchmark is stored for this exact matchup, so this remains a national vote-share guide.'
                : swingToLevel !== null && appliedSwing < swingToLevel
                  ? `${formatPoints(swingToLevel - appliedSwing)} more would be needed to draw level nationally.`
                  : 'No seat benchmark is stored for this exact matchup, so treat this as a national guide rather than a forecast.'}
          </div>
        </div>

        {/* Benchmarks */}
        <div style={{ fontSize:13, fontWeight:700, color:T.tl, letterSpacing:'0.06em', marginBottom:10 }}>Real contest benchmarks · tap to load</div>
        {BENCHMARKS.map((ex, i) => {
          const fromP  = mainParties.find(p => p.name===ex.from)
          const toP    = mainParties.find(p => p.name===ex.to)
          const isSame = fromParty===ex.from && toParty===ex.to
          const reached = isSame && appliedSwing >= ex.needed
          const status = getBenchmarkStatus(isSame, appliedSwing, ex.needed)
          return (
            <div key={i} onClick={()=>{haptic(8);setFromParty(ex.from);setToParty(ex.to);setSwing(0)}} style={{ background:reached?`${toP?.color||T.pr}12`:cardBg, border:`${isSame?2:1}px solid ${isSame?(toP?.color||T.pr)+'44':border}`, borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:T.th, marginBottom:3 }}>{ex.name}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.tl }}><span style={{ color:fromP?.color }}>{ex.from}</span>{' → '}<span style={{ color:toP?.color }}>{ex.to}</span></div>
                  <div style={{ fontSize:13, color:T.tl, marginTop:3 }}>{ex.result}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:isSame ? (toP?.color||T.pr) : T.tl, marginTop:5 }}>
                    {status}
                  </div>
                  {isSame && (
                    <div style={{ fontSize:12, fontWeight:600, color:T.tl, marginTop:4 }}>
                      Current slider: {formatPoints(appliedSwing)}{benchmarkGap !== null && benchmarkGap > CLOSE_BENCHMARK_RANGE ? ` · ${formatPoints(benchmarkGap)} short` : ''}
                    </div>
                  )}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:toP?.color||T.pr }}>{formatPoints(ex.needed)}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.tl }}>required swing</div>
                </div>
              </div>
            </div>
          )
        })}
        <div style={{ height:32 }}/>
        </div>
      </ScrollArea>
    </div>
  )
}
