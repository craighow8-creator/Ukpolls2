import React from 'react'
import { motion } from 'framer-motion'
import { GENERAL_2024 } from '../../data/electionsGeneral'
import { formatElectionDate as formatDate } from '../../utils/electionsHelpers'
import { Chip, SectionLabel, StatCard, SurfaceCard, TAP } from './ElectionsSurfaceCard'

function GeneralResultBars({ T }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
      }}
    >
      {GENERAL_2024.map((row) => (
        <div
          key={row.party}
          style={{
            borderRadius: 12,
            padding: '12px 12px',
            background: T.c0,
            border: `1px solid ${row.color}28`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: row.color, textTransform: 'uppercase' }}>
              {row.party}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: row.color }}>
              {row.seats} seats
            </div>
          </div>

          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: `${row.color}18`,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: `${Math.max(6, row.vote)}%`,
                height: '100%',
                background: row.color,
                borderRadius: 999,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: T.tl }}>Vote share</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.th }}>{row.vote}%</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function GeneralTab({ T, nextGeneralDate, generalDays, generalExplainMode, setGeneralExplainMode }) {
  return (
    <>
      <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>Next general election</SectionLabel>

        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: T.th,
            textAlign: 'center',
            lineHeight: 1.05,
          }}
        >
          {nextGeneralDate ? `${generalDays} days to go` : 'Due by August 2029'}
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: T.pr || '#12B7D4',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          {nextGeneralDate ? formatDate(nextGeneralDate) : 'The next UK general election must happen by August 2029'}
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: T.tl,
            textAlign: 'center',
            lineHeight: 1.65,
            marginTop: 8,
          }}
        >
          Election to choose the 650 MPs in the House of Commons. The party that can command a majority forms the government.
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <Chip color={T.pr || '#12B7D4'}>650 constituencies</Chip>
          <Chip color={T.pr || '#12B7D4'}>650 MPs</Chip>
          <Chip color={T.pr || '#12B7D4'}>326 for majority</Chip>
        </div>
      </SurfaceCard>

      <SurfaceCard T={T} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>What is FPTP?</SectionLabel>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <motion.button
            {...TAP}
            onClick={() => setGeneralExplainMode('simple')}
            style={{
              border: `1px solid ${generalExplainMode === 'simple' ? (T.pr || '#12B7D4') : (T.cardBorder || 'rgba(0,0,0,0.12)')}`,
              background: generalExplainMode === 'simple' ? `${T.pr || '#12B7D4'}18` : T.c0,
              color: generalExplainMode === 'simple' ? (T.pr || '#12B7D4') : T.th,
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Explain simply
          </motion.button>

          <motion.button
            {...TAP}
            onClick={() => setGeneralExplainMode('eli5')}
            style={{
              border: `1px solid ${generalExplainMode === 'eli5' ? (T.pr || '#12B7D4') : (T.cardBorder || 'rgba(0,0,0,0.12)')}`,
              background: generalExplainMode === 'eli5' ? `${T.pr || '#12B7D4'}18` : T.c0,
              color: generalExplainMode === 'eli5' ? (T.pr || '#12B7D4') : T.th,
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Explain like I’m 5
          </motion.button>
        </div>

        {generalExplainMode === 'simple' ? (
          <>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: T.th,
                textAlign: 'center',
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              First Past the Post means local winners take the seat
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                ['1. One seat, one winner', 'The country is split into 650 constituencies. Each one elects one MP.'],
                ['2. Most votes wins', 'The candidate who comes first wins the seat, even without getting more than half the votes.'],
                ['3. Winner takes all', 'Coming second wins nothing in that constituency. Only first place counts.'],
                ['4. Forming government', 'The party with enough MPs to control the Commons forms the government.'],
              ].map(([title, body]) => (
                <div key={title} style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, textAlign: 'center' }}>
                    {title}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
                    {body}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: T.th,
                textAlign: 'center',
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              Imagine the UK as one giant school with 650 classrooms
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Each classroom gets to pick one winner. Everyone gets one sticker to vote for who they want.',
                'Whoever gets the most stickers in that classroom wins — even if most people wanted someone else.',
                'There are no silver medals. If your person comes second, your stickers do not win part of the seat.',
                'After all 650 classrooms pick a winner, the team with the most winners gets to run the school.',
              ].map((body) => (
                <div key={body} style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
                    {body}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SurfaceCard>

      <SurfaceCard T={T} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>FPTP vs PR</SectionLabel>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <div
            style={{
              borderRadius: 12,
              padding: '12px 12px',
              background: T.c0,
              border: `1px solid ${(T.pr || '#12B7D4')}28`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: T.tl,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              First Past the Post
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
              Fast, simple and local. But it can exaggerate winners and punish parties whose support is spread thinly.
            </div>
          </div>

          <div
            style={{
              borderRadius: 12,
              padding: '12px 12px',
              background: T.c0,
              border: `1px solid #02A95B28`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: T.tl,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              Proportional Representation
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
              Usually fairer to national vote share. But it is less tied to one simple local winner in each constituency.
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: T.tl,
            lineHeight: 1.6,
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          Under FPTP, the national vote share and the number of seats won can be very different.
        </div>
      </SurfaceCard>

      <SurfaceCard T={T} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>Last general election result</SectionLabel>
        <GeneralResultBars T={T} />
      </SurfaceCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <StatCard T={T} label="Majority line" value="326" color={T.pr || '#12B7D4'} />
        <StatCard T={T} label="Total seats" value="650" color={T.pr || '#12B7D4'} />
        <StatCard T={T} label="Labour seats" value="412" color="#E4003B" />
        <StatCard T={T} label="Conservative seats" value="121" color="#0087DC" />
      </div>

      <SurfaceCard T={T}>
        <SectionLabel T={T}>Why this matters now</SectionLabel>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
          A party can poll strongly nationally and still disappoint in seats if its support is spread in the wrong places. Under FPTP, geography matters as much as popularity.
        </div>
      </SurfaceCard>
    </>
  )
}
