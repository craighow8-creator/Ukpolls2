import { haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { POLLSTER_INFO } from '../utils/pollsterInfo'

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

function formatUkDate(value) {
  const text = cleanText(value)
  if (!text) return ''

  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return text

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}-${month}-${year}`
}

function safeNumber(value) {
  if (value == null || value === '') return null
  const raw = String(value).replace(/%/g, '').replace(/,/g, '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function displayDate(poll) {
  return formatUkDate(poll?.publishedAt) || formatUkDate(poll?.fieldworkEnd) || formatUkDate(poll?.date) || 'Date unavailable'
}

function metaLine(poll) {
  const parts = [
    poll?.sample ? `Sample ${poll.sample}` : null,
    cleanText(poll?.method),
    cleanText(poll?.mode),
  ].filter(Boolean)

  return parts.join(' · ')
}

function isImportedPoll(poll) {
  return !!cleanText(poll?.sourceUrl)
}

function pollSortScore(poll) {
  return cleanText(poll?.publishedAt) || cleanText(poll?.fieldworkEnd) || cleanText(poll?.fieldworkStart) || cleanText(poll?.date) || ''
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
          {live ? <Badge color={T.pr}>Live import</Badge> : <Badge color={T.tl} subtle>Archive</Badge>}
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
    .sort((a, b) => pollSortScore(b).localeCompare(pollSortScore(a)))

  const latestPoll = pollsterPolls[0] || null
  const latestLivePoll = pollsterPolls.find((p) => isImportedPoll(p)) || null
  const isBpcMember = latestPoll?.isBpcMember === true
  const importedCount = pollsterPolls.filter((p) => isImportedPoll(p)).length

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
        latestPoll={latestLivePoll || latestPoll}
      />

      <div style={{ padding: '12px 16px 40px' }}>
        <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
          <SectionLabel T={T}>Pollster profile</SectionLabel>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {isBpcMember ? <Badge color={T.pr}>BPC member</Badge> : <Badge color={T.tl} subtle>Pollster</Badge>}
            {importedCount > 0 ? <Badge color={T.pr} subtle>{importedCount} live</Badge> : null}
            {latestLivePoll ? <Badge color={T.pr} subtle>Latest live poll</Badge> : null}
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
              This pollster page shows recent polling records, live imports where available, and a clearer route into full poll details.
            </div>
          )}
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
