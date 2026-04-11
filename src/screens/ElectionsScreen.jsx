import React, { useEffect, useState } from 'react'
import { StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { DEVOLVED_NATIONS, DEVOLVED_OVERVIEW } from '../data/electionsDevolved'
import { COUNCIL_MAYORS, MAYORS_OVERVIEW, REGIONAL_MAYORS } from '../data/electionsMayors'
import { daysTo } from '../utils/helpers'
import { cleanText, formatElectionDate as formatDate } from '../utils/electionsHelpers'
import ByElectionsScreen from './ByElectionsScreen'
import DevolvedTab from './elections/DevolvedTab'
import GeneralTab from './elections/GeneralTab'
import LocalsTab from './elections/LocalsTab'
import MayorsTab from './elections/MayorsTab'

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

function ScrollAwayHeader({ T, tab }) {
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
  initialSearch = '',
  initialLocalFilter = 'all',
  updateCurrentParams,
}) {
  const [tab, setTab] = useState(normalizeElectionTab(initialTab))
  const [search, setSearch] = useState(initialSearch || '')
  const [localFilter, setLocalFilter] = useState(initialLocalFilter || 'all')
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

  useEffect(() => {
    updateCurrentParams?.({
      tab,
      search,
      localFilter,
    })
  }, [tab, search, localFilter, updateCurrentParams])

  const handleSetTab = (nextTab) => {
    const safeTab = normalizeElectionTab(nextTab)
    setTab(safeTab)
    updateCurrentParams?.({ tab: safeTab, search, localFilter })
  }

  const nextGeneralDate = meta?.nextGeneralElectionDate || ''
  const generalDays = nextGeneralDate ? daysTo(nextGeneralDate) : null

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
      <ScrollAwayHeader T={T} tab={tab} />
      <StickyPillsBar T={T} tab={tab} setTab={handleSetTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {tab === 'general' ? (
          <GeneralTab
            T={T}
            nextGeneralDate={nextGeneralDate}
            generalDays={generalDays}
            generalExplainMode={generalExplainMode}
            setGeneralExplainMode={setGeneralExplainMode}
          />
        ) : null}

        {tab === 'locals' ? (
          <LocalsTab
            T={T}
            councilRegistry={councilRegistry}
            councilStatus={councilStatus}
            councilEditorial={councilEditorial}
            search={search}
            setSearch={setSearch}
            localFilter={localFilter}
            setLocalFilter={setLocalFilter}
            openCouncil={openCouncil}
          />
        ) : null}

        {tab === 'devolved' ? (
          <DevolvedTab
            T={T}
            overview={resolvedDevolvedOverview}
            metaLine={buildIntelligenceMetaLine(resolvedDevolvedMeta)}
            nations={resolvedDevolvedNations}
          />
        ) : null}

        {tab === 'mayors' ? (
          <MayorsTab
            T={T}
            overview={resolvedMayorsOverview}
            metaLine={buildIntelligenceMetaLine(resolvedMayorsMeta)}
            regionalMayors={resolvedRegionalMayors}
            councilMayors={resolvedCouncilMayors}
            expandedMayor={expandedMayor}
            setExpandedMayor={setExpandedMayor}
          />
        ) : null}

        {tab === 'byelections' ? (
          <ByElectionsScreen T={T} byElections={byElections} />
        ) : null}
      </div>
    </div>
  )
}
