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
    council?.seatsTotal ||
    council?.seats ||
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
    seats:
      pipeline?.seats ||
      (seatsTotal ? { ...(profile?.seats || {}), total: seatsTotal } : profile?.seats) ||
      null,
    seatsUp: pipeline?.seatsUp ?? council?.seatsUp ?? profile?.seatsUp ?? null,
    majority: pipeline?.majority ?? council?.majority ?? profile?.majority ?? null,
    lastFought: pipeline?.lastFought ?? council?.lastFought ?? profile?.lastFought ?? null,
    difficulty: pipeline?.difficulty || council?.difficulty || profile?.difficulty || '',
    verdict: pipeline?.verdict || council?.verdict || profile?.verdict || '',
    watchFor: pipeline?.watchFor || council?.watchFor || profile?.watchFor || '',
    cycle: pipeline?.cycle || council?.cycle || profile?.cycle || '',
    targetParty: pipeline?.targetParty || council?.targetParty || profile?.targetParty || '',
    updatedAt: pipeline?.updatedAt || council?.updatedAt || profile?.updatedAt || pipeline?.lastVerifiedAt || '',
    source: pipeline?.verificationSourceType || council?.source || profile?.source || '',
    leader: pipeline?.leader || pipeline?.mayor || council?.leader || profile?.leader || '',
    keyIssue: pipeline?.keyIssue || council?.keyIssue || profile?.keyIssue || '',
    prediction: pipeline?.prediction || council?.prediction || profile?.prediction || '',
    lastElection: pipeline?.lastElection || council?.lastElection || profile?.lastElection || '',
    website: pipeline?.officialWebsite || pipeline?.website || council?.website || profile?.website || '',
    electionStatus: pipeline?.electionStatus || council?.electionStatus || profile?.electionStatus || '',
    electionMessage: pipeline?.electionMessage || council?.electionMessage || profile?.electionMessage || '',
    nextElectionYear: pipeline?.nextElectionYear || council?.nextElectionYear || profile?.nextElectionYear || '',
    electionsPage: pipeline?.electionsPage || council?.electionsPage || profile?.electionsPage || '',
    wikipedia: pipeline?.wikipedia || council?.wikipedia || profile?.wikipedia || '',
    profileUrl: pipeline?.profileUrl || council?.profileUrl || profile?.profileUrl || '',
  }
}

function sectionHeadingStyle(T) {
  return {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color: T.tl,
    marginBottom: 8,
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
  const type = cleanText(profile?.type).toLowerCase()
  const leader = cleanText(profile?.leader).toLowerCase()
  if (type.includes('mayoral') || leader.includes('mayor')) return 'Mayoral executive'
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
  if (profile?.electionMessage) return profile.electionMessage
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

function detailRows(profile) {
  return [
    { label: 'Seats total', value: profile?.seats?.total },
    { label: 'Seats up', value: seatsUpLabel(profile) },
    { label: 'Governance model', value: governanceModelLabel(profile) },
    { label: 'Cycle', value: cycleLabel(profile) },
    { label: 'Control status', value: controlStatusLabel(profile) },
  ].filter((row) => cleanText(row.value))
}

function linkRows(profile) {
  return [
    { label: 'Council website', href: profile?.website },
    { label: 'Elections page', href: profile?.electionsPage },
    { label: 'Wikipedia', href: profile?.wikipedia },
    { label: 'Official profile', href: profile?.profileUrl },
  ].filter((row) => cleanText(row.href))
}

function DetailCell({ T, label, value, color, span = false }) {
  return (
    <div
      style={{
        gridColumn: span ? '1 / -1' : 'auto',
        borderRadius: 12,
        padding: '10px 11px',
        background: T.c1 || 'rgba(0,0,0,0.03)',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.tl }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: color || T.th, lineHeight: 1.45, marginTop: 4 }}>
        {value}
      </div>
    </div>
  )
}

function SnapshotCell({ T, label, value, accent }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '11px 10px',
        background: T.c1 || 'rgba(0,0,0,0.03)',
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        textAlign: 'left',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.tl }}>
        {label}
      </div>
      <div
        style={{
          fontSize: label === 'Seats total' || label === 'Seats up' ? 18 : 13,
          fontWeight: 800,
          color: accent || T.th,
          lineHeight: 1.3,
          marginTop: 5,
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
      borderRadius: 14, marginBottom: 10,
      background: T.c0 || '#fff',
      border: `1px solid ${color ? `${color}28` : T.cardBorder || 'rgba(0,0,0,0.07)'}`,
      overflow: 'hidden', position: 'relative',
    }}>
      {color && <div style={{ height: 3, background: color }} />}
      <div style={{ padding: '13px 14px' }}>
        {children}
      </div>
    </div>
  )
}

export default function CouncilScreen({ T, name, goBack, fromTab, councilRegistry = [], councilStatus = [], councilEditorial = [] }) {
  const p = mergeCouncilProfile(name, councilRegistry, councilStatus, councilEditorial)
  const controlColor = p ? (CONTROL_COLORS[p.control] || T.tl) : T.tl
  const diffColor = p ? (DIFF_COLORS[p.difficulty] || T.pr || T.tl) : T.tl
  const verdictColor = p ? partyColorFromText(p.verdict, diffColor) : diffColor
  const snapshotRows = p ? detailRows(p) : []
  const links = p ? linkRows(p) : []
  const statusLabel = p ? electionStatusLabel(p) : ''
  const nextElectionLabel = p?.nextElectionYear ? `Next election ${p.nextElectionYear}` : ''
  const electionInfo = p ? nextElectionInfo(p) : ''

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
        <div style={{ padding: '12px 14px 40px' }}>

          {!p ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.tl, fontSize: 14 }}>
              No profile for {name}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: T.th, marginBottom: 4, lineHeight: 1.1, textAlign: 'center' }}>
                {name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.tl, marginBottom: 10, textAlign: 'center', lineHeight: 1.5 }}>
                {[
                  cleanText(p.region),
                  cleanText(p.type),
                  controlStatusLabel(p),
                ].filter(Boolean).join(' · ')}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {statusLabel ? (
                  <span style={{
                    fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 999,
                    background: `${T.pr}18`, color: T.pr,
                  }}>{statusLabel}</span>
                ) : null}
                {nextElectionLabel ? (
                  <span style={{
                    fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 999,
                    background: `${T.tl}16`, color: T.tl,
                  }}>{nextElectionLabel}</span>
                ) : null}
              </div>

              <Card T={T} color={controlColor}>
                <div style={sectionHeadingStyle(T)}>Council identity</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {[
                    { label: 'Region', value: p.region },
                    { label: 'Council type', value: p.type, span: true },
                    { label: 'Current control', value: controlStatusLabel(p), color: controlColor },
                    { label: 'Election status', value: statusLabel || 'Current cycle' },
                    { label: 'Next election year', value: p.nextElectionYear },
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

              <Card T={T}>
                <div style={sectionHeadingStyle(T)}>Snapshot</div>
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

              {(p.verdict || p.difficulty || p.watchFor || p.keyIssue) ? (
                <Card T={T} color={diffColor}>
                  <div style={sectionHeadingStyle(T)}>
                    Political briefing
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: (p.watchFor || p.keyIssue) ? 10 : 0 }}>
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
                  {p.watchFor ? (
                    <div style={{ marginBottom: p.keyIssue ? 10 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.tl }}>
                        Watch for
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.th, lineHeight: 1.65, marginTop: 4 }}>
                        {p.watchFor}
                      </div>
                    </div>
                  ) : null}
                  {p.keyIssue ? (
                    <div style={{ paddingTop: p.watchFor ? 2 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.tl }}>
                        Key issue
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.tl, lineHeight: 1.6, marginTop: 3 }}>
                        {p.keyIssue}
                      </div>
                    </div>
                  ) : null}
                </Card>
              ) : null}

              {(electionInfo || cycleLabel(p) || seatsUpLabel(p) || p.lastElection) ? (
                <Card T={T}>
                  <div style={sectionHeadingStyle(T)}>Election details</div>
                  {electionInfo ? (
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.th, lineHeight: 1.6, textAlign: 'center', marginBottom: 10 }}>
                      {electionInfo}
                    </div>
                  ) : null}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                    {[
                      { label: 'Next election', value: p.nextElectionYear ? `${p.nextElectionYear}` : '' },
                      { label: 'Cycle', value: cycleLabel(p) },
                      { label: 'Seats up', value: seatsUpLabel(p) },
                      { label: 'Last election', value: p.lastElection, span: true },
                    ].filter((row) => cleanText(row.value)).map((row) => (
                      <DetailCell key={row.label} T={T} label={row.label} value={row.value} span={row.span} />
                    ))}
                  </div>
                </Card>
              ) : null}

              {(links.length || p.updatedAt || p.source) ? (
                <Card T={T}>
                  <div style={sectionHeadingStyle(T)}>Links and sources</div>
                  {links.length ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.tl, textAlign: 'center', marginBottom: 8 }}>
                        Official links
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: (p.updatedAt || p.source) ? 12 : 0 }}>
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
                  {(p.updatedAt || p.source) ? (
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, textAlign: 'center', lineHeight: 1.5, borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`, paddingTop: 10 }}>
                      {p.updatedAt ? `Updated ${p.updatedAt}` : ''}{p.updatedAt && p.source ? ' · ' : ''}{p.source || ''}
                    </div>
                  ) : null}
                </Card>
              ) : null}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
