import React from 'react'
/**
 * CouncilScreen — standalone council detail screen.
 * Reached via nav('council', { name }). Back via goBack().
 */
import { motion } from 'framer-motion'
import { ScrollArea } from '../components/ui'
import { COUNCIL_PROFILES, LOCAL_ELECTIONS } from '../data/elections'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const CONTROL_COLORS = {
  Con: '#0087DC', Lab: '#E4003B', LD: '#FAA61A', Grn: '#02A95B',
  Reform: '#12B7D4', NOC: '#6b7280', SNP: '#C4922A', PC: '#3F8428', Ind: '#9CA3AF',
}

const DIFF_COLORS = {
  'very hard': '#E4003B',
  hard: '#F97316',
  medium: '#EAB308',
  safe: '#02A95B',
}


function partyColorFromText(text, fallback) {
  const value = cleanText(text).toLowerCase()
  if (!value) return fallback

  if (value.includes('lab')) return CONTROL_COLORS.Lab
  if (value.includes('labour')) return CONTROL_COLORS.Lab
  if (value.includes('reform')) return CONTROL_COLORS.Reform
  if (value.includes('con')) return CONTROL_COLORS.Con
  if (value.includes('conservative')) return CONTROL_COLORS.Con
  if (value.includes('ld')) return CONTROL_COLORS.LD
  if (value.includes('lib dem')) return CONTROL_COLORS.LD
  if (value.includes('liberal democrat')) return CONTROL_COLORS.LD
  if (value.includes('green')) return CONTROL_COLORS.Grn
  if (value.includes('grn')) return CONTROL_COLORS.Grn
  if (value.includes('noc')) return CONTROL_COLORS.NOC
  if (value.includes('ind')) return CONTROL_COLORS.Ind
  return fallback
}

function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function uniqueValues(values = []) {
  return [...new Set((values || []).map((value) => cleanText(value)).filter(Boolean))]
}

function formatUkDate(value) {
  const text = cleanText(value)
  if (!text) return ''

  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    return text
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [yyyy, mm, dd] = text.split('-').map(Number)
    const date = new Date(Date.UTC(yyyy, mm - 1, dd))
    if (Number.isNaN(date.getTime())) return text
    return `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}-${yyyy}`
  }

  return text
}

function formatDatesInText(value) {
  const text = cleanText(value)
  if (!text) return ''

  return text
    .replace(/\b(\d{2}-\d{2}-\d{4})\b/g, (match) => formatUkDate(match))
    .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (match) => formatUkDate(match))
}

function normalizeSeats(rawSeats, seatsTotal) {
  if (rawSeats && typeof rawSeats === 'object' && !Array.isArray(rawSeats)) {
    return {
      ...rawSeats,
      total: rawSeats.total ?? seatsTotal ?? null,
    }
  }

  const total = rawSeats ?? seatsTotal
  return total != null ? { total } : null
}

function distinctText(primary, secondary) {
  return cleanText(primary).toLowerCase() !== cleanText(secondary).toLowerCase()
}

function findCouncilRecord(name) {
  const councils = LOCAL_ELECTIONS?.councils || []
  return councils.find((c) => cleanText(c.name).toLowerCase() === cleanText(name).toLowerCase()) || null
}

function slugifyCouncilName(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findPipelineCouncil(name, registry = [], status = [], editorial = []) {
  const slug = slugifyCouncilName(name)
  const out = { slug }
  let found = false

  for (const row of [...(registry || []), ...(status || []), ...(editorial || [])]) {
    const rowSlug = row?.slug || slugifyCouncilName(row?.name)
    if (rowSlug !== slug) continue
    Object.assign(out, row)
    found = true
  }

  return found ? out : null
}

function mergeCouncilProfile(name, registry = [], status = [], editorial = []) {
  const profile = COUNCIL_PROFILES?.[name] || null
  const council = findCouncilRecord(name)
  const pipeline = findPipelineCouncil(name, registry, status, editorial)

  if (!profile && !council && !pipeline) return null

  const seatsTotal =
    pipeline?.seatsTotal ||
    pipeline?.seats?.total ||
    council?.seatsTotal ||
    council?.seats ||
    council?.seats?.total ||
    profile?.seatsTotal ||
    profile?.seats?.total ||
    null

  return {
    ...profile,
    ...council,
    ...pipeline,
    name: pipeline?.name || council?.name || profile?.name || name,
    control: pipeline?.control || council?.control || profile?.control || '',
    type: pipeline?.type || council?.type || profile?.type || '',
    region: pipeline?.region || council?.region || profile?.region || '',
    governanceModel: pipeline?.governanceModel || council?.governanceModel || profile?.governanceModel || '',
    seatsTotal,
    seats: normalizeSeats(pipeline?.seats || council?.seats || profile?.seats, seatsTotal),
    seatsUp: pipeline?.seatsUp ?? council?.seatsUp ?? profile?.seatsUp ?? null,
    majority: pipeline?.majority ?? council?.majority ?? profile?.majority ?? null,
    lastFought: pipeline?.lastFought ?? council?.lastFought ?? profile?.lastFought ?? null,
    difficulty: pipeline?.difficulty || council?.difficulty || profile?.difficulty || '',
    verdict: pipeline?.verdict || council?.verdict || profile?.verdict || '',
    watchFor: pipeline?.watchFor || council?.watchFor || profile?.watchFor || '',
    cycle: pipeline?.cycle || council?.cycle || profile?.cycle || '',
    targetParty: pipeline?.targetParty || council?.targetParty || profile?.targetParty || '',
    updatedAt: pipeline?.updatedAt || council?.updatedAt || profile?.updatedAt || pipeline?.lastVerifiedAt || '',
    verificationSourceType: pipeline?.verificationSourceType || council?.verificationSourceType || profile?.verificationSourceType || '',
    source: pipeline?.verificationSourceType || council?.source || profile?.source || '',
    leader: pipeline?.leader || council?.leader || profile?.leader || '',
    mayor: pipeline?.mayor || council?.mayor || profile?.mayor || '',
    administration: pipeline?.administration || council?.administration || profile?.administration || '',
    composition: pipeline?.composition || council?.composition || profile?.composition || null,
    notes: pipeline?.notes || council?.notes || profile?.notes || '',
    keyIssue: pipeline?.keyIssue || council?.keyIssue || profile?.keyIssue || '',
    prediction: pipeline?.prediction || council?.prediction || profile?.prediction || '',
    lastElection: pipeline?.lastElection || council?.lastElection || profile?.lastElection || '',
    officialWebsite: pipeline?.officialWebsite || council?.officialWebsite || profile?.officialWebsite || pipeline?.website || council?.website || profile?.website || '',
    officialElectionsUrl: pipeline?.officialElectionsUrl || council?.officialElectionsUrl || profile?.officialElectionsUrl || pipeline?.electionsPage || council?.electionsPage || profile?.electionsPage || '',
    officialCompositionUrl: pipeline?.officialCompositionUrl || council?.officialCompositionUrl || profile?.officialCompositionUrl || '',
    website: pipeline?.officialWebsite || pipeline?.website || council?.website || profile?.website || '',
    electionStatus: pipeline?.electionStatus || council?.electionStatus || profile?.electionStatus || '',
    electionMessage: pipeline?.electionMessage || council?.electionMessage || profile?.electionMessage || '',
    nextElectionYear: pipeline?.nextElectionYear || council?.nextElectionYear || profile?.nextElectionYear || '',
    electionsPage: pipeline?.officialElectionsUrl || pipeline?.electionsPage || council?.officialElectionsUrl || council?.electionsPage || profile?.officialElectionsUrl || profile?.electionsPage || '',
    wikipedia: pipeline?.wikipedia || council?.wikipedia || profile?.wikipedia || '',
    profileUrl: pipeline?.profileUrl || council?.profileUrl || profile?.profileUrl || '',
    sourceUrls: uniqueValues([
      ...(Array.isArray(pipeline?.sourceUrls) ? pipeline.sourceUrls : []),
      ...(Array.isArray(council?.sourceUrls) ? council.sourceUrls : []),
      ...(Array.isArray(profile?.sourceUrls) ? profile.sourceUrls : []),
    ]),
  }
}

function sectionHeadingStyle(T) {
  return {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: T.tl,
    marginBottom: 10,
    textAlign: 'center',
  }
}

function controlStatusLabel(profile) {
  if (!profile) return ''
  if (profile.noc || cleanText(profile.control).toUpperCase() === 'NOC') return 'No overall control'
  if (!profile.control) return ''
  return `${profile.control} control`
}

function electionStatusLabel(profile) {
  if (!profile) return ''
  if (profile.electionStatus === 'not-voting-2026') return 'Not voting in 2026'
  if (profile.seatsUp === 0 && profile.nextElectionYear) return `Next vote in ${profile.nextElectionYear}`
  if (profile.electionStatus) return cleanText(profile.electionStatus).replace(/-/g, ' ')
  if (profile.seatsUp != null) return 'Voting in current cycle'
  return ''
}

function governanceModelLabel(profile) {
  const explicit = cleanText(profile?.governanceModel)
  if (explicit) return explicit

  const type = cleanText(profile?.type).toLowerCase()
  const executiveLeader = cleanText(profile?.leader || profile?.mayor).toLowerCase()
  if (type.includes('mayoral') || executiveLeader.includes('mayor')) return 'Mayoral executive'
  if (type.includes('committee')) return 'Committee system'
  return 'Leader and cabinet'
}

function cycleLabel(profile) {
  const cycle = cleanText(profile?.cycle).toLowerCase()
  if (cycle === 'by-thirds') return 'Elections by thirds'
  if (cycle === 'all-out') return 'All-out elections'
  if (cycle) return cleanText(profile.cycle)
  if (profile?.seatsUp != null && profile?.seats?.total && Number(profile.seatsUp) === Number(profile.seats.total)) return 'All-out elections'
  return ''
}

function seatsUpLabel(profile) {
  const total = Number(profile?.seats?.total || 0)
  const up = profile?.seatsUp
  if (up == null) return ''
  if (Number(up) === 0) return 'No seats scheduled this cycle'
  if (total && Number(up) === total) return 'All seats up'
  return total ? `${up} of ${total} seats up` : `${up} seats up`
}

function nextElectionInfo(profile) {
  if (profile?.electionMessage) return formatDatesInText(profile.electionMessage)
  if (profile?.nextElectionYear && profile?.electionStatus === 'not-voting-2026') {
    return `This council is not voting in 2026 and next returns to the polls in ${profile.nextElectionYear}.`
  }
  if (profile?.nextElectionYear) {
    return `The next scheduled election year is ${profile.nextElectionYear}.`
  }
  if (profile?.cycle) {
    return `This council uses ${cycleLabel(profile).toLowerCase()}.`
  }
  return ''
}

function councilSnapshotRows(profile) {
  return [
    { label: 'Seats total', value: profile?.seats?.total },
    { label: 'Seats up', value: seatsUpLabel(profile) },
    { label: 'Control status', value: controlStatusLabel(profile) },
    { label: 'Governance model', value: governanceModelLabel(profile) },
    { label: 'Cycle', value: cycleLabel(profile) },
    { label: 'Next election', value: profile?.nextElectionYear ? `${profile.nextElectionYear}` : '' },
    { label: 'Election status', value: electionStatusLabel(profile) },
  ].filter((row) => cleanText(row.value))
}

function compositionRows(composition) {
  if (!composition) return []

  if (Array.isArray(composition)) {
    return composition
      .map((row) => {
        const party = cleanText(row?.party || row?.name || row?.label || row?.group || row?.key)
        const seats = Number(row?.seats ?? row?.count ?? row?.value ?? row?.total)
        return party && Number.isFinite(seats) ? { party, seats } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.seats - a.seats)
  }

  if (typeof composition === 'object') {
    return Object.entries(composition)
      .map(([party, seats]) => {
        const label = cleanText(party)
        const count = Number(seats)
        return label && Number.isFinite(count) ? { party: label, seats: count } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.seats - a.seats)
  }

  return []
}

function majorityThreshold(totalSeats) {
  const total = Number(totalSeats)
  if (!Number.isFinite(total) || total <= 0) return null
  return Math.floor(total / 2) + 1
}

function formatSeatShare(seats, totalSeats) {
  const total = Number(totalSeats)
  const count = Number(seats)
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(count)) return ''
  return `${Math.round((count / total) * 100)}%`
}

function getControlInsight(profile, rows) {
  const totalSeats = Number(profile?.seats?.total || profile?.seatsTotal || 0)
  const threshold = majorityThreshold(totalSeats)
  const top = Array.isArray(rows) && rows.length ? rows[0] : null
  const second = Array.isArray(rows) && rows.length > 1 ? rows[1] : null
  const controlLabel = cleanText(controlStatusLabel(profile))

  if (!top || !Number.isFinite(totalSeats) || totalSeats <= 0) {
    return {
      headline: cleanText(profile?.administration) || controlLabel || '',
      subline: '',
      threshold,
      majorityMargin: null,
    }
  }

  const topSeats = Number(top.seats)
  const secondSeats = Number(second?.seats ?? 0)
  const dominantParty = cleanText(top.party)
  const leadOverSecond = second ? topSeats - secondSeats : topSeats
  const majorityMargin = Number.isFinite(threshold) ? topSeats - threshold : null

  let headline = `${dominantParty} control the council`
  let subline = `${dominantParty} hold ${topSeats} of ${totalSeats} seats.`

  if (Number.isFinite(majorityMargin)) {
    if (majorityMargin >= 0) {
      headline = `${dominantParty} control the council with a working majority`
      subline = `${dominantParty} hold ${topSeats} of ${totalSeats} seats, ${majorityMargin} above the ${threshold}-seat majority line.`
    } else {
      headline = `${dominantParty} are the largest group but short of a majority`
      subline = `${dominantParty} hold ${topSeats} of ${totalSeats} seats, ${Math.abs(majorityMargin)} short of the ${threshold}-seat majority line.`
    }
  }

  if (controlLabel.toLowerCase().includes('no overall control')) {
    headline = `${dominantParty} are the largest group in a no overall control council`
    subline = Number.isFinite(majorityMargin)
      ? `${dominantParty} hold ${topSeats} of ${totalSeats} seats, ${Math.abs(majorityMargin)} short of the ${threshold}-seat majority line.`
      : `${dominantParty} are ahead, but the council remains under no overall control.`
  }

  if (second && leadOverSecond > 0) {
    subline += ` They lead ${cleanText(second.party)} by ${leadOverSecond} seat${leadOverSecond === 1 ? '' : 's'}.`
  }

  return {
    headline,
    subline,
    threshold,
    majorityMargin,
  }
}


function getCompositionLink(profile) {
  return cleanText(
    profile?.officialCompositionUrl ||
    profile?.officialElectionsUrl ||
    profile?.electionsPage ||
    profile?.officialWebsite ||
    profile?.website
  )
}

function linkRows(profile) {
  const seen = new Set()
  const links = []

  for (const row of [
    { label: 'Council website', href: profile?.website },
    { label: 'Elections page', href: profile?.electionsPage },
    { label: 'Council composition', href: profile?.officialCompositionUrl },
    { label: 'Wikipedia', href: profile?.wikipedia },
    { label: 'Official profile', href: profile?.profileUrl },
  ]) {
    const href = cleanText(row.href)
    if (!href || seen.has(href)) continue
    seen.add(href)
    links.push({ label: row.label, href })
  }

  for (const href of (Array.isArray(profile?.sourceUrls) ? profile.sourceUrls : []).map((url) => cleanText(url)).filter(Boolean)) {
    if (seen.has(href)) continue
    seen.add(href)

    let label = 'Verification source'
    try {
      const { hostname } = new URL(href)
      const host = hostname.replace(/^www\./i, '')
      if (host) label = `Source · ${host}`
    } catch {
      label = 'Verification source'
    }

    links.push({ label, href })
  }

  return links
}

function getCouncilSnapshotMessage(profile) {
  const message = nextElectionInfo(profile)
  const status = electionStatusLabel(profile)
  if (!message) return ''
  if (!distinctText(message, status)) return ''
  return message
}


function getPoliticalControlRows(profile) {
  return [
    { label: 'Leader', value: cleanText(profile?.leader) || 'Not currently listed', type: 'leader' },
    { label: 'Mayor', value: cleanText(profile?.mayor) || 'Not currently listed', type: 'mayor' },
    { label: 'Administration', value: cleanText(profile?.administration) || 'Not currently listed' },
  ]
}

function getPoliticalBriefing(profile) {
  const prediction = formatDatesInText(profile?.prediction)
  const watchFor = formatDatesInText(profile?.watchFor)
  const keyIssue = formatDatesInText(profile?.keyIssue)

  const lead = prediction || watchFor || keyIssue || ''
  const supportCandidates = [
    { label: 'Watch for', value: watchFor },
    { label: 'Key issue', value: keyIssue },
    { label: 'Context', value: prediction },
  ]

  const support = supportCandidates.find((item) => cleanText(item.value) && distinctText(item.value, lead))

  return {
    lead,
    supportingLabel: support?.label || '',
    supportingValue: support?.value || '',
  }
}



function buildPersonDetails(profile, type) {
  const rawValue = cleanText(type === 'leader' ? profile?.leader : profile?.mayor)
  const match = rawValue.match(/^(.*?)\s*\((.*?)\)$/)
  const name = cleanText(match?.[1] || rawValue) || 'Not currently listed'
  const qualifier = cleanText(match?.[2] || '')
  const links = []

  const officialProfile = cleanText(profile?.profileUrl)
  const officialWebsite = cleanText(profile?.officialWebsite || profile?.website)
  const searchQuery = `${name !== 'Not currently listed' ? name + ' ' : ''}${cleanText(profile?.name)} ${type === 'leader' ? 'council leader' : 'mayor'}`
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`

  if (officialProfile) links.push({ label: 'Official profile', href: officialProfile })
  if (officialWebsite) links.push({ label: 'Council website', href: officialWebsite })
  if (searchQuery.trim()) links.push({ label: 'Search', href: searchUrl })

  return {
    type,
    title: type === 'leader' ? 'Council leader' : 'Mayor',
    name,
    qualifier,
    summary:
      name === 'Not currently listed'
        ? `No ${type === 'leader' ? 'leader' : 'mayor'} details are currently stored for this council. The panel is still live so richer profile, biography and contact data can be added later without changing the UI.`
        : type === 'leader'
          ? `Political lead for ${cleanText(profile?.name) || 'this council'}. This panel is ready for richer biography, contact and profile data when the pipeline is expanded.`
          : `Mayoral detail for ${cleanText(profile?.name) || 'this council'}. This panel is ready for richer biography, contact and profile data when the pipeline is expanded.`,
    links,
  }
}

function DetailCell({ T, label, value, color, span = false, infoAction = null, infoLabel = '' }) {
  return (
    <div
      style={{
        gridColumn: span ? '1 / -1' : 'auto',
        borderRadius: 16,
        padding: '14px 14px',
        background: T.c0 || '#fff',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl }}>
          {label}
        </div>
        {typeof infoAction === 'function' ? (
          <button
            type="button"
            onClick={infoAction}
            aria-label={infoLabel || `More information about ${label}`}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}`,
              background: T.c0 || '#fff',
              color: T.pr,
              fontSize: 12,
              fontWeight: 900,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
            }}
          >
            i
          </button>
        ) : null}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: color || T.th, lineHeight: 1.4, marginTop: 6 }}>
        {value}
      </div>
    </div>
  )
}

function SnapshotCell({ T, label, value, accent }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: '14px 14px',
        background: T.c0 || '#fff',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
        textAlign: 'left',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl }}>
        {label}
      </div>
      <div
        style={{
          fontSize: label === 'Seats total' || label === 'Seats up' ? 22 : 15,
          fontWeight: 900,
          color: accent || T.th,
          lineHeight: 1.2,
          marginTop: 7,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Card({ T, color, children }) {
  return (
    <div style={{
      borderRadius: 22,
      marginBottom: 18,
      background: T.c0 || '#fff',
      border: `1px solid ${color ? `${color}22` : T.cardBorder || 'rgba(0,0,0,0.06)'}`,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
    }}>
      {color ? <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}CC)` }} /> : null}
      <div style={{ padding: '18px 18px 17px' }}>
        {children}
      </div>
    </div>
  )
}


function HeroStat({ T, label, value, accent }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: '14px 14px',
        background: T.c0 || '#fff',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        boxShadow: '0 6px 18px rgba(15,23,42,0.05)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl, textAlign: 'center' }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: accent || T.th, lineHeight: 1.1, marginTop: 7, textAlign: 'center' }}>
        {value}
      </div>
    </div>
  )
}

export default function CouncilScreen({ T, name, goBack, fromTab, councilRegistry = [], councilStatus = [], councilEditorial = [] }) {
  const [personModal, setPersonModal] = React.useState(null)
  const p = mergeCouncilProfile(name, councilRegistry, councilStatus, councilEditorial)
  const controlColor = p ? (CONTROL_COLORS[p.control] || T.tl) : T.tl
  const diffColor = p ? (DIFF_COLORS[p.difficulty] || T.pr || T.tl) : T.tl
  const verdictColor = p ? partyColorFromText(p.verdict, diffColor) : diffColor
  const snapshotRows = p ? councilSnapshotRows(p) : []
  const politicalComposition = p ? compositionRows(p.composition) : []
  const politicalControlRows = p ? getPoliticalControlRows(p) : []
  const controlInsight = p ? getControlInsight(p, politicalComposition) : { headline: '', subline: '', threshold: null, majorityMargin: null }
  const compositionLink = p ? getCompositionLink(p) : ''
  const notes = cleanText(p?.notes)
  const links = p ? linkRows(p) : []
  const statusLabel = p ? electionStatusLabel(p) : ''
  const nextElectionLabel = p?.nextElectionYear ? `Next election ${p.nextElectionYear}` : ''
  const snapshotMessage = p ? getCouncilSnapshotMessage(p) : ''
  const briefing = p ? getPoliticalBriefing(p) : { lead: '', supportingLabel: '', supportingValue: '' }
  const sourceMeta = [formatUkDate(p?.updatedAt) ? `Updated ${formatUkDate(p.updatedAt)}` : '', p?.source || p?.verificationSourceType || ''].filter(Boolean).join(' · ')
  const totalSeats = Number(p?.seats?.total || p?.seatsTotal || 0)
  const dominant = politicalComposition[0] || null
  const dominantShare = dominant && totalSeats ? Math.max(4, Math.round((Number(dominant.seats) / totalSeats) * 100)) : 0
  const dominantColor = dominant ? partyColorFromText(dominant.party, controlColor) : controlColor
  const personDetails = personModal && p ? buildPersonDetails(p, personModal) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: T.sf }}>

      {/* Header */}
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <motion.button
          {...TAP}
          onClick={goBack}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: T.c0 || '#fff',
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', outline: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.th} strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
        </motion.button>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
          Elections{fromTab ? ` / ${fromTab}` : ''} / {name}
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: T.cardBorder || 'rgba(0,0,0,0.10)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
          flexShrink: 0,
        }}
      />
      <ScrollArea>
        <div style={{ padding: '18px 18px 48px', maxWidth: 1080, margin: '0 auto' }}>

          {!p ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.tl, fontSize: 14 }}>
              No profile for {name}
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                {p.verdict ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 999,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 900,
                      color: verdictColor,
                      background: `${verdictColor}14`,
                      border: `1px solid ${verdictColor}22`,
                      marginBottom: 12,
                    }}
                  >
                    {p.verdict}
                  </div>
                ) : null}

                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.1, color: T.th, marginBottom: 6, lineHeight: 1.05, textAlign: 'center' }}>
                  {name}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.tl, marginBottom: 14, textAlign: 'center', lineHeight: 1.55 }}>
                  {[
                    cleanText(p.region),
                    cleanText(p.type),
                    controlStatusLabel(p),
                  ].filter(Boolean).join(' · ')}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                  {statusLabel ? (
                    <span style={{
                      fontSize: 12, fontWeight: 900, padding: '6px 10px', borderRadius: 999,
                      background: `${T.pr}18`, color: T.pr,
                    }}>{statusLabel}</span>
                  ) : null}
                  {nextElectionLabel ? (
                    <span style={{
                      fontSize: 12, fontWeight: 900, padding: '6px 10px', borderRadius: 999,
                      background: `${T.tl}16`, color: T.tl,
                    }}>{nextElectionLabel}</span>
                  ) : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  {dominant ? <HeroStat T={T} label="Dominant party" value={dominant.party} accent={dominantColor} /> : <div />}
                  {totalSeats ? <HeroStat T={T} label="Seats total" value={totalSeats} accent={T.pr} /> : <div />}
                  {controlInsight.majorityMargin != null ? (
                    <HeroStat
                      T={T}
                      label={controlInsight.majorityMargin >= 0 ? 'Majority cushion' : 'Short of majority'}
                      value={`${Math.abs(controlInsight.majorityMargin)}`}
                      accent={controlInsight.majorityMargin >= 0 ? dominantColor : diffColor}
                    />
                  ) : <div />}
                </div>
              </div>

              <Card T={T} color={controlColor}>
                <div style={sectionHeadingStyle(T)}>Council identity</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {[
                    { label: 'Region', value: p.region },
                    { label: 'Council type', value: p.type, span: true },
                    { label: 'Current control', value: controlStatusLabel(p), color: controlColor },
                  ].filter((row) => cleanText(row.value)).map((row) => (
                    <DetailCell
                      key={row.label}
                      T={T}
                      label={row.label}
                      value={row.value}
                      color={row.color}
                      span={row.span}
                    />
                  ))}
                </div>
              </Card>

              {(politicalControlRows.length || politicalComposition.length || compositionLink || notes) ? (
                <Card T={T} color={dominantColor}>
                  <div style={sectionHeadingStyle(T)}>Political control</div>

                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: T.th, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
                      {controlInsight.headline || controlStatusLabel(p)}
                    </div>
                    {controlInsight.subline ? (
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.tl, lineHeight: 1.6, marginTop: 7, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
                        {controlInsight.subline}
                      </div>
                    ) : null}
                  </div>

                  {dominant ? (
                    <div
                      style={{
                        borderRadius: 20,
                        padding: '18px 18px 16px',
                        background: `${dominantColor}0F`,
                        border: `1px solid ${dominantColor}20`,
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl }}>
                            Dominant party
                          </div>
                          <div style={{ fontSize: 26, fontWeight: 900, color: dominantColor, lineHeight: 1.1, marginTop: 4 }}>
                            {dominant.party}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 28, fontWeight: 900, color: T.th, lineHeight: 1 }}>
                            {dominant.seats}
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: T.tl, marginTop: 4 }}>
                            seats · {formatSeatShare(dominant.seats, totalSeats)}
                          </div>
                        </div>
                      </div>

                      <div style={{ height: 14, borderRadius: 999, background: T.c1 || 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${dominantShare}%`,
                            height: '100%',
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${dominantColor}, ${dominantColor}CC)`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {politicalControlRows.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: politicalComposition.length ? 14 : 0 }}>
                      {politicalControlRows.map((row) => (
                        <DetailCell
                          key={row.label}
                          T={T}
                          label={row.label}
                          value={row.value}
                          infoAction={row.type ? () => setPersonModal(row.type) : null}
                          infoLabel={row.type ? `More about ${row.value}` : ''}
                        />
                      ))}
                    </div>
                  ) : null}

                  {politicalComposition.length ? (
                    <div>
                      {politicalComposition.map((row, index) => {
                        const share = totalSeats > 0 ? Math.max(4, Math.round((Number(row.seats) / totalSeats) * 100)) : 0
                        const barColor = partyColorFromText(row.party, index === 0 ? dominantColor : controlColor)

                        return (
                          <div
                            key={row.party}
                            style={{
                              padding: '12px 0',
                              borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                <span
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: barColor,
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ fontSize: index === 0 ? 16 : 14, fontWeight: index === 0 ? 900 : 800, color: T.th, lineHeight: 1.35 }}>
                                  {row.party}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
                                <span style={{ fontSize: 14, fontWeight: 900, color: T.th, lineHeight: 1.4 }}>
                                  {row.seats}
                                </span>
                                {totalSeats ? (
                                  <span style={{ fontSize: 11.5, fontWeight: 800, color: T.tl }}>
                                    {formatSeatShare(row.seats, totalSeats)}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div style={{ height: 9, borderRadius: 999, background: T.c1 || 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${share}%`,
                                  height: '100%',
                                  borderRadius: 999,
                                  background: barColor,
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}

                  {compositionLink ? (
                    <div style={{ marginTop: politicalComposition.length || politicalControlRows.length ? 14 : 0, textAlign: 'center' }}>
                      <a
                        href={compositionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 999,
                          padding: '10px 14px',
                          fontSize: 12,
                          fontWeight: 900,
                          color: controlColor,
                          background: `${controlColor}12`,
                          border: `1px solid ${controlColor}24`,
                          textDecoration: 'none',
                        }}
                      >
                        {politicalComposition.length ? 'View official council composition' : 'View full council composition'}
                      </a>
                    </div>
                  ) : null}
                  {notes ? (
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: T.tl, lineHeight: 1.65, marginTop: 12, textAlign: 'center' }}>
                      {notes}
                    </div>
                  ) : null}
                </Card>
              ) : null}

              <Card T={T}>
                <div style={sectionHeadingStyle(T)}>Council snapshot</div>
                {snapshotMessage ? (
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.6, textAlign: 'center', marginBottom: 10 }}>
                    {snapshotMessage}
                  </div>
                ) : null}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {snapshotRows.map((row) => (
                    <SnapshotCell
                      key={row.label}
                      T={T}
                      label={row.label}
                      value={row.value}
                      accent={row.label === 'Control status' ? controlColor : row.label === 'Seats total' || row.label === 'Seats up' ? T.pr : null}
                    />
                  ))}
                </div>
              </Card>

              {(p.verdict || p.difficulty || briefing.lead || briefing.supportingValue) ? (
                <Card T={T} color={diffColor}>
                  <div style={sectionHeadingStyle(T)}>
                    Political briefing
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: briefing.lead || briefing.supportingValue ? 10 : 0 }}>
                    {p.verdict ? (
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 999,
                        background: `${verdictColor}1e`, color: verdictColor,
                      }}>{p.verdict}</span>
                    ) : null}
                    {p.difficulty ? (
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 999,
                        background: `${diffColor}1e`, color: diffColor,
                      }}>{p.difficulty}</span>
                    ) : null}
                  </div>
                  {briefing.lead ? (
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.th, lineHeight: 1.65, marginBottom: briefing.supportingValue ? 10 : 0, textAlign: 'center' }}>
                      {briefing.lead}
                    </div>
                  ) : null}
                  {briefing.supportingValue ? (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl, textAlign: 'center' }}>
                        {briefing.supportingLabel}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.tl, lineHeight: 1.65, marginTop: 6, textAlign: 'center' }}>
                        {briefing.supportingValue}
                      </div>
                    </div>
                  ) : null}
                </Card>
              ) : null}

              {(links.length || sourceMeta) ? (
                <Card T={T}>
                  <div style={sectionHeadingStyle(T)}>Links and sources</div>
                  {links.length ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.tl, textAlign: 'center', marginBottom: 8 }}>
                        Reference links
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: sourceMeta ? 12 : 0 }}>
                      {links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            borderRadius: 999,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 800,
                            color: T.pr,
                            background: `${T.pr}12`,
                            border: `1px solid ${T.pr}24`,
                            textDecoration: 'none',
                          }}
                        >
                          {link.label}
                        </a>
                      ))}
                      </div>
                    </>
                  ) : null}
                  {sourceMeta ? (
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, textAlign: 'center', lineHeight: 1.5, borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`, paddingTop: 10 }}>
                      {sourceMeta}
                    </div>
                  ) : null}
                </Card>
              ) : null}
            </>
          )}
        </div>

      </ScrollArea>

      {personDetails ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.38)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 12,
          }}
          onClick={() => setPersonModal(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 760,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              background: T.c0 || '#fff',
              border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
              boxShadow: '0 -16px 40px rgba(15,23,42,0.18)',
              padding: '18px 18px 22px',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ width: 44, height: 5, borderRadius: 999, background: T.c1 || 'rgba(0,0,0,0.08)', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tl }}>
                  {personDetails.title}
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: T.th, lineHeight: 1.12, marginTop: 6 }}>
                  {personDetails.name}
                </div>
                {personDetails.qualifier ? (
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.pr, lineHeight: 1.45, marginTop: 6 }}>
                    {personDetails.qualifier}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setPersonModal(null)}
                aria-label="Close details"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}`,
                  background: T.c0 || '#fff',
                  color: T.th,
                  fontSize: 18,
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: T.tl, lineHeight: 1.7, marginTop: 14 }}>
              {personDetails.summary}
            </div>

            {personDetails.links.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {personDetails.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      borderRadius: 999,
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 900,
                      color: T.pr,
                      background: `${T.pr}12`,
                      border: `1px solid ${T.pr}24`,
                      textDecoration: 'none',
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
