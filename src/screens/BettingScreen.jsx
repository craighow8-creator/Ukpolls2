import React from 'react'
import { ScrollArea } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'

function impliedProb(odds) {
  if (!odds) return 0
  const [n, d] = odds.split('/').map(Number)
  if (!d) return 0
  return Math.round((d / (n + d)) * 100)
}

function ProbRing({ prob, color, size = 80 }) {
  const r = (size - 10) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = (prob / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color + '22'} strokeWidth="8" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

function OddsCard({ T, odd, rank }) {
  const prob = impliedProb(odd.odds)

  return (
    <div
      style={{
        borderRadius: 14,
        padding: 18,
        background: T.c0,
        border: `1px solid ${odd.color}44`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {rank === 1 && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: 12,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 999,
            background: odd.color + '22',
            color: odd.color,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Favourite
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ProbRing prob={prob} color={odd.color} size={84} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: odd.color }}>{prob}%</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.th, marginBottom: 4 }}>{odd.name}</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: odd.color,
              lineHeight: 1,
            }}
          >
            {odd.odds}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
            Implied probability
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BettingScreen({ T, nav, betting }) {
  const odds = betting?.odds || []
  const totalProb = odds.reduce((s, o) => s + impliedProb(o.odds), 0)

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
          Betting Odds
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl }}>
            {betting?.market || 'Most seats at next General Election'}
          </div>

          <InfoButton id="betting_odds" T={T} size={18} />
        </div>
      </div>

      <div
        style={{
          margin: '12px 16px 0',
          borderRadius: 12,
          padding: '10px 16px',
          background: T.c0,
          border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          flexShrink: 0,
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
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
            Bookmaker overround (margin)
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.th }}>
            {totalProb}% total implied
          </div>
        </div>

        <div
          style={{
            height: 4,
            borderRadius: 999,
            background: T.c1 || 'rgba(0,0,0,0.08)',
            marginTop: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, ((totalProb - 100) / totalProb) * 100 + 50)}%`,
              height: '100%',
              background: '#E4003B',
              borderRadius: 999,
            }}
          />
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
          {betting?.source || 'Betfair · Oddschecker · Mar 2026'}
        </div>
      </div>

      <ScrollArea>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {odds.map((odd, i) => (
            <OddsCard key={i} T={T} odd={odd} rank={i + 1} />
          ))}
        </div>

        <div
          style={{
            borderRadius: 14,
            padding: '14px 16px',
            background: 'transparent',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginBottom: 8 }}>
            View live odds at
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <a
              href="https://www.betfair.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 700, color: T.pr, textDecoration: 'none' }}
            >
              Betfair →
            </a>
            <a
              href="https://www.oddschecker.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 700, color: T.pr, textDecoration: 'none' }}
            >
              Oddschecker →
            </a>
          </div>
        </div>

        <div style={{ height: 32 }} />
      </ScrollArea>
    </div>
  )
}

