import React, { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { InfoButton } from '../../components/InfoGlyph'
import { COUNCIL_PROFILES, LOCAL_ELECTIONS, LOCAL_REGIONS } from '../../data/elections'
import {
  fetchLocalVoteGuideLookupIndex,
  isUkPostcode,
  normalisePostcodeInput,
  resolveLocalVoteGuideMatch,
} from '../../data/localVoteGuide'
import {
  Chip,
  CONTROL_COLORS,
  DIFF_COLORS,
  FilterChip,
  InteractiveStatCard,
  SectionLabel,
  SurfaceCard,
  TAP,
} from './ElectionsSurfaceCard'
import CouncilRow from './CouncilRow'
import { LOCAL_FILTERS, selectLocalElectionModel } from './electionsSelectors'

const ENGLISH_LOCAL_AUTHORITIES_VOTING = 136
const ENGLISH_LOCAL_SEATS_UP_LABEL = '~5,000'
const ENGLISH_LOCAL_SEATS_UP_DETAIL = '5,013-5,066 English Local Authority seats'
const POSTCODE_OUTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?$/i

function simplifyLookupValue(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^city of /i, '')
    .replace(/&/g, ' and ')
    .replace(/\b(city council|county council|district council|borough council|metropolitan borough council|london borough|council)\b/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function isUkPostcodeOutcode(query = '') {
  return POSTCODE_OUTCODE_RE.test(String(query || '').trim())
}

async function fetchOutcodeContext(outcode = '') {
  try {
    const response = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`)
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.result) return null
    return payload.result
  } catch {
    return null
  }
}

function getCouncilName(council = {}) {
  return council.name || council.supportedAreaLabel || council.slug || ''
}

function getCandidateWardCount(wards = []) {
  return wards.filter((ward) => Number(ward.candidateCount || 0) > 0).length
}

function formatWardCoverage(wards = []) {
  const candidateWardCount = getCandidateWardCount(wards)
  const wardLabel = `${wards.length} ${wards.length === 1 ? 'ward' : 'wards'} available`
  if (!candidateWardCount) return wardLabel
  return `${wardLabel} · ${candidateWardCount} ${candidateWardCount === 1 ? 'ward' : 'wards'} with candidate detail`
}

function buildLookupMaps(lookup = {}) {
  const lookupCouncils = Array.isArray(lookup?.councils) ? lookup.councils : []
  const lookupWards = Array.isArray(lookup?.wards) ? lookup.wards : []
  const councilById = new Map(lookupCouncils.map((council) => [String(council.id), council]))

  return { lookupCouncils, lookupWards, councilById }
}

function createCouncilMatch(council, lookupWards = []) {
  const wards = lookupWards.filter((ward) => String(ward.councilId) === String(council.id))
  return {
    ...council,
    displayName: getCouncilName(council),
    wards,
    wardCount: wards.length,
    candidateWardCount: getCandidateWardCount(wards),
  }
}

function createWardMatch(ward, councilById = new Map()) {
  const council = councilById.get(String(ward.councilId)) || {}
  return {
    ...ward,
    council,
    councilName: getCouncilName(council),
    councilSlug: ward.councilSlug || council.slug || '',
  }
}

function uniqueBy(items = [], getKey = (item) => item?.id || item?.slug) {
  const seen = new Set()
  return items.filter((item) => {
    const key = getKey(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function findBestCouncilSearchMatch(query = '', councils = [], lookupCouncils = []) {
  const q = simplifyLookupValue(query)
  if (!q) return null

  const localPool = (councils || []).map((council) => ({ name: council.name, slug: council.slug }))
  const d1Pool = (lookupCouncils || []).map((council) => ({
    name: council.name || council.supportedAreaLabel,
    slug: council.slug,
  }))
  const pool = [...localPool, ...d1Pool].filter((council) => council.name || council.slug)

  return (
    pool.find((council) => simplifyLookupValue(council.name) === q || simplifyLookupValue(council.slug) === q) ||
    pool.find((council) => simplifyLookupValue(council.name).includes(q)) ||
    null
  )
}

async function buildLocalAuthorityBrowseResults(query = '', lookup = {}) {
  const trimmedQuery = String(query || '').trim()
  const q = simplifyLookupValue(trimmedQuery)
  if (!q || !lookup) return null

  const { lookupCouncils, lookupWards, councilById } = buildLookupMaps(lookup)
  let type = 'search'
  let councilMatches = lookupCouncils.filter((council) => {
    const name = simplifyLookupValue(getCouncilName(council))
    const slug = simplifyLookupValue(council.slug)
    return name === q || slug === q || name.includes(q) || slug.includes(q)
  })
  let wardMatches = lookupWards.filter((ward) => {
    const values = [ward.name, ward.slug, ...(ward.aliases || [])].map(simplifyLookupValue)
    return values.some((value) => value === q || value.includes(q))
  })

  if (isUkPostcodeOutcode(trimmedQuery)) {
    const outcodeContext = await fetchOutcodeContext(trimmedQuery.toUpperCase())
    const districtKeys = new Set((outcodeContext?.admin_district || []).map(simplifyLookupValue).filter(Boolean))
    const wardKeys = new Set((outcodeContext?.admin_ward || []).map(simplifyLookupValue).filter(Boolean))

    type = 'outcode'
    councilMatches = lookupCouncils.filter((council) => districtKeys.has(simplifyLookupValue(getCouncilName(council))))
    wardMatches = lookupWards.filter((ward) => {
      const council = councilById.get(String(ward.councilId))
      const councilMatchesOutcode = council && districtKeys.has(simplifyLookupValue(getCouncilName(council)))
      return councilMatchesOutcode && wardKeys.has(simplifyLookupValue(ward.name))
    })
  }

  councilMatches = councilMatches
    .map((council) => createCouncilMatch(council, lookupWards))
    .sort((a, b) => b.candidateWardCount - a.candidateWardCount || b.wardCount - a.wardCount)
  councilMatches = uniqueBy(councilMatches, (council) => simplifyLookupValue(council.displayName))

  wardMatches = wardMatches
    .map((ward) => createWardMatch(ward, councilById))
    .sort((a, b) => Number(b.candidateCount || 0) - Number(a.candidateCount || 0))
  wardMatches = uniqueBy(wardMatches, (ward) => `${simplifyLookupValue(ward.councilName)}-${simplifyLookupValue(ward.name)}`)

  if (!councilMatches.length && wardMatches.length) {
    const councilIds = uniqueBy(
      wardMatches.map((ward) => ward.council).filter(Boolean),
      (council) => council.id || council.slug,
    )
    councilMatches = councilIds.map((council) => createCouncilMatch(council, lookupWards))
  }

  return {
    query: trimmedQuery,
    type,
    councilMatches,
    wardMatches,
  }
}

export default function LocalsTab({
  T,
  councilRegistry,
  councilStatus,
  councilEditorial,
  search,
  setSearch,
  localFilter,
  setLocalFilter,
  openCouncil,
  openLocalVoteGuide,
}) {
  const [voteGuideQuery, setVoteGuideQuery] = useState('')
  const [voteGuideMessage, setVoteGuideMessage] = useState('')
  const [voteGuideBusy, setVoteGuideBusy] = useState(false)
  const [lookupBrowseResults, setLookupBrowseResults] = useState(null)
  const resultsAnchorRef = useRef(null)
  const regions = LOCAL_REGIONS || []
  const {
    councils,
    trackedLaunchCouncils,
    veryContested,
    hardToCall,
    topCouncilsToWatch,
    localSummaryFilter,
    localFilteredCouncils,
    hasLocalRefinement,
    currentLocalFilterLabel,
  } = useMemo(
    () =>
      selectLocalElectionModel({
        staticCouncils: LOCAL_ELECTIONS?.councils || [],
        regions,
        councilRegistry,
        councilStatus,
        councilEditorial,
        search,
        localFilter,
      }),
    [regions, councilRegistry, councilStatus, councilEditorial, search, localFilter],
  )

  const detailedProfileCount = Object.keys(COUNCIL_PROFILES || {}).length
  const officialLocalBriefing = `${ENGLISH_LOCAL_AUTHORITIES_VOTING} English Local Authorities vote on 7 May 2026. Politiscope also tracks important Local Authorities that are not voting this cycle.`

  const scrollToLocalResults = () => {
    const scroll = () => resultsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    window.requestAnimationFrame(scroll)
    window.setTimeout(scroll, 80)
    window.setTimeout(scroll, 220)
  }

  const applyOverviewFilter = (nextFilter = 'all') => {
    setSearch('')
    setLocalFilter(nextFilter)
    setLookupBrowseResults(null)
    scrollToLocalResults()
  }

  const handleOpenLocalVoteGuide = async () => {
    const trimmedQuery = voteGuideQuery.trim()
    if (!trimmedQuery) {
      setVoteGuideMessage('Enter a postcode, Local Authority, ward, region or party pressure point.')
      setLookupBrowseResults(null)
      return
    }

    setVoteGuideBusy(true)
    try {
      const normalizedQuery = normalisePostcodeInput(trimmedQuery)

      if (isUkPostcode(normalizedQuery)) {
        const result = await resolveLocalVoteGuideMatch(normalizedQuery)

        if (result?.status === 'matched' || result?.status === 'manual' || result?.status === 'external') {
          setVoteGuideMessage('')
          setLookupBrowseResults(null)
          openLocalVoteGuide({
            councilSlug: result.councilSlug,
            wardSlug: result.wardSlug || '',
            query: result.query || normalizedQuery,
          })
          return
        }

        setVoteGuideMessage('That postcode could not be matched yet. Try the Local Authority or ward name instead.')
        setLookupBrowseResults(null)
        return
      }

      const lookup = await fetchLocalVoteGuideLookupIndex().catch(() => null)
      const browseResults = await buildLocalAuthorityBrowseResults(trimmedQuery, lookup)

      if (browseResults?.councilMatches?.length || browseResults?.wardMatches?.length) {
        setLookupBrowseResults(browseResults)
        setSearch('')
        setLocalFilter('all')
        setVoteGuideMessage(
          browseResults.type === 'outcode'
            ? 'Showing Local Authorities and wards that overlap this postcode area.'
            : 'Showing matching Local Authorities and wards.',
        )
        scrollToLocalResults()
        return
      }

      const councilMatch = findBestCouncilSearchMatch(trimmedQuery, councils, lookup?.councils || [])
      setLookupBrowseResults(null)
      setSearch(trimmedQuery)
      setLocalFilter('all')
      setVoteGuideMessage(
        councilMatch?.name
          ? 'Showing matching Local Authorities below.'
          : 'No exact Local Authority match yet. Showing matching authorities below.',
      )
      scrollToLocalResults()
    } finally {
      setVoteGuideBusy(false)
    }
  }

  return (
    <>
      <SectionLabel T={T}>Local Authorities</SectionLabel>

      <SurfaceCard T={T} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>Search or browse Local Authorities</SectionLabel>

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: T.th,
            lineHeight: 1.6,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Search by postcode, Local Authority, ward, region or political pressure point. One search handles local election lookup and Local Authority browsing.
        </div>

        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.tl} strokeWidth="2" strokeLinecap="round">
              <path d="M4 11h16" />
              <path d="M4 7h10" />
              <path d="M4 15h8" />
            </svg>
          </div>

          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            placeholder="Enter postcode, Local Authority, ward, region or party"
            value={voteGuideQuery}
            onChange={(e) => {
              const nextValue = e.target.value
              setVoteGuideQuery(nextValue)
              if (voteGuideMessage) setVoteGuideMessage('')
              if (lookupBrowseResults) setLookupBrowseResults(null)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              handleOpenLocalVoteGuide()
            }}
            style={{
              width: '100%',
              padding: '13px 14px 13px 38px',
              background: T.c0,
              border: `1.5px solid ${voteGuideQuery ? T.pr : T.cardBorder || 'rgba(0,0,0,0.1)'}`,
              borderRadius: 12,
              fontSize: 15,
              color: T.th,
              fontFamily: "'Outfit', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          <motion.button
            {...TAP}
            onClick={handleOpenLocalVoteGuide}
            style={{
              width: '100%',
              border: `1px solid ${T.pr}`,
              background: `${T.pr}18`,
              color: T.pr,
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              opacity: voteGuideBusy ? 0.75 : 1,
            }}
            disabled={voteGuideBusy}
          >
            {voteGuideBusy ? 'Checking…' : 'Search'}
          </motion.button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingTop: 10,
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {LOCAL_FILTERS.map((item) => (
            <FilterChip
              key={item.key}
              label={item.label}
              active={localFilter === item.key}
              onClick={() => {
                setLookupBrowseResults(null)
                setLocalFilter(item.key)
                if (item.key !== 'all') scrollToLocalResults()
              }}
              T={T}
            />
          ))}
        </div>

        {voteGuideMessage ? (
          <div
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 10,
              background: T.c1 || 'rgba(0,0,0,0.04)',
              fontSize: 14,
              fontWeight: 600,
              color: T.th,
              textAlign: 'center',
              lineHeight: 1.55,
            }}
          >
            {voteGuideMessage}
          </div>
        ) : null}
      </SurfaceCard>

      <SurfaceCard T={T} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>Local Authority picture</SectionLabel>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 12,
            textAlign: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: T.pr || '#12B7D4',
              boxShadow: `0 0 0 4px ${(T.pr || '#12B7D4')}18`,
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: 14, fontWeight: 600, color: T.th, lineHeight: 1.6 }}>
            {officialLocalBriefing}
          </div>
          <InfoButton id="elections_overview" T={T} size={18} />
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 650,
            color: T.tl,
            lineHeight: 1.55,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          English Local Authority totals are kept separate from Scotland and Wales. Detailed profiles and ward data are separate depth layers.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <InteractiveStatCard
            T={T}
            label="English Local Authorities"
            value={ENGLISH_LOCAL_AUTHORITIES_VOTING}
            color={T.pr || '#12B7D4'}
            sub="Voting on 7 May"
            active={false}
            onClick={() => applyOverviewFilter('all')}
          />
          <InteractiveStatCard
            T={T}
            label="Seats up"
            value={ENGLISH_LOCAL_SEATS_UP_LABEL}
            color={T.pr || '#12B7D4'}
            sub={ENGLISH_LOCAL_SEATS_UP_DETAIL}
            active={false}
            onClick={() => applyOverviewFilter('all')}
          />
          <InteractiveStatCard
            T={T}
            label="Detailed profiles"
            value={detailedProfileCount}
            color="#7C3AED"
            sub="Curated depth"
            active={false}
            onClick={() => applyOverviewFilter('all')}
          />
          <InteractiveStatCard
            T={T}
            label="Ward data"
            value="Building"
            color="#02A95B"
            sub="Verified sources"
            active={false}
            onClick={() => applyOverviewFilter('all')}
          />
          <InteractiveStatCard
            T={T}
            label="Toss-ups"
            value={veryContested.length}
            color="#E4003B"
            sub="Tap to filter"
            active={localSummaryFilter === 'tossups'}
            onClick={() => applyOverviewFilter('veryhard')}
          />
          <InteractiveStatCard
            T={T}
            label="Competitive"
            value={hardToCall.length}
            color="#F97316"
            sub="Tap to filter"
            active={localSummaryFilter === 'competitive'}
            onClick={() => applyOverviewFilter('hard')}
          />
        </div>

        {topCouncilsToWatch.length ? (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: T.tl,
                textAlign: 'center',
                marginTop: 14,
                marginBottom: 8,
              }}
            >
              Top Local Authorities to watch
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {topCouncilsToWatch.map((council, i) => (
                <motion.button
                  key={i}
                  {...TAP}
                  onClick={() => openCouncil(council.name)}
                  style={{
                    border: `1px solid ${(CONTROL_COLORS[council.control] || T.pr)}28`,
                    background: T.c0,
                    color: CONTROL_COLORS[council.control] || T.th,
                    borderRadius: 999,
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {council.name}
                </motion.button>
              ))}
            </div>
          </>
        ) : null}
      </SurfaceCard>

      <div ref={resultsAnchorRef} style={{ scrollMarginTop: 128 }} />

      {lookupBrowseResults?.councilMatches?.length || lookupBrowseResults?.wardMatches?.length ? (
        <>
          <SectionLabel
            T={T}
            action={{
              label: 'Clear',
              onClick: () => {
                setLookupBrowseResults(null)
                setSearch('')
                setLocalFilter('all')
              },
            }}
          >
            Local Authority matches
          </SectionLabel>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 8, textAlign: 'center' }}>
            {lookupBrowseResults.councilMatches.length} Local {lookupBrowseResults.councilMatches.length === 1 ? 'Authority' : 'Authorities'}
            {lookupBrowseResults.wardMatches.length ? ` · ${lookupBrowseResults.wardMatches.length} ward ${lookupBrowseResults.wardMatches.length === 1 ? 'match' : 'matches'}` : ''}
          </div>

          {lookupBrowseResults.councilMatches.slice(0, 6).map((council) => {
            const highlightedWards = uniqueBy(
              [
                ...lookupBrowseResults.wardMatches.filter((ward) => String(ward.council?.id) === String(council.id)),
                ...council.wards.filter((ward) => Number(ward.candidateCount || 0) > 0),
                ...council.wards,
              ],
              (ward) => ward.id || ward.slug,
            ).slice(0, 10)

            return (
              <SurfaceCard key={council.id || council.slug} T={T} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 850, color: T.th }}>{council.displayName}</div>
                    <div style={{ fontSize: 13, fontWeight: 650, color: T.tl, marginTop: 2 }}>
                      Local Authority · {formatWardCoverage(council.wards)}
                    </div>
                  </div>
                  <motion.button
                    {...TAP}
                    onClick={() => openCouncil(council.displayName)}
                    style={{
                      border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                      background: T.c0,
                      color: T.th,
                      borderRadius: 999,
                      padding: '7px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Open profile
                  </motion.button>
                </div>

                {highlightedWards.length ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {highlightedWards.map((ward) => {
                      const candidateCount = Number(ward.candidateCount || 0)
                      return (
                        <motion.button
                          key={ward.id || ward.slug}
                          {...TAP}
                          onClick={() =>
                            openLocalVoteGuide({
                              councilSlug: council.slug,
                              wardSlug: ward.slug,
                              query: ward.name,
                            })
                          }
                          style={{
                            border: `1px solid ${candidateCount ? T.pr : T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                            background: candidateCount ? `${T.pr}14` : T.c0,
                            color: candidateCount ? T.pr : T.th,
                            borderRadius: 999,
                            padding: '7px 10px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {ward.name}
                          {candidateCount ? ` · ${candidateCount} candidates` : ''}
                        </motion.button>
                      )
                    })}
                  </div>
                ) : null}
              </SurfaceCard>
            )
          })}
        </>
      ) : null}

      {hasLocalRefinement ? (
        <>
          <SectionLabel
            T={T}
            action={{
              label: 'Clear',
              onClick: () => {
                setSearch('')
                setLocalFilter('all')
              },
            }}
          >
            Search results
          </SectionLabel>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 8, textAlign: 'center' }}>
            {localFilteredCouncils.length} of {councils.length} authorities
            {search ? ` · search: "${search}"` : ''}
            {localFilter !== 'all' ? ` · ${currentLocalFilterLabel}` : ''}
          </div>

          {localFilteredCouncils.length > 0 ? (
            localFilteredCouncils.map((council, i) => (
              <CouncilRow key={`${council.slug || council.name}-${i}`} T={T} council={council} onOpen={openCouncil} />
            ))
          ) : (
            <SurfaceCard T={T} style={{ marginBottom: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: T.tl }}>No Local Authorities match that search/filter yet.</div>
            </SurfaceCard>
          )}
        </>
      ) : (
        <>
          <SectionLabel T={T}>Regional picture</SectionLabel>

          {regions.map((region, i) => (
            <SurfaceCard key={i} T={T} borderColor={`${region.accentColor || T.pr}28`} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 20 }}>{region.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{region.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
                    {region.councils} Local Authorities · {region.seats} seats
                  </div>
                </div>
                <Chip color={DIFF_COLORS[region.difficulty] || '#888'}>{region.difficulty}</Chip>
              </div>

              <div style={{ fontSize: 13, fontWeight: 500, color: T.th, lineHeight: 1.65, marginBottom: 8 }}>
                {region.story}
              </div>

              {region.watchFor ? (
                <div
                  style={{
                    padding: '8px 10px',
                    background: T.c1 || 'rgba(0,0,0,0.04)',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: T.tl,
                      marginBottom: 3,
                    }}
                  >
                    Watch for
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.th }}>{region.watchFor}</div>
                </div>
              ) : null}

              {region.councils_list?.length > 0 ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {region.councils_list.map((council, j) => (
                    <motion.div
                      key={j}
                      {...TAP}
                      onClick={() => openCouncil(council.name)}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: T.c1 || 'rgba(0,0,0,0.05)',
                        color: T.th,
                        cursor: 'pointer',
                        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.07)'}`,
                      }}
                    >
                      {council.name}
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </SurfaceCard>
          ))}

          <SectionLabel T={T}>Authority directory</SectionLabel>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 8 }}>
            {localFilteredCouncils.length} of {councils.length} authorities · tap for full profile
          </div>

          {localFilteredCouncils.map((council, i) => (
            <CouncilRow key={`${council.slug || council.name}-${i}`} T={T} council={council} onOpen={openCouncil} />
          ))}
        </>
      )}
    </>
  )
}
