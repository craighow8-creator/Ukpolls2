import React from 'react'
import { haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { POLLSTER_INFO } from '../utils/pollsterInfo'
import { formatUKDate } from '../utils/date'
import { canWinPollConflict, comparePollConflictPriority, getConflictDateMs, sourceTier } from '../shared/pollValidation'

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

function displayDate(poll) {
  return formatUKDate(poll?.date) || formatUKDate(poll?.fieldworkEnd) || formatUKDate(poll?.publishedAt) || 'Date unavailable'
}

function metaLine(poll) {
  const parts = [
    poll?.sample ? `Sample ${poll.sample}` : null,
    cleanText(poll?.method),
    cleanText(poll?.mode),
  ].filter(Boolean)

  return parts.join(' · ')
}

function sourceTypeLabel(poll) {
  if (!poll) return ''
  const explicit = cleanText(poll?.sourceType || poll?.source_type)
  if (explicit) return explicit

  const tier = sourceTier(poll)
  if (tier === 'direct') return 'Direct pollster/source row'
  if (tier === 'manual') return 'Imported/manual source row'
  if (tier === 'fallback') return 'Archive/tracker row'
  return ''
}

function pollSourceUrl(poll) {
  return cleanText(poll?.sourceUrl || poll?.source_url || poll?.url)
}

function buildTransparencyRows({ latestPoll, count, isBpcMember }) {
  const methodParts = [
    cleanText(latestPoll?.method),
    cleanText(latestPoll?.mode),
  ].filter(Boolean)
  const sourceText = cleanText(latestPoll?.source || latestPoll?.sourceTitle || latestPoll?.sourceName)
  const sourceUrl = pollSourceUrl(latestPoll)

  return [
    {
      label: 'BPC status',
      value: isBpcMember ? 'BPC member' : 'Not shown as BPC member',
    },
    latestPoll ? {
      label: 'Latest poll date',
      value: displayDate(latestPoll),
    } : null,
    {
      label: 'Polls stored',
      value: `${count} poll${count === 1 ? '' : 's'}`,
    },
    methodParts.length ? {
      label: 'Method or mode',
      value: methodParts.join(' · '),
    } : null,
    latestPoll?.sample ? {
      label: 'Sample size',
      value: String(latestPoll.sample),
    } : null,
    sourceTypeLabel(latestPoll) ? {
      label: 'Source type',
      value: sourceTypeLabel(latestPoll),
    } : null,
    sourceText || sourceUrl ? {
      label: 'Source',
      value: sourceText || sourceUrl,
      href: sourceUrl || null,
    } : null,
  ].filter(Boolean)
}

function isImportedPoll(poll) {
  const tier = sourceTier(poll)
  return tier === 'manual' || tier === 'direct'
}

function pollSortScore(poll) {
  return cleanText(poll?.date) || cleanText(poll?.fieldworkEnd) || cleanText(poll?.publishedAt) || cleanText(poll?.fieldworkStart) || ''
}

function comparePollRows(a, b) {
  const dateDiff = getConflictDateMs(b) - getConflictDateMs(a)
  if (dateDiff !== 0) return dateDiff

  const dateTextDiff = pollSortScore(b).localeCompare(pollSortScore(a))
  if (dateTextDiff !== 0) return dateTextDiff

  const priorityDiff = comparePollConflictPriority(a, b)
  if (priorityDiff !== 0) return priorityDiff

  return cleanText(a?.id || '').localeCompare(cleanText(b?.id || ''))
}

function getPollResults(poll) {
  return PARTY_KEYS
    .map((key) => {
      const pct = safeNumber(poll?.[key])
      if (pct == null) return null
      return {
        key,
        pct,
        label: PARTY_LABELS[key],
        color: PARTY_COLORS[key],
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

function SignalRow({ T, label, value, href }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        padding: '8px 0',
        borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: T.pr,
            textAlign: 'right',
            lineHeight: 1.35,
            overflowWrap: 'anywhere',
            textDecoration: 'none',
          }}
        >
          {value}
        </a>
      ) : (
        <div style={{ fontSize: 13, fontWeight: 700, color: T.th, textAlign: 'right', lineHeight: 1.35 }}>
          {value}
        </div>
      )}
    </div>
  )
}

function ScrollAwayHeader({ T, pollster, count, latestPoll }) {
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
        {pollster || 'Pollster'}
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
          {count} poll{count === 1 ? '' : 's'} stored
          {latestPoll ? ` · latest ${displayDate(latestPoll)}` : ''}
        </div>
        <InfoButton id="pollster_info" T={T} size={20} />
      </div>
    </div>
  )
}

function PollCard({ T, poll, nav }) {
  const results = getPollResults(poll).slice(0, 5)
  const live = isImportedPoll(poll)
  const leader = results[0]
  const sourceText = cleanText(poll?.source)
  const meta = metaLine(poll)

  return (
    <div
      onClick={() => {
        haptic(6)
        nav('pollDetail', { poll })
      }}
      style={{
        borderRadius: 14,
        padding: '14px 14px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${live ? (leader?.color || T.pr) + '33' : T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>
            {displayDate(poll)}
          </div>

          {meta ? (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: T.tl,
                marginTop: 4,
                lineHeight: 1.45,
              }}
            >
              {meta}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {live ? <Badge color={T.pr}>Imported</Badge> : <Badge color={T.tl} subtle>Archive</Badge>}
          {poll?.isBpcMember ? <Badge color={T.pr} subtle>BPC</Badge> : null}
        </div>
      </div>

      {results.length > 0 ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          {results.map((r) => (
            <div key={r.key} style={{ fontSize: 13, fontWeight: 800, color: r.color }}>
              {r.label} {r.pct}%
            </div>
          ))}
        </div>
      ) : null}

      {sourceText ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.tl,
            marginTop: 10,
            lineHeight: 1.45,
            textAlign: 'center',
          }}
        >
          {sourceText}
        </div>
      ) : null}

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: T.tl,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        Open poll detail →
      </div>
    </div>
  )
}

export default function PollsterScreen({ T, pollster, polls = [], nav }) {
  const info = POLLSTER_INFO?.[pollster]

  const pollsterPolls = [...(polls || [])]
    .filter((p) => cleanText(p.pollster) === cleanText(pollster))
    .sort(comparePollRows)

  const latestPoll = pollsterPolls[0] || null
  const latestLivePoll = pollsterPolls.find((p) => isImportedPoll(p)) || null
  const isBpcMember = latestPoll?.isBpcMember === true
  const importedCount = pollsterPolls.filter((p) => isImportedPoll(p)).length
  const transparencyRows = buildTransparencyRows({ latestPoll, count: pollsterPolls.length, isBpcMember })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader
        T={T}
        pollster={pollster}
        count={pollsterPolls.length}
        latestPoll={latestPoll}
      />

      <div style={{ padding: '12px 16px 40px' }}>
        <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
          <SectionLabel T={T}>Pollster profile</SectionLabel>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {isBpcMember ? <Badge color={T.pr}>BPC member</Badge> : <Badge color={T.tl} subtle>Pollster</Badge>}
            {importedCount > 0 ? <Badge color={T.pr} subtle>{importedCount} imported</Badge> : null}
            {latestLivePoll ? <Badge color={T.pr} subtle>Latest imported poll</Badge> : null}
          </div>

          {info ? (
            <>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: T.th,
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                {info.summary}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: T.tl,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                }}
              >
                {info.body}
              </div>

              {info.source ? (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: T.tl,
                    marginTop: 10,
                    textAlign: 'center',
                  }}
                >
                  Source: {info.source}
                </div>
              ) : null}
            </>
          ) : (
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T.tl,
                lineHeight: 1.7,
                textAlign: 'center',
              }}
            >
              This pollster page shows recent polling records, imported rows where available, and a clearer route into full poll details.
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}20`} style={{ marginBottom: 12 }}>
          <SectionLabel T={T}>Transparency signals</SectionLabel>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: T.tl,
              lineHeight: 1.6,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            These are the signals available in the current poll records, not a full methodology audit.
          </div>

          {transparencyRows.map((row) => (
            <SignalRow key={row.label} T={T} {...row} />
          ))}
        </SurfaceCard>

        {latestPoll ? (
          <>
            <SectionLabel T={T}>Latest poll</SectionLabel>
            <PollCard T={T} poll={latestPoll} nav={nav} />
          </>
        ) : null}

        <SectionLabel T={T}>Recent polls</SectionLabel>

        {pollsterPolls.length > 1 ? (
          pollsterPolls.slice(1).map((poll, i) => (
            <PollCard
              key={poll.id || `${poll.pollster}-${displayDate(poll)}-${i}`}
              T={T}
              poll={poll}
              nav={nav}
            />
          ))
        ) : pollsterPolls.length === 1 ? (
          <SurfaceCard T={T} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: T.tl }}>Only one poll currently stored for this pollster.</div>
          </SurfaceCard>
        ) : (
          <SurfaceCard T={T} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: T.tl }}>No polls loaded yet for this pollster.</div>
          </SurfaceCard>
        )}
      </div>
    </div>
  )
}
