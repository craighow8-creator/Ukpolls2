// ── Easing curves ─────────────────────────────────────────
export const EZ = 'cubic-bezier(0.2,0,0,1)'           // M3 standard
export const SP = 'cubic-bezier(0.34,1.56,0.64,1)'    // M3 expressive spring

// ── Border radii ──────────────────────────────────────────
export const R = {
  card: '28px',
  sm:   '16px',
  pill: '999px',
  img:  '12px',
}

// ── Spacing ───────────────────────────────────────────────
export const SPACING = {
  cardPad:  20,
  gutter:   16,
  gutterMd: 20,
  gutterLg: 24,
}

// ── Typography scale (M3 Expressive) ─────────────────────
export const TYPE = {
  heroMetric:  { fontSize:'clamp(72px,10vw,140px)', fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.1 },
  heroContext: { fontSize:14, fontWeight:500, letterSpacing:'0.01em', lineHeight:1.4 },
  bentoLabel:  { fontSize:13, fontWeight:600, letterSpacing:'0.02em', lineHeight:1.4 },
  bentoPrimary:{ fontSize:28, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.1 },
  bentoSecond: { fontSize:14, fontWeight:500, letterSpacing:0, lineHeight:1.4 },
  carouselTop: { fontSize:13, fontWeight:500, letterSpacing:0, lineHeight:1.4 },
  carouselHigh:{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.1 },
  carouselLow: { fontSize:14, fontWeight:500, letterSpacing:0, lineHeight:1.4 },
}

// ── Responsive grid columns ───────────────────────────────
export const COLS = {
  xs:  2,
  sm:  3,
  md:  4,
  lg:  5,
  xl:  6,
}

// ── API/runtime configuration ─────────────────────────────
export const WORKER = 'https://throbbing-base-05b6.craighow8.workers.dev'
export const APP_TOKEN = 'afc1e6a1834e52b57a583ad850daeb3e5d41440952946f594b20fb3c9dc96542'
export const APP_VERSION = 'v21V2.04'
export const APP_UPDATED = '08 Apr 2026'

const PROD_API_BASE = 'https://politiscope-api.craighow8.workers.dev'
const LOCAL_API_BASE = 'http://127.0.0.1:8787'

function readEnv(name) {
  if (typeof import.meta === 'undefined' || !import.meta.env) return ''
  return String(import.meta.env[name] || '').trim()
}

function getRuntimeHostname() {
  if (typeof window === 'undefined' || !window.location) return ''
  return String(window.location.hostname || '').trim().toLowerCase()
}

function resolveApiBase() {
  const explicit = readEnv('VITE_API_BASE')
  if (explicit) return explicit.replace(/\/$/, '')

  const isDev = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV
  const hostname = getRuntimeHostname()
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'

  if (isDev || isLocalHost) return LOCAL_API_BASE
  return PROD_API_BASE
}

export const API_BASE = resolveApiBase()
