import React, { useMemo, useState } from 'react'
import { haptic } from './ui'

const RECENT_KEY = 'politiscope.compare.recentOpponent'

function safeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function readRecentOpponent(baseName) {
  try {
    const data = JSON.parse(localStorage.getItem(RECENT_KEY) || '{}')
    return data?.[baseName] || null
  } catch {
    return null
  }
}

function writeRecentOpponent(baseName, opponentName) {
  try {
    const data = JSON.parse(localStorage.getItem(RECENT_KEY) || '{}')
    localStorage.setItem(RECENT_KEY, JSON.stringify({ ...data, [baseName]: opponentName }))
  } catch {
    // Local storage is only a convenience for repeat users.
  }
}

function uniqueByName(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (!item?.name || seen.has(item.name)) return false
    seen.add(item.name)
    return true
  })
}

function recommendOpponents(baseParty, parties = []) {
  if (!baseParty) return []
  const pool = parties
    .filter((party) => party?.name && party.name !== baseParty.name && party.name !== 'Other')
    .sort((a, b) => safeNumber(b.pct) - safeNumber(a.pct))

  const recentName = readRecentOpponent(baseParty.name)
  const recent = pool.find((party) => party.name === recentName)
  const nearest = [...pool].sort(
    (a, b) => Math.abs(safeNumber(a.pct) - safeNumber(baseParty.pct)) - Math.abs(safeNumber(b.pct) - safeNumber(baseParty.pct)),
  )
  const movers = [...pool].sort((a, b) => Math.abs(safeNumber(b.change)) - Math.abs(safeNumber(a.change)))

  return uniqueByName([
    recent,
    ...nearest.slice(0, 2),
    ...pool.slice(0, 3),
    movers[0],
  ]).slice(0, 3)
}

function contextLabel(area) {
  if (!area || area === 'overview') return 'Overview'
  return area === 'nhs' ? 'NHS' : area.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

export default function CompareLauncherSheet({
  T,
  open,
  baseParty,
  parties = [],
  contextArea = 'overview',
  fromScreen = 'party',
  onClose,
  onLaunch,
}) {
  const [showAll, setShowAll] = useState(false)
  const recommended = useMemo(() => recommendOpponents(baseParty, parties), [baseParty, parties])
  const fullList = useMemo(
    () =>
      parties
        .filter((party) => party?.name && party.name !== baseParty?.name && party.name !== 'Other')
        .sort((a, b) => safeNumber(b.pct) - safeNumber(a.pct)),
    [baseParty, parties],
  )
  const options = showAll ? fullList : recommended
  const sheetSurface = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
    ? '#111B22'
    : '#FFFFFF'

  if (!open || !baseParty) return null

  const launch = (opponent) => {
    if (!opponent) return
    haptic(8)
    writeRecentOpponent(baseParty.name, opponent.name)
    onLaunch?.({
      baseParty,
      opponent,
      contextArea,
      fromScreen,
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(3, 18, 27, 0.52)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: '22px 22px 18px 18px',
          background: sheetSurface,
          border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          boxShadow: '0 22px 60px rgba(2, 12, 20, 0.34)',
          padding: '16px 16px 14px',
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            borderRadius: 999,
            background: T.cardBorder || 'rgba(0,0,0,0.14)',
            margin: '0 auto 14px',
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 850,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: baseParty.color,
              marginBottom: 6,
            }}
          >
            Compare with
          </div>
          <div style={{ fontSize: 22, fontWeight: 850, color: T.th, letterSpacing: '-0.03em' }}>
            {baseParty.name}
          </div>
          <div style={{ fontSize: 13, fontWeight: 650, color: T.tl, marginTop: 5 }}>
            Opens Compare on {contextLabel(contextArea)}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {options.map((party) => (
            <button
              key={party.name}
              onClick={() => launch(party)}
              style={{
                border: `1px solid ${party.color}28`,
                background: `${party.color}0F`,
                borderRadius: 14,
                padding: '12px 13px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 10,
                color: T.th,
                textAlign: 'left',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 850, color: T.th }}>
                  {party.name}
                </span>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.tl, marginTop: 2 }}>
                  {party.pct ?? '—'}% · {party.seats ?? '—'} seats
                </span>
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 850,
                  color: party.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Compare
              </span>
            </button>
          ))}
        </div>

        {!showAll ? (
          <button
            onClick={() => {
              haptic(5)
              setShowAll(true)
            }}
            style={{
              width: '100%',
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              background: T.sf || 'rgba(0,0,0,0.03)',
              color: T.th,
              borderRadius: 14,
              padding: '11px 12px',
              fontSize: 14,
              fontWeight: 800,
              marginTop: 8,
              cursor: 'pointer',
            }}
          >
            Choose another…
          </button>
        ) : null}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            color: T.tl,
            fontSize: 13,
            fontWeight: 800,
            marginTop: 10,
            padding: '8px 0 2px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
