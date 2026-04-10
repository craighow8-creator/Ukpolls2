import process from 'node:process'
import { LOCAL_ELECTIONS, COUNCIL_PROFILES } from '../src/data/elections.js'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  'https://politiscope-api.craighow8.workers.dev'

function slugifyCouncilName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const REGISTRY_OVERRIDES = {
  sheffield: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and committee system',
    officialWebsite: 'https://www.sheffield.gov.uk',
    officialElectionsUrl: 'https://www.sheffield.gov.uk/your-city-council/about-council/elected-representatives',
    officialCompositionUrl: 'https://democracy.sheffield.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=1&VW=TABLE',
    notes: '84 councillors across 28 wards.',
  },
  doncaster: {
    type: 'Metropolitan Borough',
    governanceModel: 'Directly elected mayor and cabinet',
    officialWebsite: 'https://www.doncaster.gov.uk',
    officialElectionsUrl: 'https://www.doncaster.gov.uk/services/the-council-democracy/upcoming-elections',
    officialCompositionUrl: 'https://www.doncaster.gov.uk/services/the-council-democracy/local-elections-2025',
    notes: '55 ward councillors plus a directly elected mayor.',
  },
  rotherham: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.rotherham.gov.uk',
    officialElectionsUrl: 'https://www.rotherham.gov.uk/elections-voting/upcoming-elections',
    officialCompositionUrl: 'https://moderngov.rotherham.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=1&VW=TABLE',
    notes: '59 councillors.',
  },
  birmingham: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.birmingham.gov.uk',
    officialElectionsUrl: 'https://www.birmingham.gov.uk/info/50074/elections_and_voting',
    officialCompositionUrl: 'https://www.birmingham.gov.uk/councillors/name',
    notes: '101-councillor chamber; 2026 all-out election on new boundaries.',
  },
  leeds: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.leeds.gov.uk',
    officialElectionsUrl: 'https://www.leeds.gov.uk/elections/leeds-city-council-elections',
    officialCompositionUrl: 'https://www.leeds.gov.uk/councillors-and-democracy/councillors-and-committees',
    notes: '99 councillors across 33 wards.',
  },
  bradford: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.bradford.gov.uk',
    officialElectionsUrl: 'https://www.bradford.gov.uk/your-council/elections-and-voting/',
    officialCompositionUrl: 'https://www.bradford.gov.uk/your-council/about-bradford-council/the-political-composition-of-bradford-council/',
    notes: '90 councillors across 30 wards.',
  },
  newcastle: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.newcastle.gov.uk',
    officialElectionsUrl: 'https://www.newcastle.gov.uk/local-government/your-elected-representatives/local-councillors',
    officialCompositionUrl: 'https://www.newcastle.gov.uk/local-government/your-elected-representatives/local-councillors',
    notes: '78 councillors across 26 wards.',
  },
  lancashire: {
    type: 'County Council',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.lancashire.gov.uk',
    officialElectionsUrl: 'https://www.lancashire.gov.uk/council/get-involved/elections/',
    officialCompositionUrl: 'https://council.lancashire.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=1&VW=TABLE',
    notes: '84 county councillors following the 2025 county council elections.',
  },
  'manchester-city': {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.manchester.gov.uk',
    officialElectionsUrl: 'https://www.manchester.gov.uk/elections',
    officialCompositionUrl: 'https://democracy.manchester.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=1&VW=TABLE',
    notes: '96 councillors with one-third elected three years in four.',
  },
  liverpool: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.liverpool.gov.uk',
    officialElectionsUrl: 'https://liverpool.gov.uk/council/councillors-and-committees/elections/',
    officialCompositionUrl: 'https://liverpool.gov.uk/council/councillors-and-committees/how-the-council-works/',
    notes: '85 locally elected councillors and a Lord Mayor for civic functions.',
  },
  trafford: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.trafford.gov.uk',
    officialElectionsUrl: 'https://www.trafford.gov.uk/residents/voting-and-elections/elections.aspx',
    officialCompositionUrl: 'https://democratic.trafford.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=1&VW=TABLE',
    notes: '63 councillors across 21 wards.',
  },
  stockport: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.stockport.gov.uk',
    officialElectionsUrl: 'https://www.stockport.gov.uk/elections-and-voting',
    officialCompositionUrl: 'https://www.stockport.gov.uk/councillors',
    notes: '63 councillors across 21 wards.',
  },
  oldham: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.oldham.gov.uk',
    officialElectionsUrl: 'https://www.oldham.gov.uk/info/100002/elections_and_voting',
    officialCompositionUrl: 'https://committees.oldham.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=1&VW=TABLE',
    notes: '60 councillors with one-third elected three years in four.',
  },
  rochdale: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.rochdale.gov.uk',
    officialElectionsUrl: 'https://www.rochdale.gov.uk/elections-voting/next-election',
    officialCompositionUrl: 'https://www.rochdale.gov.uk/councillors-committees',
    notes: '60 councillors with one-third elected annually three years in four.',
  },
  'cheshire-east': {
    type: 'Unitary Authority',
    governanceModel: 'Committee system',
    officialWebsite: 'https://www.cheshireeast.gov.uk',
    officialElectionsUrl: 'https://www.cheshireeast.gov.uk/council_and_democracy/your_council/councillors/elections.aspx',
    officialCompositionUrl: 'https://www.cheshireeast.gov.uk/council_and_democracy/your_council/councillors/council-composition.aspx',
    notes: '82 councillors in 52 wards and a civic mayor.',
  },
  'cheshire-west-and-chester': {
    type: 'Unitary Authority',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.cheshirewestandchester.gov.uk',
    officialElectionsUrl: 'https://www.cheshirewestandchester.gov.uk/your-council/voting-and-elections',
    officialCompositionUrl: 'https://www.cheshirewestandchester.gov.uk/your-council/councillors-and-committees/political-make-up',
    notes: '70 elected members representing 45 wards.',
  },
  warrington: {
    type: 'Unitary Authority',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.warrington.gov.uk',
    officialElectionsUrl: 'https://www.warrington.gov.uk/elections',
    officialCompositionUrl: 'https://www.warrington.gov.uk/councillor',
    notes: '58 councillors with all-out elections every four years.',
  },
  halton: {
    type: 'Unitary Authority',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www3.halton.gov.uk',
    officialElectionsUrl: 'https://www3.halton.gov.uk/Pages/councildemocracy/Council.aspx',
    officialCompositionUrl: 'https://councillors.halton.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=1&VW=TABLE',
    notes: '56 councillors elected by thirds and a civic mayor.',
  },
  blackpool: {
    type: 'Unitary Authority',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.blackpool.gov.uk',
    officialElectionsUrl: 'https://www.blackpool.gov.uk/Your-Council/Elections-and-voting/Elections-and-voting.aspx',
    officialCompositionUrl: 'https://www.blackpool.gov.uk/Your-Council/The-Council/Council-make-up/Council-make-up.aspx',
    notes: '42 councillors across 21 wards, with two councillors per ward.',
  },
  'blackburn-with-darwen': {
    type: 'Unitary Authority',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.blackburn.gov.uk',
    officialElectionsUrl: 'https://www.blackburn.gov.uk/council-and-democracy/elections',
    officialCompositionUrl: 'https://democracy.blackburn.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=0&VW=LIST',
    notes: '51 councillors with one-third standing for election three years in four.',
  },
  preston: {
    type: 'District Council',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.preston.gov.uk',
    officialElectionsUrl: 'https://www.preston.gov.uk/elections',
    officialCompositionUrl: 'https://www.preston.gov.uk/media/1737/Political-history-composition-of-the-Council/pdf/Political_History-Composition_of_Council_2025.26.pdf?m=1766577997083',
    notes: '48 councillors across 16 wards.',
  },
  sefton: {
    type: 'Metropolitan Borough',
    governanceModel: 'Leader and cabinet',
    officialWebsite: 'https://www.sefton.gov.uk',
    officialElectionsUrl: 'https://www.sefton.gov.uk/your-council/councillors-meetings-decisions/elections-in-sefton/become-a-councillor/',
    officialCompositionUrl: 'https://www.sefton.gov.uk/your-council/councillors-meetings-decisions/',
    notes: '66 councillors with one-third elected annually three years in four, moving to all-out whole council elections in 2026.',
  },
  wirral: {
    type: 'Metropolitan Borough',
    governanceModel: 'Committee system',
    officialWebsite: 'https://www.wirral.gov.uk',
    officialElectionsUrl: 'https://www.wirral.gov.uk/elections-and-voting/elections/local-elections',
    officialCompositionUrl: 'https://www.wirral.gov.uk/councillors-and-committees/councillors',
    notes: '66 councillors across 22 wards, with all-out elections on a four-year cycle.',
  },

}

function normaliseType(rawType = '') {
  const t = String(rawType || '').trim()
  if (!t) return ''
  const map = {
    Metropolitan: 'Metropolitan Borough',
    County: 'County Council',
    District: 'District Council',
    Borough: 'Borough Council',
    Unitary: 'Unitary Authority',
    'London Borough': 'London Borough',
  }
  return map[t] || t
}

function validateCouncilRegistryRow(row) {
  const errors = []

  if (!row || typeof row !== 'object') {
    return ['Row must be an object']
  }

  if (!row.name || !String(row.name).trim()) {
    errors.push('Missing name')
  }

  if (!row.slug || !String(row.slug).trim()) {
    errors.push(`Missing slug for ${row.name || 'unknown council'}`)
  }

  if (!row.type || !String(row.type).trim()) {
    errors.push(`Missing type for ${row.name}`)
  }

  if (!row.region || !String(row.region).trim()) {
    errors.push(`Missing region for ${row.name}`)
  }

  for (const key of ['officialWebsite', 'officialElectionsUrl', 'officialCompositionUrl']) {
    if (row[key] && !String(row[key]).startsWith('http')) {
      errors.push(`${key} must be a full URL for ${row.name}`)
    }
  }

  return errors
}

function normalizeCouncilRegistryRow(row) {
  const name = String(row.name || '').trim()
  return {
    slug: String(row.slug || slugifyCouncilName(name)).trim(),
    name,
    type: row.type || '',
    region: row.region || '',
    governanceModel: row.governanceModel || '',
    officialWebsite: row.officialWebsite || '',
    officialElectionsUrl: row.officialElectionsUrl || '',
    officialCompositionUrl: row.officialCompositionUrl || '',
    notes: row.notes || '',
  }
}

async function importCouncilRegistry(councils) {
  const res = await fetch(`${API_BASE}/api/elections/import-registry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ councils }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Import failed ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return { ok: true, raw: text } }
}

function buildCouncilRegistryRows() {
  const councils = Array.isArray(LOCAL_ELECTIONS?.councils) ? LOCAL_ELECTIONS.councils : []
  const seen = new Set()

  return councils
    .map((c) => {
      const name = String(c?.name || '').trim()
      if (!name) return null

      const slug = slugifyCouncilName(name)
      if (seen.has(slug)) return null
      seen.add(slug)

      const profile = COUNCIL_PROFILES?.[name] || {}
      const override = REGISTRY_OVERRIDES[slug] || {}

      return {
        slug,
        name,
        type: override.type || normaliseType(c.type),
        region: c.region || '',
        governanceModel: override.governanceModel || '',
        officialWebsite: override.officialWebsite || profile.website || '',
        officialElectionsUrl: override.officialElectionsUrl || '',
        officialCompositionUrl: override.officialCompositionUrl || '',
        notes: override.notes || '',
      }
    })
    .filter(Boolean)
}

async function main() {
  console.log(`Using API base: ${API_BASE}`)
  const rawRows = buildCouncilRegistryRows()
  const councils = rawRows.map(normalizeCouncilRegistryRow)
  const validationErrors = councils.flatMap(validateCouncilRegistryRow)

  if (validationErrors.length) {
    console.error('Validation failed:')
    for (const err of validationErrors) console.error(`- ${err}`)
    process.exit(1)
  }

  console.log(`Prepared council registry rows: ${councils.length}`)
  console.log('Importing to Worker...')
  const result = await importCouncilRegistry(councils)
  console.log('Import result:')
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('Council registry ingest failed:')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
