import { useState } from 'react'
import { ScrollArea, StickyPills } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'

const TABS = [
  { key: 'latest', label: 'Latest' },
  { key: 'all', label: 'All polls' },
  { key: 'pollsters', label: 'Pollsters' },
]

const PARTY_COLORS = {
  ref: '#12B7D4',
  lab: '#E4003B',
  con: '#0087DC',
  grn: '#02A95B',
  ld: '#FAA61A',
  rb: '#1a4a9e',
  snp: '#C4922A',
}

const PARTY_NAMES = {
  ref: 'Reform UK',
  lab: 'Labour',
  con: 'Conservative',
  grn: 'Green',
  ld: 'Lib Dem',
  rb: 'Restore Britain',
  snp: 'SNP',
}

function PollCard({ T, poll }) {
  const results = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp']
    .filter((k) => poll[k] != null)
    .map((k) => ({
      key: k,
      pct: poll[k],
      color: PARTY_COLORS[k],
      name: PARTY_NAMES[k],
    }))
    .sort((a, b) => b.pct - a.pct)

  const max = results[0]?.pct || 30

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 10,
        background: T.c0,
        border: `1px solid ${results[0]?.color || T.pr}33`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.th }}>{poll.pollster}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl }}>{poll.date}</div>
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 999,
            background: `${results[0]?.color}22`,
            color: results[0]?.color,
            flexShrink: 0,
          }}
        >
          {results[0]?.name?.split(' ')[0]} leads
        </div>
      </div>

      {results.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: r.color,
              width: 30,
              flexShrink: 0,
            }}
          >
            {r.name.split(' ')[0].slice(0, 3).toUpperCase()}
          </div>

          <div
            style={{
              flex: 1,
              height: 7,
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
              width: 26,
              textAlign: 'right',
            }}
          >
            {r.pct}%
          </div>
        </div>
      ))}
    </div>
  )
}

function PartyAverageStrip({ T, parties }) {
  const main = (parties || [])
    .filter((p) => p.name !== 'Other')
    .sort((a, b) => b.pct - a.pct)

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        paddingBottom: 4,
        marginBottom: 16,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {main.map((p, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12,
            padding: '14px 16px',
            minWidth: 110,
            flexShrink: 0,
            textAlign: 'center',
            background: T.c0,
            border: `1px solid ${p.color}44`,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: p.color,
              marginBottom: 6,
            }}
          >
            {p.abbr}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: p.color,
              lineHeight: 1,
            }}
          >
            {p.pct}%
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: p.change > 0 ? '#02A95B' : p.change < 0 ? '#C8102E' : T.tl,
              marginTop: 6,
            }}
          >
            {p.change > 0 ? '▲' : p.change < 0 ? '▼' : '—'} {Math.abs(p.change || 0)}pt
          </div>

          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.07)',
              marginTop: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(p.pct / 35) * 100}%`,
                height: '100%',
                background: p.color,
                borderRadius: 999,
              }}
            />
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.tl,
              marginTop: 4,
            }}
          >
            {p.seats || 0} seats
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PollsScreen({ T, parties, polls, meta }) {
  const [tab, setTab] = useState('latest')

  const mainParties = (parties || [])
    .filter((p) => p.name !== 'Other')
    .sort((a, b) => b.pct - a.pct)

  const allPolls = polls || []
  const recentPolls = allPolls.slice(0, 10)

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
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: -1,
            color: T.th,
          }}
        >
          Polls
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 2,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl }}>
            BPC member polls · 7-poll average
          </div>

          <InfoButton id="poll_average" T={T} size={18} />
        </div>

        {meta?.fetchDate && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: T.tl,
              marginTop: 3,
              opacity: 0.7,
            }}
          >
            Updated {meta.fetchDate} · BPC pollsters
          </div>
        )}
      </div>

      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {tab === 'latest' && (
          <>
            <PartyAverageStrip T={T} parties={mainParties} />
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
              Recent polls
            </div>
            {recentPolls.map((poll, i) => (
              <PollCard key={i} T={T} poll={poll} />
            ))}
          </>
        )}

        {tab === 'all' && (
          <>
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
              {allPolls.length} polls in database
            </div>
            {allPolls.map((poll, i) => (
              <PollCard key={i} T={T} poll={poll} />
            ))}
          </>
        )}

        {tab === 'pollsters' && (
          <>
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
              BPC member pollsters
            </div>

            {[
              'YouGov',
              'Techne',
              'More in Common',
              'Ipsos',
              'Survation',
              'Find Out Now',
              'Focaldata',
              'Redfield & Wilton',
              'Savanta',
              'BMG Research',
            ].map((name, i) => {
              const recent = allPolls.filter((p) => p.pollster === name).slice(0, 1)[0]

              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 8,
                    background: T.c0,
                    border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.th }}>{name}</div>
                    {recent && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
                        {recent.date}
                      </div>
                    )}
                  </div>

                  {recent && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                      {['ref', 'lab', 'con', 'grn', 'ld']
                        .filter((k) => recent[k] != null)
                        .map((k, j) => (
                          <div
                            key={j}
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: PARTY_COLORS[k],
                            }}
                          >
                            {k.toUpperCase()} {recent[k]}%
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}