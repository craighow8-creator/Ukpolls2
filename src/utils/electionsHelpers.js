// Shared Elections helpers.
// These keep the Elections screens lean while preserving the current data flow.

export function cleanText(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

export function formatElectionDate(value) {
  if (!value) return 'Date TBC'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return cleanText(value)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function slugifyCouncilName(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function mergeCouncilLayers(staticCouncils = [], registry = [], status = [], editorial = []) {
  const out = new Map()

  for (const row of registry || []) {
    const slug = row.slug || slugifyCouncilName(row.name)
    if (!slug) continue
    out.set(slug, { ...row, slug })
  }

  for (const row of status || []) {
    const slug = row.slug || slugifyCouncilName(row.name)
    if (!slug) continue
    out.set(slug, { ...(out.get(slug) || {}), ...row, slug })
  }

  for (const row of editorial || []) {
    const slug = row.slug || slugifyCouncilName(row.name)
    if (!slug) continue
    out.set(slug, { ...(out.get(slug) || {}), ...row, slug })
  }

  for (const row of staticCouncils || []) {
    const slug = row.slug || slugifyCouncilName(row.name)
    if (!slug || out.has(slug)) continue
    out.set(slug, { ...row, slug })
  }

  return [...out.values()]
}

// Mayoral helpers are kept here so the Elections screen can stay mostly about
// composition. The underlying data is still hand-maintained for now, and a
// backend-fed mayor dataset can replace these inputs later without changing the
// UI layer.

export function normalizeMayorParty(party) {
  const value = cleanText(party).toLowerCase()
  if (!value) return { key: 'other', label: 'Other' }
  if (value.includes('labour')) return { key: 'labour', label: 'Labour' }
  if (value.includes('conservative')) return { key: 'conservative', label: 'Conservative' }
  if (value.includes('reform')) return { key: 'reform', label: 'Reform' }
  if (value.includes('liberal')) return { key: 'libdem', label: 'Liberal Democrats' }
  if (value.includes('aspire')) return { key: 'aspire', label: 'Aspire' }
  return { key: 'other', label: cleanText(party) || 'Other' }
}

export function createRegionalMayorProfile(row = {}) {
  return {
    name: cleanText(row.name),
    holder: cleanText(row.holder),
    party: cleanText(row.party),
    color: row.color || '#12B7D4',
    status: cleanText(row.status) || 'Regional mayor',
    electedDate: row.electedDate || '',
    officeStartDate: row.officeStartDate || '',
    website: cleanText(row.website),
    contactUrl: cleanText(row.contactUrl),
    email: cleanText(row.email),
    contactNote: cleanText(row.contactNote),
    category: cleanText(row.category),
    signal: cleanText(row.signal),
    breakthroughType: cleanText(row.breakthroughType),
    politicalWeight: cleanText(row.politicalWeight),
    importance: cleanText(row.importance),
    politicalReading: cleanText(row.politicalReading),
    whyItMattersNow: cleanText(row.whyItMattersNow || row.mattersNow),
    note: cleanText(row.note),
    context: cleanText(row.context),
    nationalProfile: !!row.nationalProfile,
    mixedRegion: !!row.mixedRegion,
    newMayoralty: !!row.newMayoralty,
  }
}

export function createDevolvedNationProfile(row = {}) {
  const partyLandscape = (row.partyLandscape || row.parties || []).map((party) => ({
    party: cleanText(party.party),
    pct: Number(party.pct || 0),
    color: party.color || '#12B7D4',
    trend: cleanText(party.trend),
  }))

  return {
    key: cleanText(row.key),
    title: cleanText(row.title),
    institution: cleanText(row.institution),
    regionLabel: cleanText(row.regionLabel),
    system: cleanText(row.system),
    nextElection: row.nextElection || '',
    accent: row.accent || '#12B7D4',
    politicalPicture: cleanText(row.politicalPicture),
    watch: cleanText(row.watch),
    signal: cleanText(row.signal),
    whyItMattersNow: cleanText(row.whyItMattersNow),
    keyStrategicQuestion: cleanText(row.keyStrategicQuestion),
    partyLandscape,
    // Keep the current screen-compatible key while preparing for a cleaner
    // intelligence-first structure.
    parties: partyLandscape,
  }
}

function joinLabels(values = []) {
  const list = values.filter(Boolean)
  if (list.length <= 1) return list[0] || ''
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

export function deriveRegionalMayorSignals(mayor = {}) {
  const party = normalizeMayorParty(mayor.party)
  const signals = []

  if (cleanText(mayor.signal)) signals.push(cleanText(mayor.signal))
  if (party.key === 'labour' && !mayor.mixedRegion && !mayor.newMayoralty) {
    signals.push('Labour stronghold')
  }
  if (party.key === 'conservative') signals.push('Conservative holdout')
  if (party.key === 'reform') signals.push('Reform breakthrough')
  if (mayor.newMayoralty) signals.push('New mayoralty')
  if (mayor.mixedRegion) signals.push('Politically mixed region')
  if (mayor.nationalProfile) signals.push('National profile')
  if (mayor.category === 'devolution-test') signals.push('Devolution test case')

  return [...new Set(signals)]
}

export function describeRegionalMayorPoliticalCase(mayor = {}) {
  const party = normalizeMayorParty(mayor.party)
  if (cleanText(mayor.breakthroughType)) return cleanText(mayor.breakthroughType)
  if (party.key === 'reform' && mayor.newMayoralty) return 'Breakthrough now under test'
  if (party.key === 'conservative') return 'Conservative holdout under pressure'
  if (mayor.category === 'devolution-test') return 'Devolution test case'
  if (mayor.mixedRegion) return 'Mixed-region test case'
  if (party.key === 'labour' && mayor.nationalProfile) return 'Labour flagship office'
  if (party.key === 'labour') return 'Labour-held regional base'
  if (mayor.newMayoralty) return 'New office still taking shape'
  return 'Regional leadership test'
}

export function buildMayoralLandscape(regionalMayors = [], councilMayors = []) {
  const counts = regionalMayors.reduce(
    (acc, mayor) => {
      const family = normalizeMayorParty(mayor.party).key
      acc[family] = (acc[family] || 0) + 1
      return acc
    },
    { labour: 0, conservative: 0, reform: 0, other: 0 },
  )

  const conservativeRegions = regionalMayors
    .filter((mayor) => normalizeMayorParty(mayor.party).key === 'conservative')
    .map((mayor) => mayor.name)

  const reformRegions = regionalMayors
    .filter((mayor) => normalizeMayorParty(mayor.party).key === 'reform')
    .map((mayor) => mayor.name)

  const newMayoralties = regionalMayors.filter((mayor) => mayor.newMayoralty)
  const nonLabourRegional = regionalMayors.filter(
    (mayor) => normalizeMayorParty(mayor.party).key !== 'labour',
  )

  const summaryParts = []
  if (counts.labour > regionalMayors.length / 2) {
    summaryParts.push(
      `Labour hold ${counts.labour} of ${regionalMayors.length} regional mayoralties`,
    )
  }
  if (counts.conservative > 0) {
    summaryParts.push(
      counts.conservative === 1
        ? 'Conservative strength now rests on a single regional holdout'
        : `Conservatives are down to ${counts.conservative} regional holdouts`,
    )
  }
  if (counts.reform > 0) {
    summaryParts.push(
      counts.reform === 1
        ? 'Reform have broken through in one new mayoralty'
        : `Reform have broken through in ${counts.reform} new mayoralties`,
    )
  }
  if (newMayoralties.length > 0) {
    summaryParts.push(
      newMayoralties.length === 1
        ? 'One newly created office is still defining its political role'
        : `${newMayoralties.length} newly created offices are still settling into the map`,
    )
  }

  const whatMatters = []
  if (counts.labour > 0) {
    whatMatters.push(
      `Labour's regional strength is broadest across the big metro offices.`,
    )
  }
  if (counts.conservative > 0) {
    whatMatters.push(
      conservativeRegions.length <= 2
        ? `Conservative resilience is concentrated in ${joinLabels(conservativeRegions)}.`
        : 'Conservative mayoral strength is now concentrated rather than broad.',
    )
  }
  if (counts.reform > 0) {
    whatMatters.push(
      reformRegions.length <= 2
        ? `${joinLabels(reformRegions)} now test whether Reform can turn breakthroughs into governing records.`
        : 'Reform now have to turn fresh breakthroughs into durable regional authority.',
    )
  }
  if (newMayoralties.length > 0) {
    whatMatters.push(
      `${newMayoralties.length} newer mayoralties still matter as devolution test cases, not settled institutions.`,
    )
  }

  return {
    totalRegional: regionalMayors.length,
    totalCouncil: councilMayors.length,
    totalTracked: regionalMayors.length + councilMayors.length,
    labourRegional: counts.labour,
    conservativeRegional: counts.conservative,
    reformRegional: counts.reform,
    nonLabourRegional: nonLabourRegional.length,
    newRegional: newMayoralties.length,
    summary: summaryParts.length
      ? `${summaryParts.slice(0, 2).join('. ')}.`
      : 'Regional mayoralties now matter as tests of executive delivery as well as party strength.',
    whatMatters: whatMatters.slice(0, 3),
  }
}

export function deriveDevolvedOverview(nations = []) {
  const scotland = nations.find((nation) => nation.key === 'scotland')
  const wales = nations.find((nation) => nation.key === 'wales')

  const parts = []
  if (scotland?.keyStrategicQuestion) parts.push(scotland.keyStrategicQuestion)
  if (wales?.keyStrategicQuestion) parts.push(wales.keyStrategicQuestion)

  return {
    title: 'Why this matters now',
    summary:
      parts.length > 0
        ? `${parts.join(' ')} In both systems, finishing first does not guarantee control — the seat maths can produce more complicated outcomes.`
        : 'In Scotland and Wales, proportional systems make the contest about coalition maths as well as who finishes first.',
  }
}
