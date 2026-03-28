/**
 * CouncilScreen — standalone council detail screen.
 * Reached via nav('council', { name }). Back via goBack().
 */
import { motion } from 'framer-motion'
import { ScrollArea } from '../components/ui'
import { COUNCIL_PROFILES } from '../data/elections'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const CONTROL_COLORS = {
  Con: '#0087DC', Lab: '#E4003B', LD: '#FAA61A', Grn: '#02A95B',
  Reform: '#12B7D4', NOC: '#6b7280', SNP: '#C4922A', PC: '#3F8428', Ind: '#9CA3AF',
}

function Card({ T, color, children }) {
  return (
    <div style={{
      borderRadius: 14, marginBottom: 10,
      background: T.c0 || '#fff',
      border: `1px solid ${color ? `${color}28` : T.cardBorder || 'rgba(0,0,0,0.07)'}`,
      overflow: 'hidden', position: 'relative',
    }}>
      {color && <div style={{ height: 3, background: color }} />}
      <div style={{ padding: '13px 14px' }}>
        {children}
      </div>
    </div>
  )
}

export default function CouncilScreen({ T, name, goBack }) {
  const p = COUNCIL_PROFILES?.[name]
  const controlColor = p ? (CONTROL_COLORS[p.control] || T.tl) : T.tl

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: T.sf }}>

      {/* Header */}
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <motion.button
          {...TAP}
          onClick={goBack}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: T.c0 || '#fff',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', outline: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.th} strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
        </motion.button>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
          Elections / {name}
        </div>
      </div>

      <ScrollArea>
        <div style={{ padding: '0 14px 40px' }}>

          {!p ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.tl, fontSize: 14 }}>
              No profile for {name}
            </div>
          ) : (
            <>
              {/* Title */}
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: T.th, marginBottom: 3, lineHeight: 1.1 }}>
                {name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginBottom: 14 }}>
                {p.type} · {p.seats?.total || 0} seats · {p.seatsUp} up for election
              </div>

              {/* Control & leader */}
              <Card T={T} color={controlColor}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                    background: `${controlColor}1e`, color: controlColor, flexShrink: 0,
                  }}>
                    {p.control}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>{p.leader}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.tm, lineHeight: 1.65 }}>
                  {p.keyIssue}
                </div>
              </Card>

              {/* Seat composition bar */}
              {p.seats && (() => {
                const entries = Object.entries(p.seats)
                  .filter(([k]) => k !== 'total')
                  .sort(([, a], [, b]) => b - a)
                return entries.length > 0 ? (
                  <Card T={T}>
                    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: T.tl, marginBottom: 8 }}>
                      Council composition
                    </div>
                    <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
                      {entries.map(([party, seats], i) => {
                        const col = CONTROL_COLORS[party.charAt(0).toUpperCase() + party.slice(1)] || '#888'
                        const pct = Math.round(((seats || 0) / (p.seats?.total || 1)) * 100)
                        return pct > 0 ? <div key={i} style={{ width: `${pct}%`, height: '100%', background: col }} /> : null
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '4px 10px', flexWrap: 'wrap' }}>
                      {entries.map(([party, seats], i) => seats > 0 ? (
                        <span key={i} style={{
                          fontSize: 13, fontWeight: 800,
                          color: CONTROL_COLORS[party.charAt(0).toUpperCase() + party.slice(1)] || T.tl,
                        }}>
                          {party.toUpperCase()} {seats}
                        </span>
                      ) : null)}
                    </div>
                  </Card>
                ) : null
              })()}

              {/* Prediction */}
              <Card T={T}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: T.tl, marginBottom: 8 }}>
                  Prediction
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.tm, lineHeight: 1.7 }}>{p.prediction}</div>
              </Card>

              {/* Last election */}
              {p.lastElection && (
                <Card T={T}>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: T.tl, marginBottom: 6 }}>
                    Last election
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tm }}>{p.lastElection}</div>
                </Card>
              )}

              {/* Website */}
              {p.website && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 700, color: T.pr, textDecoration: 'none' }}
                  >
                    Visit council website →
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
