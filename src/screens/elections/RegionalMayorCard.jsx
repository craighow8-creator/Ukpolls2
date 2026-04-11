import React from 'react'
import { motion } from 'framer-motion'
import {
  deriveRegionalMayorSignals,
  describeRegionalMayorPoliticalCase,
  formatElectionDate as formatDate,
} from '../../utils/electionsHelpers'
import { Chip, SurfaceCard, TAP } from './ElectionsSurfaceCard'

export default function RegionalMayorCard({ T, mayor, isExpanded, onToggle }) {
  const signals = deriveRegionalMayorSignals(mayor)
  const politicalCase = describeRegionalMayorPoliticalCase(mayor)

  return (
    <SurfaceCard T={T} borderColor={`${mayor.color}28`} style={{ marginBottom: 8, padding: '12px 14px' }}>
      <motion.button
        {...TAP}
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'inherit',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.th, lineHeight: 1.3 }}>{mayor.name}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: mayor.color, lineHeight: 1.45, marginTop: 4 }}>
              {mayor.holder}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <Chip color={mayor.color}>{mayor.party}</Chip>
              {signals.slice(0, 2).map((signal) => (
                <span
                  key={signal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.tl,
                    background: T.c1 || 'rgba(0,0,0,0.04)',
                    border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                    borderRadius: 999,
                    padding: '4px 8px',
                  }}
                >
                  {signal}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: T.th, lineHeight: 1.45, marginTop: 6, opacity: 0.92 }}>
              {mayor.note}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.tl, lineHeight: 1.4, marginTop: 6, letterSpacing: '0.02em' }}>
              Elected {formatDate(mayor.electedDate)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
          <span
            style={{
              border: `1px solid ${mayor.color}28`,
              background: isExpanded ? `${mayor.color}18` : T.c0,
              color: mayor.color,
              borderRadius: 999,
              padding: '6px 11px',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {isExpanded ? 'Hide' : 'More'}
          </span>
        </div>
      </motion.button>

      {isExpanded ? (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            borderRadius: 10,
            background: T.c1 || 'rgba(0,0,0,0.04)',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <div
            style={{
              borderRadius: 10,
              padding: '10px 12px',
              background: `${mayor.color}10`,
              border: `1px solid ${mayor.color}24`,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: mayor.color,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Why it matters now
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.6, textAlign: 'center' }}>
              {mayor.whyItMattersNow || politicalCase}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {signals.map((signal) => (
              <span
                key={signal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: mayor.color,
                  background: T.c0,
                  border: `1px solid ${mayor.color}22`,
                  borderRadius: 999,
                  padding: '5px 9px',
                }}
              >
                {signal}
              </span>
            ))}
          </div>

          {mayor.importance || mayor.politicalWeight ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.tl, textAlign: 'center', marginBottom: 4 }}>
                Importance
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.55, textAlign: 'center', marginBottom: 10 }}>
                {mayor.importance || (mayor.politicalWeight === 'high' ? 'High political weight' : 'Regional political test')}
              </div>
            </>
          ) : null}

          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.tl, textAlign: 'center', marginBottom: 4 }}>
            Political reading
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.th, lineHeight: 1.55, textAlign: 'center', marginBottom: 10 }}>
            {politicalCase}
          </div>

          <div style={{ fontSize: 13, color: T.th, lineHeight: 1.68, textAlign: 'center', marginBottom: 10 }}>
            {mayor.context}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {mayor.website ? (
              <a
                href={mayor.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  border: `1px solid ${mayor.color}28`,
                  background: T.c0,
                  color: mayor.color,
                  borderRadius: 999,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Open
              </a>
            ) : null}
            {mayor.contactUrl ? (
              <a
                href={mayor.contactUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  border: `1px solid ${mayor.color}28`,
                  background: T.c0,
                  color: mayor.color,
                  borderRadius: 999,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Contact
              </a>
            ) : null}
            {mayor.email ? (
              <a
                href={`mailto:${mayor.email}`}
                style={{
                  border: `1px solid ${mayor.color}28`,
                  background: T.c0,
                  color: mayor.color,
                  borderRadius: 999,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                }}
              >
                {mayor.email}
              </a>
            ) : null}
          </div>
          {mayor.contactNote ? (
            <div style={{ fontSize: 12, color: T.tl, lineHeight: 1.6, textAlign: 'center' }}>
              {mayor.contactNote}
            </div>
          ) : null}
        </div>
      ) : null}
    </SurfaceCard>
  )
}
