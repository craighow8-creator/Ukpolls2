import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { LOCAL_ELECTIONS, LOCAL_REGIONS } from '../data/elections'
import { GENERAL_2024 } from '../data/electionsGeneral'
import { DEVOLVED_NATIONS, DEVOLVED_OVERVIEW } from '../data/electionsDevolved'
import { COUNCIL_MAYORS, MAYORS_OVERVIEW, REGIONAL_MAYORS } from '../data/electionsMayors'
import { daysTo } from '../utils/helpers'
import {
  cleanText,
  deriveRegionalMayorSignals,
  describeRegionalMayorPoliticalCase,
  formatElectionDate as formatDate,
  mergeCouncilLayers,
  slugifyCouncilName,
} from '../utils/electionsHelpers'
import ByElectionsScreen from './ByElectionsScreen'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'locals', label: 'Locals' },
  { key: 'devolved', label: 'Devolved' },
  { key: 'mayors', label: 'Mayors' },
  { key: 'byelections', label: 'By-elections' },
]

const HEADER_COPY = {
  general: {
    eyebrow: 'General election',
    subtitle: 'Westminster, national mandate and how power is won.',
  },
  locals: {
    eyebrow: 'Local elections',
    subtitle: 'Council control, battlegrounds and where May matters most.',
  },
  devolved: {
    eyebrow: 'Devolved elections',
    subtitle: 'Scotland and Wales beyond Westminster politics.',
  },
  mayors: {
    eyebrow: 'Mayoral elections',
    subtitle: 'Regional and local executive offices with real power.',
  },
  byelections: {
    eyebrow: 'By-elections',
    subtitle: 'Single-seat contests that can reveal pressure fast.',
  },
}

const VALID_TAB_KEYS = new Set(TABS.map((tab) => tab.key))

function normalizeElectionTab(value) {
  const next = cleanText(value)
  return VALID_TAB_KEYS.has(next) ? next : 'general'
}

function formatIntelligenceSourceType(value) {
  const next = cleanText(value)
  if (!next) return ''
  if (next === 'maintained' || next === 'backend-shaped-from-maintained-source') {
    return 'Maintained source'
  }
  return next
}

function buildIntelligenceMetaLine(meta) {
  if (!meta || typeof meta !== 'object') return ''
  const parts = []
  if (meta.updatedAt) parts.push(`Updated ${formatDate(meta.updatedAt)}`)
  const sourceType = formatIntelligenceSourceType(meta.sourceType)
  if (sourceType) parts.push(sourceType)
  if (Number.isFinite(Number(meta.sourceCount)) && Number(meta.sourceCount) > 0) {
    const count = Number(meta.sourceCount)
    parts.push(`${count} source${count === 1 ? '' : 's'} tracked`)
  }
  return parts.join(' · ')
}

const CONTROL_COLORS = {
  Con: '#0087DC',
  Lab: '#E4003B',
  LD: '#FAA61A',
  Grn: '#02A95B',
  Reform: '#12B7D4',
  NOC: '#6b7280',
  SNP: '#C4922A',
  PC: '#3F8428',
  Ind: '#9CA3AF',
}

const DIFF_COLORS = {
  'very hard': '#E4003B',
  hard: '#F97316',
  medium: '#EAB308',
  safe: '#02A95B',
}

function Chip({ children, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color,
        background: `${color}1e`,
        border: `1px solid ${color}2B`,
        borderRadius: 999,
        padding: '4px 9px',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function FilterChip({ label, active, onClick, T }) {
  return (
    <motion.button
      {...TAP}
      onClick={onClick}
      style={{
        border: `1px solid ${active ? T.pr : T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        background: active ? `${T.pr}18` : T.c0,
        color: active ? T.pr : T.th,
        borderRadius: 999,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </motion.button>
  )
}

function SectionLabel({ children, T, action }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: action ? 'space-between' : 'center',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
      }}
    >
      {action ? <div style={{ width: 80 }} /> : null}
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.tl,
          textAlign: 'center',
        }}
      >
        {children}
      </div>
      {action ? (
        <div
          style={{
            width: 80,
            fontSize: 12,
            fontWeight: 700,
            color: T.pr,
            textAlign: 'right',
            cursor: 'pointer',
          }}
          onClick={action.onClick}
        >
          {action.label}
        </div>
      ) : null}
    </div>
  )
}

function ControlBadge({ control, T }) {
  const c = CONTROL_COLORS[control] || T.tl
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: 999,
        background: `${c}1e`,
        color: c,
        flexShrink: 0,
      }}
    >
      {control}
    </span>
  )
}

function DiffDot({ d }) {
  const c = DIFF_COLORS[d] || '#888'
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
}

function StatCard({ T, label, value, color, sub }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '12px 12px',
        textAlign: 'center',
        background: T.c0,
        border: `1px solid ${color}28`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: T.tl,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub ? (
        <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 4, lineHeight: 1.4 }}>
          {sub}
        </div>
      ) : null}
    </div>
  )
}

function InteractiveStatCard({ T, label, value, color, sub, onClick, active = false }) {
  return (
    <motion.button
      {...TAP}
      onClick={onClick}
      style={{
        borderRadius: 12,
        padding: '12px 12px',
        textAlign: 'center',
        background: active ? `${color}10` : T.c0,
        border: `1px solid ${active ? color : `${color}28`}`,
        cursor: 'pointer',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: T.tl,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub ? (
        <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 4, lineHeight: 1.4 }}>
          {sub}
        </div>
      ) : null}
    </motion.button>
  )
}

function SurfaceCard({ T, children, borderColor, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '14px',
        background: T.c0,
        border: `1px solid ${borderColor || T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function ScrollAwayHeader({ T, tab, meta }) {
  const copy = HEADER_COPY[tab] || HEADER_COPY.general

  return (
    <div style={{ padding: '8px 16px 10px' }}>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        Elections
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.tl,
          textAlign: 'center',
          lineHeight: 1.4,
          margin: '8px auto 0',
        }}
      >
        {copy.eyebrow}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1.55,
          maxWidth: 520,
          margin: '6px auto 0',
        }}
      >
        {copy.subtitle}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 8,
        }}
      >
        <InfoButton id="elections_overview" T={T} size={20} />
      </div>
    </div>
  )
}

function StickyPillsBar({ T, tab, setTab }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8,
        background: T.sf,
        padding: '8px 16px 10px',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />
    </div>
  )
}

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

function DevolvedPollGrid({ T, polls }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
      {polls.map((p, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            background: `${p.color}0e`,
            border: `1px solid ${p.color}28`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.party}</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: T.th,
              lineHeight: 1,
            }}
          >
            {p.pct}%
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginTop: 2 }}>{p.trend}</div>
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

      <DevolvedPollGrid T={T} polls={nation.parties} />

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

export default function ElectionsScreen({
  T,
  nav,
  meta,
  elections = {},
  byElections = { upcoming: [], recent: [] },
  councilRegistry = [],
  councilStatus = [],
  councilEditorial = [],
  initialTab = 'general',
  updateCurrentParams,
}) {
  const [tab, setTab] = useState(normalizeElectionTab(initialTab))
  const [search, setSearch] = useState('')
  const [localFilter, setLocalFilter] = useState('all')
  const [generalExplainMode, setGeneralExplainMode] = useState('simple')
  const [expandedMayor, setExpandedMayor] = useState(null)

  const electionsIntelligence =
    elections && typeof elections === 'object' && elections.intelligence && typeof elections.intelligence === 'object'
      ? elections.intelligence
      : null

  const resolvedMayorsOverview =
    electionsIntelligence?.mayors?.overview && typeof electionsIntelligence.mayors.overview === 'object'
      ? electionsIntelligence.mayors.overview
      : MAYORS_OVERVIEW

  const resolvedRegionalMayors = Array.isArray(electionsIntelligence?.mayors?.regional) && electionsIntelligence.mayors.regional.length
    ? electionsIntelligence.mayors.regional
    : REGIONAL_MAYORS

  const resolvedCouncilMayors = Array.isArray(electionsIntelligence?.mayors?.council) && electionsIntelligence.mayors.council.length
    ? electionsIntelligence.mayors.council
    : COUNCIL_MAYORS

  const resolvedMayorsMeta =
    electionsIntelligence?.mayors?.meta && typeof electionsIntelligence.mayors.meta === 'object'
      ? electionsIntelligence.mayors.meta
      : null

  const resolvedDevolvedOverview =
    electionsIntelligence?.devolved?.overview && typeof electionsIntelligence.devolved.overview === 'object'
      ? electionsIntelligence.devolved.overview
      : DEVOLVED_OVERVIEW

  const resolvedDevolvedMeta =
    electionsIntelligence?.devolved?.meta && typeof electionsIntelligence.devolved.meta === 'object'
      ? electionsIntelligence.devolved.meta
      : null

  const resolvedDevolvedNations = Array.isArray(electionsIntelligence?.devolved?.nations) && electionsIntelligence.devolved.nations.length
    ? electionsIntelligence.devolved.nations
    : DEVOLVED_NATIONS

  useEffect(() => {
    setTab(normalizeElectionTab(initialTab))
  }, [initialTab])

  const handleSetTab = (nextTab) => {
    const safeTab = normalizeElectionTab(nextTab)
    setTab(safeTab)
    updateCurrentParams?.({ tab: safeTab })
  }

  const nextGeneralDate = meta?.nextGeneralElectionDate || ''
  const generalDays = nextGeneralDate ? daysTo(nextGeneralDate) : null

  const staticCouncils = LOCAL_ELECTIONS?.councils || []
  const regions = LOCAL_REGIONS || []
  const councils = useMemo(
    () => mergeCouncilLayers(staticCouncils, councilRegistry, councilStatus, councilEditorial),
    [staticCouncils, councilRegistry, councilStatus, councilEditorial],
  )

  const allSearchableCouncils = useMemo(() => {
    const flat = [...councils]
    regions.forEach((r) => {
      if (r.councils_list) {
        r.councils_list.forEach((c) => {
          const slug = c.slug || slugifyCouncilName(c.name)
          if (!flat.find((x) => (x.slug || slugifyCouncilName(x.name)) === slug)) {
            flat.push({ ...c, slug, region: r.name, type: r.type || 'Metropolitan' })
          }
        })
      }
    })
    return flat
  }, [councils, regions])

  const filteredCouncils = useMemo(() => {
    if (!search.trim()) return councils
    const q = search.toLowerCase()
    return allSearchableCouncils.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        cleanText(c.region).toLowerCase().includes(q) ||
        cleanText(c.type).toLowerCase().includes(q) ||
        cleanText(c.control).toLowerCase().includes(q) ||
        cleanText(c.verdict).toLowerCase().includes(q) ||
        cleanText(c.watchFor).toLowerCase().includes(q) ||
        cleanText(c.targetParty).toLowerCase().includes(q) ||
        cleanText(c.cycle).toLowerCase().includes(q) ||
        cleanText(c.electionStatus).toLowerCase().includes(q) ||
        cleanText(c.electionMessage).toLowerCase().includes(q) ||
        cleanText(c.governanceModel).toLowerCase().includes(q),
    )
  }, [allSearchableCouncils, councils, search])

  const launchCouncils = useMemo(
    () => councils.filter((c) => cleanText(c.electionStatus) === 'scheduled-2026'),
    [councils],
  )

  const trackedLaunchCouncils = useMemo(
    () =>
      launchCouncils.filter((c) => {
        const hasEditorialDepth =
          !!cleanText(c.verdict) &&
          !!cleanText(c.difficulty) &&
          !!cleanText(c.watchFor)
        const isMajorCouncil =
          /metropolitan/i.test(cleanText(c.type)) ||
          /london borough/i.test(cleanText(c.type)) ||
          /unitary/i.test(cleanText(c.type))
        return hasEditorialDepth && isMajorCouncil
      }),
    [launchCouncils],
  )

  const trackedLaunchSeatsUp = useMemo(
    () =>
      trackedLaunchCouncils.reduce((sum, c) => {
        const seatsUp = Number(c.seatsUp || 0) || 0
        return sum + seatsUp
      }, 0),
    [trackedLaunchCouncils],
  )

  const veryContested = trackedLaunchCouncils.filter((c) => c.difficulty === 'very hard')
  const hardToCall = trackedLaunchCouncils.filter((c) => c.difficulty === 'hard')

  const topCouncilsToWatch = useMemo(
    () =>
      [...trackedLaunchCouncils]
        .sort((a, b) => {
          const difficultyScore = (value) => {
            if (value === 'very hard') return 3
            if (value === 'hard') return 2
            if (value === 'medium') return 1
            return 0
          }
          const diffGap = difficultyScore(cleanText(b.difficulty)) - difficultyScore(cleanText(a.difficulty))
          if (diffGap !== 0) return diffGap
          return (Number(b.seatsUp || 0) || 0) - (Number(a.seatsUp || 0) || 0)
        })
        .slice(0, 5),
    [trackedLaunchCouncils],
  )

  const liveBriefing = useMemo(() => {
    if (!trackedLaunchCouncils.length) return 'Politiscope is building its launch council tracking set.'
    const names = topCouncilsToWatch.map((c) => c.name).slice(0, 3)
    const joined =
      names.length === 1
        ? names[0]
        : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names[0]}, ${names[1]} and ${names[2]}`
    return `${trackedLaunchCouncils.length} tracked councils for May 2026. ${joined} are among the key places to watch.`
  }, [trackedLaunchCouncils, topCouncilsToWatch])

  const localSummaryFilter = useMemo(() => {
    if (localFilter === 'veryhard') return 'tossups'
    if (localFilter === 'hard') return 'competitive'
    if (localFilter === 'all' && !search.trim()) return 'tracked'
    return 'other'
  }, [localFilter, search])

  const LOCAL_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'reform', label: 'Reform targets' },
    { key: 'labour', label: 'Labour defences' },
    { key: 'conservative', label: 'Conservative defences' },
    { key: 'noc', label: 'NOC' },
    { key: 'veryhard', label: 'Very hard' },
    { key: 'hard', label: 'Hard' },
    { key: 'county', label: 'County' },
    { key: 'district', label: 'District' },
    { key: 'metropolitan', label: 'Metropolitan' },
    { key: 'unitary', label: 'Unitary' },
    { key: 'london', label: 'London' },
  ]

  const localFilteredCouncils = useMemo(() => {
    const list = filteredCouncils

    switch (localFilter) {
      case 'reform':
        return list.filter((c) =>
          /reform/i.test(cleanText(c.targetParty)) ||
          /reform/i.test(cleanText(c.verdict)) ||
          /reform/i.test(cleanText(c.watchFor))
        )
      case 'labour':
        return list.filter((c) => cleanText(c.control) === 'Lab')
      case 'conservative':
        return list.filter((c) => cleanText(c.control) === 'Con')
      case 'noc':
        return list.filter((c) => c.noc || cleanText(c.control) === 'NOC')
      case 'veryhard':
        return list.filter((c) => cleanText(c.difficulty) === 'very hard')
      case 'hard':
        return list.filter((c) => cleanText(c.difficulty) === 'hard')
      case 'county':
        return list.filter((c) => cleanText(c.type) === 'County')
      case 'district':
        return list.filter((c) => cleanText(c.type) === 'District' || cleanText(c.type) === 'Borough')
      case 'metropolitan':
        return list.filter((c) => cleanText(c.type) === 'Metropolitan')
      case 'unitary':
        return list.filter((c) => cleanText(c.type) === 'Unitary')
      case 'london':
        return list.filter((c) => /london/i.test(cleanText(c.region)) || /london borough/i.test(cleanText(c.type)))
      default:
        return list
    }
  }, [filteredCouncils, localFilter])

  const hasLocalRefinement = !!search.trim() || localFilter !== 'all'
  const currentLocalFilterLabel = LOCAL_FILTERS.find((x) => x.key === localFilter)?.label || localFilter

  useEffect(() => {
    updateCurrentParams?.({
      tab,
      search,
      localFilter,
    })
  }, [tab, search, localFilter, updateCurrentParams])

  const openCouncil = (name) => {
    haptic(6)
    updateCurrentParams?.({
      tab,
      search,
      localFilter,
    })
    nav('council', {
      name,
      fromTab: tab,
      fromSearch: search,
      fromLocalFilter: localFilter,
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} tab={tab} meta={meta} />
      <StickyPillsBar T={T} tab={tab} setTab={handleSetTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {tab === 'general' ? (
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
                    <div style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, textAlign: 'center' }}>
                        1. One seat, one winner
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
                        The country is split into 650 constituencies. Each one elects one MP.
                      </div>
                    </div>

                    <div style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, textAlign: 'center' }}>
                        2. Most votes wins
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
                        The candidate who comes first wins the seat, even without getting more than half the votes.
                      </div>
                    </div>

                    <div style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, textAlign: 'center' }}>
                        3. Winner takes all
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
                        Coming second wins nothing in that constituency. Only first place counts.
                      </div>
                    </div>

                    <div style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: T.tl, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, textAlign: 'center' }}>
                        4. Forming government
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.65, textAlign: 'center' }}>
                        The party with enough MPs to control the Commons forms the government.
                      </div>
                    </div>
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
                    <div style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
                        Each classroom gets to pick one winner. Everyone gets one sticker to vote for who they want.
                      </div>
                    </div>

                    <div style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
                        Whoever gets the most stickers in that classroom wins — even if most people wanted someone else.
                      </div>
                    </div>

                    <div style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
                        There are no silver medals. If your person comes second, your stickers do not win part of the seat.
                      </div>
                    </div>

                    <div style={{ borderRadius: 12, padding: '12px', background: T.c0, border: `1px solid ${(T.pr || '#12B7D4')}18` }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.7, textAlign: 'center' }}>
                        After all 650 classrooms pick a winner, the team with the most winners gets to run the school.
                      </div>
                    </div>
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
        ) : null}

        {tab === 'locals' ? (
          <>
            <SurfaceCard T={T} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Local elections overview</SectionLabel>

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
                  {liveBriefing}
                </div>
                <InfoButton id="elections_overview" T={T} size={18} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <InteractiveStatCard
                  T={T}
                  label="Tracked councils"
                  value={trackedLaunchCouncils.length}
                  color={T.pr || '#12B7D4'}
                  sub="Tap to view"
                  active={localSummaryFilter === 'tracked'}
                  onClick={() => {
                    setSearch('')
                    setLocalFilter('all')
                  }}
                />
                <InteractiveStatCard
                  T={T}
                  label="Seats up"
                  value={`${trackedLaunchSeatsUp.toLocaleString()}+`}
                  color={T.pr || '#12B7D4'}
                  sub="Across tracked councils"
                  active={localSummaryFilter === 'tracked'}
                  onClick={() => {
                    setSearch('')
                    setLocalFilter('all')
                  }}
                />
                <InteractiveStatCard
                  T={T}
                  label="Toss-ups"
                  value={veryContested.length}
                  color="#E4003B"
                  sub="Tap to filter"
                  active={localSummaryFilter === 'tossups'}
                  onClick={() => {
                    setSearch('')
                    setLocalFilter('veryhard')
                  }}
                />
                <InteractiveStatCard
                  T={T}
                  label="Competitive"
                  value={hardToCall.length}
                  color="#F97316"
                  sub="Tap to filter"
                  active={localSummaryFilter === 'competitive'}
                  onClick={() => {
                    setSearch('')
                    setLocalFilter('hard')
                  }}
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
                    {topCouncilsToWatch.map((c, i) => (
                      <motion.button
                        key={i}
                        {...TAP}
                        onClick={() => openCouncil(c.name)}
                        style={{
                          border: `1px solid ${(CONTROL_COLORS[c.control] || T.pr)}28`,
                          background: T.c0,
                          color: CONTROL_COLORS[c.control] || T.th,
                          borderRadius: 999,
                          padding: '8px 12px',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.name}
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : null}
            </SurfaceCard>

            <SectionLabel T={T}>Search and filters</SectionLabel>

            <div style={{ position: 'relative', marginBottom: 10 }}>
              <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.tl} strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>

              <input
                type="search"
                placeholder="Search councils, regions, parties…"
                value={search}
                onChange={(e) => {
                  const nextValue = e.target.value
                  setSearch(nextValue)
                  if (nextValue.trim() && localFilter !== 'all') {
                    setLocalFilter('all')
                  }
                }}
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 38px',
                  background: T.c0,
                  border: `1.5px solid ${search ? T.pr : T.cardBorder || 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 12,
                  fontSize: 15,
                  color: T.th,
                  fontFamily: "'Outfit', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                  marginBottom: 10,
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 6,
                marginBottom: 12,
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {LOCAL_FILTERS.map((item) => (
                <FilterChip
                  key={item.key}
                  label={item.label}
                  active={localFilter === item.key}
                  onClick={() => setLocalFilter(item.key)}
                  T={T}
                />
              ))}
            </div>

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
                  Filtered councils
                </SectionLabel>

                <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 8, textAlign: 'center' }}>
                  {localFilteredCouncils.length} of {councils.length} councils
                  {search ? ` · search: "${search}"` : ''}
                  {localFilter !== 'all' ? ` · ${currentLocalFilterLabel}` : ''}
                </div>

                {localFilteredCouncils.length > 0 ? (
                  localFilteredCouncils.map((c, i) => (
                    <motion.div
                      key={i}
                      {...TAP}
                      onClick={() => openCouncil(c.name)}
                      style={{
                        borderRadius: 12,
                        padding: '10px 12px',
                        marginBottom: 6,
                        background: T.c0,
                        border: `1px solid ${(CONTROL_COLORS[c.control] || '#888')}18`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <DiffDot d={c.difficulty} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{c.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
                          {c.region} · {c.type} · {c.electionStatus === 'not-voting-2026'
                            ? 'not voting in May 2026'
                            : `${(c.seatsUp || c.seats)} up / ${(c.seatsTotal || c.seats)} seats`}
                        </div>
                        {c.watchFor ? (
                          <div
                            style={{
                              fontSize: 13,
                              color: T.tl,
                              marginTop: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {c.watchFor}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <ControlBadge control={c.control} T={T} />
                        {c.verdict ? (
                          <div style={{ fontSize: 13, fontWeight: 700, color: DIFF_COLORS[c.difficulty] || T.tl, marginTop: 3 }}>
                            {c.verdict}
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
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

                {regions.map((r, i) => (
                  <SurfaceCard key={i} T={T} borderColor={`${r.accentColor || T.pr}28`} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 20 }}>{r.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{r.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
                          {r.councils} councils · {r.seats} seats
                        </div>
                      </div>
                      <Chip color={DIFF_COLORS[r.difficulty] || '#888'}>{r.difficulty}</Chip>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 500, color: T.th, lineHeight: 1.65, marginBottom: 8 }}>
                      {r.story}
                    </div>

                    {r.watchFor ? (
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
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.th }}>{r.watchFor}</div>
                      </div>
                    ) : null}

                    {r.councils_list?.length > 0 ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {r.councils_list.map((cl, j) => (
                          <motion.div
                            key={j}
                            {...TAP}
                            onClick={() => openCouncil(cl.name)}
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
                            {cl.name}
                          </motion.div>
                        ))}
                      </div>
                    ) : null}
                  </SurfaceCard>
                ))}

                <SectionLabel T={T}>Council directory</SectionLabel>

                <div style={{ fontSize: 13, fontWeight: 700, color: T.tl, marginBottom: 8 }}>
                  {localFilteredCouncils.length} of {councils.length} councils · tap for full profile
                </div>

                {localFilteredCouncils.map((c, i) => (
                  <motion.div
                    key={i}
                    {...TAP}
                    onClick={() => openCouncil(c.name)}
                    style={{
                      borderRadius: 12,
                      padding: '10px 12px',
                      marginBottom: 6,
                      background: T.c0,
                      border: `1px solid ${(CONTROL_COLORS[c.control] || '#888')}18`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <DiffDot d={c.difficulty} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{c.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
                        {c.region} · {c.type} · {c.electionStatus === 'not-voting-2026'
                          ? 'not voting in May 2026'
                          : `${(c.seatsUp || c.seats)} up / ${(c.seatsTotal || c.seats)} seats`}
                      </div>
                      {c.watchFor ? (
                        <div
                          style={{
                            fontSize: 13,
                            color: T.tl,
                            marginTop: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {c.watchFor}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <ControlBadge control={c.control} T={T} />
                      {c.verdict ? (
                        <div style={{ fontSize: 13, fontWeight: 700, color: DIFF_COLORS[c.difficulty] || T.tl, marginTop: 3 }}>
                          {c.verdict}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </>
        ) : null}

{tab === 'devolved' ? (
          <>
            <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>{resolvedDevolvedOverview.title}</SectionLabel>
              <div style={{ maxWidth: 520, margin: '0 auto' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.68, textAlign: 'center' }}>
                  {resolvedDevolvedOverview.summary}
                </div>
                {buildIntelligenceMetaLine(resolvedDevolvedMeta) ? (
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
                    {buildIntelligenceMetaLine(resolvedDevolvedMeta)}
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

            {resolvedDevolvedNations.map((nation) => (
              <DevolvedNationCard key={nation.key} T={T} nation={nation} />
            ))}
          </>
        ) : null}

        {tab === 'mayors' ? (
          <>
            <SurfaceCard T={T} borderColor={`${T.pr || '#12B7D4'}28`} style={{ marginBottom: 12 }}>
              <SectionLabel T={T}>Mayoral map</SectionLabel>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.th, lineHeight: 1.62, textAlign: 'center' }}>
                {resolvedMayorsOverview.summary}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                {[
                  { label: 'Regional', value: resolvedMayorsOverview.totalRegional },
                  { label: 'Labour-held', value: resolvedMayorsOverview.labourRegional },
                  { label: 'New offices', value: resolvedMayorsOverview.newRegional },
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
              {buildIntelligenceMetaLine(resolvedMayorsMeta) ? (
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
                  {buildIntelligenceMetaLine(resolvedMayorsMeta)}
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {resolvedMayorsOverview.labourRegional ? <Chip color="#E4003B">Labour {resolvedMayorsOverview.labourRegional}</Chip> : null}
                {resolvedMayorsOverview.conservativeRegional ? <Chip color="#0087DC">Conservative {resolvedMayorsOverview.conservativeRegional}</Chip> : null}
                {resolvedMayorsOverview.reformRegional ? <Chip color="#12B7D4">Reform {resolvedMayorsOverview.reformRegional}</Chip> : null}
              </div>

              {resolvedMayorsOverview.whatMatters?.length ? (
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
                    {resolvedMayorsOverview.whatMatters.map((line) => (
                      <div key={line} style={{ fontSize: 13, fontWeight: 500, color: T.th, lineHeight: 1.55, textAlign: 'center' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </SurfaceCard>

            <SectionLabel T={T}>Regional mayors</SectionLabel>

            {resolvedRegionalMayors.map((m, i) => {
              const isExpanded = expandedMayor === i
              const signals = deriveRegionalMayorSignals(m)
              const politicalCase = describeRegionalMayorPoliticalCase(m)
              return (
                <SurfaceCard key={i} T={T} borderColor={`${m.color}28`} style={{ marginBottom: 8, padding: '12px 14px' }}>
                  <motion.button
                    {...TAP}
                    onClick={() => setExpandedMayor(isExpanded ? null : i)}
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
                        <div style={{ fontSize: 15, fontWeight: 800, color: T.th, lineHeight: 1.3 }}>{m.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: m.color, lineHeight: 1.45, marginTop: 4 }}>
                          {m.holder}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          <Chip color={m.color}>{m.party}</Chip>
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
                          {m.note}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.tl, lineHeight: 1.4, marginTop: 6, letterSpacing: '0.02em' }}>
                          Elected {formatDate(m.electedDate)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                      <span
                        style={{
                          border: `1px solid ${m.color}28`,
                          background: isExpanded ? `${m.color}18` : T.c0,
                          color: m.color,
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
                          background: `${m.color}10`,
                          border: `1px solid ${m.color}24`,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: m.color,
                            textAlign: 'center',
                            marginBottom: 4,
                          }}
                        >
                          Why it matters now
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.6, textAlign: 'center' }}>
                          {m.whyItMattersNow || politicalCase}
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
                              color: m.color,
                              background: T.c0,
                              border: `1px solid ${m.color}22`,
                              borderRadius: 999,
                              padding: '5px 9px',
                            }}
                          >
                            {signal}
                          </span>
                        ))}
                      </div>

                      {m.importance || m.politicalWeight ? (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.tl, textAlign: 'center', marginBottom: 4 }}>
                            Importance
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.55, textAlign: 'center', marginBottom: 10 }}>
                            {m.importance || (m.politicalWeight === 'high' ? 'High political weight' : 'Regional political test')}
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
                        {m.context}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        {m.website ? (
                          <a
                            href={m.website}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              border: `1px solid ${m.color}28`,
                              background: T.c0,
                              color: m.color,
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
                        {m.contactUrl ? (
                          <a
                            href={m.contactUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              border: `1px solid ${m.color}28`,
                              background: T.c0,
                              color: m.color,
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
                        {m.email ? (
                          <a
                            href={`mailto:${m.email}`}
                            style={{
                              border: `1px solid ${m.color}28`,
                              background: T.c0,
                              color: m.color,
                              borderRadius: 999,
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              textDecoration: 'none',
                            }}
                          >
                            {m.email}
                          </a>
                        ) : null}
                      </div>
                      {m.contactNote ? (
                        <div style={{ fontSize: 12, color: T.tl, lineHeight: 1.6, textAlign: 'center' }}>
                          {m.contactNote}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </SurfaceCard>
              )
            })}

            <SectionLabel T={T}>Council mayors</SectionLabel>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {resolvedCouncilMayors.map((m, i) => (
                <SurfaceCard key={i} T={T} borderColor={`${m.color}28`}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.th, textAlign: 'center' }}>{m.area}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <Chip color={m.color}>{m.party}</Chip>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.color, textAlign: 'center', marginTop: 8 }}>
                    {m.holder}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, textAlign: 'center', marginTop: 6, lineHeight: 1.5 }}>
                    {m.type}
                  </div>
                  {m.website || m.email ? (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {m.website ? (
                        <a
                          href={m.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            border: `1px solid ${m.color}28`,
                            background: T.c0,
                            color: m.color,
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
                      {m.email ? (
                        <a
                          href={`mailto:${m.email}`}
                          style={{
                            border: `1px solid ${m.color}28`,
                            background: T.c0,
                            color: m.color,
                            borderRadius: 999,
                            padding: '7px 10px',
                            fontSize: 11,
                            fontWeight: 800,
                            textDecoration: 'none',
                          }}
                        >
                          {m.email}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </SurfaceCard>
              ))}
            </div>
          </>
        ) : null}

        {tab === 'byelections' ? (
          <ByElectionsScreen T={T} byElections={byElections} />
        ) : null}
      </div>
    </div>
  )
}
