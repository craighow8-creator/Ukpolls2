import { useState } from 'react'
import { ScrollArea, StickyPills, haptic } from '../components/ui'

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'recent', label: 'Recent' },
]

function ResultBar({ result, T }) {
  const max = Math.max(...(result || []).map((r) => r.pct || 0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
      {(result || []).map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: r.color,
              width: 28,
              flexShrink: 0,
            }}
          >
            {(r.party || '').split(' ')[0].slice(0, 3).toUpperCase()}
          </div>

          <div
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.07)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(r.pct / max) * 100}%`,
                height: '100%',
                background: r.color,
                borderRadius: 999,
              }}
            />
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: r.color,
              width: 28,
              textAlign: 'right',
            }}
          >
            {r.pct}%
          </div>

          {r.change != null && (
            <div
              style={{
                fontSize: 13,
                color: r.change > 0 ? '#02A95B' : '#C8102E',
                width: 24,
                textAlign: 'right',
              }}
            >
              {r.change > 0 ? '+' : ''}
              {r.change}
            </div>
          )}

          {r.winner && (
            <div style={{ fontSize: 13, fontWeight: 800, color: r.color }}>
              ✓
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ContestCard({ T, contest, isUpcoming }) {
  const [open, setOpen] = useState(false)
  const result = isUpcoming ? contest.result2024 : contest.result
  const accent = (isUpcoming ? contest.defColor : contest.winnerColor || contest.defColor) || '#888'

  return (
    <div
      onClick={() => {
        haptic(6)
        setOpen((o) => !o)
      }}
      style={{
        borderRadius: 14,
        padding: 18,
        marginBottom: 10,
        background: T.c0,
        border: `1px solid ${accent}44`,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `${accent}06`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: T.th,
                letterSpacing: -0.3,
                lineHeight: 1.1,
              }}
            >
              {contest.name}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 3 }}>
              {contest.region} · Leave {contest.leaveVote}%
            </div>
          </div>

          {isUpcoming ? (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: '#E4003B22',
                  color: '#E4003B',
                  textTransform: 'uppercase',
                }}
              >
                Upcoming
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 4 }}>
                {contest.dateLabel}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: `${contest.winnerColor}22`,
                  color: contest.winnerColor,
                }}
              >
                {contest.winner} {contest.gainLoss}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 4 }}>
                {contest.dateLabel}
              </div>
            </div>
          )}
        </div>

        {isUpcoming ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 999,
                background: `${contest.defColor}22`,
                color: contest.defColor,
              }}
            >
              {contest.defending} defend · {contest.majority2024?.toLocaleString()} maj
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.06)',
                color: T.tm,
              }}
            >
              {contest.swingNeeded}pt swing needed
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {contest.swing && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: `${contest.winnerColor}22`,
                  color: contest.winnerColor,
                }}
              >
                {contest.swing.pts}pt swing {contest.swing.from}→{contest.swing.to}
              </div>
            )}
            {contest.majority && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.06)',
                  color: T.tm,
                }}
              >
                Majority: {contest.majority.toLocaleString()}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: contest.verdictColor || T.tl,
            marginBottom: 6,
          }}
        >
          {contest.verdict}
        </div>

        <ResultBar result={result} T={T} />

        {open && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${T.c1 || 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T.tm,
                lineHeight: 1.7,
                marginBottom: 10,
              }}
            >
              {contest.context}
            </div>

            {contest.watchFor && (
              <div
                style={{
                  borderRadius: 14,
                  padding: '10px 14px',
                  background: T.c1 || 'rgba(0,0,0,0.05)',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: T.tl,
                    marginBottom: 4,
                  }}
                >
                  Watch for
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.tm }}>
                  {contest.watchFor}
                </div>
              </div>
            )}

            {contest.significance && (
              <div
                style={{
                  borderRadius: 14,
                  padding: '10px 14px',
                  background: T.c1 || 'rgba(0,0,0,0.05)',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: T.tl,
                    marginBottom: 4,
                  }}
                >
                  Significance
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.tm }}>
                  {contest.significance}
                </div>
              </div>
            )}

            {contest.odds && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {Object.entries(contest.odds).map(([party, odds], i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: T.c1 || 'rgba(0,0,0,0.05)',
                      color: T.th,
                    }}
                  >
                    {party.split(' ')[0]} {odds}
                  </div>
                ))}
              </div>
            )}

            {contest.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {contest.tags.map((tag, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: `${contest.tagColors?.[i] || T.pr}22`,
                      color: contest.tagColors?.[i] || T.pr,
                      letterSpacing: 0.4,
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            textAlign: 'right',
            fontSize: 13,
            color: T.tl,
            opacity: 0.55,
            marginTop: 8,
            fontWeight: 600,
          }}
        >
          {open ? '▲ less' : '▼ more'}
        </div>
      </div>
    </div>
  )
}

export default function ByElectionsScreen({ T, nav, byElections }) {
  const [tab, setTab] = useState('upcoming')
  const upcoming = (byElections?.upcoming || []).filter((b) => b.status !== 'skip')
  const recent = byElections?.recent || []

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
          By-elections
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
          Constituency contests · tap card for full detail
        </div>
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'upcoming' &&
          (upcoming.length > 0 ? (
            upcoming.map((c, i) => <ContestCard key={i} T={T} contest={c} isUpcoming />)
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: T.tl }}>
              No upcoming by-elections confirmed
            </div>
          ))}

        {tab === 'recent' && recent.map((c, i) => <ContestCard key={i} T={T} contest={c} isUpcoming={false} />)}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}