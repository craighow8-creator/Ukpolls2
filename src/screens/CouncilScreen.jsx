// PROPER REDESIGN — CouncilScreen.jsx
import React from 'react'
import { ScrollArea } from '../components/ui'

export default function CouncilScreen({ data }) {
  const p = data
  const total = p.seatsTotal || 0
  const top = p.composition?.[0]
  const pct = top ? Math.round((top.seats / total) * 100) : 0

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh' }}>
      <div style={{ padding: '32px 20px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
          {p.verdict || p.control + ' council'}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          {p.region} · {p.type}
        </div>
      </div>

      <ScrollArea>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>

          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>
              {top?.party} dominate
            </div>
            <div style={{ marginBottom: 10 }}>
              {top?.seats} of {total} seats ({pct}%)
            </div>

            <div style={{
              height: 14,
              background: '#E5E7EB',
              borderRadius: 999,
              overflow: 'hidden',
              marginBottom: 16
            }}>
              <div style={{
                width: pct + '%',
                height: '100%',
                background: '#DC2626'
              }} />
            </div>

            {p.composition?.slice(1).map(r => (
              <div key={r.party} style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{r.party}</span>
                <span>{r.seats}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 20
          }}>
            <Stat label="Seats" value={total} />
            <Stat label="Seats up" value={p.seatsUp} />
            <Stat label="Control" value={p.control} />
            <Stat label="Next election" value={p.nextElectionYear} />
          </div>

          {p.prediction && (
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 20
            }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>
                Political Briefing
              </div>
              <div>{p.prediction}</div>
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900 }}>{value}</div>
    </div>
  )
}
