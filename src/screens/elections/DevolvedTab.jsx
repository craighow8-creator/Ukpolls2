import React from 'react'
import { cleanText, formatElectionDate as formatDate } from '../../utils/electionsHelpers'
import { SectionLabel, SurfaceCard } from './ElectionsSurfaceCard'

function DevolvedPollGrid({ T, polls }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
      {polls.map((poll, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            background: `${poll.color}0e`,
            border: `1px solid ${poll.color}28`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: poll.color }}>{poll.party}</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: T.th,
              lineHeight: 1,
            }}
          >
            {poll.pct}%
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 2 }}>{poll.trend}</div>
        </div>
      ))}
    </div>
  )
}

function DevolvedInfoGrid({ T, rows }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
      {rows.filter((row) => cleanText(row.value)).map((row) => (
        <div
          key={row.label}
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            background: T.c1 || 'rgba(0,0,0,0.04)',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.tl }}>
            {row.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.th, lineHeight: 1.45, marginTop: 4 }}>
            {row.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function DevolvedNationCard({ T, nation }) {
  return (
    <SurfaceCard T={T} borderColor={`${nation.accent}28`} style={{ marginBottom: 12 }}>
      <SectionLabel T={T}>{nation.title}</SectionLabel>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.th, textAlign: 'center', lineHeight: 1.3 }}>
        {nation.institution}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: nation.accent, textAlign: 'center', marginTop: 4 }}>
        {nation.regionLabel}
      </div>

      <DevolvedInfoGrid
        T={T}
        rows={[
          { label: 'Voting system', value: nation.system },
          { label: 'Next election', value: formatDate(nation.nextElection) },
        ]}
      />

      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.tl, textAlign: 'center', marginTop: 14 }}>
        Political picture
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center', marginTop: 6 }}>
        {nation.politicalPicture}
      </div>

      <DevolvedPollGrid T={T} polls={nation.parties || []} />

      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <div
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            background: `${nation.accent}10`,
            border: `1px solid ${nation.accent}22`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: nation.accent, textAlign: 'center' }}>
            Recent signal
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.6, textAlign: 'center', marginTop: 5 }}>
            {nation.signal}
          </div>
        </div>
        <div
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            background: T.c1 || 'rgba(0,0,0,0.04)',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.tl, textAlign: 'center' }}>
            What to watch
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.6, textAlign: 'center', marginTop: 5 }}>
            {nation.watch}
          </div>
        </div>
      </div>
    </SurfaceCard>
  )
}

export default function DevolvedTab({ T, overview, metaLine, nations }) {
  return (
    <>
      <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>{overview.title}</SectionLabel>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.68, textAlign: 'center' }}>
            {overview.summary}
          </div>
          {metaLine ? (
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                fontWeight: 600,
                color: T.tl,
                textAlign: 'center',
                lineHeight: 1.45,
              }}
            >
              {metaLine}
            </div>
          ) : null}
        </div>
      </SurfaceCard>

      <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}22`} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>How devolved elections differ</SectionLabel>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
            Scotland and Wales use more proportional systems than Westminster. That means seat totals depend on overall vote share as well as local wins, making coalition or multi-party outcomes more likely.
          </div>
        </div>
      </SurfaceCard>

      {nations.map((nation) => (
        <DevolvedNationCard key={nation.key} T={T} nation={nation} />
      ))}
    </>
  )
}
