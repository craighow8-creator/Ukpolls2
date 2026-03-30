import { useMemo, useState } from 'react'
import { R } from '../constants'
import { StickyPills, haptic } from '../components/ui'
import Ring from '../components/Ring'
import { PortraitAvatar } from '../utils/portraits'
import { useSwipeNav } from '../utils/swipeNav'
import { InfoButton } from '../components/InfoGlyph'

const PILLS = [
  { key: 'bio', label: 'About' },
  { key: 'immigration', label: 'Immigration' },
  { key: 'economy', label: 'Economy' },
  { key: 'nhs', label: 'NHS' },
  { key: 'climate', label: 'Climate' },
]

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

function ScrollAwayHeader({ T, l, party, rankLabel }) {
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
        <Badge color={party?.color || l.color}>{party?.abbr || l.party}</Badge>
        {rankLabel ? <Badge color={T.tl} subtle>{rankLabel}</Badge> : null}
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
        {l.name}
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
          {l.role} · {l.party}
        </div>
        <InfoButton id="leader_profile" T={T} size={20} />
      </div>
    </div>
  )
}

function StickyPillsBar({ T, pills, tab, setTab }) {
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
      <StickyPills pills={pills} active={tab} onSelect={setTab} T={T} />
    </div>
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

export default function LeaderScreen({ T, lIdx, nav, leaders, parties }) {
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
  const rankLabel = curRank >= 0 ? `#${curRank + 1} by net approval` : null

  const netColor = l.net >= 0 ? '#02A95B' : '#C8102E'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} l={l} party={party} rankLabel={rankLabel} />
      <StickyPillsBar T={T} pills={pills} tab={tab} setTab={setTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        <div
          style={{
            borderRadius: 14,
            padding: '14px 14px 16px',
            background: T.c0,
            border: `1px solid ${(party?.color || l.color) + '28'}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 14,
              alignItems: 'center',
              marginBottom: 12,
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
                <style>{`@keyframes breathe{0%,100%{transform:scale(1);opacity:0.45}50%{transform:scale(1.04);opacity:0.85}}`}</style>
                <div
                  style={{
                    position: 'absolute',
                    inset: -7,
                    borderRadius: '50%',
                    border: `2px solid ${l.color}44`,
                    animation: 'breathe 2.8s ease-in-out infinite',
                  }}
                />
                <PortraitAvatar name={l.name} color={l.color} size={92} radius={46} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: T.tl,
                    marginBottom: 8,
                    lineHeight: 1.2,
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
                    marginBottom: 10,
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
                    fontSize: 28,
                    fontWeight: 800,
                    color: netColor,
                    lineHeight: 1,
                  }}
                >
                  {l.net >= 0 ? '+' : ''}
                  {l.net}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.tl,
                    marginTop: 4,
                    lineHeight: 1,
                  }}
                >
                  {l.approve}% approve · {l.disapprove}% disapprove
                </div>
              </div>
            </div>

            <div style={{ flexShrink: 0, justifySelf: 'end' }}>
              <Ring value={l.net} size={76} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: 18,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: prev ? prev.color : 'transparent',
                cursor: prev ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
              onClick={() => {
                if (!prev) return
                haptic(6)
                nav('leader', { lIdx: leaders.indexOf(prev) })
              }}
            >
              {prev ? `‹ ${prev.name.split(' ').pop()}` : '•'}
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: T.tl,
              }}
            >
              Approval ranking
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: next ? next.color : 'transparent',
                cursor: next ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
              onClick={() => {
                if (!next) return
                haptic(6)
                nav('leader', { lIdx: leaders.indexOf(next) })
              }}
            >
              {next ? `${next.name.split(' ').pop()} ›` : '•'}
            </div>
          </div>
        </div>

        {party && idx !== -1 ? (
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
        ) : null}

        <div
          style={{
            borderRadius: 14,
            padding: '18px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            marginBottom: 12,
          }}
        >
          <SectionLabel T={T}>
            {tab === 'bio' ? 'About' : pills.find((p) => p.key === tab)?.label || 'Detail'}
          </SectionLabel>

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
      </div>
    </div>
  )
}