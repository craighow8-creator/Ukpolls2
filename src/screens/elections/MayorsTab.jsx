import React from 'react'
import { Chip, SectionLabel, SurfaceCard } from './ElectionsSurfaceCard'
import RegionalMayorCard from './RegionalMayorCard'

export default function MayorsTab({
  T,
  overview,
  metaLine,
  regionalMayors,
  councilMayors,
  expandedMayor,
  setExpandedMayor,
}) {
  return (
    <>
      <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>Mayoral map</SectionLabel>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.62, textAlign: 'center' }}>
          {overview.summary}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Regional', value: overview.totalRegional },
            { label: 'Labour-held', value: overview.labourRegional },
            { label: 'New offices', value: overview.newRegional },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                borderRadius: 16,
                padding: '10px 8px',
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                background: T.c0,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: T.pr || '#12B7D4', lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.tl, marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
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

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {overview.labourRegional ? <Chip color="#E4003B">Labour {overview.labourRegional}</Chip> : null}
          {overview.conservativeRegional ? <Chip color="#0087DC">Conservative {overview.conservativeRegional}</Chip> : null}
          {overview.reformRegional ? <Chip color="#12B7D4">Reform {overview.reformRegional}</Chip> : null}
        </div>

        {overview.whatMatters?.length ? (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 12,
              background: T.c1 || 'rgba(0,0,0,0.04)',
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: T.tl,
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              What matters now
            </div>
            <div style={{ display: 'grid', gap: 5 }}>
              {overview.whatMatters.map((line) => (
                <div key={line} style={{ fontSize: 13, fontWeight: 500, color: T.th, lineHeight: 1.55, textAlign: 'center' }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </SurfaceCard>

      <SectionLabel T={T}>Regional mayors</SectionLabel>

      {regionalMayors.map((mayor, i) => (
        <RegionalMayorCard
          key={i}
          T={T}
          mayor={mayor}
          isExpanded={expandedMayor === i}
          onToggle={() => setExpandedMayor(expandedMayor === i ? null : i)}
        />
      ))}

      <SectionLabel T={T}>Council mayors</SectionLabel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        {councilMayors.map((mayor, i) => (
          <SurfaceCard key={i} T={T} borderColor={`${mayor.color}28`}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.th, textAlign: 'center' }}>{mayor.area}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <Chip color={mayor.color}>{mayor.party}</Chip>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: mayor.color, textAlign: 'center', marginTop: 8 }}>
              {mayor.holder}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, textAlign: 'center', marginTop: 6, lineHeight: 1.5 }}>
              {mayor.type}
            </div>
            {mayor.website || mayor.email ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
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
                      padding: '7px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Open
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
                      padding: '7px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    {mayor.email}
                  </a>
                ) : null}
              </div>
            ) : null}
          </SurfaceCard>
        ))}
      </div>
    </>
  )
}
