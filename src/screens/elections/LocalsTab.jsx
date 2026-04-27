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
const ENGLISH_LOCAL_SEATS_UP_DETAIL = '5,013–5,066 English council seats'

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
  const officialLocalBriefing = `${ENGLISH_LOCAL_AUTHORITIES_VOTING} English councils vote on 7 May 2026. Politiscope also tracks important local authorities that are not voting this cycle.`

  const scrollToLocalResults = () => {
    const scroll = () => resultsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    window.requestAnimationFrame(scroll)
    window.setTimeout(scroll, 80)
    window.setTimeout(scroll, 220)
  }

  const applyOverviewFilter = (nextFilter = 'all') => {
    setSearch('')
    setLocalFilter(nextFilter)
    scrollToLocalResults()
  }

  const handleOpenLocalVoteGuide = async () => {
    const trimmedQuery = voteGuideQuery.trim()
    if (!trimmedQuery) {
      setVoteGuideMessage('Enter a postcode, council, ward, region or party pressure point.')
      return
    }

    setVoteGuideBusy(true)
    try {
      const normalizedQuery = normalisePostcodeInput(trimmedQuery)

      if (isUkPostcode(normalizedQuery)) {
        const result = await resolveLocalVoteGuideMatch(normalizedQuery)

        if (result?.status === 'matched' || result?.status === 'manual' || result?.status === 'external') {
          setVoteGuideMessage('')
          openLocalVoteGuide({
            councilSlug: result.councilSlug,
            wardSlug: result.wardSlug || '',
            query: result.query || normalizedQuery,
          })
          return
        }

        setVoteGuideMessage('That postcode could not be matched yet. Try the council or ward name instead.')
        return
      }

      const lookup = await fetchLocalVoteGuideLookupIndex().catch(() => null)
      const councilMatch = findBestCouncilSearchMatch(trimmedQuery, councils, lookup?.councils || [])

      if (councilMatch?.name) {
        setVoteGuideMessage('')
        openCouncil(councilMatch.name)
        return
      }

      setSearch(trimmedQuery)
      setLocalFilter('all')
      setVoteGuideMessage('No exact authority match yet. Showing matching councils below.')
      scrollToLocalResults()
    } finally {
      setVoteGuideBusy(false)
    }
  }

  return (
    <>
      <SectionLabel T={T}>Local authorities</SectionLabel>

      <SurfaceCard T={T} style={{ marginBottom: 12 }}>
        <SectionLabel T={T}>Search or browse</SectionLabel>

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
          Search by postcode, council, ward, region or political pressure point. One search handles local election lookup and council browsing.
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
            placeholder="Enter postcode, council, ward, region or party"
            value={voteGuideQuery}
            onChange={(e) => {
              const nextValue = e.target.value
              const normalizedValue = normalisePostcodeInput(nextValue)
              setVoteGuideQuery(nextValue)
              if (voteGuideMessage) setVoteGuideMessage('')

              if (!nextValue.trim()) {
                setSearch('')
                setLocalFilter('all')
                return
              }

              if (isUkPostcode(normalizedValue)) {
                setSearch('')
                setLocalFilter('all')
                return
              }

              setSearch(nextValue)
              if (localFilter !== 'all') setLocalFilter('all')
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
        <SectionLabel T={T}>Local authority picture</SectionLabel>

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
          English local council totals are kept separate from Scotland and Wales. Detailed profiles and ward data are separate depth layers.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <InteractiveStatCard
            T={T}
            label="English councils"
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
              Top councils to watch
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
            {localFilteredCouncils.length} of {councils.length} councils
            {search ? ` · search: "${search}"` : ''}
            {localFilter !== 'all' ? ` · ${currentLocalFilterLabel}` : ''}
          </div>

          {localFilteredCouncils.length > 0 ? (
            localFilteredCouncils.map((council, i) => (
              <CouncilRow key={`${council.slug || council.name}-${i}`} T={T} council={council} onOpen={openCouncil} />
            ))
          ) : (
            <SurfaceCard T={T} style={{ marginBottom: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: T.tl }}>No councils match that search/filter yet.</div>
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
                    {region.councils} councils · {region.seats} seats
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
