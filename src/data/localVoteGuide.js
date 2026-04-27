import { API_BASE } from '../constants.js'
import sheffieldCouncillorsByWard from './sheffieldCouncillorsByWard.json' with { type: 'json' }

const SHEFFIELD_COUNCIL_SLUG = 'sheffield-city-council'
export const EXTERNAL_LOCAL_VOTE_GUIDE_SLUG = 'postcode-fallback'
const SHEFFIELD_LAST_CHECKED = '25-04-2026'
const SHEFFIELD_CANDIDATE_NOTICE_DATE = '10-04-2026'
const SHEFFIELD_NEXT_ELECTION_DATE = '07-05-2026'
const DEMOCRACY_CLUB_API_BASE = 'https://developers.democracyclub.org.uk/api/v1'
const DEMOCRACY_CLUB_SOURCE_LABEL = 'Democracy Club / WhoCanIVoteFor'
const LOCAL_VOTE_FETCH_TIMEOUT_MS = 5000

const SHEFFIELD_SOURCE_URLS = {
  electionsHub: 'https://www.sheffield.gov.uk/your-city-council/elections',
  electoralWards: 'https://www.sheffield.gov.uk/your-city-council/elections/electoral-wards',
  electionNotices: 'https://www.sheffield.gov.uk/your-city-council/elections/election-notices',
  statementOfPersonsNominated:
    'https://www.sheffield.gov.uk/sites/default/files/2026-04/statement_of_persons_nominated.pdf',
  councillorsByWard: 'https://democracy.sheffield.gov.uk/mgMemberIndex.aspx?FN=WARD&PIC=0&VW=LIST',
  councillorsByWardTable: 'https://democracy.sheffield.gov.uk/mgMemberIndex.aspx?FN=WARD&PIC=1&VW=TABLE',
  councilOverview: 'https://www.sheffield.gov.uk/your-city-council',
  postcodeLookupDocs: 'https://postcodes.io/docs/postcode/lookup/',
  democracyClubDocs: 'https://developers.democracyclub.org.uk/api/v1/',
  whoCanIVoteFor: 'https://whocanivotefor.co.uk/',
}

export const LOCAL_VOTE_ISSUE_AREAS = [
  { key: 'housing', label: 'Housing' },
  { key: 'councilTax', label: 'Council tax' },
  { key: 'binsServices', label: 'Bins/services' },
  { key: 'transport', label: 'Transport' },
  { key: 'environment', label: 'Environment' },
]

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function readClientEnv(name) {
  if (typeof import.meta === 'undefined' || !import.meta.env) return ''
  return String(import.meta.env[name] || '').trim()
}

function titleCaseName(value) {
  return String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function buildTodayStamp() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return `${day}-${month}-${year}`
}

function normaliseWardKey(value) {
  return slugify(String(value || '').replace(/\bward\b/gi, ''))
}

function normalisePartyName(value) {
  const party = String(value || '').trim()
  const key = party.toLowerCase()

  if (key === 'labour party') return 'Labour'
  if (key === 'labour and co-operative party') return 'Labour and Co-operative'
  if (key === 'the conservative party candidate') return 'Conservative'
  if (key === 'conservative and unionist party') return 'Conservative'
  if (key === 'liberal democrats') return 'Liberal Democrat'
  if (key === 'green party') return 'Green'
  if (key === 'reformuk - changing politics for good') return 'Reform UK'
  return party
}

function buildElectionSourceUrl(ballotId = '') {
  if (!ballotId) return SHEFFIELD_SOURCE_URLS.whoCanIVoteFor
  return `${SHEFFIELD_SOURCE_URLS.whoCanIVoteFor}elections/${ballotId}/`
}

function createCandidate(ward, name, party, options = {}) {
  const sourceUrl = options.sourceUrl || SHEFFIELD_SOURCE_URLS.statementOfPersonsNominated
  const sourceLabel = options.sourceLabel || 'Official statement of persons nominated'
  const lastChecked = options.lastChecked || SHEFFIELD_LAST_CHECKED
  const verificationStatus = options.verificationStatus || 'Verified'
  const electionDate = options.electionDate || SHEFFIELD_NEXT_ELECTION_DATE
  const issueStatements = options.issueStatements || {}

  return {
    id: `${slugify(name)}-${slugify(party)}`,
    ward,
    name,
    party,
    electionDate,
    sourceUrl,
    sourceLabel,
    lastChecked,
    verificationStatus,
    sourceAttribution: options.sourceAttribution || 'official',
    issueStatements,
  }
}

function createCouncillorFromDataset(ward, entry = {}) {
  const name = String(entry.name || '').trim()
  const party = String(entry.party || '').trim()

  return {
    id: `${slugify(name)}-${slugify(party)}`,
    ward,
    name,
    party,
    sourceUrl: entry.sourceUrl || SHEFFIELD_SOURCE_URLS.councillorsByWard,
    sourceLabel: entry.sourceLabel || 'Sheffield councillors by ward',
    lastChecked: entry.lastChecked || SHEFFIELD_LAST_CHECKED,
    verificationStatus: entry.verificationStatus || 'verified',
    seatStatus: 'occupied',
  }
}

function createWard({
  slug,
  name,
  aliases = [],
  councillors = [],
  candidates = [],
  notes = '',
}) {
  return {
    slug,
    name,
    aliases,
    notes,
    updatedAt: SHEFFIELD_LAST_CHECKED,
    fetchedAt: SHEFFIELD_LAST_CHECKED,
    candidateListStatus: candidates.length ? 'Verified candidate list' : 'No verified candidate list yet',
    sources: [
      {
        label: 'Current councillors by ward',
        url: SHEFFIELD_SOURCE_URLS.councillorsByWardTable,
        updatedAt: SHEFFIELD_LAST_CHECKED,
      },
      {
        label: 'Electoral wards overview',
        url: SHEFFIELD_SOURCE_URLS.electoralWards,
        updatedAt: SHEFFIELD_LAST_CHECKED,
      },
      ...(candidates.length
        ? [
            {
              label: 'Statement of persons nominated',
              url: SHEFFIELD_SOURCE_URLS.statementOfPersonsNominated,
              updatedAt: SHEFFIELD_CANDIDATE_NOTICE_DATE,
            },
          ]
        : []),
    ],
    councillors,
    candidates,
  }
}

function createLocalVoteGuideCouncil({
  councilSlug,
  councilName,
  supportedAreaLabel,
  nextElectionDate,
  updatedAt,
  fetchedAt,
  sourceNote,
  controls,
  sources,
  wards,
  lookup = {},
}) {
  return {
    councilSlug,
    councilName,
    supportedAreaLabel,
    nextElectionDate,
    updatedAt,
    fetchedAt,
    sourceNote,
    controls,
    sources,
    wards,
    lookup: {
      areaQueries: lookup.areaQueries || [],
      postcodeLookupDocsUrl: lookup.postcodeLookupDocsUrl || '',
      isSupportedPostcode: lookup.isSupportedPostcode || (() => false),
      resolvePostcodeMatch: lookup.resolvePostcodeMatch || null,
      fetchCandidates: lookup.fetchCandidates || null,
    },
  }
}

if (sheffieldCouncillorsByWard.length !== 28) {
  console.warn(
    `[LocalVoteGuide] Expected 28 Sheffield wards in sheffieldCouncillorsByWard.json, found ${sheffieldCouncillorsByWard.length}.`,
  )
}

const SHEFFIELD_COUNCILLOR_MAP = new Map(
  sheffieldCouncillorsByWard.map((entry) => [
    String(entry.ward || '').trim(),
    (entry.councillors || [])
      .filter((councillor) => councillor?.name && councillor?.party)
      .map((councillor) => createCouncillorFromDataset(String(entry.ward || '').trim(), councillor)),
  ]),
)

function getSheffieldWardCouncillors(wardName) {
  return SHEFFIELD_COUNCILLOR_MAP.get(wardName) || []
}

const SHEFFIELD_WARDS = [
  createWard({
    slug: 'beauchief-and-greenhill',
    name: 'Beauchief and Greenhill',
    aliases: ['beauchief greenhill'],
    notes: 'Current councillors verified from Sheffield City Council ward listings.',
    councillors: getSheffieldWardCouncillors('Beauchief and Greenhill'),
    candidates: [
      createCandidate('Beauchief and Greenhill', 'Michelle Lesley Astle', 'Conservative'),
      createCandidate('Beauchief and Greenhill', 'Jonathan Bagley', 'Green'),
      createCandidate('Beauchief and Greenhill', 'Simon William Clement-Jones', 'Liberal Democrat'),
      createCandidate('Beauchief and Greenhill', 'Amanda Clare Gaffney', 'Reform UK'),
      createCandidate('Beauchief and Greenhill', 'Hafeas Rehman', 'Labour'),
      createCandidate('Beauchief and Greenhill', 'Daniel Lucas Smith', 'Trade Unionist and Socialist Coalition'),
    ],
  }),
  createWard({
    slug: 'beighton',
    name: 'Beighton',
    aliases: ['beighton ward'],
    notes: 'All three current councillors are present in the official Sheffield table view.',
    councillors: getSheffieldWardCouncillors('Beighton'),
    candidates: [
      createCandidate('Beighton', 'Amanda Julie Adlington', 'Liberal Democrat'),
      createCandidate('Beighton', 'Alexander James Brown', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Beighton', 'Shirley Diane Clayton', 'Conservative'),
      createCandidate('Beighton', 'Kurtis Jenson Crossthorn', 'Liberal Democrat'),
      createCandidate('Beighton', 'Suzanne Davison', 'Conservative'),
      createCandidate('Beighton', 'Laurence Hayward', 'Reform UK'),
      createCandidate('Beighton', 'Bridget Kelly', 'Labour and Co-operative'),
      createCandidate('Beighton', 'Stewart Kemp', 'Green'),
      createCandidate('Beighton', 'Craig Myers', 'Independent'),
      createCandidate('Beighton', 'Wayne Michael Rhodes', 'Labour'),
      createCandidate('Beighton', 'Stuart Wallace', 'Reform UK'),
    ],
  }),
  createWard({
    slug: 'birley',
    name: 'Birley',
    aliases: ['birley ward'],
    councillors: getSheffieldWardCouncillors('Birley'),
    candidates: [
      createCandidate('Birley', 'David James Cronshaw', 'Independent'),
      createCandidate('Birley', 'Charles Philip Edwardson', 'Liberal Democrat'),
      createCandidate('Birley', 'Daniel Gage', 'Conservative'),
      createCandidate('Birley', 'Luke Goddard', 'Reform UK'),
      createCandidate('Birley', 'Karen Lesley McGowan', 'Labour'),
      createCandidate('Birley', 'Andrea Ugolini', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Birley', 'Alan Yearsley', 'Green'),
    ],
  }),
  createWard({
    slug: 'broomhill-and-sharrow-vale',
    name: 'Broomhill and Sharrow Vale',
    aliases: ['broomhill sharrow vale'],
    councillors: getSheffieldWardCouncillors('Broomhill and Sharrow Vale'),
    candidates: [
      createCandidate('Broomhill and Sharrow Vale', 'Fiona Ann Carr', 'Liberal Democrat'),
      createCandidate('Broomhill and Sharrow Vale', 'Louise Martha Cooper', 'Labour'),
      createCandidate('Broomhill and Sharrow Vale', 'Andrew John Grafton', 'Reform UK'),
      createCandidate('Broomhill and Sharrow Vale', 'Maleiki Haybe', 'Green'),
      createCandidate('Broomhill and Sharrow Vale', 'Charles Peter Hughes', 'Conservative'),
      createCandidate('Broomhill and Sharrow Vale', 'John Bunn', 'Trade Unionist and Socialist Coalition'),
    ],
  }),
  createWard({
    slug: 'burngreave',
    name: 'Burngreave',
    aliases: ['burngreave ward'],
    councillors: getSheffieldWardCouncillors('Burngreave'),
    candidates: [
      createCandidate('Burngreave', 'Mustafa Ahmed', 'Green'),
      createCandidate('Burngreave', 'Andrew Brooker', 'Conservative'),
      createCandidate('Burngreave', 'Hannah Cawley', 'Labour and Co-operative'),
      createCandidate('Burngreave', 'Neil Danford', 'Reform UK'),
      createCandidate('Burngreave', 'James Robert Ellwood', 'Liberal Democrat'),
      createCandidate('Burngreave', 'Abdullah Okud', 'Independent'),
      createCandidate('Burngreave', 'Khalil Mohammed Qasem Al-Asad', 'Independent'),
      createCandidate('Burngreave', 'Osman Rafiq', 'Independent'),
    ],
  }),
  createWard({
    slug: 'city',
    name: 'City',
    aliases: ['sheffield city ward', 'city ward'],
    councillors: getSheffieldWardCouncillors('City'),
    candidates: [
      createCandidate('City', 'Ashish Bhandari', 'Conservative'),
      createCandidate('City', 'Shelley Anne Cockayne', 'Liberal Democrat'),
      createCandidate('City', 'Lee Rooker', 'Reform UK'),
      createCandidate('City', 'Madeline Claire Rooney', 'Trade Unionist and Socialist Coalition'),
      createCandidate('City', 'Terezia Rostas', 'Labour'),
      createCandidate('City', 'Maia Salman-Lord', 'Green'),
    ],
  }),
  createWard({
    slug: 'crookes-and-crosspool',
    name: 'Crookes and Crosspool',
    aliases: ['crookes crosspool'],
    councillors: getSheffieldWardCouncillors('Crookes and Crosspool'),
    candidates: [
      createCandidate('Crookes and Crosspool', 'Jordan Barry', 'Liberal Democrat'),
      createCandidate('Crookes and Crosspool', 'Alasdair Hadrian Cook', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Crookes and Crosspool', 'Aliou Diallo', 'Conservative'),
      createCandidate('Crookes and Crosspool', 'Dylan Lewis-Creser', 'Green'),
      createCandidate('Crookes and Crosspool', 'Minesh Parekh', 'Labour and Co-operative'),
      createCandidate('Crookes and Crosspool', 'Ricia Ward', 'Reform UK'),
    ],
  }),
  createWard({
    slug: 'darnall',
    name: 'Darnall',
    aliases: ['darnall ward'],
    councillors: getSheffieldWardCouncillors('Darnall'),
    candidates: [
      createCandidate('Darnall', 'Asif Ahmed', 'Independent'),
      createCandidate('Darnall', 'Joydu Al Mahfuz', 'Green'),
      createCandidate('Darnall', 'Misbah Chowdhury', 'Independent'),
      createCandidate('Darnall', 'Timothy Goddard', 'Reform UK'),
      createCandidate('Darnall', 'Thomas Huggan', 'Liberal Democrat'),
      createCandidate('Darnall', 'Zahira Naz', 'Labour'),
      createCandidate('Darnall', 'Margaret Pigott', 'Conservative'),
    ],
  }),
  createWard({
    slug: 'dore-and-totley',
    name: 'Dore and Totley',
    aliases: ['dore totley'],
    councillors: getSheffieldWardCouncillors('Dore and Totley'),
    candidates: [
      createCandidate('Dore and Totley', 'Gill Black', 'Green'),
      createCandidate('Dore and Totley', 'Isaac Joseph Harry Graves', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Dore and Totley', 'Paul Jakeman', 'Reform UK'),
      createCandidate('Dore and Totley', 'Martin Richard Smith', 'Liberal Democrat'),
      createCandidate('Dore and Totley', 'Nicola Smith', 'Labour and Co-operative'),
      createCandidate('Dore and Totley', 'Zoe Michelle Steane', 'Conservative'),
    ],
  }),
  createWard({
    slug: 'east-ecclesfield',
    name: 'East Ecclesfield',
    aliases: ['east ecclesfield ward'],
    councillors: getSheffieldWardCouncillors('East Ecclesfield'),
    candidates: [
      createCandidate('East Ecclesfield', 'Susan Davidson', 'Liberal Democrat'),
      createCandidate('East Ecclesfield', 'Craig Gamble Pugh', 'Labour and Co-operative'),
      createCandidate('East Ecclesfield', 'Kevin Mahoney', 'Conservative'),
      createCandidate('East Ecclesfield', 'Sean Maloney', 'Reform UK'),
      createCandidate('East Ecclesfield', 'Rosie Trevillion', 'Green'),
      createCandidate('East Ecclesfield', 'Colin Michael Wray', 'Trade Unionist and Socialist Coalition'),
    ],
  }),
  createWard({
    slug: 'ecclesall',
    name: 'Ecclesall',
    aliases: ['ecclesall ward'],
    councillors: getSheffieldWardCouncillors('Ecclesall'),
    candidates: [
      createCandidate('Ecclesall', 'Michael Edward Brown', 'Liberal Democrat'),
      createCandidate('Ecclesall', 'Noah Thomas Eden', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Ecclesall', 'Rory Joseph Gilmore', 'Labour'),
      createCandidate('Ecclesall', 'John Andrew Horton', 'Reform UK'),
      createCandidate('Ecclesall', 'Tessa Louise Lupton', 'Green'),
      createCandidate('Ecclesall', 'Gordon Ronald Millward', 'Conservative'),
    ],
  }),
  createWard({
    slug: 'firth-park',
    name: 'Firth Park',
    aliases: ['firth park ward'],
    councillors: getSheffieldWardCouncillors('Firth Park'),
    notes: 'All three current councillors are verified from the official Sheffield table view.',
    candidates: [
      createCandidate('Firth Park', 'Omer Abdulqader', 'Independent'),
      createCandidate('Firth Park', 'Fran Belbin', 'Labour and Co-operative'),
      createCandidate('Firth Park', 'Victoria Margaret Bowden', 'Liberal Democrat'),
      createCandidate('Firth Park', 'Luke Jonathan Elliott Brownbill', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Firth Park', 'Daniel Jonathon Fielding', 'Conservative'),
      createCandidate('Firth Park', 'Robert Hanson', 'Reform UK'),
      createCandidate('Firth Park', 'Mike Harrison', 'Green'),
      createCandidate('Firth Park', 'Sarah Marie Hill', 'Labour and Co-operative'),
      createCandidate('Firth Park', 'Thomas Sturgess', 'Liberal Democrat'),
      createCandidate('Firth Park', 'David Tetenji', 'Conservative'),
      createCandidate('Firth Park', 'Graeme Boyd Waddicar', 'Reform UK'),
      createCandidate('Firth Park', 'Eamonn Charles Ward', 'Green'),
    ],
  }),
  createWard({
    slug: 'fulwood',
    name: 'Fulwood',
    aliases: ['fulwood ward'],
    councillors: getSheffieldWardCouncillors('Fulwood'),
    candidates: [
      createCandidate('Fulwood', 'Ellie Axe', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Fulwood', 'Thomas Evans', 'Labour and Co-operative'),
      createCandidate('Fulwood', 'John Ronan', 'Green'),
      createCandidate('Fulwood', 'Andy Telford', 'Reform UK'),
      createCandidate('Fulwood', 'Thomas Wilson', 'Conservative'),
      createCandidate('Fulwood', 'Cliff Woodcraft', 'Liberal Democrat'),
    ],
  }),
  createWard({
    slug: 'gleadless-valley',
    name: 'Gleadless Valley',
    aliases: ['gleadless'],
    councillors: getSheffieldWardCouncillors('Gleadless Valley'),
    candidates: [
      createCandidate('Gleadless Valley', 'John Dryden', 'Liberal Democrat'),
      createCandidate('Gleadless Valley', 'Marieanne Elliot', 'Green'),
      createCandidate('Gleadless Valley', 'Jennifer Karen Grant', 'Conservative'),
      createCandidate('Gleadless Valley', 'Simon John Jenkins', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Gleadless Valley', 'Bob Pemberton', 'Labour and Co-operative'),
      createCandidate('Gleadless Valley', 'Andy Rayner', 'Reform UK'),
    ],
  }),
  createWard({
    slug: 'graves-park',
    name: 'Graves Park',
    aliases: ['graves park ward'],
    councillors: getSheffieldWardCouncillors('Graves Park'),
    candidates: [
      createCandidate('Graves Park', 'Tom Atkin-Withers', 'Green'),
      createCandidate('Graves Park', 'Steve Ayris', 'Liberal Democrat'),
      createCandidate('Graves Park', 'Julia Catherine Brown', 'Labour'),
      createCandidate('Graves Park', 'David Pascoe Ellis', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Graves Park', 'Trevor Henry Grant', 'Conservative'),
      createCandidate('Graves Park', 'Robert David White', 'Reform UK'),
    ],
  }),
  createWard({
    slug: 'hillsborough',
    name: 'Hillsborough',
    aliases: ['hillsborough ward'],
    councillors: getSheffieldWardCouncillors('Hillsborough'),
    candidates: [
      createCandidate('Hillsborough', 'Mike Bell', 'Reform UK'),
      createCandidate('Hillsborough', 'Mark Harrop', 'Independent'),
      createCandidate('Hillsborough', 'Joseph Lewis Hibbert', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Hillsborough', 'Christopher Alan Lynch', 'Liberal Democrat'),
      createCandidate('Hillsborough', 'Eve Millward', 'Conservative'),
      createCandidate('Hillsborough', 'Richard Tinsley', 'Green'),
      createCandidate('Hillsborough', 'Andrew Wild', 'Labour'),
    ],
  }),
  createWard({
    slug: 'manor-castle',
    name: 'Manor Castle',
    aliases: ['manor castle ward'],
    councillors: getSheffieldWardCouncillors('Manor Castle'),
    candidates: [
      createCandidate('Manor Castle', 'Margaret Ruth Abbey', 'Green'),
      createCandidate('Manor Castle', 'Seun Ajao', 'Reform UK'),
      createCandidate('Manor Castle', 'Michael Chilton', 'Labour'),
      createCandidate('Manor Castle', 'Stephanie Jane Kenning', 'Liberal Democrat'),
      createCandidate('Manor Castle', 'Peter Joseph Reilly', 'Independent'),
      createCandidate('Manor Castle', 'Alistair Tice', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Manor Castle', 'Dylan Turner', 'Conservative'),
    ],
  }),
  createWard({
    slug: 'mosborough',
    name: 'Mosborough',
    aliases: ['mosborough ward'],
    councillors: getSheffieldWardCouncillors('Mosborough'),
    candidates: [
      createCandidate('Mosborough', 'Patricia Jean Barnsley', 'Conservative'),
      createCandidate('Mosborough', 'Ronald Corbett', 'Independent'),
      createCandidate('Mosborough', 'Jason Holyhead', 'Labour'),
      createCandidate('Mosborough', 'Michael John Hudgell', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Mosborough', 'Joel McGuigan', 'Reform UK'),
      createCandidate('Mosborough', 'Gail Smith', 'Liberal Democrat'),
      createCandidate('Mosborough', 'Julie White', 'Green'),
    ],
  }),
  createWard({
    slug: 'nether-edge-and-sharrow',
    name: 'Nether Edge and Sharrow',
    aliases: ['nether edge sharrow'],
    councillors: getSheffieldWardCouncillors('Nether Edge and Sharrow'),
    candidates: [
      createCandidate('Nether Edge and Sharrow', 'Lynsey Angell', 'Green'),
      createCandidate('Nether Edge and Sharrow', 'Nighat Basharat', 'Labour'),
      createCandidate('Nether Edge and Sharrow', 'Joanne Mary Lowe', 'Conservative'),
      createCandidate('Nether Edge and Sharrow', 'Sean Patrick Pearce', 'Reform UK'),
      createCandidate('Nether Edge and Sharrow', 'Tilde Resare', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Nether Edge and Sharrow', 'Joe Yeardley', 'Liberal Democrat'),
    ],
  }),
  createWard({
    slug: 'park-and-arbourthorne',
    name: 'Park and Arbourthorne',
    aliases: ['park arbourthorne'],
    councillors: getSheffieldWardCouncillors('Park and Arbourthorne'),
    candidates: [
      createCandidate('Park and Arbourthorne', 'Dwaine Craven', 'Independent'),
      createCandidate('Park and Arbourthorne', 'Jack Jeffery', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Park and Arbourthorne', 'Ann Patricia Kingdom', 'Liberal Democrat'),
      createCandidate('Park and Arbourthorne', 'Nabeela Mowlana', 'Labour and Co-operative'),
      createCandidate('Park and Arbourthorne', 'Matt Smith', 'Reform UK'),
      createCandidate('Park and Arbourthorne', 'Brian Stringfellow', 'Conservative'),
      createCandidate('Park and Arbourthorne', 'Billie Dawn Turner', 'Green'),
    ],
  }),
  createWard({
    slug: 'richmond',
    name: 'Richmond',
    aliases: ['richmond ward'],
    councillors: getSheffieldWardCouncillors('Richmond'),
    candidates: [
      createCandidate('Richmond', 'Hollie Charlotte Buisson', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Richmond', 'Jack Byrom', 'Reform UK'),
      createCandidate('Richmond', 'Beth Cheshire', 'Labour and Co-operative'),
      createCandidate('Richmond', 'Joe Greatorex', 'Independent'),
      createCandidate('Richmond', 'Luke William Hunt', 'Green'),
      createCandidate('Richmond', 'Jack Hurst', 'UKIP - People not Politics'),
      createCandidate('Richmond', 'Adil Shaffaq Mohammed', 'Liberal Democrat'),
      createCandidate('Richmond', 'Pansy Plester', 'Conservative'),
    ],
  }),
  createWard({
    slug: 'shiregreen-and-brightside',
    name: 'Shiregreen and Brightside',
    aliases: ['shiregreen brightside'],
    councillors: getSheffieldWardCouncillors('Shiregreen and Brightside'),
    candidates: [
      createCandidate('Shiregreen and Brightside', 'Rachel Esther Barker', 'Liberal Democrat'),
      createCandidate('Shiregreen and Brightside', 'Josh Darling', 'Independent'),
      createCandidate('Shiregreen and Brightside', 'Rebecca Fryer', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Shiregreen and Brightside', 'Joel Gilbert', 'Green'),
      createCandidate('Shiregreen and Brightside', 'Mick Lee', 'Reform UK'),
      createCandidate('Shiregreen and Brightside', 'Josiah Lenton', 'Labour and Co-operative'),
      createCandidate('Shiregreen and Brightside', 'Lewis Lennard Henrey Malcolm Mills', 'Conservative'),
      createCandidate('Shiregreen and Brightside', 'Garry David Weatherall', 'Independent'),
    ],
  }),
  createWard({
    slug: 'southey',
    name: 'Southey',
    aliases: ['southey ward'],
    councillors: getSheffieldWardCouncillors('Southey'),
    candidates: [
      createCandidate('Southey', 'Joseph Clark', 'Independent'),
      createCandidate('Southey', 'Jayne Dunn', 'Labour and Co-operative'),
      createCandidate('Southey', 'Kevin Grum', 'Liberal Democrat'),
      createCandidate('Southey', 'Harry John Lomas', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Southey', 'Tuss Ramzan', 'Green'),
      createCandidate('Southey', 'Andrew Mark Smith', 'Conservative'),
      createCandidate('Southey', 'Yvonne Sykes', 'Reform UK'),
    ],
  }),
  createWard({
    slug: 'stannington',
    name: 'Stannington',
    aliases: ['stannington ward'],
    councillors: getSheffieldWardCouncillors('Stannington'),
    candidates: [
      createCandidate('Stannington', 'Lewis William Blake Dagnall', 'Labour and Co-operative'),
      createCandidate('Stannington', 'Maz Rowan Hamilton', 'Green'),
      createCandidate('Stannington', 'Matthew James Langham', 'Conservative'),
      createCandidate('Stannington', 'Cameron James Luke Mannion', 'Independent'),
      createCandidate('Stannington', 'Ian Oxley', 'Reform UK'),
      createCandidate('Stannington', 'George Arthur Rollason', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Stannington', 'Will Sapwell', 'Liberal Democrat'),
    ],
  }),
  createWard({
    slug: 'stocksbridge-and-upper-don',
    name: 'Stocksbridge and Upper Don',
    aliases: ['stocksbridge upper don'],
    councillors: getSheffieldWardCouncillors('Stocksbridge and Upper Don'),
    candidates: [
      createCandidate('Stocksbridge and Upper Don', 'Owen Cooper', 'Conservative'),
      createCandidate('Stocksbridge and Upper Don', 'John Hesketh', 'Reform UK'),
      createCandidate('Stocksbridge and Upper Don', 'Janet Hilary Ridler', 'Labour'),
      createCandidate('Stocksbridge and Upper Don', 'Stuart Andrew Shepherd', 'Liberal Democrat'),
      createCandidate('Stocksbridge and Upper Don', 'David Willington', 'Green'),
      createCandidate('Stocksbridge and Upper Don', 'Claire Suzanne Wraith', 'Trade Unionist and Socialist Coalition'),
    ],
  }),
  createWard({
    slug: 'walkley',
    name: 'Walkley',
    aliases: ['walkley ward'],
    councillors: getSheffieldWardCouncillors('Walkley'),
    candidates: [
      createCandidate('Walkley', 'Harry Crawley', 'Independent'),
      createCandidate('Walkley', 'Andy Davies', 'Green'),
      createCandidate('Walkley', 'Isabelle Amy France', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Walkley', 'Michael Lawrence Ginn', 'Conservative'),
      createCandidate('Walkley', 'Kim Vivien Hanson', 'Reform UK'),
      createCandidate('Walkley', 'Tom Hunt', 'Labour'),
      createCandidate('Walkley', 'Alex Purvis', 'Liberal Democrat'),
    ],
  }),
  createWard({
    slug: 'west-ecclesfield',
    name: 'West Ecclesfield',
    aliases: ['west ecclesfield ward'],
    councillors: getSheffieldWardCouncillors('West Ecclesfield'),
    candidates: [
      createCandidate('West Ecclesfield', 'Kathy Aston', 'Green'),
      createCandidate('West Ecclesfield', 'Matt Dixon', 'Conservative'),
      createCandidate('West Ecclesfield', 'Mike Levery', 'Liberal Democrat'),
      createCandidate('West Ecclesfield', 'David Ogle', 'Reform UK'),
      createCandidate('West Ecclesfield', 'Alexander Stuart Parker', 'Labour'),
      createCandidate('West Ecclesfield', 'Solomon David Wells-Ashmore', 'Trade Unionist and Socialist Coalition'),
    ],
  }),
  createWard({
    slug: 'woodhouse',
    name: 'Woodhouse',
    aliases: ['woodhouse ward'],
    councillors: getSheffieldWardCouncillors('Woodhouse'),
    candidates: [
      createCandidate('Woodhouse', 'Danny Alan Allsebrook', 'Labour and Co-operative'),
      createCandidate('Woodhouse', 'Dorne Carr', 'Independent'),
      createCandidate('Woodhouse', 'Joshua Andrew Crapper', 'Trade Unionist and Socialist Coalition'),
      createCandidate('Woodhouse', 'Willis James Marshall', 'Liberal Democrat'),
      createCandidate('Woodhouse', 'Nathaniel Menday', 'Reform UK'),
      createCandidate('Woodhouse', 'Hannah Kate Nicklin', 'Green'),
      createCandidate('Woodhouse', 'Steven Winstone', 'Conservative'),
    ],
  }),
]

export function isSheffieldPostcode(value) {
  return /^S\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i.test(String(value || '').trim())
}

export function isUkPostcode(value) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(String(value || '').trim())
}

function buildWardAliasMap(council) {
  return (council?.wards || []).flatMap((ward) => {
    const aliases = [ward.name, ward.slug, ...(ward.aliases || [])]
    return aliases.map((alias) => ({
      alias: slugify(alias),
      wardSlug: ward.slug,
    }))
  })
}

function findWardMatchForCouncil(council, query) {
  const wardAliasMap = buildWardAliasMap(council)
  const wardKey = slugify(query)
  return wardAliasMap.find((entry) => entry.alias === wardKey) || null
}

function supportsCouncilAreaQuery(council, query) {
  const normalisedQuery = String(query || '').trim().toLowerCase()
  return (council?.lookup?.areaQueries || []).some((value) => value === normalisedQuery)
}

function findCouncilForSupportedPostcode(query) {
  return LOCAL_VOTE_GUIDE_COUNCIL_LIST.find((council) => council.lookup.isSupportedPostcode(query)) || null
}

function createGuideMatch(council, wardSlug = '') {
  if (!council) return null

  return {
    councilSlug: council.councilSlug,
    wardSlug,
    query: wardSlug
      ? `${council.supportedAreaLabel} · ${getLocalVoteGuideWard(council.councilSlug, wardSlug)?.name || ''}`
      : council.supportedAreaLabel,
  }
}

async function fetchSheffieldLiveCandidates({ ward, query }) {
  const postcode = normalisePostcodeInput(query)
  const apiKey = getDemocracyClubApiKey()

  if (!isSheffieldPostcode(postcode)) return null

  const democracyClubResponse = await requestDemocracyClubPostcode(postcode, apiKey)
  const payload = democracyClubResponse?.payload || null
  const liveCandidates = extractDemocracyClubWardCandidates(payload, ward)

  if (!liveCandidates.length) return null

  return {
    candidates: liveCandidates,
    sourceLabel: DEMOCRACY_CLUB_SOURCE_LABEL,
    sourceUrl: SHEFFIELD_SOURCE_URLS.democracyClubDocs,
    status: 'verified',
  }
}

async function resolveSheffieldPostcodeMatch(query, council) {
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(query)}`)
    const payload = await response.json().catch(() => null)
    const result = payload?.result

    if (!response.ok || !result) {
      return {
        status: 'manual',
        ...createGuideMatch(council),
        query,
        lookupSourceUrl: council.lookup.postcodeLookupDocsUrl,
      }
    }

    if (String(result.admin_district || '').trim().toLowerCase() !== 'sheffield') {
      return null
    }

    const resolvedWardName = String(result.admin_ward || '').trim()
    const matchedWard = findWardMatchForCouncil(council, resolvedWardName)

    if (matchedWard) {
      return {
        status: 'matched',
        councilSlug: council.councilSlug,
        wardSlug: matchedWard.wardSlug,
        query,
        resolvedWardName,
        lookupSourceUrl: council.lookup.postcodeLookupDocsUrl,
      }
    }

    return {
      status: 'manual',
      ...createGuideMatch(council),
      query,
      resolvedWardName,
      lookupSourceUrl: council.lookup.postcodeLookupDocsUrl,
    }
  } catch {
    return {
      status: 'manual',
      ...createGuideMatch(council),
      query,
      lookupSourceUrl: council.lookup.postcodeLookupDocsUrl,
    }
  }
}

const SHEFFIELD_COUNCIL = createLocalVoteGuideCouncil({
  councilSlug: SHEFFIELD_COUNCIL_SLUG,
  councilName: 'Sheffield City Council',
  supportedAreaLabel: 'Sheffield',
  nextElectionDate: '07-05-2026',
  updatedAt: SHEFFIELD_LAST_CHECKED,
  fetchedAt: SHEFFIELD_LAST_CHECKED,
  sourceNote: 'Maintained local election guide · sources linked where available',
  controls: [
    'Council tax, budget priorities and neighbourhood services',
    'Bins, street cleaning, local environmental services and parks',
    'Planning, housing strategy and some local regeneration decisions',
    'Road safety, local transport priorities and active travel schemes',
    'Social care, libraries and a wide range of day-to-day council services',
  ],
  sources: [
    {
      label: 'Sheffield elections hub',
      url: SHEFFIELD_SOURCE_URLS.electionsHub,
      updatedAt: SHEFFIELD_LAST_CHECKED,
    },
    {
      label: 'Electoral wards overview',
      url: SHEFFIELD_SOURCE_URLS.electoralWards,
      updatedAt: SHEFFIELD_LAST_CHECKED,
    },
    {
      label: 'Election notices',
      url: SHEFFIELD_SOURCE_URLS.electionNotices,
      updatedAt: SHEFFIELD_CANDIDATE_NOTICE_DATE,
    },
    {
      label: 'Statement of persons nominated',
      url: SHEFFIELD_SOURCE_URLS.statementOfPersonsNominated,
      updatedAt: SHEFFIELD_CANDIDATE_NOTICE_DATE,
    },
    {
      label: 'Current councillors by ward',
      url: SHEFFIELD_SOURCE_URLS.councillorsByWardTable,
      updatedAt: SHEFFIELD_LAST_CHECKED,
    },
    {
      label: 'Council overview',
      url: SHEFFIELD_SOURCE_URLS.councilOverview,
      updatedAt: SHEFFIELD_LAST_CHECKED,
    },
    {
      label: 'Postcode lookup API',
      url: SHEFFIELD_SOURCE_URLS.postcodeLookupDocs,
    },
    {
      label: 'Democracy Club developer API',
      url: SHEFFIELD_SOURCE_URLS.democracyClubDocs,
    },
  ],
  wards: SHEFFIELD_WARDS,
  lookup: {
    areaQueries: ['sheffield'],
    postcodeLookupDocsUrl: SHEFFIELD_SOURCE_URLS.postcodeLookupDocs,
    isSupportedPostcode: isSheffieldPostcode,
    resolvePostcodeMatch: resolveSheffieldPostcodeMatch,
    fetchCandidates: fetchSheffieldLiveCandidates,
  },
})

const LOCAL_VOTE_GUIDE_COUNCIL_LIST = [SHEFFIELD_COUNCIL]

const LOCAL_VOTE_GUIDES = Object.fromEntries(
  LOCAL_VOTE_GUIDE_COUNCIL_LIST.map((council) => [council.councilSlug, council]),
)

const LOCAL_VOTE_ROUTE_SLUGS = {
  [SHEFFIELD_COUNCIL_SLUG]: 'sheffield',
}

export function normalisePostcodeInput(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

export function getLocalVoteGuideCouncil(councilSlug) {
  if (!councilSlug) return null
  return LOCAL_VOTE_GUIDES[councilSlug] || null
}

async function fetchLocalVoteGuideJson(path) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeoutId = controller ? setTimeout(() => controller.abort(), LOCAL_VOTE_FETCH_TIMEOUT_MS) : null

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
      signal: controller?.signal,
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) return null

    return await response.json().catch(() => null)
  } catch {
    return null
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function fetchLocalVoteGuideCouncilData(councilSlug) {
  const routeSlug = LOCAL_VOTE_ROUTE_SLUGS[councilSlug]
  if (!routeSlug) return null

  const payload = await fetchLocalVoteGuideJson(`/api/local-vote/councils/${routeSlug}`)
  if (!payload || payload.councilSlug !== councilSlug || !Array.isArray(payload.wards)) return null
  return payload
}

function simplifyCouncilLookupKey(value) {
  return slugify(
    String(value || '')
      .replace(/^city of /i, '')
      .replace(/\bcity council\b/gi, '')
      .replace(/\bcouncil\b/gi, '')
      .replace(/\bborough\b/gi, '')
      .replace(/\blondon borough of\b/gi, '')
      .replace(/\s+/g, ' '),
  )
}

let localVoteLookupIndexPromise = null

export async function fetchLocalVoteGuideLookupIndex() {
  if (!localVoteLookupIndexPromise) {
    localVoteLookupIndexPromise = fetchLocalVoteGuideJson('/api/local-vote/lookup-index').then((payload) => {
      if (!payload || !Array.isArray(payload.councils) || !Array.isArray(payload.wards)) return null
      return payload
    })
  }

  return localVoteLookupIndexPromise
}

export async function resolveExternalLocalVoteGuideMatch({ councilName = '', wardName = '' } = {}) {
  const lookup = await fetchLocalVoteGuideLookupIndex()
  if (!lookup) return null

  const simplifiedCouncil = simplifyCouncilLookupKey(councilName)
  const wardKey = slugify(String(wardName || '').replace(/\bward\b/gi, ''))
  if (!simplifiedCouncil || !wardKey) return null

  const matchedCouncil =
    (lookup.councils || []).find((council) => simplifyCouncilLookupKey(council.name) === simplifiedCouncil) ||
    (lookup.councils || []).find((council) => simplifyCouncilLookupKey(council.supportedAreaLabel) === simplifiedCouncil) ||
    null

  if (!matchedCouncil) return null

  const matchedWard =
    (lookup.wards || []).find((ward) => ward.councilId === matchedCouncil.id && slugify(ward.name.replace(/\bward\b/gi, '')) === wardKey) ||
    (lookup.wards || []).find((ward) => ward.councilId === matchedCouncil.id && slugify(ward.slug) === wardKey) ||
    (lookup.wards || []).find((ward) => ward.councilId === matchedCouncil.id && (ward.aliases || []).some((alias) => slugify(alias.replace(/\bward\b/gi, '')) === wardKey)) ||
    null

  if (!matchedWard) return null

  return {
    councilSlug: matchedCouncil.slug,
    councilName: matchedCouncil.name,
    wardSlug: matchedWard.slug,
    wardName: matchedWard.name,
  }
}

export async function fetchLocalVoteGuideD1Candidates({ councilSlug = '', wardSlug = '' } = {}) {
  if (!councilSlug || !wardSlug) return null

  const payload = await fetchLocalVoteGuideJson(
    `/api/local-vote/candidates?councilSlug=${encodeURIComponent(councilSlug)}&wardSlug=${encodeURIComponent(wardSlug)}`,
  )

  if (!payload || !Array.isArray(payload.candidates)) return null
  return payload
}

export function getLocalVoteGuideWard(councilSlug, wardSlug) {
  const council = getLocalVoteGuideCouncil(councilSlug)
  if (!council || !wardSlug) return null
  return council.wards.find((ward) => ward.slug === wardSlug) || null
}

export function getLocalVoteGuideRecord(councilSlug, wardSlug) {
  const council = getLocalVoteGuideCouncil(councilSlug)
  if (!council) return null
  const ward = getLocalVoteGuideWard(councilSlug, wardSlug)
  return {
    ...council,
    ward: ward || null,
  }
}

export function getSheffieldGuideMatch(wardSlug = '') {
  return createGuideMatch(SHEFFIELD_COUNCIL, wardSlug)
}

export function findLocalVoteGuideMatch(rawQuery) {
  const query = normalisePostcodeInput(rawQuery)
  if (!query) return null

  for (const council of LOCAL_VOTE_GUIDE_COUNCIL_LIST) {
    const matchedWard = findWardMatchForCouncil(council, query)
    if (matchedWard) {
      return {
        councilSlug: council.councilSlug,
        wardSlug: matchedWard.wardSlug,
        query,
      }
    }
  }

  const matchedCouncil =
    LOCAL_VOTE_GUIDE_COUNCIL_LIST.find((council) => supportsCouncilAreaQuery(council, query)) ||
    findCouncilForSupportedPostcode(query)

  if (matchedCouncil) {
    return {
      councilSlug: matchedCouncil.councilSlug,
      wardSlug: '',
      query,
    }
  }

  return null
}

function getDemocracyClubApiKey() {
  return readClientEnv('VITE_DEMOCRACY_CLUB_API_KEY')
}

async function requestDemocracyClubPostcode(postcode, apiKey) {
  if (!postcode) return { ok: false, status: 0, payload: null, requestUrl: '' }

  const url = new URL(`${DEMOCRACY_CLUB_API_BASE}/postcode/${encodeURIComponent(postcode)}`)
  if (apiKey) {
    url.searchParams.set('auth_token', apiKey)
  }

  try {
    const response = await fetch(url.toString())
    const payload = await response.json().catch(() => null)
    return {
      ok: response.ok,
      status: response.status,
      payload,
      requestUrl: url.toString(),
    }
  } catch {
    return {
      ok: false,
      status: 0,
      payload: null,
      requestUrl: url.toString(),
    }
  }
}

async function requestPostcodeContext(postcode) {
  if (!postcode) return null

  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)
    const payload = await response.json().catch(() => null)
    if (!response.ok) return null
    return payload?.result || null
  } catch {
    return null
  }
}

function extractWardNameFromBallot(ballot) {
  const postName = String(ballot?.post_name || '').trim()
  if (postName) return postName

  const ballotTitle = String(ballot?.ballot_title || '').trim()
  const match = ballotTitle.match(/local election\s+(.+)$/i)
  return match?.[1] ? titleCaseName(match[1]) : ''
}

function mapDemocracyClubCandidate(ballot, candidate, fallbackWardName) {
  const person = candidate?.person || {}
  const partyName = normalisePartyName(candidate?.party?.party_name || 'Independent')
  const name = String(person.name || '').trim()

  if (!name) return null

  return createCandidate(fallbackWardName, name, partyName, {
    electionDate: ballot?.poll_open_date || SHEFFIELD_NEXT_ELECTION_DATE,
    sourceUrl: person.absolute_url || ballot?.wcivf_url || buildElectionSourceUrl(ballot?.ballot_paper_id),
    sourceLabel: DEMOCRACY_CLUB_SOURCE_LABEL,
    lastChecked: SHEFFIELD_LAST_CHECKED,
    verificationStatus: 'Verified',
    sourceAttribution: 'democracy-club',
  })
}

function extractDemocracyClubWardCandidates(payload, ward) {
  if (!payload || !ward) return []

  const targetWardKey = normaliseWardKey(ward.name)
  const dates = Array.isArray(payload.dates) ? payload.dates : []

  for (const dateEntry of dates) {
    const ballots = Array.isArray(dateEntry?.ballots) ? dateEntry.ballots : []

    for (const ballot of ballots) {
      if (String(ballot?.poll_open_date || '') !== SHEFFIELD_NEXT_ELECTION_DATE) continue
      if (!String(ballot?.ballot_paper_id || '').toLowerCase().includes('local.sheffield.')) continue

      const wardName = extractWardNameFromBallot(ballot)
      if (normaliseWardKey(wardName) !== targetWardKey) continue

      return (Array.isArray(ballot?.candidates) ? ballot.candidates : [])
        .map((candidate) => mapDemocracyClubCandidate(ballot, candidate, ward.name))
        .filter(Boolean)
    }
  }

  return []
}

function extractExternalAreaName(payload) {
  const dates = Array.isArray(payload?.dates) ? payload.dates : []
  const firstBallot = dates.flatMap((entry) => entry?.ballots || []).find(Boolean)
  return (
    String(firstBallot?.post_name || '').trim() ||
    String(firstBallot?.election_name || '').trim() ||
    String(payload?.electoral_services?.name || '').trim() ||
    ''
  )
}

function extractExternalWhoCanIVoteForUrl(payload) {
  const dates = Array.isArray(payload?.dates) ? payload.dates : []
  const firstBallot = dates.flatMap((entry) => entry?.ballots || []).find(Boolean)
  return String(firstBallot?.wcivf_url || '').trim() || SHEFFIELD_SOURCE_URLS.whoCanIVoteFor
}

function extractExternalCandidates(payload) {
  const dates = Array.isArray(payload?.dates) ? payload.dates : []
  const candidates = []

  for (const dateEntry of dates) {
    const ballots = Array.isArray(dateEntry?.ballots) ? dateEntry.ballots : []

    for (const ballot of ballots) {
      const areaName = String(ballot?.post_name || ballot?.election_name || '').trim() || 'Local area'
      const ballotCandidates = Array.isArray(ballot?.candidates) ? ballot.candidates : []

      for (const candidate of ballotCandidates) {
        const mapped = mapDemocracyClubCandidate(ballot, candidate, areaName)
        if (!mapped) continue
        candidates.push({
          ...mapped,
          ward: areaName,
          areaName,
        })
      }
    }
  }

  return candidates
}

export async function fetchExternalLocalVoteGuide(query = '') {
  const postcode = normalisePostcodeInput(query)
  if (!isUkPostcode(postcode)) return null

  const democracyClubResponse = await requestDemocracyClubPostcode(postcode, getDemocracyClubApiKey())
  const payload = democracyClubResponse?.payload || null
  const postcodeContext = await requestPostcodeContext(postcode)
  const contextLastChecked = buildTodayStamp()
  const areaName =
    extractExternalAreaName(payload) ||
    String(postcodeContext?.admin_ward || '').trim() ||
    String(postcodeContext?.parliamentary_constituency || '').trim() ||
    String(postcodeContext?.admin_district || '').trim() ||
    ''
  const candidates = extractExternalCandidates(payload)

  return {
    query: postcode,
    areaName,
    candidates,
    postcodeContext: {
      councilName: String(postcodeContext?.admin_district || '').trim(),
      countyName: String(postcodeContext?.admin_county || '').trim(),
      wardName: String(postcodeContext?.admin_ward || '').trim(),
      constituencyName: String(postcodeContext?.parliamentary_constituency || '').trim(),
      regionName: String(postcodeContext?.region || '').trim(),
      countryName: String(postcodeContext?.country || '').trim(),
      lastChecked: contextLastChecked,
      sourceLabel: 'Postcodes.io postcode lookup',
      sourceUrl: SHEFFIELD_SOURCE_URLS.postcodeLookupDocs,
    },
    sourceLabel: DEMOCRACY_CLUB_SOURCE_LABEL,
    sourceUrl: payload ? SHEFFIELD_SOURCE_URLS.democracyClubDocs : SHEFFIELD_SOURCE_URLS.whoCanIVoteFor,
    whoCanIVoteForUrl: extractExternalWhoCanIVoteForUrl(payload),
    status: payload?.address_picker
      ? 'address-picker'
      : candidates.length
        ? 'ok'
        : democracyClubResponse?.status === 401
          ? 'api-auth-required'
          : 'unavailable',
    message: 'Full Politiscope guide coming soon for this area',
  }
}

export async function fetchLocalVoteGuideCandidates({ councilSlug, wardSlug, query = '' }) {
  const council = getLocalVoteGuideCouncil(councilSlug)
  const ward = getLocalVoteGuideWard(councilSlug, wardSlug)

  if (!council || !ward) {
    return {
      candidates: [],
      sourceLabel: '',
      sourceUrl: '',
      status: 'unavailable',
    }
  }

  const liveResult = await council.lookup.fetchCandidates?.({ council, ward, query })
  if (liveResult?.candidates?.length) {
    return liveResult
  }

  return {
    candidates: ward.candidates || [],
    sourceLabel: '',
    sourceUrl: '',
    status: ward.candidates?.length ? 'verified' : 'unavailable',
  }
}

export async function resolveLocalVoteGuideMatch(rawQuery) {
  const query = normalisePostcodeInput(rawQuery)
  if (!query) return null

  const directMatch = findLocalVoteGuideMatch(query)
  if (directMatch && directMatch.wardSlug) {
    return {
      status: 'matched',
      ...directMatch,
    }
  }

  const matchedCouncil = LOCAL_VOTE_GUIDE_COUNCIL_LIST.find((council) => supportsCouncilAreaQuery(council, query))
  if (matchedCouncil) {
    return {
      status: 'manual',
      ...createGuideMatch(matchedCouncil),
      query,
      lookupSourceUrl: matchedCouncil.lookup.postcodeLookupDocsUrl,
    }
  }

  const postcodeCouncil = findCouncilForSupportedPostcode(query)
  if (!postcodeCouncil) {
    if (isUkPostcode(query)) {
      return {
        status: 'external',
        councilSlug: EXTERNAL_LOCAL_VOTE_GUIDE_SLUG,
        wardSlug: '',
        query,
      }
    }
    return null
  }

  const postcodeMatch = await postcodeCouncil.lookup.resolvePostcodeMatch?.(query, postcodeCouncil)
  if (postcodeMatch) {
    return postcodeMatch
  }

  if (isUkPostcode(query)) {
    return {
      status: 'external',
      councilSlug: EXTERNAL_LOCAL_VOTE_GUIDE_SLUG,
      wardSlug: '',
      query,
    }
  }

  return null
}

export const SHEFFIELD_WARD_COUNT = SHEFFIELD_WARDS.length
export const SHEFFIELD_COUNCILLOR_RECORD_COUNT = SHEFFIELD_WARDS.reduce(
  (total, ward) => total + ward.councillors.length,
  0,
)
export const SHEFFIELD_VACANT_SEAT_COUNT = SHEFFIELD_WARDS.reduce(
  (total, ward) => total + ward.councillors.filter((entry) => entry.seatStatus === 'vacant').length,
  0,
)
