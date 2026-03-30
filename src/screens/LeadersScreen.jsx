import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { haptic, StickyPills } from '../components/ui'
import { PortraitAvatar } from '../utils/portraits'
import { InfoButton } from '../components/InfoGlyph'

const TAP = {
  whileTap: { opacity: 0.76, scale: 0.992 },
  transition: { duration: 0.08 },
}

const TABS = [
  { key: 'ranked', label: 'Ranked' },
  { key: 'cards', label: 'Cards' },
]

function NetBadge({ net, large = false }) {
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

function Badge({ children, color, subtle = false }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color,
        background: subtle ? `${color}12` : `${color}1F`,
        border: `1px solid ${color}2B`,
        borderRadius: 999,
        padding: '4px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function SectionLabel({ children, T }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.tl,
        marginBottom: 10,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function ScrollAwayHeader({ T, leaderCount, topLeader }) {
  return (
    <div style={{ padding: '8px 16px 10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <Badge color={T.pr}>{leaderCount} leaders</Badge>
        {topLeader ? <Badge color={T.tl} subtle>Top net: {topLeader.name}</Badge> : null}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        Leaders
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
          width: '100%',
          marginTop: 6,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
          UK leaders · net approval · ranking
        </div>
        <InfoButton id="leaders_approval" T={T} size={20} />
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.tl,
          marginTop: 6,
          opacity: 0.85,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        Ipsos Political Monitor
      </div>
    </div>
  )
}

function StickyPillsBar({ T, tab, setTab }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8,
        background: T.sf,
        padding: '8px 16px 10px',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />
    </div>
  )
}

export default function LeadersScreen({ T, nav, leaders }) {
  const sorted = useMemo(() => [...(leaders || [])].sort((a, b) => b.net - a.net), [leaders])
  const [activeTab, setActiveTab] = useState('ranked')

  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const card = isDark ? 'rgba(12,20,30,0.97)' : '#ffffff'
  const border = T.cardBorder || 'rgba(0,0,0,0.08)'

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  const portraitSize = isDesktop ? 82 : 60
  const portraitRadius = portraitSize / 2

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} leaderCount={sorted.length} topLeader={sorted[0]} />
      <StickyPillsBar T={T} tab={activeTab} setTab={setActiveTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {activeTab === 'ranked' ? (
          <>
            <SectionLabel T={T}>Net approval ranking</SectionLabel>

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
                    marginBottom: 8,
                    background: card,
                    border: `1px solid ${l.color}22`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ height: 3, background: l.color, flexShrink: 0 }} />

                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 22,
                          fontSize: 15,
                          fontWeight: 800,
                          color: T.tl,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>

                      <PortraitAvatar name={l.name} color={l.color} size={56} radius={28} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: T.th,
                            lineHeight: 1.15,
                            marginBottom: 2,
                          }}
                        >
                          {l.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: l.color,
                          }}
                        >
                          {l.party}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <NetBadge net={l.net} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 4 }}>
                          {l.approve}% / {l.disapprove}%
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </>
        ) : null}

        {activeTab === 'cards' ? (
          <>
            <SectionLabel T={T}>Leader cards</SectionLabel>

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
                        padding: '14px 16px 14px',
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
                          marginBottom: 10,
                          gap: 10,
                        }}
                      >
                        <PortraitAvatar
                          name={l.name}
                          color={l.color}
                          size={portraitSize}
                          radius={portraitRadius}
                        />
                        <NetBadge net={l.net} />
                      </div>

                      <div
                        style={{
                          fontSize: isDesktop ? 16 : 14,
                          fontWeight: 800,
                          color: T.th,
                          lineHeight: 1.2,
                          marginBottom: 2,
                          textAlign: 'center',
                        }}
                      >
                        {l.name}
                      </div>

                      <div
                        style={{
                          fontSize: isDesktop ? 14 : 13,
                          fontWeight: 600,
                          color: l.color,
                          marginBottom: 12,
                          textAlign: 'center',
                        }}
                      >
                        {l.party}
                      </div>

                      <div
                        style={{
                          height: 5,
                          borderRadius: 999,
                          overflow: 'hidden',
                          display: 'flex',
                          background: border,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ width: `${l.approve}%`, height: '100%', background: '#02A95B' }} />
                        <div style={{ flex: 1 }} />
                        <div style={{ width: `${l.disapprove}%`, height: '100%', background: '#C8102E' }} />
                      </div>

                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
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
        ) : null}

        <div
          style={{
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 10,
            background: card,
            border: `1px solid ${border}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: T.th, marginBottom: 5, textAlign: 'center' }}>
            About net approval
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, lineHeight: 1.6, textAlign: 'center' }}>
            Net approval = % approve minus % disapprove. Tracked monthly by Ipsos Political Monitor since 1977.
          </div>
        </div>
      </div>
    </div>
  )
}