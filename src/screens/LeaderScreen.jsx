import { useState } from 'react'
import { R } from '../constants'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import Ring from '../components/Ring'
import { InfoButton } from '../components/InfoGlyph'
import { PortraitAvatar } from '../utils/portraits'
import { useSwipeNav } from '../utils/swipeNav'

const PILLS = [
  { key: 'bio', label: 'About' },
  { key: 'immigration', label: 'Immigration' },
  { key: 'economy', label: 'Economy' },
  { key: 'nhs', label: 'NHS' },
  { key: 'climate', label: 'Climate' },
]

export default function LeaderScreen({ T, lIdx, nav, goBack, leaders, parties }) {
  const l = leaders?.[lIdx]
  const party = parties?.find((p) => p.name === l?.party)
  const [tab, setTab] = useState('bio')

  if (!l) return null

  const pills = PILLS.filter((pi) => pi.key === 'bio' || l[pi.key])
  const idx = parties?.indexOf(party)

  useSwipeNav({
    items: leaders,
    currentIdx: lIdx,
    onNavigate: (newIdx) => nav('leader', { lIdx: newIdx }),
  })

  const sorted = [...(leaders || [])].sort((a, b) => b.net - a.net)
  const curRank = sorted.findIndex((x) => x.name === l.name)
  const prev = curRank > 0 ? sorted[curRank - 1] : null
  const next = curRank < sorted.length - 1 ? sorted[curRank + 1] : null

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
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: -0.8,
                color: T.th,
                lineHeight: 1,
              }}
            >
              {l.name}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>
              {l.role} · {l.party}
            </div>
          </div>

          <div
            onClick={goBack}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              color: T.tl,
              fontSize: 18,
              cursor: 'pointer',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ×
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '6px 18px 8px',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr auto',
          gap: 12,
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            minWidth: 0,
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <style>{`@keyframes breathe{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.05);opacity:0.9}}`}</style>
            <div
              style={{
                position: 'absolute',
                inset: -7,
                borderRadius: '50%',
                border: `2px solid ${l.color}44`,
                animation: 'breathe 2.8s ease-in-out infinite',
              }}
            />
            <PortraitAvatar name={l.name} color={l.color} size={90} radius={45} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: T.tl,
                marginBottom: 6,
              }}
            >
              Net approval
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px 6px 8px',
                borderRadius: R.pill,
                background: `${party?.color || l.color}22`,
                color: party?.color || l.color,
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: party?.color || l.color,
                }}
              />
              {party?.abbr || l.party}
            </div>

            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: l.net >= 0 ? '#02A95B' : '#C8102E',
                lineHeight: 1.1,
              }}
            >
              {l.net >= 0 ? '+' : ''}
              {l.net} net
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minWidth: 0,
            gap: 8,
          }}
        >
          {prev ? (
            <div
              onClick={() => {
                haptic(6)
                nav('leader', { lIdx: leaders.indexOf(prev) })
              }}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: prev.color,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                whiteSpace: 'nowrap',
              }}
            >
              ‹ {prev.name.split(' ').pop()}
            </div>
          ) : (
            <div />
          )}

          {next ? (
            <div
              onClick={() => {
                haptic(6)
                nav('leader', { lIdx: leaders.indexOf(next) })
              }}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: next.color,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {next.name.split(' ').pop()} ›
            </div>
          ) : (
            <div />
          )}
        </div>

        <div style={{ flexShrink: 0, justifySelf: 'end' }}>
          <Ring value={l.net} size={72} />
        </div>
      </div>

      <StickyPills pills={pills} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {party && idx !== -1 && (
          <div
            onClick={() => {
              haptic(8)
              nav('party', { idx, from: 'leaders' })
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px 7px 9px',
              borderRadius: R.pill,
              background: `${party.color}18`,
              color: party.color,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 12,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: party.color,
              }}
            />
            {party.name} → {party.abbr} {party.pct}%
          </div>
        )}

        <div
          style={{
            borderRadius: 14,
            padding: '18px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: T.tm,
              lineHeight: 1.8,
            }}
          >
            {tab === 'bio' ? l.bio : l[tab]}
          </div>
        </div>

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}