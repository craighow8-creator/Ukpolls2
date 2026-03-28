import { useState, useEffect, useRef, useCallback } from 'react'
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
import PartiesScreen from './screens/PartiesScreen'
import PartyScreen from './screens/PartyScreen'
import LeadersScreen from './screens/LeadersScreen'
import LeaderScreen from './screens/LeaderScreen'
import TrendsScreen from './screens/TrendsScreen'
import DemographicsScreen from './screens/DemographicsScreen'
import MigrationScreen from './screens/MigrationScreen'
import ElectionsScreen from './screens/ElectionsScreen'
import CouncilScreen from './screens/CouncilScreen'
import BettingScreen from './screens/BettingScreen'
import NewsScreen from './screens/NewsScreen'
import VoteScreen from './screens/VoteScreen'
import CompareScreen from './screens/CompareScreen'
import SwingCalcScreen from './screens/SwingCalcScreen'
import ParliamentScreen from './screens/ParliamentScreen'
import QuoteMatchScreen from './screens/QuoteMatchScreen'
import SeatBuilderScreen from './screens/SeatBuilderScreen'
import PollPredictorScreen from './screens/PollPredictorScreen'
import { getData } from './data/store.js'

export default function App() {
  const { dark, toggle: toggleDark } = useDarkMode()

  const [appData,    setAppData]    = useState(null)
  const [dataReady,  setDataReady]  = useState(false)
  const [themeKey,   setThemeKey]   = useState('reform')
  const [expanded,   setExpanded]   = useState(null)
  const [navStack,   setNavStack]   = useState([])
  const [toast,      setToast]      = useState('')
  const [shareOpen,  setShareOpen]  = useState(false)
  const [shareText,  setShareText]  = useState('')
  const [aboutOpen,  setAboutOpen]  = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const toastRef = useRef()

  // ── Load app data ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const d = await getData()
        if (cancelled) return
        setAppData(d)
        const top = [...(d?.parties || [])].sort((a, b) => b.pct - a.pct)[0]
        if (top) setThemeKey(partyTheme(top.name))
      } catch (e) {
        console.error('App data load failed', e)
        // dataReady still becomes true via finally — app shows with empty data
      } finally {
        if (!cancelled) setDataReady(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Derived data ───────────────────────────────────────────
  const META       = appData?.meta        || {}
  const PARTIES    = appData?.parties     || []
  const TRENDS     = appData?.trends      || []
  const POLLS      = appData?.polls       || []
  const LEADERS    = appData?.leaders     || []
  const DEMO       = appData?.demographics || {}
  const MIGRATION  = appData?.migration   || {}
  const BY_ELEC    = appData?.byElections || { upcoming: [], recent: [] }
  const ELECTIONS  = appData?.elections   || {}
  const BETTING    = appData?.betting     || { odds: [] }
  const MILESTONES = appData?.milestones  || []

  // FIX: was referencing undefined 'parties' — must use PARTIES
  const PARTIES_WITH_LEADERS = PARTIES.map(p => ({
    ...p,
    _leader: (LEADERS || []).find(
      l => (l.party || '').toLowerCase() === (p.name || '').toLowerCase()
    ) || null,
  }))

  // ── Navigation ─────────────────────────────────────────────
  const closeExpanded = useCallback(() => {
    setExpanded(null)
    setNavStack([])
    const top = [...PARTIES].sort((a, b) => b.pct - a.pct)[0]
    if (top) setThemeKey(partyTheme(top.name))
  }, [PARTIES])

  const nav = useCallback((screen, params = {}) => {
    const layoutId = params.layoutId || screen
    if (screen === 'party' && params.idx !== undefined)
      setThemeKey(partyTheme(PARTIES[params.idx]?.name))
    else if (screen === 'leader' && params.lIdx !== undefined)
      setThemeKey(partyTheme(LEADERS[params.lIdx]?.party))
    if (screen === 'home') {
      setExpanded(null); setNavStack([])
      const top = [...PARTIES].sort((a, b) => b.pct - a.pct)[0]
      if (top) setThemeKey(partyTheme(top.name))
      return
    }
    if (expanded) { setNavStack(s => [...s, { screen, params }]); return }
    setExpanded({ screen, params, layoutId })
    setNavStack([])
  }, [expanded, PARTIES, LEADERS])

  const goBack = useCallback(() => {
    if (navStack.length > 0) setNavStack(s => s.slice(0, -1))
    else setExpanded(null)
  }, [navStack])

  useEffect(() => {
    const onPop = () => {
      if (expanded) {
        if (navStack.length > 0) setNavStack(s => s.slice(0, -1))
        else closeExpanded()
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [expanded, navStack, closeExpanded])

  useEffect(() => {
    if (expanded) window.history.pushState({ expanded: true }, '')
  }, [expanded])

  // ── Derived theme + helpers ────────────────────────────────
  const T = getTheme(themeKey === 'reform' ? 'Reform UK' : themeKey, dark)
  const currentNav = navStack.length > 0 ? navStack[navStack.length - 1] : expanded

  const showToast = (msg) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(''), 2600)
  }

  const genShareText = () => {
    const sorted = [...PARTIES].sort((a, b) => b.pct - a.pct)
    const snap = sorted.filter(p => p.name !== 'Other').map(p => `${p.abbr} ${p.pct}%`).join(' · ')
    const days = Math.max(0, Math.ceil((new Date('2026-05-07') - new Date()) / 86400000))
    return `UK polls (${META.fetchDate || ''}):\n${snap}\n\n${days} days to local elections\n\n${META.appUrl || ''}`
  }

  // FIX: show splash while loading instead of blank null
  if (!dataReady) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'linear-gradient(175deg, #e8f8fc 0%, #cdf0f7 40%, #a8e4f0 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
      }}>
        <svg width="72" height="72" viewBox="0 0 80 80" style={{ marginBottom: 20 }}>
          <defs>
            <radialGradient id="sg" cx="32%" cy="26%" r="72%">
              <stop offset="0%" stopColor="#0d4a5c"/>
              <stop offset="100%" stopColor="#020c12"/>
            </radialGradient>
            <clipPath id="sc"><circle cx="40" cy="40" r="38"/></clipPath>
          </defs>
          <circle cx="40" cy="40" r="38" fill="url(#sg)"/>
          <g clipPath="url(#sc)">
            <line x1="2" y1="2" x2="78" y2="78" stroke="white" strokeWidth="14"/>
            <line x1="78" y1="2" x2="2" y2="78" stroke="white" strokeWidth="14"/>
            <line x1="2" y1="2" x2="78" y2="78" stroke="#C8102E" strokeWidth="8"/>
            <line x1="78" y1="2" x2="2" y2="78" stroke="#C8102E" strokeWidth="8"/>
            <line x1="2" y1="40" x2="78" y2="40" stroke="white" strokeWidth="5"/>
            <line x1="2" y1="40" x2="78" y2="40" stroke="#C8102E" strokeWidth="3"/>
            <line x1="40" y1="2" x2="40" y2="78" stroke="white" strokeWidth="5"/>
            <line x1="40" y1="2" x2="40" y2="78" stroke="#C8102E" strokeWidth="3"/>
          </g>
          <circle cx="40" cy="40" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
        </svg>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#041C24', letterSpacing: -0.5 }}>Politiscope</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(4,28,36,0.5)', marginTop: 6 }}>Loading…</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 28 }}>
          {[0, 0.2, 0.4].map((d, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%', background: 'rgba(4,28,36,0.25)',
              animation: 'dp 1.4s ease-in-out infinite', animationDelay: `${d}s`,
            }}/>
          ))}
        </div>
        <style>{`@keyframes dp{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>
      </div>
    )
  }

  const common = {
    T, nav, goBack,
    goHome: closeExpanded,
    closeSheet: closeExpanded,
    parties: PARTIES_WITH_LEADERS,
    meta: META,
    showToast,
  }

  const renderScreen = (s, p = {}) => {
    switch (s) {
      case 'polls':        return <PollsScreen         {...common} polls={POLLS}/>
      case 'parties':      return <PartiesScreen        {...common} polls={POLLS} leaders={LEADERS} trends={TRENDS}/>
      case 'party':        return <PartyScreen          {...common} idx={p.idx??0} from={p.from||'polls'} leaders={LEADERS} trends={TRENDS} polls={POLLS}/>
      case 'leaders':      return <LeadersScreen        {...common} leaders={LEADERS}/>
      case 'leader':       return <LeaderScreen         {...common} lIdx={p.lIdx??0} leaders={LEADERS}/>
      case 'trends':       return <TrendsScreen         {...common} trends={TRENDS} milestones={MILESTONES}/>
      case 'demographics': return <DemographicsScreen   {...common} demographics={DEMO}/>
      case 'migration':    return <MigrationScreen      {...common} migration={MIGRATION}/>
      case 'elections':    return <ElectionsScreen      {...common} elections={ELECTIONS}/>
      case 'council':      return <CouncilScreen        {...common} name={p.name}/>
      case 'betting':      return <BettingScreen        {...common} betting={BETTING}/>
      case 'news':         return <NewsScreen           {...common}/>
      case 'vote':         return <VoteScreen           {...common} parties={PARTIES}/>
      case 'compare':      return <CompareScreen        {...common} leaders={LEADERS}/>
      case 'swingcalc':    return <SwingCalcScreen      {...common}/>
      case 'parliament':   return <ParliamentScreen     {...common}/>
      case 'quotematch':   return <QuoteMatchScreen     {...common}/>
      case 'seatbuilder':  return <SeatBuilderScreen    {...common} parties={PARTIES_WITH_LEADERS}/>
      case 'pollpredictor':return <PollPredictorScreen  {...common}/>
      default:             return null
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
        <AtmoBg T={T}/>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          overflowY: 'auto', overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none',
        }}>
          <HomeScreen
            {...common}
            trends={TRENDS}
            byElections={BY_ELEC}
            migration={MIGRATION}
            betting={BETTING}
            onMenu={() => setMenuOpen(true)}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {expanded && currentNav && (
         <ExpandedCard key={expanded.layoutId} layoutId={expanded.layoutId} T={T} onClose={closeExpanded}>
            {renderScreen(currentNav.screen, currentNav.params || {})}
          </ExpandedCard>
        )}
      </AnimatePresence>

      <Toast msg={toast} T={T}/>
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} T={T} text={shareText} appUrl={META.appUrl}/>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} T={T} dark={dark} onToggleDark={toggleDark}/>
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        T={T} dark={dark}
        onToggleDark={toggleDark}
        onAbout={() => { setMenuOpen(false); setTimeout(() => setAboutOpen(true), 180) }}
        onShare={() => { setMenuOpen(false); setShareText(genShareText()); setTimeout(() => setShareOpen(true), 180) }}
      />
    </>
  )
}
