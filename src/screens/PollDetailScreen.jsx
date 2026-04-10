import React from 'react'
import { haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { formatUKDate } from '../utils/date'

const PARTY_KEYS = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp']

const PARTY_COLORS = {
  ref: '#12B7D4',
  lab: '#E4003B',
  con: '#0087DC',
  grn: '#02A95B',
  ld: '#FAA61A',
  rb: '#1A4A9E',
  snp: '#C4922A',
}

const PARTY_NAMES = {
  ref: 'Reform UK',
  lab: 'Labour',
  con: 'Conservative',
  grn: 'Green',
  ld: 'Liberal Democrat',
  rb: 'Restore Britain',
  snp: 'SNP',
}

const PARTY_LABELS = {
  ref: 'REF',
  lab: 'LAB',
  con: 'CON',
  grn: 'GRN',
  ld: 'LD',
  rb: 'RB',
  snp: 'SNP',
}

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/Â·/g, '·').replace(/\s+/g, ' ').trim()
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const raw = String(value).replace(/%/g, '').replace(/,/g, '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function displayPrimaryDate(poll) {
  return formatUKDate(poll?.publishedAt) || formatUKDate(poll?.fieldworkEnd) || formatUKDate(poll?.date) || 'Date unavailable'
}

function displayFieldwork(poll) {
  const start = formatUKDate(poll?.fieldworkStart)
  const end = formatUKDate(poll?.fieldworkEnd)
  const fallback = formatUKDate(poll?.date || poll?.fieldwork || poll?.fieldworkDate)

  if (start && end && start !== end) return `${start} to ${end}`
  if (end) return end
  if (start) return start
  return fallback
}

function isImportedPoll(poll) {
  return !!cleanText(poll?.sourceUrl)
}

function getResults(poll) {
  return PARTY_KEYS
    .map((k) => {
      const pct = safeNumber(poll?.[k])
      if (pct == null) return null
      return {
        key: k,
        label: PARTY_LABELS[k],
        name: PARTY_NAMES[k],
        pct,
        color: PARTY_COLORS[k],
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct)
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

function SurfaceCard({ T, children, borderColor, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '14px 14px',
        background: T.c0,
        border: `1px solid ${borderColor || T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function InfoRow({ label, value, T, noBorder = false }) {
  if (!value) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 10,
        padding: '8px 0',
        borderBottom: noBorder ? 'none' : `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: T.tl,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: T.th,
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ScrollAwayHeader({ T, poll }) {
  const live = isImportedPoll(poll)

  return (
    <div style={{ padding: '8px 16px 10px' }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: -1,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        Poll detail
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
          {cleanText(poll?.pollster) || 'Unknown pollster'} · {displayPrimaryDate(poll)}
        </div>
        <InfoButton id="poll_average" T={T} size={20} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {live ? <Badge color={T.pr}>Live import</Badge> : <Badge color={T.tl} subtle>Archive</Badge>}
        {poll?.isBpcMember ? <Badge color={T.pr} subtle>BPC</Badge> : null}
      </div>
    </div>
  )
}

function ResultBars({ T, results }) {
  const max = Math.max(...results.map((r) => r.pct), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {results.map((r) => (
        <div
          key={r.key}
          style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 40px',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: r.color,
              textAlign: 'left',
            }}
          >
            {r.label}
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: T.c1 || 'rgba(0,0,0,0.06)',
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
              fontWeight: 800,
              color: r.color,
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

export default function PollDetailScreen({ T, poll, nav }) {
  if (!poll) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          color: T.tl,
          background: T.sf,
        }}
      >
        Poll not found
      </div>
    )
  }

  const results = getResults(poll)
  const leader = results[0]
  const live = isImportedPoll(poll)

  const pollster = cleanText(poll?.pollster)
  const fieldwork = displayFieldwork(poll)
  const published = formatUKDate(poll?.publishedAt || poll?.published || poll?.releaseDate)
  const sample = poll?.sample ? String(poll.sample) : ''
  const method = cleanText(poll?.method)
  const mode = cleanText(poll?.mode)
  const commissioner = cleanText(poll?.commissioner)
  const sourceText = cleanText(poll?.source || poll?.sourceLabel)
  const sourceUrl = cleanText(poll?.sourceUrl)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} poll={poll} />

      <div style={{ padding: '12px 16px 40px' }}>
        <SurfaceCard
          T={T}
          borderColor={`${leader?.color || T.pr || '#12B7D4'}33`}
          style={{ marginBottom: 12 }}
        >
          <SectionLabel T={T}>Pollster</SectionLabel>

          <div
            onClick={() => {
              if (!pollster) return
              haptic(6)
              nav('pollster', { pollster })
            }}
            style={{
              cursor: pollster ? 'pointer' : 'default',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: T.th,
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              {pollster || 'Unknown pollster'}
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.tl,
                marginTop: 6,
                textAlign: 'center',
              }}
            >
              Open pollster profile →
            </div>
          </div>
        </SurfaceCard>

        {results.length > 0 ? (
          <SurfaceCard
            T={T}
            borderColor={`${leader?.color || T.pr || '#12B7D4'}22`}
            style={{ marginBottom: 12 }}
          >
            <SectionLabel T={T}>Vote shares</SectionLabel>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            >
              <Badge color={leader.color}>{leader.name} leads</Badge>
              <Badge color={leader.color} subtle>{leader.pct}%</Badge>
            </div>

            <ResultBars T={T} results={results} />
          </SurfaceCard>
        ) : null}

        <SurfaceCard T={T} style={{ marginBottom: 12 }}>
          <SectionLabel T={T}>Poll information</SectionLabel>

          <InfoRow label="Fieldwork" value={fieldwork} T={T} />
          <InfoRow label="Published" value={published} T={T} />
          <InfoRow label="Sample" value={sample} T={T} />
          <InfoRow label="Method" value={method} T={T} />
          <InfoRow label="Mode" value={mode} T={T} />
          <InfoRow label="Commissioner" value={commissioner} T={T} />
          <InfoRow label="Source" value={sourceText || sourceUrl} T={T} noBorder />
        </SurfaceCard>

        {(sourceUrl || sourceText) ? (
          <SurfaceCard T={T}>
            <SectionLabel T={T}>Source note</SectionLabel>

            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T.tl,
                lineHeight: 1.7,
                textAlign: 'center',
              }}
            >
              {live
                ? 'This poll is being treated as a live-imported poll because it has a direct source link.'
                : 'This poll is currently being shown as an archive row rather than a fully live-imported record.'}
            </div>

            {(sourceText || sourceUrl) ? (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.th,
                  lineHeight: 1.6,
                  textAlign: 'center',
                  marginTop: 10,
                  wordBreak: 'break-word',
                }}
              >
                {sourceText || sourceUrl}
              </div>
            ) : null}
          </SurfaceCard>
        ) : null}
      </div>
    </div>
  )
}


