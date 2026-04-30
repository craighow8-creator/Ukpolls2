import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { getTheme, partyTheme } from './theme'
import { EZ } from './constants'
import AtmoBg from './components/AtmoBg'
import { Toast } from './components/ui'
import ShareModal from './components/ShareModal'
import AboutModal from './components/AboutModal'
import { ExpandedCard } from './components/MotionCard'
import { useDarkMode } from './utils/darkMode'
import MenuSheet from './components/MenuSheet'
import HomeScreen from './screens/HomeScreen'
import PollsScreen from './screens/PollsScreen'
import PollDetailScreen from './screens/PollDetailScreen'
import PollsterScreen from './screens/PollsterScreen'
import PartiesScreen from './screens/PartiesScreen'
import PartyScreen from './screens/PartyScreen'
import LeadersScreen from './screens/LeadersScreen'
import LeaderScreen from './screens/LeaderScreen'
import TrendsScreen from './screens/TrendsScreen'
import DemographicsScreen from './screens/DemographicsScreen'
import MigrationScreen from './screens/MigrationScreen'
import ElectionsScreen from './screens/ElectionsScreen'
import CouncilScreen from './screens/CouncilScreen'
import LocalVoteGuideScreen from './screens/LocalVoteGuideScreen'
import PolicyCompareScreen from './screens/PolicyCompareScreen'
import BettingScreen from './screens/BettingScreen'
import NewsScreen from './screens/NewsScreen'
import VoteScreen from './screens/VoteScreen'
import CompareScreen from './screens/CompareScreen'
import ParliamentScreen from './screens/ParliamentScreen'
import QuoteMatchScreen from './screens/QuoteMatchScreen'
import SeatBuilderScreen from './screens/SeatBuilderScreen'
import PollPredictorScreen from './screens/PollPredictorScreen'
import GovernmentSimulatorScreen from './screens/GovernmentSimulatorScreen'
import { getData } from './data/store.js'
import { buildPollingAverage } from './utils/pollAverage'

const CANONICAL_SHARE_URL = 'https://politiscope.co.uk'

function getPollKeyForParty(party = {}) {
  const abbr = String(party?.abbr || '').trim().toLowerCase()
  const name = String(party?.name || '').trim().toLowerCase()

  const map = {
    ref: 'ref',
    labour: 'lab',
    lab: 'lab',
    conservative: 'con',
    con: 'con',
    green: 'grn',
    grn: 'grn',
    'lib dem': 'ld',
    'lib dems': 'ld',
    'liberal democrats': 'ld',
    ld: 'ld',
    'restore britain': 'rb',
    rb: 'rb',
    snp: 'snp',
  }

  return map[abbr] || map[name] || null
}


function getPollDateMs(poll) {
  const raw = poll?.fieldworkEnd || poll?.publishedAt || poll?.date || null
  if (!raw) return 0

  if (typeof raw === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('-').map(Number)
    return Date.UTC(yyyy, mm - 1, dd)
  }

  const ts = new Date(raw).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function formatShareDate(value) {
  if (!value) return ''

  if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) return value

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${parsed.getFullYear()}`
}

function mergePollHistory(preferred = [], fallback = []) {
  const merged = new Map()

  const upsert = (poll, sourceRank) => {
    if (!poll || typeof poll !== 'object') return

    const key = [
      String(poll.id || '').trim().toLowerCase(),
      String(poll.pollster || '').trim().toLowerCase(),
      String(poll.fieldworkEnd || poll.publishedAt || poll.date || '').trim(),
    ].join('|')

    const ts = getPollDateMs(poll)
    const existing = merged.get(key)

    if (!existing || ts > existing.ts || (ts === existing.ts && sourceRank < existing.sourceRank)) {
      merged.set(key, { poll, sourceRank, ts })
    }
  }

  preferred.forEach((poll) => upsert(poll, 0))
  fallback.forEach((poll) => upsert(poll, 1))

  return [...merged.values()]
    .sort((a, b) => b.ts - a.ts)
    .map((entry) => entry.poll)
}

function getRouteResetKey(route, depth = 0) {
  if (!route) return 'home'
  const params = route.params || {}
  const poll = params.poll || {}
  return [
    route.screen,
    depth,
    params.idx,
    params.lIdx,
    params.name,
    params.councilSlug,
    params.wardSlug,
    params.pollster,
    params.query,
    params.tab,
    params.search,
    params.localFilter,
    params.localSort,
    params.openTab,
    params.selectedPolicyArea,
    params.policyArea,
    params.leftParty,
    params.rightParty,
    params.fromScreen,
    params.fromPartyIdx,
    params.fromLeaderIdx,
    params.returnTab,
    params.returnPolicyArea,
    poll.id,
    poll.pollster,
    poll.fieldworkEnd,
    poll.publishedAt,
    poll.date,
  ]
    .map((part) => String(part ?? ''))
    .join('|')
}

function clearLocalsTabReturnState() {
  try {
    sessionStorage.removeItem('politiscope.localsTab.state')
  } catch {}
}

export default function App() {
  const { dark, toggle: toggleDark } = useDarkMode()

  const [appData, setAppData] = useState(null)
  const [dataReady, setDataReady] = useState(false)
  const [themeKey, setThemeKey] = useState('reform')
  const [expanded, setExpanded] = useState(null)
  const [navStack, setNavStack] = useState([])
  const [toast, setToast] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState('')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const toastRef = useRef()
  const historyDepthRef = useRef(0)
  const skipPopRef = useRef(0)
  // Tracks whether the initial data load has completed.
  // Background refreshes (focus/storage/visibility) update appData but must NOT
  // reset themeKey — doing so would clobber any leader/party-specific theme the
  // user navigated to and cause a visible flash a few seconds after landing.
  const initialLoadDone = useRef(false)

  const loadAppData = useCallback(async () => {
    const isInitial = !initialLoadDone.current
    try {
      const data = await getData()
      setAppData(data)

      if (isInitial) {
        initialLoadDone.current = true
        const top = [...(data?.parties || [])].sort((a, b) => (b.pct || 0) - (a.pct || 0))[0]
        if (top) setThemeKey(partyTheme(top.name))
      }
    } catch (e) {
      console.error('App data load failed', e)
    } finally {
      setDataReady(true)
    }
  }, [])

  useEffect(() => {
    loadAppData().catch(() => {})
  }, [loadAppData])

  useEffect(() => {
    const refresh = () => {
      loadAppData().catch(() => {})
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    const onStorage = (event) => {
      if (!event.key || event.key.startsWith('PS_')) refresh()
    }

    window.addEventListener('politiscope:data-updated', refresh)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('politiscope:data-updated', refresh)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [loadAppData])

  const META = appData?.meta || {}
  const RAW_PARTIES = appData?.parties || []
  const POLLS = appData?.polls || []
  const POLLS_HISTORY = appData?.pollsData || appData?.pollContext?.allPollsSorted || appData?.polls || []
  const LEADERS = appData?.leaders || []
  const POLL_CONTEXT = appData?.pollContext || {}
  const TRENDS = POLL_CONTEXT?.trendSeries || appData?.trends || []
  const DEMO = appData?.demographics || {}
  const POLICY_RECORDS_DATA = Array.isArray(appData?.policyRecords) ? appData.policyRecords : null
  const POLICY_TAXONOMY_DATA =
    appData?.policyTaxonomy && typeof appData.policyTaxonomy === 'object' && !Array.isArray(appData.policyTaxonomy)
      ? appData.policyTaxonomy
      : null
  const MIGRATION = appData?.migration || {}
  const BY_ELEC = appData?.byElections || { upcoming: [], recent: [] }
  const ELECTIONS = appData?.elections || {}
  const BETTING = appData?.betting || { odds: [] }
  const PREDICTION_MARKETS = appData?.predictionMarkets || { markets: [] }
  const NEWS =
    appData?.news && typeof appData.news === 'object' && !Array.isArray(appData.news)
      ? appData.news
      : appData?.newsItems && typeof appData.newsItems === 'object' && !Array.isArray(appData.newsItems)
        ? {
            items: Array.isArray(appData.newsItems.items) ? appData.newsItems.items : [],
            meta: appData.newsItems.meta || null,
            fetchedAt: appData.newsItems.fetchedAt || null,
          }
        : { items: Array.isArray(appData?.newsItems) ? appData.newsItems : [], meta: null }
  const MILESTONES = appData?.milestones || []
  const COUNCIL_REGISTRY = appData?.councilRegistry || []
  const COUNCIL_STATUS = appData?.councilStatus || []
  const COUNCIL_EDITORIAL = appData?.councilEditorial || []
  const PARLIAMENT = appData?.parliament || {}

  const latestPoll = POLLS_HISTORY?.[0] || null
  const pollingAverage = POLL_CONTEXT?.pollingAverage || buildPollingAverage(POLLS_HISTORY, { windowDays: 30 })

  const PARTIES = pollingAverage
    ? RAW_PARTIES.map((p) => {
        const key = getPollKeyForParty(p)
        if (!key) return p
        return {
          ...p,
          pct: pollingAverage?.[key] != null ? pollingAverage[key] : 0,
        }
      })
    : latestPoll
      ? RAW_PARTIES.map((p) => {
          const key = getPollKeyForParty(p)
          if (!key) return p
          return {
            ...p,
            pct: latestPoll?.[key] != null ? latestPoll[key] : 0,
          }
        })
      : RAW_PARTIES

  const PARTIES_WITH_LEADERS = PARTIES.map((p) => ({
    ...p,
    _leader:
      (LEADERS || []).find(
        (l) => (l.party || '').toLowerCase() === (p.name || '').toLowerCase(),
      ) || null,
  }))

  const collapseExpanded = useCallback(() => {
    clearLocalsTabReturnState()
    setExpanded(null)
    setNavStack([])
    const top = [...PARTIES].sort((a, b) => (b.pct || 0) - (a.pct || 0))[0]
    if (top) setThemeKey(partyTheme(top.name))
  }, [PARTIES])

  const closeExpanded = useCallback(() => {
    const historyDepth = historyDepthRef.current
    if (historyDepth > 0) {
      skipPopRef.current = historyDepth
      historyDepthRef.current = 0
      collapseExpanded()
      window.history.go(-historyDepth)
      return
    }
    collapseExpanded()
  }, [collapseExpanded])

  const nav = useCallback(
    (screen, params = {}) => {
      const layoutId = params.layoutId || screen
      if (screen === 'party' && params.idx !== undefined) setThemeKey(partyTheme(PARTIES[params.idx]?.name))
      else if (screen === 'leader' && params.lIdx !== undefined) setThemeKey(partyTheme(LEADERS[params.lIdx]?.party))
      if (screen === 'home') {
        clearLocalsTabReturnState()
        setExpanded(null)
        setNavStack([])
        const top = [...PARTIES].sort((a, b) => (b.pct || 0) - (a.pct || 0))[0]
        if (top) setThemeKey(partyTheme(top.name))
        return
      }
      if (expanded) {
        setNavStack((s) => [...s, { screen, params }])
        return
      }
      setExpanded({ screen, params, layoutId })
      setNavStack([])
    },
    [expanded, PARTIES, LEADERS],
  )

  const goBack = useCallback(() => {
    if (!expanded) return
    if (historyDepthRef.current > 0) {
      window.history.back()
      return
    }
    if (navStack.length > 0) setNavStack((s) => s.slice(0, -1))
    else collapseExpanded()
  }, [expanded, navStack.length, collapseExpanded])

  const updateCurrentParams = useCallback(
    (patch = {}) => {
      if (navStack.length > 0) {
        setNavStack((stack) => {
          if (!stack.length) return stack
          const next = [...stack]
          const last = next[next.length - 1]
          next[next.length - 1] = {
            ...last,
            params: { ...(last.params || {}), ...(patch || {}) },
          }
          return next
        })
        return
      }

      setExpanded((prev) =>
        prev
          ? {
              ...prev,
              params: { ...(prev.params || {}), ...(patch || {}) },
            }
          : prev,
      )
    },
    [navStack.length],
  )

  useEffect(() => {
    const onPop = () => {
      if (skipPopRef.current > 0) {
        skipPopRef.current -= 1
        return
      }

      if (expanded) {
        if (navStack.length > 0) {
          historyDepthRef.current = Math.max(historyDepthRef.current - 1, 0)
          setNavStack((s) => s.slice(0, -1))
        } else {
          historyDepthRef.current = 0
          collapseExpanded()
        }
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [expanded, navStack.length, collapseExpanded])

  useEffect(() => {
    const targetDepth = expanded ? navStack.length + 1 : 0
    const currentDepth = historyDepthRef.current

    if (targetDepth > currentDepth) {
      for (let depth = currentDepth + 1; depth <= targetDepth; depth += 1) {
        window.history.pushState({ expanded: true, depth }, '')
      }
      historyDepthRef.current = targetDepth
      return
    }

    if (targetDepth === 0) {
      historyDepthRef.current = 0
    }
  }, [expanded, navStack.length])

  const T = getTheme(themeKey === 'reform' ? 'Reform UK' : themeKey, dark)
  const currentNav = navStack.length > 0 ? navStack[navStack.length - 1] : expanded
  const navResetKey = getRouteResetKey(currentNav, navStack.length)

  const showToast = (msg) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(''), 2600)
  }

  const genShareText = () => {
    const sorted = [...PARTIES].sort((a, b) => (b.pct || 0) - (a.pct || 0))
    const snap = sorted
      .filter((p) => p.name !== 'Other')
      .slice(0, 5)
      .map((p) => `${p.abbr} ${p.pct}%`)
      .join(' · ')
    const latest = [...(POLLS_HISTORY || [])].sort((a, b) => getPollDateMs(b) - getPollDateMs(a))[0]
    const latestDate = formatShareDate(latest?.fieldworkEnd || latest?.publishedAt || latest?.date)

    if (!snap) return 'Politiscope: the smarter way to follow UK politics.'

    const dateLabel = latestDate ? `Latest poll data ${latestDate}` : 'Latest poll snapshot'
    return `Politiscope: the smarter way to follow UK politics.\n${dateLabel}\n${snap}`
  }

  if (!dataReady) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(175deg, #e8f8fc 0%, #cdf0f7 40%, #a8e4f0 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <svg width="72" height="72" viewBox="0 0 80 80" style={{ marginBottom: 20 }}>
          <defs>
            <radialGradient id="sg" cx="32%" cy="26%" r="72%">
              <stop offset="0%" stopColor="#0d4a5c" />
              <stop offset="100%" stopColor="#020c12" />
            </radialGradient>
            <clipPath id="sc">
              <circle cx="40" cy="40" r="38" />
            </clipPath>
          </defs>
          <circle cx="40" cy="40" r="38" fill="url(#sg)" />
          <g clipPath="url(#sc)">
            <line x1="2" y1="2" x2="78" y2="78" stroke="white" strokeWidth="14" />
            <line x1="78" y1="2" x2="2" y2="78" stroke="white" strokeWidth="14" />
            <line x1="2" y1="2" x2="78" y2="78" stroke="#C8102E" strokeWidth="8" />
            <line x1="78" y1="2" x2="2" y2="78" stroke="#C8102E" strokeWidth="8" />
            <line x1="2" y1="40" x2="78" y2="40" stroke="white" strokeWidth="5" />
            <line x1="2" y1="40" x2="78" y2="40" stroke="#C8102E" strokeWidth="3" />
            <line x1="40" y1="2" x2="40" y2="78" stroke="white" strokeWidth="5" />
            <line x1="40" y1="2" x2="40" y2="78" stroke="#C8102E" strokeWidth="3" />
          </g>
          <circle cx="40" cy="40" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </svg>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#041C24', letterSpacing: -0.5 }}>Politiscope</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(4,28,36,0.5)', marginTop: 6 }}>Loading…</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 28 }}>
          {[0, 0.2, 0.4].map((d, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(4,28,36,0.25)',
                animation: 'dp 1.4s ease-in-out infinite',
                animationDelay: `${d}s`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes dp{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>
      </div>
    )
  }

  const common = {
    T,
    nav,
    goBack,
    goHome: closeExpanded,
    closeSheet: closeExpanded,
    parties: PARTIES_WITH_LEADERS,
    meta: META,
    news: NEWS,
    showToast,
    updateCurrentParams,
    councilRegistry: COUNCIL_REGISTRY,
    councilStatus: COUNCIL_STATUS,
    councilEditorial: COUNCIL_EDITORIAL,
    pollContext: POLL_CONTEXT,
    parliament: PARLIAMENT,
    dataState: appData?.dataState || {},
  }

  const renderScreen = (s, p = {}) => {
    switch (s) {
      case 'polls':
        return <PollsScreen {...common} polls={POLLS_HISTORY} initialTab={p.tab || 'snapshot'} />
      case 'pollDetail':
        return <PollDetailScreen {...common} poll={p.poll} />
      case 'pollster':
        return <PollsterScreen {...common} pollster={p.pollster} polls={POLLS_HISTORY} />
      case 'parties':
        return <PartiesScreen {...common} polls={POLLS} leaders={LEADERS} trends={TRENDS} policyRecords={POLICY_RECORDS_DATA || undefined} />
      case 'party':
        return (
          <PartyScreen
            {...common}
            idx={p.idx ?? 0}
            from={p.from || 'polls'}
            leaders={LEADERS}
            trends={TRENDS}
            polls={POLLS}
            policyRecords={POLICY_RECORDS_DATA || undefined}
            openTab={p.openTab}
            selectedPolicyArea={p.selectedPolicyArea || p.policyArea}
            policyArea={p.policyArea}
          />
        )
      case 'leaders':
        return <LeadersScreen {...common} leaders={LEADERS} />
      case 'leader':
        return <LeaderScreen {...common} lIdx={p.lIdx ?? 0} leaders={LEADERS} initialTab={p.openTab || p.returnTab} />
      case 'trends':
        return <TrendsScreen {...common} trends={TRENDS} milestones={MILESTONES} />
      case 'demographics':
        return <DemographicsScreen {...common} demographics={DEMO} />
      case 'migration':
        return <MigrationScreen {...common} migration={MIGRATION} policyRecords={POLICY_RECORDS_DATA || undefined} />
      case 'policyCompare':
        return (
          <PolicyCompareScreen
            {...common}
            parties={RAW_PARTIES}
            policyRecords={POLICY_RECORDS_DATA || undefined}
            policyTaxonomy={POLICY_TAXONOMY_DATA || undefined}
            initialArea={p.area || 'immigration'}
            initialTopic={p.topic || 'All'}
          />
        )
      case 'elections':
        return (
          <ElectionsScreen
            {...common}
            elections={ELECTIONS}
            byElections={BY_ELEC}
            councilRegistry={COUNCIL_REGISTRY}
            councilStatus={COUNCIL_STATUS}
            councilEditorial={COUNCIL_EDITORIAL}
            initialTab={p.tab || 'overview'}
            initialSearch={p.search || ''}
            initialLocalFilter={p.localFilter || 'all'}
            initialLocalSort={p.localSort || 'difficulty'}
          />
        )
      case 'council':
        return (
          <CouncilScreen
            {...common}
            name={p.name}
            fromTab={p.fromTab}
            councilRegistry={COUNCIL_REGISTRY}
            councilStatus={COUNCIL_STATUS}
            councilEditorial={COUNCIL_EDITORIAL}
          />
        )
      case 'localvoteguide':
        return (
          <LocalVoteGuideScreen
            {...common}
            councilSlug={p.councilSlug}
            wardSlug={p.wardSlug}
            query={p.query}
          />
        )
      case 'betting':
        return <BettingScreen {...common} betting={BETTING} predictionMarkets={PREDICTION_MARKETS} />
      case 'news':
        return <NewsScreen {...common} news={NEWS} />
      case 'vote':
        return <VoteScreen {...common} parties={PARTIES} />
      case 'compare':
        return (
          <CompareScreen
            {...common}
            leaders={LEADERS}
            policyRecords={POLICY_RECORDS_DATA || undefined}
            initialTab={p.tab || p.policyArea || 'overview'}
            leftParty={p.leftParty}
            rightParty={p.rightParty}
            fromScreen={p.fromScreen}
            fromPartyIdx={p.fromPartyIdx}
            fromLeaderIdx={p.fromLeaderIdx}
            returnTab={p.returnTab}
            returnPolicyArea={p.returnPolicyArea}
          />
        )
      case 'parliament':
        return <ParliamentScreen {...common} />
      case 'quotematch':
        return <QuoteMatchScreen {...common} />
      case 'seatbuilder':
        return <SeatBuilderScreen {...common} parties={PARTIES_WITH_LEADERS} />
      case 'pollpredictor':
        return <PollPredictorScreen {...common} />
      case 'simulator':
        return <GovernmentSimulatorScreen {...common} />
      default:
        return null
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          -webkit-touch-callout: none;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
        }
        input, textarea, [contenteditable] {
          user-select: text;
          -webkit-user-select: text;
          touch-action: auto;
        }
        *:focus { outline: none; }
        ::-webkit-scrollbar { display: none; }
        html, body {
          margin: 0; padding: 0;
          overscroll-behavior: none;
          font-family: 'Outfit', sans-serif;
          height: 100dvh;
          overflow: hidden;
        }
        #root { height: 100dvh; overflow: hidden; }
        @keyframes breathe { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.05);opacity:0.9} }
        @keyframes aiPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.9)} }
        @keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(228,0,59,0.7)} 70%{box-shadow:0 0 0 8px rgba(228,0,59,0)} 100%{box-shadow:0 0 0 0 rgba(228,0,59,0)} }
        @keyframes infoUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        select { appearance: none; -webkit-appearance: none; }
        input[type=range] { accent-color: ${T.pr}; }
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
      `}</style>

      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <AtmoBg T={T} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
          }}
        >
          <HomeScreen
            {...common}
            trends={TRENDS}
            byElections={BY_ELEC}
            migration={MIGRATION}
            betting={BETTING}
            news={NEWS}
            pollContext={POLL_CONTEXT}
            onMenu={() => setMenuOpen(true)}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {expanded && currentNav && (
          <ExpandedCard
            key={expanded.layoutId}
            layoutId={expanded.layoutId}
            T={T}
            onClose={closeExpanded}
            onSwipeBack={goBack}
            resetKey={navResetKey}
          >
            {renderScreen(currentNav.screen, currentNav.params || {})}
          </ExpandedCard>
        )}
      </AnimatePresence>

      <Toast msg={toast} T={T} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} T={T} text={shareText} appUrl={CANONICAL_SHARE_URL} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} T={T} dark={dark} onToggleDark={toggleDark} />
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        T={T}
        dark={dark}
        onToggleDark={toggleDark}
        onAbout={() => {
          setMenuOpen(false)
          setTimeout(() => setAboutOpen(true), 180)
        }}
        onShare={() => {
          setMenuOpen(false)
          setShareText(genShareText())
          setTimeout(() => setShareOpen(true), 180)
        }}
      />
    </>
  )
}
