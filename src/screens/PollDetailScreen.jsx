import { ScrollArea } from '../components/ui'

const PARTY_KEYS = ['ref', 'lab', 'con', 'grn', 'ld', 'rb', 'snp']

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

function SectionLabel({ children, T }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.06em',
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

function InfoRow({ label, value, T }) {
  if (!value) return null
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 10,
        padding: '8px 0',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: T.tl }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}

function getResults(poll) {
  return PARTY_KEYS
    .filter((k) => poll?.[k] != null)
    .map((k) => ({
      key: k,
      name: PARTY_NAMES[k],
      pct: poll[k],
      color: PARTY_COLORS[k],
    }))
    .sort((a, b) => b.pct - a.pct)
}

export default function PollDetailScreen({ T, poll, nav }) {
  if (!poll) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.tl }}>
        Poll not found
      </div>
    )
  }

  const results = getResults(poll)
  const leader = results[0]

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
      <div style={{ padding: '20px 18px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8, color: T.th, lineHeight: 1, textAlign: 'center' }}>
          Poll Detail
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4, textAlign: 'center' }}>
          {poll.pollster || 'Unknown pollster'}
        </div>
      </div>

      <ScrollArea>
        <div
          onClick={() => poll.pollster && nav('pollster', { pollster: poll.pollster })}
          style={{
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 12,
            background: T.c0,
            border: `1px solid ${leader?.color || T.pr}33`,
            cursor: poll.pollster ? 'pointer' : 'default',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, textAlign: 'center' }}>
            Pollster
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.th, textAlign: 'center' }}>
            {poll.pollster || 'Unknown'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 6, textAlign: 'center' }}>
            Open pollster profile →
          </div>
        </div>

        <div
          style={{
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 12,
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <SectionLabel T={T}>Poll information</SectionLabel>
          <InfoRow label="Fieldwork" value={poll.date || poll.fieldwork || poll.fieldworkDate} T={T} />
          <InfoRow label="Published" value={poll.publishedAt || poll.published || poll.releaseDate} T={T} />
          <InfoRow label="Sample" value={poll.sample ? String(poll.sample) : null} T={T} />
          <InfoRow label="Method" value={poll.method} T={T} />
          <InfoRow label="Mode" value={poll.mode} T={T} />
          <InfoRow label="Commissioned" value={poll.commissioner} T={T} />
          <InfoRow label="Source" value={poll.source || poll.sourceLabel || poll.sourceUrl} T={T} />
        </div>

        <div
          style={{
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 12,
            background: T.c0,
            border: `1px solid ${leader?.color || T.pr}22`,
          }}
        >
          <SectionLabel T={T}>Vote shares</SectionLabel>

          {results.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 10,
                padding: '9px 0',
                borderBottom: i < results.length - 1 ? `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: T.th }}>{r.name}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: r.color }}>
                {r.pct}%
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 10,
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <SectionLabel T={T}>Notes</SectionLabel>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, lineHeight: 1.7, textAlign: 'center' }}>
            This is the first pass of poll detail. Next stage should add previous poll comparison, commissioner/source links, and richer methodology notes from live data.
          </div>
        </div>

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}