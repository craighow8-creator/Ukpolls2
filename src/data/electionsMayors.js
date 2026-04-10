// Maintained static mayoral reference data for the Elections area.
// This is currently curated in-app source data and can later be replaced by backend-fed mayor profiles.
import {
  buildMayoralLandscape,
  cleanText,
  createRegionalMayorProfile,
  slugifyCouncilName,
} from '../utils/electionsHelpers'
import { DEFAULT_MAYOR_ENRICHMENTS } from './electionsMayorsEnrichment'
import {
  DEFAULT_MAYOR_EXTERNAL_SOURCE,
  MAYOR_EXTERNAL_ALLOWED_FIELDS,
} from './electionsMayorsExternalSource'

// Hand-maintained raw mayor office data.
// Future backend-fed or semi-live mayor datasets can replace or enrich this input layer.
const REGIONAL_MAYOR_SOURCE = [
  {
    name: 'London',
    holder: 'Sadiq Khan',
    party: 'Labour',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Labour stronghold',
    category: 'capital',
    importance: 'Highest-profile regional office',
    politicalWeight: 'high',
    nationalProfile: true,
    note: 'England’s highest-profile mayoralty, combining city-wide visibility with major transport and planning clout.',
    mattersNow: 'Labour’s flagship mayoralty still sets the tone for whether city leadership can carry national political weight.',
    context: 'London is the best-known example of the English mayoral model. The office-holder shapes transport, housing, planning, policing oversight and city-wide political messaging, so the Mayor of London is judged both as an executive manager and as a national political figure. That makes this role more exposed than almost any other directly elected office below Westminster.',
    electedDate: '2024-05-04',
    website: 'https://www.london.gov.uk/home-page-london-city-hall',
    contactUrl: 'https://www.london.gov.uk/who-we-are/what-mayor-does/contact-city-hall-or-mayor',
    email: 'mayor@london.gov.uk',
    contactNote: 'Official City Hall contact route.',
  },
  {
    name: 'Greater Manchester',
    holder: 'Andy Burnham',
    party: 'Labour Co-op',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Labour stronghold',
    category: 'metro',
    importance: 'Flagship metro mayoralty',
    politicalWeight: 'high',
    nationalProfile: true,
    note: 'One of the strongest metro mayor offices in England, with real political weight beyond the city-region itself.',
    mattersNow: 'Greater Manchester remains one of Labour’s clearest regional power bases and a visible test of English devolution.',
    context: 'Greater Manchester matters because the mayor is expected to be more than a local administrator. The office often shapes wider debates about English devolution, transport reform, regional identity and Labour’s strength outside London. In practice, the role works best when the mayor looks visible enough to represent the whole city-region while still delivering tangible policy wins.',
    electedDate: '2024-05-04',
    website: 'https://www.greatermanchester-ca.gov.uk/the-mayor/',
    contactUrl: 'https://www.greatermanchester-ca.gov.uk/contact/mayor/',
    email: 'andy.burnham@greatermanchester-ca.gov.uk',
    contactNote: 'Official mayor contact page.',
  },
  {
    name: 'West Midlands',
    holder: 'Richard Parker',
    party: 'Labour Co-op',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Politically mixed region',
    category: 'mixed-region',
    importance: 'Major swing-region mayoralty',
    politicalWeight: 'high',
    mixedRegion: true,
    note: 'A politically mixed region where the mayoralty can swing with the broader mood, but local credibility still matters.',
    mattersNow: 'This is one of the clearest regional tests of whether Labour can hold a mixed urban and suburban coalition.',
    context: 'The West Midlands is one of the clearest tests of whether a mayor can hold together very different urban, suburban and town priorities under one regional brand. It is politically mixed enough that party alone does not settle the argument. The mayor has to look like a practical regional leader rather than just a party representative.',
    electedDate: '2024-05-04',
    website: 'https://www.wmca.org.uk/mayor-of-the-west-midlands-more-information-about-the-role/',
    contactUrl: 'https://governance.wmca.org.uk/mgUserInfo.aspx?UID=2555',
    email: 'richard.parker@wmca.org.uk',
    contactNote: 'Official WMCA profile and contact details.',
  },
  {
    name: 'West Yorkshire',
    holder: 'Tracy Brabin',
    party: 'Labour Co-op',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Labour stronghold',
    category: 'metro',
    politicalWeight: 'medium',
    note: 'A major northern mayoralty where transport, regeneration and visibility all matter to how the office is judged.',
    mattersNow: 'West Yorkshire helps show whether Labour can pair northern urban strength with visible regional delivery.',
    context: 'West Yorkshire matters because voters are not only judging party loyalty. They are also judging whether the mayor looks like a recognisable advocate for the region, with enough political weight to push investment, safer streets and transport integration across Bradford, Calderdale, Kirklees, Leeds and Wakefield.',
    electedDate: '2024-05-04',
    website: 'https://www.westyorks-ca.gov.uk/the-mayor-of-west-yorkshire/',
    contactUrl: 'https://www.westyorks-ca.gov.uk/contact-us/',
    email: 'Mayoral.Enquiries@westyorks-ca.gov.uk',
    contactNote: 'Official mayoral enquiries route.',
  },
  {
    name: 'South Yorkshire',
    holder: 'Oliver Coppard',
    party: 'Labour Co-op',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Labour stronghold',
    category: 'metro',
    politicalWeight: 'medium',
    note: 'A South Yorkshire mayor now combines regional leadership with policing powers, making the office more politically significant.',
    mattersNow: 'The added policing brief makes this office a sharper test of Labour’s grip on both delivery and visible public order.',
    context: 'This office is no longer just about regional investment and transport. The added policing role raises the political stakes and makes performance easier for voters to judge. A South Yorkshire mayor has to look capable on both long-term economic strategy and immediate public concerns.',
    electedDate: '2024-05-04',
    website: 'https://www.southyorkshire-ca.gov.uk/about-the-mayor',
    contactUrl: 'https://www.southyorkshire-ca.gov.uk/about-the-mayor',
    email: 'Mayor@southyorkshire-ca.gov.uk',
    contactNote: 'Official mayoral office email.',
  },
  {
    name: 'Liverpool City Region',
    holder: 'Steve Rotheram',
    party: 'Labour',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Labour stronghold',
    category: 'metro',
    politicalWeight: 'medium',
    note: 'A strong regional identity makes this a mayoralty where the office-holder is expected to act as a public champion, not just an administrator.',
    mattersNow: 'Liverpool City Region is one of the clearest examples of a mayoralty becoming part of a region’s political identity.',
    context: 'Liverpool City Region matters because the mayor has to look like the voice of the region while also delivering practical gains. Symbolism and delivery both count here. It is one of the clearest examples of a mayoralty becoming part of how a region presents itself politically and economically.',
    electedDate: '2024-05-04',
    website: 'https://www.liverpoolcityregion-ca.gov.uk/your-metro-mayor',
    contactUrl: 'https://www.liverpoolcityregion-ca.gov.uk/',
    email: '',
    contactNote: 'Official combined authority contact page and phone route are published; no direct public mayor email was surfaced.',
  },
  {
    name: 'North East',
    holder: 'Kim McGuinness',
    party: 'Labour Co-op',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Devolution test case',
    category: 'devolution-test',
    importance: 'New regional office with broad reach',
    politicalWeight: 'medium',
    newMayoralty: true,
    note: 'A newer, larger North East mayoralty covering a broad region with big expectations around growth and connectivity.',
    mattersNow: 'The question now is whether a still-new office can turn regional scale into visible economic and transport gains.',
    context: 'This office matters because it is part of a bigger devolution story in the North East. The challenge is turning a new regional structure into something voters actually feel in jobs, transport, investment and visible leadership across a very broad patch.',
    electedDate: '2024-05-02',
    officeStartDate: '2024-05-07',
    website: 'https://www.northeast-ca.gov.uk/about/the-mayor',
    contactUrl: 'https://www.northeast-ca.gov.uk/contact-us',
    email: 'mayorsoffice@northeast-ca.gov.uk',
    contactNote: 'Official mayor’s office email.',
  },
  {
    name: 'East Midlands',
    holder: 'Claire Ward',
    party: 'Labour Co-op',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Devolution test case',
    category: 'devolution-test',
    importance: 'New combined-county office',
    politicalWeight: 'medium',
    newMayoralty: true,
    mixedRegion: true,
    note: 'A new combined-county mayoralty trying to turn a large, varied region into a recognisable political unit.',
    mattersNow: 'East Midlands will show whether Labour can make a new and uneven region feel politically coherent quickly.',
    context: 'The East Midlands office matters because the region is politically and geographically broad. The task is to make the mayoralty feel coherent rather than artificial, and to prove that one regional office can speak credibly to different places with different priorities.',
    electedDate: '2024-05-03',
    website: 'https://www.eastmidlands-cca.gov.uk/the-mayor/',
    contactUrl: 'https://democracy.eastmidlands-cca.gov.uk/mgUserInfo.aspx?UID=107',
    email: 'Claire.Ward@eastmidlands-cca.gov.uk',
    contactNote: 'Official mayor profile and contact details.',
  },
  {
    name: 'York and North Yorkshire',
    holder: 'David Skaith',
    party: 'Labour Co-op',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Devolution test case',
    category: 'devolution-test',
    importance: 'Mixed urban-rural mayoralty',
    politicalWeight: 'medium',
    newMayoralty: true,
    mixedRegion: true,
    note: 'A mixed urban-rural mayoralty where the office-holder has to balance York’s priorities with those of a much wider county.',
    mattersNow: 'This office matters because Labour has to show it can hold together a mixed city-and-county coalition.',
    context: 'This role matters because it forces one regional leader to bridge very different local identities. Success depends on looking credible across the whole patch, not just one centre. The office has to feel relevant to both York and a much wider rural and market-town landscape.',
    electedDate: '2024-05-03',
    officeStartDate: '2024-05-07',
    website: 'https://yorknorthyorks-ca.gov.uk/meet-your-mayor/',
    contactUrl: 'https://yorknorthyorks-ca.gov.uk/contact-us/',
    email: '',
    contactNote: 'Official combined authority contact page is public; no direct public mayor email was surfaced.',
  },
  {
    name: 'Tees Valley',
    holder: 'Ben Houchen',
    party: 'Conservative',
    color: '#0087DC',
    status: 'Regional mayor',
    signal: 'Conservative holdout',
    category: 'holdout',
    importance: 'High-profile Conservative base',
    politicalWeight: 'high',
    nationalProfile: true,
    note: 'One of the best-known Conservative mayoralties, with a strong focus on visible economic projects and regional branding.',
    mattersNow: 'Tees Valley remains a key Conservative holdout and a test of whether a strong personal brand can outlast the national tide.',
    context: 'Tees Valley matters because it has often been used as proof that a mayor can build a personal brand that cuts across wider party trends. The office is judged heavily on visible development, industrial politics and whether the mayor can keep looking like a deal-maker for the region.',
    electedDate: '2024-05-02',
    website: 'https://teesvalley-ca.gov.uk/about/leadership/mayor/',
    contactUrl: 'https://teesvalley-ca.gov.uk/about/leadership/mayor/',
    email: 'ben.houchen@teesvalley-ca.gov.uk',
    contactNote: 'Official mayor page plus publicly cited official email in authority documents.',
  },
  {
    name: 'Cambridgeshire & Peterborough',
    holder: 'Paul Bristow',
    party: 'Conservative',
    color: '#0087DC',
    status: 'Regional mayor',
    signal: 'Conservative holdout',
    category: 'holdout',
    importance: 'Growth-region Conservative test',
    politicalWeight: 'medium',
    mixedRegion: true,
    note: 'A broad and politically uneven region where the mayor has to speak to very different communities and priorities.',
    mattersNow: 'This is one of the few remaining Conservative regional bases and a live test of centre-right resilience outside Westminster.',
    context: 'This office matters because success depends on holding together places with very different pressures, from growth corridors and science-driven expansion to market towns and suburban concerns. A regional mayor here has to look balanced, practical and attentive to competing local demands.',
    electedDate: '2025-05-02',
    website: 'https://democracy.cambridgeshirepeterborough-ca.gov.uk/mgUserInfo.aspx?UID=362',
    contactUrl: 'https://democracy.cambridgeshirepeterborough-ca.gov.uk/mgUserInfo.aspx?UID=362',
    email: 'mayorsoffice@cambridgeshirepeterborough-ca.gov.uk',
    contactNote: 'Official mayor profile and office email.',
  },
  {
    name: 'West of England',
    holder: 'Helen Godwin',
    party: 'Labour',
    color: '#E4003B',
    status: 'Regional mayor',
    signal: 'Politically mixed region',
    category: 'mixed-region',
    importance: 'Urban coalition test',
    politicalWeight: 'medium',
    mixedRegion: true,
    note: 'A politically mixed region where the mayoralty is a live test of whether Labour can hold together an urban regional coalition.',
    mattersNow: 'West of England is a good test of whether Labour can turn a mixed region into a durable mayoral coalition.',
    context: 'West of England matters because it is not naturally tidy political territory. The mayor has to look practical, local and visible enough to hold a mixed electorate together across Bristol, Bath and surrounding areas, while still showing clear regional purpose.',
    electedDate: '2025-05-02',
    website: 'https://www.westofengland-ca.gov.uk/about-us/the-mayor/',
    contactUrl: 'https://www.westofengland-ca.gov.uk/about-us/contact-us/',
    email: 'info@westofengland-ca.gov.uk',
    contactNote: 'Official combined authority contact route.',
  },
  {
    name: 'Hull & East Yorkshire',
    holder: 'Luke Campbell',
    party: 'Reform UK',
    color: '#12B7D4',
    status: 'Regional mayor',
    signal: 'Reform breakthrough',
    category: 'new-mayoralty',
    importance: 'First-wave Reform test case',
    breakthroughType: 'Reform breakthrough now under delivery test',
    politicalWeight: 'high',
    newMayoralty: true,
    note: 'A new mayoralty where the first winner now has to prove that a breakthrough result can become durable regional leadership.',
    mattersNow: 'Hull and East Yorkshire is now a test of whether Reform can turn a first breakthrough into credible regional government.',
    context: 'Hull and East Yorkshire matters because the launch election is over. The real question now is whether a high-profile first mayor can turn attention into lasting authority, shape the regional agenda and make the office feel meaningful quickly.',
    electedDate: '2025-05-02',
    officeStartDate: '2025-05-06',
    website: 'https://www.hullandeastyorkshire.gov.uk/mayor',
    contactUrl: 'https://www.hullandeastyorkshire.gov.uk/executive-board',
    email: 'louise.hawkins@ca.hullandeastyorkshire.gov.uk',
    contactNote: 'Official authority contact officer listed on the Executive Board page.',
  },
  {
    name: 'Greater Lincolnshire',
    holder: 'Andrea Jenkyns',
    party: 'Reform UK',
    color: '#12B7D4',
    status: 'Regional mayor',
    signal: 'Reform breakthrough',
    category: 'new-mayoralty',
    importance: 'Reform breakthrough office',
    breakthroughType: 'Reform breakthrough now under delivery test',
    politicalWeight: 'high',
    newMayoralty: true,
    note: 'Another new mayoralty where Reform moved first and now has to show it can turn a breakthrough into credible regional power.',
    mattersNow: 'Greater Lincolnshire is another early test of whether Reform can make its first mayoral wins look durable and competent.',
    context: 'Greater Lincolnshire matters because it tests whether a new mayoralty can quickly become politically meaningful, and whether Reform can make first-mover advantage stick. The office now has to move from symbolic breakthrough to visible regional leverage.',
    electedDate: '2025-05-02',
    officeStartDate: '2025-05-06',
    website: 'https://greaterlincolnshire-cca.gov.uk/about-1/mayor',
    contactUrl: 'https://greaterlincolnshire-cca.gov.uk/',
    email: 'info@greaterlincolnshire-cca.gov.uk',
    contactNote: 'Official authority contact route used by the mayor’s office in published correspondence.',
  },
]

// Hand-maintained compact council mayor directory data.
const COUNCIL_MAYOR_SOURCE = [
  { area: 'Bedford', holder: 'Tom Wootton', party: 'Conservative', color: '#0087DC', type: 'Unitary authority', website: 'https://www.bedford.gov.uk/your-council/councillors-and-senior-staff/mayor-bedford-borough', email: 'MayorsCasework@bedford.gov.uk' },
  { area: 'Croydon', holder: 'Jason Perry', party: 'Conservative', color: '#0087DC', type: 'London borough', website: 'https://www.croydon.gov.uk/council-and-elections/mayors-croydon/elected-mayor-croydon/contact-mayor', email: 'mayor@croydon.gov.uk' },
  { area: 'Doncaster', holder: 'Ros Jones', party: 'Labour', color: '#E4003B', type: 'Metropolitan borough', website: 'https://www.doncaster.gov.uk/mayor/mayor-home', email: '' },
  { area: 'Hackney', holder: 'Caroline Woodley', party: 'Labour', color: '#E4003B', type: 'London borough', website: 'https://www.hackney.gov.uk/council-and-elections/mayor-cabinet-and-councillors/mayor-and-cabinet/mayor-hackney', email: 'mayor@hackney.gov.uk' },
  { area: 'Leicester', holder: 'Peter Soulsby', party: 'Labour', color: '#E4003B', type: 'Unitary authority', website: 'https://www.leicester.gov.uk/about-council/city-mayor-peter-soulsby/contact-me', email: 'TheMayor@leicester.gov.uk' },
  { area: 'Lewisham', holder: 'Brenda Dacres', party: 'Labour Co-op', color: '#E4003B', type: 'London borough', website: 'https://lewisham.gov.uk/mayorandcouncil/mayor-and-cabinet', email: 'brenda.dacres@lewisham.gov.uk' },
  { area: 'Mansfield', holder: 'Andy Abrahams', party: 'Labour', color: '#E4003B', type: 'District', website: 'https://www.mansfield.gov.uk/council-councillors-democracy/meet-mayor-1', email: 'mayor@mansfield.gov.uk' },
  { area: 'Middlesbrough', holder: 'Chris Cooke', party: 'Labour Co-op', color: '#E4003B', type: 'Unitary authority', website: 'https://moderngov.middlesbrough.gov.uk/mgUserInfo.aspx?UID=153', email: 'mayor@middlesbrough.gov.uk' },
  { area: 'Newham', holder: 'Rokhsana Fiaz', party: 'Labour Co-op', color: '#E4003B', type: 'London borough', website: 'https://www.newham.gov.uk/council/mayor-newham-1', email: '' },
  { area: 'North Tyneside', holder: 'Karen Clark', party: 'Labour', color: '#E4003B', type: 'Metropolitan borough', website: 'https://democracy.northtyneside.gov.uk/mgUserInfo.aspx?UID=141', email: 'karen.clark@northtyneside.gov.uk' },
  { area: 'Salford', holder: 'Paul Dennett', party: 'Labour', color: '#E4003B', type: 'Metropolitan borough', website: 'https://www.salford.gov.uk/your-council/city-mayor/', email: '' },
  { area: 'Tower Hamlets', holder: 'Lutfur Rahman', party: 'Aspire', color: '#8B5CF6', type: 'London borough', website: 'https://democracy.towerhamlets.gov.uk/mgUserInfo.aspx?UID=312', email: 'mayor@towerhamlets.gov.uk' },
  { area: 'Watford', holder: 'Peter Taylor', party: 'Liberal Democrats', color: '#FAA61A', type: 'District', website: 'https://www.watford.gov.uk/councillors-decision-making/mayor-cabinet', email: '' },
]

// ─── Enrichment merge helper ──────────────────────────────────────────────────
// Applies a sparse enrichment record onto a Layer-1 source row.
// Only keys present in the enrichment record override the source value.
// updatedAt inside an enrichment is provenance metadata — it tracks when the
// enrichment was last verified and is stripped before the row reaches shaping.
function applyEnrichment(sourceRow, enrichmentRecord) {
  if (!enrichmentRecord || Object.keys(enrichmentRecord).length === 0) return sourceRow
  // Strip enrichment-only provenance fields so they do not bleed into shaped output.
  const { updatedAt: _enrichedAt, ...overrides } = enrichmentRecord
  return { ...sourceRow, ...overrides }
}

function hasMeaningfulEnrichment(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false
  return Object.keys(record).some((key) => key !== 'updatedAt')
}

function enrichmentCandidateKeys(value) {
  const exact = cleanText(value)
  const lower = exact.toLowerCase()
  const slug = slugifyCouncilName(exact)
  return [...new Set([exact, lower, slug].filter(Boolean))]
}

function resolveEnrichmentRecord(sourceKey, enrichmentMap = {}) {
  for (const candidate of enrichmentCandidateKeys(sourceKey)) {
    if (
      Object.prototype.hasOwnProperty.call(enrichmentMap, candidate) &&
      enrichmentMap[candidate] &&
      typeof enrichmentMap[candidate] === 'object' &&
      !Array.isArray(enrichmentMap[candidate])
    ) {
      return {
        matchedKey: candidate,
        record: enrichmentMap[candidate],
      }
    }
  }

  return { matchedKey: null, record: null }
}

function buildEnrichmentDebug(enrichmentMap = {}, matches = []) {
  const loadedKeys = Object.keys(enrichmentMap || {})
  const matchedEntries = matches
    .filter((match) => match.matchedKey && hasMeaningfulEnrichment(match.record))
    .map((match) => ({
      sourceKey: match.sourceKey,
      matchedKey: match.matchedKey,
    }))
  const matchedKeySet = new Set(matchedEntries.map((entry) => entry.matchedKey))

  return {
    loadedKeys,
    matchedKeys: matchedEntries,
    unmatchedLoadedKeys: loadedKeys.filter((key) => !matchedKeySet.has(key)),
  }
}

function buildSourceKeyIndex(rows = [], keyField) {
  const index = new Map()

  for (const row of rows) {
    const sourceKey = cleanText(row?.[keyField])
    if (!sourceKey) continue
    for (const candidate of enrichmentCandidateKeys(sourceKey)) {
      if (!index.has(candidate)) index.set(candidate, sourceKey)
    }
  }

  return index
}

function pickExternalOverrideFields(record = {}) {
  const override = {}
  for (const field of MAYOR_EXTERNAL_ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      override[field] = record[field]
    }
  }
  return override
}

function normalizeMayorExternalSource(externalSource = {}, sourceRows = [], keyField) {
  const rows = Array.isArray(externalSource) ? externalSource : []
  const keyIndex = buildSourceKeyIndex(sourceRows, keyField)
  const overrides = {}
  const loadedKeys = []
  const matched = []
  const unmatched = []

  for (const record of rows) {
    const rawKey = cleanText(record?.[keyField] || record?.name || record?.area || record?.office || record?.matchKey)
    if (!rawKey) continue
    loadedKeys.push(rawKey)

    let canonicalSourceKey = ''
    let matchedKey = ''
    for (const candidate of enrichmentCandidateKeys(rawKey)) {
      if (keyIndex.has(candidate)) {
        canonicalSourceKey = keyIndex.get(candidate) || ''
        matchedKey = candidate
        break
      }
    }

    if (!canonicalSourceKey) {
      unmatched.push(rawKey)
      continue
    }

    const safeFields = pickExternalOverrideFields(record)
    if (!Object.keys(safeFields).length) continue

    const previous = overrides[canonicalSourceKey] || {}
    overrides[canonicalSourceKey] = {
      ...previous,
      ...safeFields,
      updatedAt: record.fetchedAt || record.updatedAt || previous.updatedAt || '',
    }
    matched.push({
      sourceKey: canonicalSourceKey,
      matchedKey,
      loadedKey: rawKey,
      updatedFields: Object.keys(safeFields),
    })
  }

  return {
    overrides,
    loadedKeys,
    matched,
    unmatched,
    appliedCount: Object.keys(overrides).length,
  }
}

function mergeOverrideMaps(baseMap = {}, higherPriorityMap = {}) {
  const merged = { ...baseMap }
  for (const [key, value] of Object.entries(higherPriorityMap || {})) {
    merged[key] = { ...(baseMap[key] || {}), ...(value || {}) }
  }
  return merged
}

// ─── Source-to-intelligence shaping ──────────────────────────────────────────
// buildMayorsIntelligencePayload is the single function responsible for turning
// maintained source arrays into the full mayors intelligence payload.
//
// It works across three layers:
//   Layer 1  Maintained source arrays (REGIONAL_MAYOR_SOURCE / COUNCIL_MAYOR_SOURCE)
//   Layer 2b External-source adapter output (options.externalSource, or
//            DEFAULT_MAYOR_EXTERNAL_SOURCE as fallback) — factual override layer
//   Layer 2  Manual controlled enrichment (options.enrichments, or
//            DEFAULT_MAYOR_ENRICHMENTS as fallback) — sparse field-level overrides
//            applied after external data so human corrections win when needed
//   Layer 3  Derived intelligence (party counts, landscape summary, signals)
//            computed from the Layer 1+2 merged records
//
// Live-enrichment plug-in point:
//   Pass { externalSource, enrichments } as options.
//   The worker's refresh path can load D1-stored external input and manual
//   enrichments before calling this shaper.
//   See electionsMayorsExternalSource.js and electionsMayorsEnrichment.js.
//
// Frontend contract:
//   mayors.overview   – landscape summary + political counts
//   mayors.regional   – array of shaped regional mayor profiles
//   mayors.council    – array of council mayor directory rows
//   mayors.meta       – updatedAt, sourceType, enrichedCount, coverageNote
export function buildMayorsIntelligencePayload(options = {}) {
  const updatedAt = options.updatedAt || new Date().toISOString()
  const sourceCount = Number(options.sourceCount || 1)

  // Layer 2: prefer caller-supplied enrichments (from D1 via refresh path),
  // fall back to the file-default enrichments compiled into the bundle.
  const enrichments = options.enrichments !== undefined
    ? options.enrichments
    : DEFAULT_MAYOR_ENRICHMENTS
  const externalSource = options.externalSource !== undefined
    ? options.externalSource
    : DEFAULT_MAYOR_EXTERNAL_SOURCE

  const regionalEnrich = (enrichments && enrichments.regional) || {}
  const councilEnrich = (enrichments && enrichments.council) || {}

  const externalRegional = normalizeMayorExternalSource(
    externalSource && externalSource.regional,
    REGIONAL_MAYOR_SOURCE,
    'name',
  )
  const externalCouncil = normalizeMayorExternalSource(
    externalSource && externalSource.council,
    COUNCIL_MAYOR_SOURCE,
    'area',
  )

  // Precedence: manual controlled enrichment > external adapter > maintained source.
  const mergedRegionalOverrides = mergeOverrideMaps(externalRegional.overrides, regionalEnrich)
  const mergedCouncilOverrides = mergeOverrideMaps(externalCouncil.overrides, councilEnrich)

  // Match enrichments flexibly so saved overrides can be keyed by the display
  // name, a lower-case variant, or a slugified form like "hull-and-east-yorkshire".
  const regionalMatches = REGIONAL_MAYOR_SOURCE.map((row) => ({
    sourceKey: row.name,
    ...resolveEnrichmentRecord(row.name, mergedRegionalOverrides),
  }))
  const councilMatches = COUNCIL_MAYOR_SOURCE.map((row) => ({
    sourceKey: row.area,
    ...resolveEnrichmentRecord(row.area, mergedCouncilOverrides),
  }))

  // Count only applied enrichments: records that matched a source row and have
  // at least one override field beyond updatedAt provenance metadata.
  const regionalEnrichedCount = regionalMatches.filter((match) => hasMeaningfulEnrichment(match.record)).length
  const councilEnrichedCount = councilMatches.filter((match) => hasMeaningfulEnrichment(match.record)).length
  const enrichedCount = regionalEnrichedCount + councilEnrichedCount
  const externalOverrideCount = externalRegional.appliedCount + externalCouncil.appliedCount

  // Layer 1 → Layer 2 merge: apply enrichments before shaping.
  // Maintained source values remain the fallback for any un-enriched field.
  const regional = REGIONAL_MAYOR_SOURCE
    .map((row) => applyEnrichment(row, resolveEnrichmentRecord(row.name, mergedRegionalOverrides).record))
    .map(createRegionalMayorProfile)

  const council = COUNCIL_MAYOR_SOURCE
    .map((row) => applyEnrichment(row, resolveEnrichmentRecord(row.area, mergedCouncilOverrides).record))
    .map((row) => ({ ...row }))

  // Layer 3: derive intelligence from the merged records.
  const landscape = buildMayoralLandscape(regional, council)

  const enrichmentActive = enrichedCount > 0
  const externalActive = externalOverrideCount > 0
  const externalSourceType =
    cleanText(externalSource?.meta?.sourceType) || 'adapter-ready-maintained-external-source'
  const externalCoverageNote =
    cleanText(externalSource?.meta?.coverageNote) ||
    'Mayors external-source adapter currently uses a maintained structured input file and can later be replaced by a live feed.'
  const effectiveSourceCount = Math.max(sourceCount, Number(externalSource?.meta?.sourceCount || 0) || 0, 1)

  return {
    // Derived landscape summary: party counts, summary line, whatMatters points.
    overview: {
      ...landscape,
      keyPoliticalPicture: [...(landscape.whatMatters || [])],
    },
    // Shaped regional mayor profiles — enrichment overrides applied where present.
    regional,
    // Council mayor directory rows — enrichment overrides applied where present.
    council,
    // Provenance and enrichment metadata updated on every refresh run.
    meta: {
      updatedAt,
      sourceCount: effectiveSourceCount,
      // enrichedCount: how many source records had at least one overridden field.
      enrichedCount,
      externalOverrideCount,
      externalSourceUsed: externalActive,
      // sourceType shifts from 'maintained' to 'maintained-with-enrichment' as
      // soon as higher layers are active.
      sourceType: enrichmentActive
        ? externalActive
          ? 'maintained-with-external-and-manual-enrichment'
          : 'maintained-with-enrichment'
        : externalActive
          ? 'maintained-with-external-adapter'
        : 'backend-shaped-from-maintained-source',
      coverageNote: enrichmentActive
        ? externalActive
          ? `Mayors intelligence shaped from maintained source, ${externalSourceType}, and ${enrichedCount} manual override record(s).`
          : `Mayors intelligence shaped from maintained source with ${enrichedCount} enriched record override(s).`
        : externalActive
          ? `${externalCoverageNote} ${externalOverrideCount} external override record(s) currently apply.`
        : 'Regional and council mayor intelligence is currently shaped from the maintained Elections source set.',
    },
    ...(options.includeDebug
      ? {
          // Temporary local verification aid while the first refreshable Elections
          // enrichment path is being bedded in. Remove once the matching flow is trusted.
          _debug: {
            regional: buildEnrichmentDebug(regionalEnrich, regionalMatches),
            council: buildEnrichmentDebug(councilEnrich, councilMatches),
            external: {
              regional: {
                loadedKeys: externalRegional.loadedKeys,
                matchedKeys: externalRegional.matched,
                unmatchedLoadedKeys: externalRegional.unmatched,
              },
              council: {
                loadedKeys: externalCouncil.loadedKeys,
                matchedKeys: externalCouncil.matched,
                unmatchedLoadedKeys: externalCouncil.unmatched,
              },
            },
          },
        }
      : {}),
  }
}

// ─── Stable UI exports ────────────────────────────────────────────────────────
// These are module-load-time derivations used by direct UI imports.
// The Elections screen reads these when it is not using the intelligence API.
export const REGIONAL_MAYORS = REGIONAL_MAYOR_SOURCE.map(createRegionalMayorProfile)
export const COUNCIL_MAYORS = COUNCIL_MAYOR_SOURCE.map((row) => ({ ...row }))
export const MAYORS_OVERVIEW = buildMayoralLandscape(REGIONAL_MAYORS, COUNCIL_MAYORS)

export default {
  MAYORS_OVERVIEW,
  REGIONAL_MAYORS,
  COUNCIL_MAYORS,
}
