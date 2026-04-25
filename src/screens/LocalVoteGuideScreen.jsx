import React, { useEffect, useMemo, useState } from 'react'
import { ScrollArea } from '../components/ui'
import { formatUKDate } from '../utils/date'
import {
  fetchLocalVoteGuideCouncilData,
  fetchLocalVoteGuideCandidates,
  getLocalVoteGuideCouncil,
  isSheffieldPostcode,
  LOCAL_VOTE_ISSUE_AREAS,
} from '../data/localVoteGuide'
import {
  Chip,
  CONTROL_COLORS,
  SectionLabel,
  SurfaceCard,
} from './elections/ElectionsSurfaceCard'

function partyColor(party, fallback) {
  const key = String(party || '').toLowerCase()
  if (key.includes('lab')) return CONTROL_COLORS.Lab
  if (key.includes('con')) return CONTROL_COLORS.Con
  if (key.includes('green')) return CONTROL_COLORS.Grn
  if (key.includes('lib')) return CONTROL_COLORS.LD
  if (key.includes('reform')) return CONTROL_COLORS.Reform
  if (key.includes('independent')) return CONTROL_COLORS.Ind
  if (key.includes('vacant')) return TONE_NEUTRAL
  return fallback
}

const TONE_NEUTRAL = '#6B7280'

function InfoRow({ T, label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 12,
        alignItems: 'start',
        padding: '10px 0',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.tl,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.th, lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

function InlineSourceLink({ T, href, label }) {
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: T.pr,
        fontSize: 13,
        fontWeight: 700,
        textDecoration: 'none',
      }}
    >
      {label} →
    </a>
  )
}

function EntrySourceMeta({ T, entry, fallbackLabel = 'No verified source yet' }) {
  const sourceLabel = entry?.sourceLabel || ''
  const sourceUrl = entry?.sourceUrl || ''
  const verificationStatus = entry?.verificationStatus || 'No verified source yet'
  const lastChecked = entry?.lastChecked ? formatUKDate(entry.lastChecked) : ''

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.tl }}>
        {verificationStatus}
        {lastChecked ? ` · ${lastChecked}` : ''}
      </div>
      {sourceUrl ? (
        <InlineSourceLink T={T} href={sourceUrl} label={sourceLabel || 'Source'} />
      ) : (
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tl }}>{sourceLabel || fallbackLabel}</div>
      )}
    </div>
  )
}

function buildUniqueSources(council, ward) {
  const seen = new Set()
  return [...(council?.sources || []), ...(ward?.sources || [])].filter((source) => {
    const key = `${source.label}|${source.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default function LocalVoteGuideScreen({ T, councilSlug, wardSlug, query = '' }) {
  const [council, setCouncil] = useState(() => getLocalVoteGuideCouncil(councilSlug))
  const [selectedWardSlug, setSelectedWardSlug] = useState(wardSlug || '')
  const [wardSearch, setWardSearch] = useState('')
  const [candidateState, setCandidateState] = useState({
    loading: false,
    candidates: [],
    sourceLabel: '',
    sourceUrl: '',
  })
  const queriedSheffieldPostcode = isSheffieldPostcode(query)

  useEffect(() => {
    setSelectedWardSlug(wardSlug || '')
  }, [wardSlug])

  useEffect(() => {
    setWardSearch('')
  }, [wardSlug, councilSlug])

  useEffect(() => {
    let cancelled = false

    setCouncil(getLocalVoteGuideCouncil(councilSlug))

    ;(async () => {
      const remoteCouncil = await fetchLocalVoteGuideCouncilData(councilSlug)
      if (cancelled || !remoteCouncil) return
      setCouncil(remoteCouncil)
    })()

    return () => {
      cancelled = true
    }
  }, [councilSlug])

  const selectedWard = useMemo(
    () => (council?.wards || []).find((ward) => ward.slug === selectedWardSlug) || null,
    [council, selectedWardSlug],
  )

  const sources = useMemo(
    () => buildUniqueSources(council, selectedWard),
    [council, selectedWard],
  )

  const filteredWards = useMemo(() => {
    const search = String(wardSearch || '').trim().toLowerCase()
    if (!search) return council?.wards || []
    return (council?.wards || []).filter((ward) => ward.name.toLowerCase().includes(search))
  }, [council, wardSearch])

  useEffect(() => {
    let cancelled = false

    if (!selectedWard) {
      setCandidateState({
        loading: false,
        candidates: [],
        sourceLabel: '',
        sourceUrl: '',
      })
      return () => {
        cancelled = true
      }
    }

    setCandidateState((current) => ({
      ...current,
      loading: queriedSheffieldPostcode,
    }))

    ;(async () => {
      const result = await fetchLocalVoteGuideCandidates({
        councilSlug,
        wardSlug: selectedWard.slug,
        query,
      }).catch(() => null)

      if (cancelled) return

      setCandidateState({
        loading: false,
        candidates: result?.candidates || [],
        sourceLabel: result?.sourceLabel || '',
        sourceUrl: result?.sourceUrl || '',
      })
    })()

    return () => {
      cancelled = true
    }
  }, [councilSlug, selectedWard, query, queriedSheffieldPostcode])

  const displayedCandidates = selectedWard
    ? (candidateState.candidates.length ? candidateState.candidates : selectedWard.candidates)
    : []
  const candidateSourceLabel = candidateState.sourceLabel || (displayedCandidates.length ? 'Sheffield City Council statement of persons nominated' : '')
  const candidateSourceUrl = candidateState.sourceUrl || (displayedCandidates.length ? selectedWard?.candidates?.[0]?.sourceUrl || '' : '')

  if (!council) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.sf }}>
        <div style={{ padding: '16px 18px 0', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.th, lineHeight: 1 }}>Local vote guide</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl, marginTop: 4 }}>Sheffield-first coverage in this phase.</div>
        </div>

        <ScrollArea>
          <div style={{ padding: '12px 16px 32px' }}>
            <SurfaceCard T={T} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.th, lineHeight: 1.6 }}>
                We could not find a local guide for that council yet.
              </div>
            </SurfaceCard>
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.sf }}>
      <div style={{ padding: '16px 18px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl, textAlign: 'center' }}>
          Local vote guide
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.th, lineHeight: 1.05, textAlign: 'center', marginTop: 6 }}>
          {council.councilName}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.th, textAlign: 'center', lineHeight: 1.55, maxWidth: 520, margin: '6px auto 0' }}>
          {selectedWard ? selectedWard.name : 'Choose a Sheffield ward to see verified councillors and candidates.'}
        </div>
      </div>

      <ScrollArea>
        <div style={{ padding: '12px 16px 32px' }}>
          <SurfaceCard T={T} style={{ marginBottom: 12 }}>
            <SectionLabel T={T}>Guide overview</SectionLabel>

            <InfoRow T={T} label="Council" value={council.councilName} />
            <InfoRow T={T} label="Ward" value={selectedWard ? selectedWard.name : 'Select a ward below'} />
            <InfoRow T={T} label="Election" value={formatUKDate(council.nextElectionDate)} />
            <div style={{ paddingTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl, marginBottom: 8 }}>
                Your lookup
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.th, lineHeight: 1.6 }}>
                {query || 'Sheffield'}
              </div>
              {!selectedWard ? (
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, lineHeight: 1.6, marginTop: 8 }}>
                  {queriedSheffieldPostcode
                    ? "We couldn't verify a ward for this postcode yet. Choose your ward manually below."
                    : 'Ward selection stays manual in this Sheffield-first phase unless you open the guide from a supported ward name.'}
                </div>
              ) : null}
            </div>
          </SurfaceCard>

          <SurfaceCard T={T} style={{ marginBottom: 12 }}>
            <SectionLabel T={T}>What this guide shows</SectionLabel>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                {
                  label: 'Current councillors',
                  text: 'Who currently represents the ward on Sheffield City Council.',
                },
                {
                  label: '2026 candidates',
                  text: 'Who is standing in the next local election where a verified list is available.',
                },
                {
                  label: 'Sources',
                  text: 'Each entry links to the source used, with the latest checked date shown underneath.',
                },
                {
                  label: 'Council responsibilities',
                  text: 'The services Sheffield City Council controls locally, such as housing, transport, and waste.',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: T.c1 || 'rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.th, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, lineHeight: 1.6 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard T={T} style={{ marginBottom: 12 }}>
            <SectionLabel T={T}>Choose ward</SectionLabel>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, textAlign: 'center', lineHeight: 1.6, marginBottom: 10 }}>
              Search Sheffield wards, then open the one you want to compare.
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.tl} strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </div>
              <input
                type="text"
                inputMode="search"
                placeholder="Search ward name"
                value={wardSearch}
                onChange={(e) => setWardSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 38px',
                  background: T.c0,
                  border: `1.5px solid ${wardSearch ? T.pr : T.cardBorder || 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 12,
                  fontSize: 15,
                  color: T.th,
                  fontFamily: "'Outfit', sans-serif",
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {filteredWards.map((ward) => (
                <button
                  key={ward.slug}
                  onClick={() => setSelectedWardSlug(ward.slug)}
                  style={{
                    border: `1px solid ${selectedWardSlug === ward.slug ? T.pr : T.cardBorder || 'rgba(0,0,0,0.12)'}`,
                    background: selectedWardSlug === ward.slug ? `${T.pr}18` : T.c0,
                    color: selectedWardSlug === ward.slug ? T.pr : T.th,
                    borderRadius: 999,
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {ward.name}
                </button>
              ))}
            </div>
            {!filteredWards.length ? (
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, textAlign: 'center', lineHeight: 1.6, marginTop: 12 }}>
                No Sheffield ward matched that search. Try another ward name.
              </div>
            ) : null}
          </SurfaceCard>

          <SurfaceCard T={T} style={{ marginBottom: 12 }}>
            <SectionLabel T={T}>What this council controls</SectionLabel>
            <div style={{ display: 'grid', gap: 8 }}>
              {council.controls.map((item) => (
                <div
                  key={item}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: T.c1 || 'rgba(0,0,0,0.04)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.th,
                    lineHeight: 1.55,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </SurfaceCard>

          {selectedWard ? (
            <>
              <SectionLabel T={T}>Current ward councillors</SectionLabel>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, textAlign: 'center', lineHeight: 1.6, marginBottom: 10 }}>
                These are the councillors who currently represent {selectedWard.name}.
              </div>
              {selectedWard.councillors.map((councillor) => {
                const accent = partyColor(councillor.party, T.pr)
                return (
                  <SurfaceCard key={councillor.id} T={T} borderColor={`${accent}28`} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.th }}>{councillor.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginTop: 4 }}>{councillor.party}</div>
                      </div>
                      <Chip color={accent}>{councillor.seatStatus === 'vacant' ? 'Vacant' : 'Councillor'}</Chip>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.6, marginBottom: 8 }}>
                      {councillor.seatStatus === 'vacant'
                        ? 'This ward seat is currently shown as vacant in the maintained guide.'
                        : "Listed in Sheffield City Council's current councillors-by-ward register."}
                    </div>
                    <EntrySourceMeta T={T} entry={councillor} />
                  </SurfaceCard>
                )
              })}

              <SectionLabel T={T}>Verified 2026 ward candidates</SectionLabel>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, textAlign: 'center', lineHeight: 1.6, marginBottom: 10 }}>
                These are the people standing in the next local election for {selectedWard.name}, where a verified list is available.
              </div>
              {displayedCandidates.length ? (
                <>
                  {displayedCandidates.map((candidate) => {
                  const accent = partyColor(candidate.party, T.pr)
                  return (
                    <SurfaceCard key={candidate.id} T={T} borderColor={`${accent}28`} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: T.th }}>{candidate.name}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginTop: 4 }}>{candidate.party}</div>
                        </div>
                        <Chip color={accent}>Verified</Chip>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.6, marginBottom: 8 }}>
                        {candidate.sourceAttribution === 'democracy-club'
                          ? 'Shown from Democracy Club\'s current WhoCanIVoteFor candidate feed for this upcoming ballot.'
                          : "Listed on Sheffield City Council's official statement of persons nominated for this ward."}
                      </div>
                      <EntrySourceMeta T={T} entry={candidate} />
                    </SurfaceCard>
                  )
                  })}

                  {candidateSourceLabel ? (
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.tl, textAlign: 'center', marginBottom: 10 }}>
                      {candidateSourceUrl ? (
                        <a
                          href={candidateSourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: T.pr, textDecoration: 'none' }}
                        >
                          Source: {candidateSourceLabel}
                        </a>
                      ) : (
                        `Source: ${candidateSourceLabel}`
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <SurfaceCard T={T} style={{ marginBottom: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.th, lineHeight: 1.6 }}>
                    {candidateState.loading
                      ? 'Checking Democracy Club / WhoCanIVoteFor...'
                      : selectedWard.candidateListStatus || 'No verified candidate list yet'}
                  </div>
                  {!candidateState.loading ? (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href="https://whocanivotefor.co.uk/"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: T.pr,
                          textDecoration: 'none',
                        }}
                      >
                        Can't find your candidates? Check Democracy Club / WhoCanIVoteFor →
                      </a>
                    </div>
                  ) : null}
                </SurfaceCard>
              )}

              {displayedCandidates.length ? (
                <>
                  <SectionLabel T={T}>Compare by issue</SectionLabel>
                  {LOCAL_VOTE_ISSUE_AREAS.map((area) => (
                    <SurfaceCard key={area.key} T={T} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl, textAlign: 'center', marginBottom: 10 }}>
                        {area.label}
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {displayedCandidates.map((candidate) => {
                          const accent = partyColor(candidate.party, T.pr)
                          const issueStatement = candidate.issueStatements?.[area.key] || null

                          return (
                            <div
                              key={`${candidate.id}-${area.key}`}
                              style={{
                                borderRadius: 12,
                                border: `1px solid ${accent}22`,
                                background: T.c1 || 'rgba(0,0,0,0.04)',
                                padding: '12px 12px 10px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{candidate.name}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: accent, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                  {candidate.party}
                                </div>
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.6 }}>
                                {issueStatement?.text || 'No verified issue statement yet.'}
                              </div>
                              {issueStatement?.sourceUrl ? (
                                <div style={{ marginTop: 8 }}>
                                  <InlineSourceLink T={T} href={issueStatement.sourceUrl} label={issueStatement.sourceLabel || 'Issue source'} />
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    </SurfaceCard>
                  ))}
                </>
              ) : null}

              {selectedWard.notes ? (
                <SurfaceCard T={T} style={{ marginTop: 4, marginBottom: 12 }}>
                  <SectionLabel T={T}>Ward note</SectionLabel>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.6, textAlign: 'center' }}>
                    {selectedWard.notes}
                  </div>
                </SurfaceCard>
              ) : null}
            </>
          ) : null}

          <SurfaceCard T={T} style={{ marginTop: 4 }}>
            <SectionLabel T={T}>Sources</SectionLabel>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, textAlign: 'center', lineHeight: 1.6 }}>
              {council.sourceNote}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, textAlign: 'center', lineHeight: 1.6, marginTop: 4, marginBottom: sources.length ? 12 : 0 }}>
              Reviewed {formatUKDate(selectedWard?.updatedAt || council.updatedAt)}
            </div>
            {sources.length ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {sources.map((source) => (
                  <a
                    key={`${source.label}-${source.url}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: T.c1 || 'rgba(0,0,0,0.04)',
                      color: T.pr,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    {source.label}
                    {source.updatedAt ? ` · ${formatUKDate(source.updatedAt)}` : ''}
                    {' →'}
                  </a>
                ))}
              </div>
            ) : null}
          </SurfaceCard>
        </div>
      </ScrollArea>
    </div>
  )
}
