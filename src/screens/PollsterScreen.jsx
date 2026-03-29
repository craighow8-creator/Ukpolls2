import { ScrollArea, haptic } from '../components/ui'
import { POLLSTER_INFO } from '../utils/pollsterInfo'

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

function PollRow({ T, poll, onClick }) {
  const toplines = PARTY_KEYS.filter((k) => poll?.[k] != null).slice(0, 5)

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 8,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{poll.date || poll.fieldwork || 'Undated poll'}</div>
          {(poll.sample || poll.method) && (
            <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 3 }}>
              {[poll.sample ? `Sample ${poll.sample}` : null, poll.method || null].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>Open →</div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
        {toplines.map((k) => (
          <div key={k} style={{ fontSize: 13, fontWeight: 700, color: PARTY_COLORS[k] }}>
            {k.toUpperCase()} {poll[k]}%
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PollsterScreen({ T, pollster, polls = [], nav }) {
  const info = POLLSTER_INFO?.[pollster]
  const pollsterPolls = (polls || []).filter((p) => p.pollster === pollster)

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
          {pollster || 'Pollster'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4, textAlign: 'center' }}>
          {pollsterPolls.length} poll{pollsterPolls.length === 1 ? '' : 's'} in database
        </div>
      </div>

      <ScrollArea>
        {info && (
          <div
            style={{
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 12,
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <SectionLabel T={T}>About this pollster</SectionLabel>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.th, textAlign: 'center', marginBottom: 6 }}>
              {info.summary}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, lineHeight: 1.7, whiteSpace: 'pre-line', textAlign: 'center' }}>
              {info.body}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginTop: 10, textAlign: 'center' }}>
              Source: {info.source}
            </div>
          </div>
        )}

        <SectionLabel T={T}>Recent polls</SectionLabel>

        {pollsterPolls.length > 0 ? (
          pollsterPolls.map((poll, i) => (
            <PollRow
              key={i}
              T={T}
              poll={poll}
              onClick={() => {
                haptic(6)
                nav('pollDetail', { poll })
              }}
            />
          ))
        ) : (
          <div
            style={{
              borderRadius: 12,
              padding: '14px',
              background: T.c0,
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              textAlign: 'center',
              fontSize: 14,
              color: T.tl,
            }}
          >
            No polls loaded yet for this pollster.
          </div>
        )}

        <div
          style={{
            borderRadius: 14,
            padding: '14px 16px',
            marginTop: 12,
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <SectionLabel T={T}>Next stage</SectionLabel>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, lineHeight: 1.7, textAlign: 'center' }}>
            This screen should later add proper methodology fields, BPC status, commissioner patterns, and historical pollster comparison once live ingestion is wired.
          </div>
        </div>

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}