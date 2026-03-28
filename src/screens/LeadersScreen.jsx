import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import { PortraitAvatar } from '../utils/portraits'

const TAP = {
  whileTap: { opacity: 0.76, scale: 0.992 },
  transition: { duration: 0.08 },
}

const TABS = [
  { key: 'ranking', label: 'Ranking' },
  { key: 'cards', label: 'Cards' },
]

function NetBadge({ net, large }) {
  const positive = net >= 0
  const color = positive ? '#02A95B' : '#C8102E'

  return (
    <div
      style={{
        fontSize: large ? 44 : 22,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color,
        lineHeight: 1,
      }}
    >
      {positive ? '+' : ''}
      {net}
    </div>
  )
}

function ApprovalPills({ approve, disapprove }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 999,
          background: '#D0F5E4',
          color: '#02A95B',
        }}
      >
        ✓ {approve}%
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 999,
          background: '#FAD5DB',
          color: '#C8102E',
        }}
      >
        ✗ {disapprove}%
      </div>
    </div>
  )
}

function LeaderRow({ T, l, onClick }) {
  return (
    <motion.div
      {...TAP}
      onClick={onClick}
      style={{
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${l.color}22`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PortraitAvatar name={l.name} color={l.color} size={44} radius={22} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.th, lineHeight: 1.15 }}>
            {l.name}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: l.color, marginTop: 3 }}>
            {l.party}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: l.net >= 0 ? '#02A95B' : '#C8102E' }}>
            {l.net >= 0 ? '+' : ''}
            {l.net}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.tl }}>net</div>
        </div>
      </div>

      <div
        style={{
          height: 6,
          borderRadius: 999,
          overflow: 'hidden',
          display: 'flex',
          background: T.cardBorder || 'rgba(0,0,0,0.08)',
          marginTop: 10,
        }}
      >
        <div style={{ width: `${l.approve}%`, height: '100%', background: '#02A95B' }} />
        <div style={{ flex: 1 }} />
        <div style={{ width: `${l.disapprove}%`, height: '100%', background: '#C8102E' }} />
      </div>
    </motion.div>
  )
}

export default function LeadersScreen({ T, nav, leaders }) {
  const [tab, setTab] = useState('ranking')

  const sorted = useMemo(
    () => [...(leaders || [])].sort((a, b) => b.net - a.net),
    [leaders]
  )

  const top = sorted[0]
  const rest = sorted.slice(1)

  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const card = isDark ? 'rgba(12,20,30,0.97)' : '#ffffff'
  const border = T.cardBorder || 'rgba(0,0,0,0.08)'

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
      <div style={{ padding: '20px 18px 0', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: -0.8,
            color: T.th,
            lineHeight: 1,
          }}
        >
          UK Leaders
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
          Net approval · Ipsos Political Monitor
        </div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'ranking' && (
          <>
            {top && (
              <motion.div
                {...TAP}
                onClick={() => {
                  haptic(8)
                  nav('leader', { lIdx: leaders.indexOf(top) })
                }}
                style={{
                  borderRadius: 16,
                  marginBottom: 10,
                  overflow: 'hidden',
                  background: card,
                  border: `1px solid ${top.color}28`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ height: 4, background: top.color }} />

                <div style={{ padding: '16px 18px 18px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 14,
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                      <PortraitAvatar name={top.name} color={top.color} size={60} radius={30} />
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            letterSpacing: '0.10em',
                            textTransform: 'uppercase',
                            color: T.tl,
                            marginBottom: 4,
                          }}
                        >
                          Highest approval
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: T.th,
                            letterSpacing: -0.4,
                            lineHeight: 1.1,
                          }}
                        >
                          {top.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: top.color,
                            marginTop: 3,
                          }}
                        >
                          {top.role} · {top.party}
                        </div>
                      </div>
                    </div>

                    <NetBadge net={top.net} large />
                  </div>

                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      overflow: 'hidden',
                      display: 'flex',
                      background: border,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ width: `${top.approve}%`, height: '100%', background: '#02A95B' }} />
                    <div style={{ flex: 1 }} />
                    <div style={{ width: `${top.disapprove}%`, height: '100%', background: '#C8102E' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#02A95B' }}>
                      Approve {top.approve}%
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#C8102E' }}>
                      Disapprove {top.disapprove}%
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ApprovalPills approve={top.approve} disapprove={top.disapprove} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>Full profile →</div>
                  </div>
                </div>
              </motion.div>
            )}

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: T.tl,
                marginBottom: 10,
                textAlign: 'center',
              }}
            >
              Full ranking
            </div>

            {rest.map((l, i) => {
              const lIdx = leaders.indexOf(l)
              return (
                <LeaderRow
                  key={i}
                  T={T}
                  l={l}
                  onClick={() => {
                    haptic(8)
                    nav('leader', { lIdx })
                  }}
                />
              )
            })}
          </>
        )}

        {tab === 'cards' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {sorted.map((l, i) => {
                const lIdx = leaders.indexOf(l)

                return (
                  <motion.div
                    key={i}
                    {...TAP}
                    onClick={() => {
                      haptic(8)
                      nav('leader', { lIdx })
                    }}
                    style={{
                      borderRadius: 14,
                      overflow: 'hidden',
                      gridColumn: i === sorted.length - 1 && sorted.length % 2 !== 0 ? 'span 2' : undefined,
                      background: card,
                      border: `1px solid ${l.color}22`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: 3, background: l.color, flexShrink: 0 }} />

                    <div
                      style={{
                        padding: '12px 14px 13px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <PortraitAvatar name={l.name} color={l.color} size={44} radius={22} />
                        <NetBadge net={l.net} />
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 800, color: T.th, lineHeight: 1.2, marginBottom: 2 }}>
                        {l.name}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: l.color, marginBottom: 10 }}>
                        {l.party}
                      </div>

                      <div
                        style={{
                          height: 5,
                          borderRadius: 999,
                          overflow: 'hidden',
                          display: 'flex',
                          background: border,
                          marginBottom: 7,
                        }}
                      >
                        <div style={{ width: `${l.approve}%`, height: '100%', background: '#02A95B' }} />
                        <div style={{ flex: 1 }} />
                        <div style={{ width: `${l.disapprove}%`, height: '100%', background: '#C8102E' }} />
                      </div>

                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 999,
                            background: '#D0F5E4',
                            color: '#02A95B',
                          }}
                        >
                          ✓ {l.approve}%
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 999,
                            background: '#FAD5DB',
                            color: '#C8102E',
                          }}
                        >
                          ✗ {l.disapprove}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        <div
          style={{
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 10,
            background: card,
            border: `1px solid ${border}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: T.th, marginBottom: 5 }}>
            About net approval
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6 }}>
            Net approval = % approve minus % disapprove. Tracked monthly by Ipsos Political Monitor since 1977.
          </div>
        </div>

        <div style={{ height: 32 }} />
      </ScrollArea>
    </div>
  )
}