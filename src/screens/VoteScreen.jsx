import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea } from '../components/ui'
import POTDWidget from '../components/POTDWidget'
import PartyIdentityMark from '../components/PartyIdentityMark'
import { WORKER, APP_TOKEN } from '../constants'
import { getMyVote, setMyVote, getDeviceId } from '../utils/helpers'
import { parseJsonResponse } from '../utils/http'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const PARTIES_VOTE = [
  { name: 'Reform UK', color: '#12B7D4' },
  { name: 'Labour', color: '#E4003B' },
  { name: 'Conservative', color: '#0087DC' },
  { name: 'Green', color: '#02A95B' },
  { name: 'Lib Dem', color: '#FAA61A' },
  { name: 'Restore Britain', color: '#1a4a9e' },
  { name: 'SNP', color: '#C4922A' },
  { name: 'Plaid Cymru', color: '#3F8428' },
  { name: 'Would not vote', color: '#6b7280' },
]

const POLL_MAP = {
  'Reform UK': 27,
  Labour: 19,
  Conservative: 18,
  Green: 16,
  'Lib Dem': 12,
  'Restore Britain': 7,
  SNP: 3,
}

export default function VoteScreen({ T, nav, meta, leaders = [] }) {
  const [myVote, setMyVoteState] = useState(getMyVote())
  const [votes, setVotes] = useState({})
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadVotes()
  }, [])

  const loadVotes = async () => {
    try {
      const r = await fetch(`${WORKER}/votes`, {
        headers: { 'X-App-Token': APP_TOKEN },
      })
      const data = await parseJsonResponse(r, 'Vote totals')
      setVotes(data)
      setTotal(
        Object.entries(data)
          .filter(([k]) => PARTIES_VOTE.find((p) => p.name === k))
          .reduce((s, [, v]) => s + Number(v), 0),
      )
    } catch {}
  }

  const castVote = async (party) => {
    const prev = getMyVote()
    setMyVote(party)
    setMyVoteState(party)

    try {
      await fetch(`${WORKER}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Token': APP_TOKEN,
        },
        body: JSON.stringify({
          party,
          deviceId: getDeviceId(),
          prevVote: prev,
        }),
      })
    } catch {}

    await loadVotes()
  }

  const mainParties = PARTIES_VOTE.slice(0, 6)
  const otherParties = PARTIES_VOTE.slice(6)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: T.sf,
      }}
    >
      <div style={{ padding: '18px 18px 0', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: -0.8,
            color: T.th,
            lineHeight: 1,
          }}
        >
          Your Vote
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
          Cast your vote · compare app users with polling
        </div>
      </div>

      <ScrollArea>
        <div style={{ padding: '12px 14px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 8,
            }}
          >
            {mainParties.map((p, i) => {
              const sel = p.name === myVote
              const pollPct = POLL_MAP[p.name]

              return (
                <motion.div
                  key={i}
                  {...TAP}
                  onClick={() => castVote(p.name)}
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: sel ? `${p.color}14` : T.c0 || '#fff',
                    border: `${sel ? 2 : 1}px solid ${sel ? p.color : `${p.color}28`}`,
                    cursor: 'pointer',
                    minHeight: 76,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    padding: '12px 8px',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: 3,
                      background: p.color,
                      width: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />

                  <PartyIdentityMark party={p.name} color={p.color} size={34} />

                  <div style={{ fontSize: 14, fontWeight: 800, color: sel ? p.color : T.th }}>
                    {p.name}
                  </div>

                  {sel ? (
                    <div style={{ fontSize: 13, fontWeight: 800, color: p.color }}>✓ Your vote</div>
                  ) : pollPct ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tl }}>Poll: {pollPct}%</div>
                  ) : null}
                </motion.div>
              )
            })}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 7,
              marginBottom: 16,
            }}
          >
            {otherParties.map((p, i) => {
              const sel = p.name === myVote
              return (
                <motion.div
                  key={i}
                  {...TAP}
                  onClick={() => castVote(p.name)}
                  style={{
                    borderRadius: 12,
                    padding: '9px 6px',
                    textAlign: 'center',
                    background: sel ? `${p.color}14` : T.c0 || '#fff',
                    border: `${sel ? 2 : 1}px solid ${sel ? p.color : `${p.color}20`}`,
                    cursor: 'pointer',
                  }}
                >
                  <PartyIdentityMark party={p.name} color={p.color} size={28} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: sel ? p.color : T.th }}>
                    {p.name}
                  </div>
                  {sel && <div style={{ fontSize: 13, fontWeight: 800, color: p.color, marginTop: 2 }}>✓</div>}
                </motion.div>
              )
            })}
          </div>

          {total > 0 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    color: T.pr,
                  }}
                >
                  {total.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: T.tl,
                    marginTop: 3,
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                  }}
                >
                  Total votes cast
                </div>
              </div>

              {PARTIES_VOTE.filter((p) => (votes[p.name] || 0) > 0 || POLL_MAP[p.name])
                .sort((a, b) => (votes[b.name] || 0) - (votes[a.name] || 0))
                .map((p, i) => {
                  const n = votes[p.name] || 0
                  const userPct = total > 0 ? Math.round((n / total) * 100) : 0
                  const pollPct = POLL_MAP[p.name] || 0
                  if (!n && !pollPct) return null

                  return (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 5,
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <PartyIdentityMark party={p.name} color={p.color} size={24} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.name}</span>
                        </span>

                        {n > 0 && pollPct > 0 && (
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 999,
                              background: `${p.color}16`,
                              color: p.color,
                            }}
                          >
                            {userPct > pollPct ? '▲' : '▼'} {Math.abs(userPct - pollPct)}pt vs polls
                          </span>
                        )}
                      </div>

                      {n > 0 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, width: 28 }}>App</div>
                          <div
                            style={{
                              flex: 1,
                              height: 10,
                              borderRadius: 999,
                              background: T.c1 || 'rgba(0,0,0,0.07)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${userPct}%`,
                                height: '100%',
                                background: p.color,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: p.color,
                              width: 32,
                              textAlign: 'right',
                            }}
                          >
                            {userPct}%
                          </div>
                        </div>
                      )}

                      {pollPct > 0 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, width: 28 }}>Poll</div>
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 999,
                              background: T.c1 || 'rgba(0,0,0,0.07)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${pollPct}%`,
                                height: '100%',
                                background: `${p.color}66`,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: T.tl,
                              width: 32,
                              textAlign: 'right',
                            }}
                          >
                            {pollPct}%
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
                .filter(Boolean)}
            </>
          )}

          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: T.tl,
              marginBottom: 8,
              marginTop: 6,
            }}
          >
            Poll of the day
          </div>

          <POTDWidget T={T} leaders={leaders} />

          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: T.tl,
              lineHeight: 1.45,
              textAlign: 'center',
              marginTop: 12,
              padding: '0 8px',
            }}
          >
            Party identity marks are shown for identification and editorial context only. Politiscope is independent and not endorsed by any political party.
          </div>

          <div style={{ height: 40 }} />
        </div>
      </ScrollArea>
    </div>
  )
}


