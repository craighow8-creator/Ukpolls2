import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import { PLEDGES, PLEDGE_TOPICS } from '../data/pledges'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const POLICY_TOPICS = [
  { key: 'overview',    label: 'Overview'    },
  { key: 'immigration', label: 'Immigration' },
  { key: 'economy',     label: 'Economy'     },
  { key: 'nhs',         label: 'NHS'         },
  { key: 'climate',     label: 'Climate'     },
]

// ─── Primitives ───────────────────────────────────────────────────
function Chip({ children, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
      textTransform: 'uppercase', color,
      background: `${color}1e`, borderRadius: 4, padding: '2px 7px',
      flexShrink: 0, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function SectionLabel({ children, T }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 800, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: T.tl,
      marginBottom: 8, marginTop: 6,
    }}>{children}</div>
  )
}

// ─── Party picker sheet ───────────────────────────────────────────
function PartyPicker({ T, main, slot, exclude, onPick, onCancel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: T.sf }}>
      <div style={{ padding: '20px 18px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.th }}>Choose Party {slot}</div>
          <motion.div {...TAP} onClick={onCancel}
            style={{ fontSize: 13, fontWeight: 700, color: T.tl, cursor: 'pointer', padding: '6px 10px' }}>
            Cancel
          </motion.div>
        </div>
      </div>
      <ScrollArea>
        <div style={{ padding: '4px 14px' }}>
          {main.filter(p => p.name !== exclude).map((p, i) => (
            <motion.div
              key={i} {...TAP}
              onClick={() => { haptic(6); onPick(p.name) }}
              style={{
                borderRadius: 14, padding: '13px 14px', marginBottom: 8,
                background: T.c0 || '#fff',
                border: `1px solid ${p.color}28`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{p.name}</div>
                <div style={{ fontSize: 13, color: T.tl }}>{p.pct}% · {p.seats ?? '—'} seats</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: p.color }}>{p.pct}%</div>
            </motion.div>
          ))}
          <div style={{ height: 40 }} />
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── Head-to-head stat row ─────────────────────────────────────────
function H2HRow({ T, label, valA, valB, colorA, colorB, winnerA }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', gap: 10, marginBottom: 8,
    }}>
      <div style={{
        borderRadius: 10, padding: '9px 10px', textAlign: 'center',
        background: winnerA === true ? `${colorA}14` : T.c0 || '#fff',
        border: `1px solid ${winnerA === true ? colorA : T.cardBorder || 'rgba(0,0,0,0.07)'}28`,
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: colorA }}>{valA}</div>
        {winnerA === true && <div style={{ fontSize: 13, fontWeight: 800, color: colorA, marginTop: 2 }}>HIGHER</div>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 50 }}>
        {label}
      </div>
      <div style={{
        borderRadius: 10, padding: '9px 10px', textAlign: 'center',
        background: winnerA === false ? `${colorB}14` : T.c0 || '#fff',
        border: `1px solid ${winnerA === false ? colorB : T.cardBorder || 'rgba(0,0,0,0.07)'}28`,
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: colorB }}>{valB}</div>
        {winnerA === false && <div style={{ fontSize: 13, fontWeight: 800, color: colorB, marginTop: 2 }}>HIGHER</div>}
      </div>
    </div>
  )
}

// ─── CompareScreen ────────────────────────────────────────────────
export default function CompareScreen({ T, nav, parties = [], leaders = [] }) {
  const [selA, setSelA]   = useState(null)
  const [selB, setSelB]   = useState(null)
  const [tab,  setTab]    = useState('overview')
  const [pick, setPick]   = useState(null) // 'A' | 'B'

  const main     = parties.filter(p => p.name !== 'Other')
  const partyA   = main.find(p => p.name === selA)
  const partyB   = main.find(p => p.name === selB)
  const leaderA  = leaders?.find(l => l.party === selA)
  const leaderB  = leaders?.find(l => l.party === selB)
  const pledgesA = PLEDGES?.[selA]
  const pledgesB = PLEDGES?.[selB]
  const both     = partyA && partyB

  // Available tabs — only show if at least one party has that policy data
  const availTabs = POLICY_TOPICS.filter(t => {
    if (t.key === 'overview') return true
    if (!both) return false
    return leaderA?.[t.key] || leaderB?.[t.key] ||
      pledgesA?.[t.key]?.length || pledgesB?.[t.key]?.length
  })

  // Party picker overlay
  if (pick) {
    return (
      <PartyPicker
        T={T}
        main={main}
        slot={pick}
        exclude={pick === 'A' ? selB : selA}
        onPick={name => {
          if (pick === 'A') setSelA(name)
          else setSelB(name)
          setPick(null)
          setTab('overview')
        }}
        onCancel={() => setPick(null)}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: T.sf }}>

      <div style={{ padding: '20px 18px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, color: T.th, lineHeight: 1, marginBottom: 3 }}>Compare</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl }}>Side-by-side party comparison</div>
      </div>

      {/* ── Party selector ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, padding: '14px 14px 0', alignItems: 'center', flexShrink: 0 }}>
        {[
          { slot: 'A', party: partyA, sel: selA },
          { slot: 'B', party: partyB, sel: selB },
        ].map(({ slot, party, sel }, i) => (
          <motion.div
            key={i} {...TAP}
            onClick={() => { haptic(6); setPick(slot) }}
            style={{
              borderRadius: 14, cursor: 'pointer',
              background: T.c0 || '#fff',
              border: `1px solid ${party?.color ? `${party.color}33` : T.cardBorder || 'rgba(0,0,0,0.07)'}`,
              overflow: 'hidden',
              minHeight: 84,
              display: 'flex', flexDirection: 'column',
            }}
          >
            {party && <div style={{ height: 3, background: party.color }} />}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 8px' }}>
              {party ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: party.color, marginBottom: 3 }}>
                    {party.name}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: party.color, lineHeight: 1 }}>
                    {party.pct}%
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 2 }}>
                    {party.seats ?? '—'} seats
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 24, color: T.tl, marginBottom: 4 }}>+</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>Party {slot}</div>
                </>
              )}
            </div>
          </motion.div>
        ))}
        <div style={{ fontSize: 16, fontWeight: 800, color: T.tl, textAlign: 'center', flexShrink: 0 }}>VS</div>
      </div>

      {both && <StickyPills pills={availTabs} active={tab} onSelect={setTab} T={T} />}

      <ScrollArea>
        <div style={{ padding: '8px 14px' }}>

          {/* Empty state */}
          {!both && (
            <div style={{ textAlign: 'center', padding: '44px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>⚖️</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.th, marginBottom: 8 }}>Pick two parties above</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
                Compare polling, seats, leader ratings, and full policy positions side by side
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {both && tab === 'overview' && (
            <>
              {/* Gap bar */}
              <div style={{
                borderRadius: 14, padding: '13px 14px', marginBottom: 10,
                background: T.c0 || '#fff',
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: T.tl, marginBottom: 8 }}>
                  Poll gap
                </div>
                <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', marginBottom: 7 }}>
                  <div style={{ flex: partyA.pct, background: partyA.color }} />
                  <div style={{ flex: partyB.pct, background: partyB.color }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: partyA.color }}>{partyA.abbr} {partyA.pct}%</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.th }}>
                    {Math.abs(partyA.pct - partyB.pct)}pt {partyA.pct > partyB.pct ? partyA.name : partyB.name} lead
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: partyB.color }}>{partyB.abbr} {partyB.pct}%</div>
                </div>
              </div>

              {/* Head-to-head stats */}
              <SectionLabel T={T}>Head-to-head</SectionLabel>
              <H2HRow T={T} label="Poll %" valA={`${partyA.pct}%`} valB={`${partyB.pct}%`} colorA={partyA.color} colorB={partyB.color} winnerA={partyA.pct > partyB.pct} />
              <H2HRow T={T} label="Seats" valA={partyA.seats ?? '—'} valB={partyB.seats ?? '—'} colorA={partyA.color} colorB={partyB.color} winnerA={(partyA.seats || 0) > (partyB.seats || 0)} />
              <H2HRow T={T} label="Weekly" valA={`${partyA.change > 0 ? '+' : ''}${partyA.change}pt`} valB={`${partyB.change > 0 ? '+' : ''}${partyB.change}pt`} colorA={partyA.color} colorB={partyB.color} winnerA={partyA.change > partyB.change} />
              {leaderA && leaderB && (
                <H2HRow T={T} label="Leader" valA={`${leaderA.net >= 0 ? '+' : ''}${leaderA.net}`} valB={`${leaderB.net >= 0 ? '+' : ''}${leaderB.net}`} colorA={partyA.color} colorB={partyB.color} winnerA={leaderA.net > leaderB.net} />
              )}

              {/* Leader names */}
              {(leaderA || leaderB) && (
                <>
                  <SectionLabel T={T}>Leaders</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[{ leader: leaderA, party: partyA }, { leader: leaderB, party: partyB }].map(({ leader, party }, i) => (
                      <div key={i} style={{
                        borderRadius: 12, padding: '11px 12px',
                        background: T.c0 || '#fff',
                        border: `1px solid ${party?.color || T.cardBorder || 'rgba(0,0,0,0.07)'}28`,
                        textAlign: 'center',
                      }}>
                        {leader ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 800, color: party?.color }}>{leader.name}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: leader.net >= 0 ? '#02A95B' : '#E4003B', marginTop: 4 }}>
                              {leader.net >= 0 ? '+' : ''}{leader.net}
                            </div>
                            <div style={{ fontSize: 13, color: T.tl, marginTop: 2 }}>Net approval</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: T.tl }}>No leader data</div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Policy previews */}
              {['immigration', 'economy', 'nhs'].map(topic => {
                const textA = leaderA?.[topic] || pledgesA?.[topic]?.[0]?.pledge
                const textB = leaderB?.[topic] || pledgesB?.[topic]?.[0]?.pledge
                if (!textA && !textB) return null
                return (
                  <div key={topic} style={{ marginBottom: 10 }}>
                    <SectionLabel T={T}>{topic} · preview</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[{ text: textA, party: partyA }, { text: textB, party: partyB }].map(({ text, party }, i) => (
                        <div key={i} style={{
                          borderRadius: 12, padding: '11px 12px',
                          background: T.c0 || '#fff',
                          border: `1px solid ${party?.color || T.cardBorder || 'rgba(0,0,0,0.07)'}20`,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: party?.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                            {party?.abbr}
                          </div>
                          <div style={{
                            fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.55,
                            display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {text || 'No data'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* ── POLICY TABS ── */}
          {both && tab !== 'overview' && (
            <>
              <SectionLabel T={T}>{POLICY_TOPICS.find(t => t.key === tab)?.label} · side by side</SectionLabel>

              {/* Leader full policy text */}
              {(leaderA?.[tab] || leaderB?.[tab]) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[{ leader: leaderA, party: partyA }, { leader: leaderB, party: partyB }].map(({ leader, party }, i) => (
                    <div key={i} style={{
                      borderRadius: 12, padding: '12px 12px',
                      background: T.c0 || '#fff',
                      border: `1px solid ${party?.color || T.cardBorder || 'rgba(0,0,0,0.07)'}28`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: party?.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        {party?.name}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6 }}>
                        {leader?.[tab] || 'No position data available'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Manifesto pledges side by side */}
              {(pledgesA?.[tab]?.length || pledgesB?.[tab]?.length) > 0 && (
                <>
                  <SectionLabel T={T}>Manifesto pledges</SectionLabel>
                  {Array.from({ length: Math.max(pledgesA?.[tab]?.length || 0, pledgesB?.[tab]?.length || 0) }).map((_, i) => {
                    const pA = pledgesA?.[tab]?.[i]
                    const pB = pledgesB?.[tab]?.[i]
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                        {[{ pledge: pA, party: partyA }, { pledge: pB, party: partyB }].map(({ pledge, party }, j) => (
                          <div key={j} style={{
                            borderRadius: 10, padding: '10px 10px',
                            background: pledge ? `${party?.color}0c` : T.c1 || 'rgba(0,0,0,0.03)',
                            border: `1px solid ${party?.color || T.cardBorder || 'rgba(0,0,0,0.07)'}${pledge ? '28' : '10'}`,
                            minHeight: 50,
                          }}>
                            {pledge && (
                              <>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: party?.color, flexShrink: 0, marginTop: 5 }} />
                                  <div style={{ fontSize: 13, fontWeight: 500, color: T.tm, lineHeight: 1.55 }}>{pledge.pledge}</div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginTop: 4, paddingLeft: 11 }}>{pledge.source}</div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </>
              )}
            </>
          )}

          <div style={{ height: 40 }} />
        </div>
      </ScrollArea>
    </div>
  )
}
