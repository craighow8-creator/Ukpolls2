import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea, haptic } from '../components/ui'
import { PortraitAvatar } from '../utils/portraits'

const TAP = {
  whileTap: { opacity: 0.76, scale: 0.992 },
  transition: { duration: 0.08 },
}

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

export default function LeadersScreen({ T, nav, leaders }) {
  const sorted = useMemo(
    () => [...(leaders || [])].sort((a, b) => b.net - a.net),
    [leaders]
  )

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
        height: '100%',
        overflow: 'hidden',
        background: T.sf,
      }}
    >
      <div style={{ padding: '20px 18px 0', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: -0.8,
            color: T.th,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          UK Leaders
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: T.tl,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          Listed by net approval
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: T.tl,
            marginTop: 2,
            textAlign: 'center',
          }}
        >
          Ipsos Political Monitor
        </div>
      </div>

      <ScrollArea>
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

        <div style={{ height: 32 }} />
      </ScrollArea>
    </div>
  )
}