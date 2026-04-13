import process from 'node:process'
import { LOCAL_ELECTIONS, COUNCIL_PROFILES } from '../src/data/elections.js'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  'https://politiscope-api.craighow8.workers.dev'

const OPEN_COUNCIL_DATA_URL = 'https://opencouncildata.co.uk/councils.php?model=E&y=0'

function formatUkDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `${day}-${month}-${year}`
}

function slugifyCouncilName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normaliseType(rawType = '') {
  const t = cleanText(rawType)
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

const STATUS_OVERRIDES = {
  sheffield: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled local council election on 7 May 2026.',
    cycle: 'by-thirds',
    seatsTotal: 84,
    seatsUp: 28,
    control: 'NOC',
    leader: 'Cllr Tom Hunt (Labour)',
    mayor: 'Cllr Safiya Saeed (Lord Mayor)',
    governanceModel: 'Leader and committee system',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.sheffield.gov.uk/your-city-council/about-council/elected-representatives',
      'https://democracy.sheffield.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=1&VW=TABLE',
    ],
  },
  doncaster: {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled local council election here on 7 May 2026. Doncaster next elects all city councillors in May 2029.',
    nextElectionYear: 2029,
    cycle: 'all-out',
    seatsTotal: 55,
    seatsUp: 0,
    control: 'Split control',
    leader: 'Mayor Ros Jones (Labour)',
    mayor: 'Mayor Ros Jones (Labour)',
    governanceModel: 'Directly elected mayor and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.doncaster.gov.uk/services/the-council-democracy/upcoming-elections',
      'https://www.doncaster.gov.uk/services/the-council-democracy/local-elections-2025',
      'https://www.doncaster.gov.uk/Documents/DocumentView/Stream/Media/Default/Council%20and%20Democracy/Governance%20Services/Constitution%20%28All%20Parts%29%20Feb%202026.pdf',
    ],
  },
  rotherham: {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled local council election here on 7 May 2026. Rotherham next holds all-out borough elections in May 2028.',
    nextElectionYear: 2028,
    cycle: 'all-out',
    seatsTotal: 59,
    seatsUp: 0,
    control: 'Lab',
    leader: 'Cllr Chris Read (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.rotherham.gov.uk/elections-voting/upcoming-elections',
      'https://moderngov.rotherham.gov.uk/documents/g16305/Public%20reports%20pack%20Monday%2013-Apr-2026%2010.00%20Cabinet.pdf?T=10',
      'https://moderngov.rotherham.gov.uk/documents/g16311/Public%20reports%20pack%20Wednesday%2004-Mar-2026%2014.00%20Council%20Meeting.pdf?T=10',
    ],
  },
  birmingham: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled all-out local council election on 7 May 2026 on new ward boundaries.',
    nextElectionYear: 2026,
    cycle: 'all-out',
    seatsTotal: 101,
    seatsUp: 101,
    control: 'Lab',
    leader: 'Cllr John Cotton (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.birmingham.gov.uk/councillors/name',
      'https://www.birmingham.gov.uk/download/downloads/id/31471/statement_of_accounts_2024_to_2025.pdf',
    ],
  },
  leeds: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled local council election on 7 May 2026.',
    nextElectionYear: 2026,
    cycle: 'by-thirds',
    seatsTotal: 99,
    seatsUp: 33,
    control: 'Lab',
    leader: 'Cllr James Lewis (Labour)',
    mayor: 'Cllr Dan Cohen (Lord Mayor 2025/26)',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.leeds.gov.uk/councillors-and-democracy/councillors-and-committees',
      'https://www.leeds.gov.uk/elections/leeds-city-council-elections',
      'https://www.leeds.gov.uk/performance-and-spending/council-tax-and-business-rates-financial-information/leaders-message',
    ],
  },
  bradford: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled all-out local council election on 7 May 2026 after boundary review.',
    nextElectionYear: 2026,
    cycle: 'all-out',
    seatsTotal: 90,
    seatsUp: 90,
    control: 'Lab',
    leader: 'Cllr Susan Hinchcliffe (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.bradford.gov.uk/your-council/about-bradford-council/the-political-composition-of-bradford-council/',
      'https://www.bradford.gov.uk/your-council/about-bradford-council/how-bradford-council-works/',
      'https://www.bradford.gov.uk/media/skod2kwj/2025-26-budget-reference-document.pdf',
    ],
  },
  newcastle: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled local council election on 7 May 2026.',
    nextElectionYear: 2026,
    cycle: 'by-thirds',
    seatsTotal: 78,
    seatsUp: 26,
    control: 'NOC',
    leader: 'Cllr Karen Kilgour (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.newcastle.gov.uk/local-government/your-elected-representatives/local-councillors',
      'https://new.newcastle.gov.uk/sites/default/files/2026-03/SCHEDULE%20C%2002.03.26.pdf',
    ],
  },
  barnsley: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled whole-council election on 07-05-2026. Barnsley has moved to all-out elections, so all 63 seats are being contested together.',
    nextElectionYear: 2026,
    cycle: 'all-out',
    seatsTotal: 63,
    seatsUp: 63,
    control: 'Lab',
    leader: 'Cllr Sir Steve Houghton CBE (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.barnsley.gov.uk/services/media-and-advertising/media-enquiries/',
      'https://www.barnsley.gov.uk/services/voting-and-elections/types-of-elections/',
      'https://www.barnsley.gov.uk/services/voting-and-elections/election-results/local-government-elections-5-may-2022/',
    ],
  },
  wakefield: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled whole-council election on 07-05-2026. For the first time in over 20 years, all Wakefield council seats are being contested together.',
    nextElectionYear: 2026,
    cycle: 'all-out',
    seatsTotal: 63,
    seatsUp: 63,
    control: 'Lab',
    leader: 'Cllr Denise Jeffery (Labour)',
    mayor: 'Cllr Maureen Tennant-King (Mayor 2025/26)',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://mg.wakefield.gov.uk/mgUserInfo.aspx?UID=182',
      'https://www.wakefield.gov.uk/elections/district-elections-7-may-2026/what-is-the-election-for',
      'https://www.wakefield.gov.uk/about-the-council/councillors-and-mayor/councillors',
    ],
  },
  kirklees: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled whole-council election on 07-05-2026. Kirklees will elect all 69 seats after the local government boundary review.',
    nextElectionYear: 2026,
    cycle: 'all-out',
    seatsTotal: 69,
    seatsUp: 69,
    control: 'NOC',
    leader: 'Cllr Carole Pattison (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://democracy.kirklees.gov.uk/mgUserInfo.aspx?UID=337',
      'https://www.kirklees.gov.uk/beta/your-councillors/composition-of-council.aspx',
      'https://www.kirklees.gov.uk/beta/voting-and-elections/scheduled-elections.aspx',
    ],
  },
  calderdale: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled local council election on 07-05-2026. Calderdale elects by thirds, so one seat in each ward is contested in election years.',
    nextElectionYear: 2026,
    cycle: 'by-thirds',
    seatsTotal: 51,
    seatsUp: 17,
    control: 'Lab',
    leader: 'Cllr Tim Swift (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.calderdale.gov.uk/council/councillors/councillors/register.jsp',
      'https://new.calderdale.gov.uk/council/councillors-and-decision-making/your-councillors',
      'https://new.calderdale.gov.uk/sites/default/files/2024-12/Statement-of-Accounts-2023-24.pdf',
    ],
  },
  hull: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled local council election on 07-05-2026. Hull elects by thirds, with one seat contested in each ward that is due to vote this year.',
    nextElectionYear: 2026,
    cycle: 'by-thirds',
    seatsTotal: 57,
    seatsUp: 19,
    control: 'LD',
    leader: 'Cllr Mike Ross (Liberal Democrats)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.hull.gov.uk/councillors/1/mike-ross',
      'https://news.hull.gov.uk/02/05/2024/live-blog-hull-local-elections-2024/',
      'https://www.hull.gov.uk/elections-voting/local-elections',
    ],
  },
  'kingston-upon-hull': {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled local council election on 07-05-2026. Hull elects by thirds, with one seat contested in each ward that is due to vote this year.',
    nextElectionYear: 2026,
    cycle: 'by-thirds',
    seatsTotal: 57,
    seatsUp: 19,
    control: 'LD',
    leader: 'Cllr Mike Ross (Liberal Democrats)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.hull.gov.uk/councillors/1/mike-ross',
      'https://news.hull.gov.uk/02/05/2024/live-blog-hull-local-elections-2024/',
      'https://www.hull.gov.uk/elections-voting/local-elections',
    ],
  },
  york: {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled City of York Council election on 07-05-2026. The current 47-seat council was elected in 2023 and the next ordinary full election is due in 2027.',
    nextElectionYear: 2027,
    cycle: 'all-out',
    seatsTotal: 47,
    seatsUp: 0,
    control: 'Lab',
    leader: 'Cllr Claire Douglas (Labour)',
    mayor: 'Cllr Martin Rowley BEM (Lord Mayor)',
    governanceModel: 'Leader and executive',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://democracy.york.gov.uk/mgUserInfo.aspx?UID=9772',
      'https://www.york.gov.uk/council/executive-council-members',
      'https://democracy.york.gov.uk/mgMemberIndex.aspx?VW=TABLE',
    ],
  },
  'north-yorkshire': {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled North Yorkshire Council election on 07-05-2026. The next full council elections are due in May 2027.',
    nextElectionYear: 2027,
    cycle: 'all-out',
    seatsTotal: 90,
    seatsUp: 0,
    control: 'Con',
    leader: 'Cllr Carl Les OBE (Conservative)',
    mayor: '',
    governanceModel: 'Leader and executive',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://edemocracy.northyorks.gov.uk/mgUserInfo.aspx?UID=152',
      'https://www.northyorks.gov.uk/your-council/elections-and-voting',
      'https://edemocracy.northyorks.gov.uk/mgMemberIndex.aspx?FN=PARTY&PIC=0&VW=LIST',
    ],
  },
  gateshead: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled whole-council election on 07-05-2026. Three councillors will be elected in each of Gateshead’s 22 wards, so all 66 seats are up together.',
    nextElectionYear: 2026,
    cycle: 'all-out',
    seatsTotal: 66,
    seatsUp: 66,
    control: 'Lab',
    leader: 'Cllr Martin Gannon (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.gateshead.gov.uk/article/2923/Local-elections',
      'https://www.gateshead.gov.uk/article/36306/Foreword-Councillor-Martin-Gannon-Leader-of-Gateshead-Council',
      'https://www.gateshead.gov.uk/article/3748/About-Gateshead-Council',
    ],
  },
  sunderland: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled whole-council election on 07-05-2026. All 75 seats across Sunderland’s 25 wards are up after the boundary review.',
    nextElectionYear: 2026,
    cycle: 'all-out',
    seatsTotal: 75,
    seatsUp: 75,
    control: 'Lab',
    leader: 'Cllr Michael Mordey (Labour and Co-operative)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.sunderland.gov.uk/article/38886/Local-Government-Elections-Thursday-7-May-2026',
      'https://www.sunderland.gov.uk/article/31343/Council-Michael-Mordey-elected-new-Leader-of-Sunderland-City-Council',
      'https://committees.sunderland.gov.uk/committees/cmis5/Members/tabid/62/ctl/ViewCMIS_Person/mid/600/id/1247/ScreenMode/Ward/Default.aspx',
    ],
  },
  'north-tyneside': {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled local council election on 07-05-2026. One seat per ward is contested in North Tyneside’s regular local election cycle.',
    nextElectionYear: 2026,
    cycle: 'by-thirds',
    seatsTotal: 60,
    seatsUp: 20,
    control: 'Lab',
    leader: 'Mayor Karen Clark (Labour)',
    mayor: 'Mayor Karen Clark (Labour)',
    governanceModel: 'Directly elected mayor and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.northtyneside.gov.uk/elections-and-voting/elections/local-election-2026/notice-election-2026-0',
      'https://democracy.northtyneside.gov.uk/mgUserInfo.aspx?UID=141',
      'https://www.northtyneside.gov.uk/sites/default/files/2026-02/24-25%20audited%20statment%20of%20accounts_0.pdf',
    ],
  },
  'south-tyneside': {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled whole-council election on 07-05-2026. Following boundary changes, all 54 council seats are up together.',
    nextElectionYear: 2026,
    cycle: 'all-out',
    seatsTotal: 54,
    seatsUp: 54,
    control: 'Lab',
    leader: 'Cllr Tracey Dixon (Labour)',
    mayor: 'Cllr Jay Potts (Mayor 2025/26)',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.southtyneside.gov.uk/article/29169/Local-government-elections-Thursday-7-May-2026',
      'https://www.southtyneside.gov.uk/article/1315/Council-Leader-and-Deputy-Leader',
      'https://www.southtyneside.gov.uk/article/1609/Political-share-of-South-Tyneside-Council',
    ],
  },
  durham: {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled Durham County Council election on 07-05-2026. Durham elects all councillors once every four years and the next scheduled county election is in 2029.',
    nextElectionYear: 2029,
    cycle: 'all-out',
    seatsTotal: 126,
    seatsUp: 0,
    control: 'NOC',
    leader: 'Cllr Andrew Husband',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.durham.gov.uk/elections',
      'https://www.durham.gov.uk/article/32983/News-Council-appoints-new-Leader',
      'https://www.durham.gov.uk/media/46997/Statement-of-Accounts-2024-25/pdf/StatementOfAccounts2024-2025.pdf?m=1764346377467',
    ],
  },
  'county-durham': {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled Durham County Council election on 07-05-2026. Durham elects all councillors once every four years and the next scheduled county election is in 2029.',
    nextElectionYear: 2029,
    cycle: 'all-out',
    seatsTotal: 126,
    seatsUp: 0,
    control: 'NOC',
    leader: 'Cllr Andrew Husband',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.durham.gov.uk/elections',
      'https://www.durham.gov.uk/article/32983/News-Council-appoints-new-Leader',
      'https://www.durham.gov.uk/media/46997/Statement-of-Accounts-2024-25/pdf/StatementOfAccounts2024-2025.pdf?m=1764346377467',
    ],
  },
  northumberland: {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled Northumberland County Council election on 07-05-2026. All 69 county councillors are elected together every four years, with the next county election scheduled for 2029.',
    nextElectionYear: 2029,
    cycle: 'all-out',
    seatsTotal: 69,
    seatsUp: 0,
    control: 'Con',
    leader: 'Cllr Glen Sanderson',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.northumberland.gov.uk/councillors-and-democracy/voting-and-elections/current-elections',
      'https://www.northumberland.gov.uk/news/council-leader-welcomes-ai-investment',
      'https://www.northumberland.gov.uk/NorthumberlandCountyCouncil/media/Councillors-and-Democracy/constitution/Constitution-of-the-council.pdf',
    ],
  },
  'stockton-on-tees': {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled Stockton-on-Tees Borough Council election on 07-05-2026. The borough elects all 56 councillors together every four years, with the next ordinary election due in 2027.',
    nextElectionYear: 2027,
    cycle: 'all-out',
    seatsTotal: 56,
    seatsUp: 0,
    control: 'NOC',
    leader: 'Cllr Lisa Evans (Labour)',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.stockton.gov.uk/article/1414/Elections-and-voting',
      'https://www.stockton.gov.uk/Councillors-and-council-meetings',
      'https://www.stockton.gov.uk/Evans-Lisa',
    ],
  },
  middlesbrough: {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled Middlesbrough Council election on 07-05-2026. Middlesbrough is an elected-mayor authority and there is no ordinary local council election listed for May 2026.',
    nextElectionYear: 2027,
    cycle: 'all-out',
    seatsTotal: 46,
    seatsUp: 0,
    control: 'Lab',
    leader: 'Chris Cooke - Elected Mayor (Labour)',
    mayor: 'Chris Cooke - Elected Mayor (Labour)',
    governanceModel: 'Directly elected mayor and executive',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://moderngov.middlesbrough.gov.uk/mgUserInfo.aspx?UID=153',
      'https://www.middlesbrough.gov.uk/council-and-democracy/civic-and-ceremonial/chair-of-the-council/',
      'https://www.middlesbrough.gov.uk/elections/upcoming-elections/',
    ],
  },
  'redcar-and-cleveland': {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled Redcar and Cleveland borough election on 07-05-2026. The most recent whole-council election was in 2023 and the next ordinary local councillor election is listed for 2027.',
    nextElectionYear: 2027,
    cycle: 'all-out',
    seatsTotal: 59,
    seatsUp: 0,
    control: 'NOC',
    leader: 'Cllr Alec Brown',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.redcar-cleveland.gov.uk/voting-and-elections/upcoming-elections-and-current-vacancies',
      'https://www.redcar-cleveland.gov.uk/councillors-and-committees/the-cabinet-and-cabinet-papers',
      'https://www.redcar-cleveland.gov.uk/councillors-and-committees/your-councillors',
    ],
  },
  darlington: {
    electionStatus: 'not-voting-2026',
    electionMessage: 'No scheduled Darlington Borough Council election on 07-05-2026. Darlington’s current and future elections page lists the next borough council election in May 2027.',
    nextElectionYear: 2027,
    cycle: 'all-out',
    seatsTotal: 50,
    seatsUp: 0,
    control: 'NOC',
    leader: 'Cllr Stephen Harker',
    mayor: '',
    governanceModel: 'Leader and cabinet',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.darlington.gov.uk/elections/current-and-future-elections/',
      'https://www.darlington.gov.uk/media/b0vgeoug/council-plan-2024-2027.pdf',
      'https://www.darlington.gov.uk/elected-members/',
    ],
  },
  hartlepool: {
    electionStatus: 'scheduled-2026',
    electionMessage: 'Scheduled local council election on 07-05-2026. Hartlepool elects one seat in each ward in election years, so 12 of the 36 seats are due this cycle.',
    nextElectionYear: 2026,
    cycle: 'by-thirds',
    seatsTotal: 36,
    seatsUp: 12,
    control: 'Lab',
    leader: 'Cllr Pamela Hargreaves (Labour)',
    mayor: 'Cllr Carole Thompson (Ceremonial Mayor 2025/26)',
    governanceModel: 'Committee system',
    verificationStatus: 'verified',
    verificationSourceType: 'official council sources',
    sourceUrls: [
      'https://www.hartlepool.gov.uk/elections-voting/election-information',
      'https://www.hartlepool.gov.uk/council-democracy/appointments-council-committees',
      'https://www.hartlepool.gov.uk/council-democracy/part-1-summary-explanation',
      'https://www.hartlepool.gov.uk/councillors',
    ],
  },

}


function normalizeOpenCouncilSlug(value) {
  return slugifyCouncilName(
    String(value || '')
      .toLowerCase()
      .replace(/\bcity of\b/gi, '')
      .replace(/\bcity\b/gi, '')
      .replace(/\bcouncil\b/gi, '')
      .replace(/\bmetropolitan borough\b/gi, '')
      .replace(/\bborough council\b/gi, '')
      .replace(/\bborough\b/gi, '')
      .replace(/\bdistrict council\b/gi, '')
      .replace(/\bdistrict\b/gi, '')
      .replace(/\bcounty council\b/gi, '')
      .replace(/\bcounty\b/gi, '')
      .replace(/\bunitary authority\b/gi, '')
      .replace(/\bauthority\b/gi, '')
      .replace(/\band\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

const OPEN_COUNCIL_SLUG_ALIASES = {
  'manchester-city': ['manchester'],
  liverpool: ['liverpool'],
  trafford: ['trafford'],
  stockport: ['stockport'],
  oldham: ['oldham'],
  rochdale: ['rochdale'],
  'cheshire-east': ['cheshire-east'],
  'cheshire-west-and-chester': ['cheshire-west-chester', 'cheshire-west-and-chester'],
  'blackburn-with-darwen': ['blackburn-darwen', 'blackburn-with-darwen'],
  'stockton-on-tees': ['stockton-on-tees', 'stockton'],
}

function uniqueValues(values = []) {
  return [...new Set((values || []).map((value) => cleanText(value)).filter(Boolean))]
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(value) {
  return decodeHtmlEntities(String(value || '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function parseOpenCouncilNumber(value) {
  const text = cleanText(value).replace(/,/g, '')
  if (!text || text === '-' || text === '–') return 0
  return /^-?\d+$/.test(text) ? Number(text) : 0
}

async function fetchOpenCouncilCompositionIndex(timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(OPEN_COUNCIL_DATA_URL, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Politiscope/1.0 (+https://politiscope.co.uk)',
      },
      signal: controller.signal,
    })

    if (!res.ok) return new Map()

    const html = await res.text()
    const rowMatches = html.match(/<tr\b[\s\S]*?<\/tr>/gi) || []
    const bySlug = new Map()

    for (const rowHtml of rowMatches) {
      const cellMatches = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      const cells = cellMatches.map((m) => stripTags(m[1]))
      if (cells.length < 4) continue

      const councilName = cleanText(cells[0])
      if (!councilName || /^council$/i.test(councilName) || /^authority$/i.test(councilName)) continue

      const numericCells = cells.slice(1).map(parseOpenCouncilNumber)
      const total = Math.max(...numericCells, 0)
      if (!total) continue

      const composition = []
      const knownColumns = [
        ['Conservative', numericCells[0] || 0],
        ['Labour', numericCells[1] || 0],
        ['Lib Dem', numericCells[2] || 0],
        ['Green', numericCells[3] || 0],
        ['Reform UK', numericCells[4] || 0],
      ]

      for (const [party, seats] of knownColumns) {
        if (Number.isFinite(seats) && seats > 0) {
          composition.push({ party, seats })
        }
      }

      const used = composition.reduce((sum, row) => sum + row.seats, 0)
      const otherSeats = Math.max(0, total - used)
      if (otherSeats > 0) {
        composition.push({ party: 'Other', seats: otherSeats })
      }

      if (!composition.length) continue

      const slug = normalizeOpenCouncilSlug(councilName)
      if (!slug) continue
      bySlug.set(slug, composition.sort((a, b) => b.seats - a.seats))
    }

    return bySlug
  } catch {
    return new Map()
  } finally {
    clearTimeout(timeout)
  }
}

function inferOpenCouncilComposition(row, slug, openCouncilMap) {
  if (!(openCouncilMap instanceof Map) || !openCouncilMap.size) return null
  if (openCouncilMap.has(slug)) return openCouncilMap.get(slug)

  const aliasKeys = Array.isArray(OPEN_COUNCIL_SLUG_ALIASES?.[slug]) ? OPEN_COUNCIL_SLUG_ALIASES[slug] : []
  const altKeys = [
    slug,
    ...aliasKeys,
    slug.replace(/-city$/i, ''),
    normalizeOpenCouncilSlug(row?.name),
    normalizeOpenCouncilSlug(String(row?.name || '').replace(/^city of\s+/i, '')),
    normalizeOpenCouncilSlug(String(row?.name || '').replace(/^the\s+/i, '')),
  ].filter(Boolean)

  for (const key of altKeys) {
    if (openCouncilMap.has(key)) return openCouncilMap.get(key)
  }

  return null
}

function validateCouncilStatusRow(row) {
  const errors = []
  if (!row || typeof row !== 'object') return ['Row must be an object']
  if (!row.name || !String(row.name).trim()) errors.push('Missing name')
  if (!row.slug || !String(row.slug).trim()) errors.push(`Missing slug for ${row.name || 'unknown council'}`)
  if (row.nextElectionYear != null && !Number.isFinite(Number(row.nextElectionYear))) errors.push(`Invalid nextElectionYear for ${row.name}`)
  if (row.seatsTotal != null && !Number.isFinite(Number(row.seatsTotal))) errors.push(`Invalid seatsTotal for ${row.name}`)
  if (row.seatsUp != null && !Number.isFinite(Number(row.seatsUp))) errors.push(`Invalid seatsUp for ${row.name}`)
  if (!Array.isArray(row.sourceUrls)) errors.push(`sourceUrls must be an array for ${row.name}`)
  if (row.administration != null && typeof row.administration !== 'string') errors.push(`administration must be a string for ${row.name}`)
  if (row.composition != null && !Array.isArray(row.composition) && typeof row.composition !== 'object') errors.push(`composition must be an object or array for ${row.name}`)
  if (row.lastVerifiedAt && !/^\d{2}-\d{2}-\d{4}$/.test(String(row.lastVerifiedAt))) errors.push(`lastVerifiedAt must be dd-mm-yyyy for ${row.name}`)
  return errors
}

function normalizeCouncilStatusRow(row) {
  const name = String(row.name || '').trim()
  return {
    slug: String(row.slug || slugifyCouncilName(name)).trim(),
    name,
    electionStatus: row.electionStatus || '',
    electionMessage: row.electionMessage || '',
    nextElectionYear: row.nextElectionYear == null || row.nextElectionYear === '' ? null : Number(row.nextElectionYear),
    cycle: row.cycle || '',
    seatsTotal: row.seatsTotal == null || row.seatsTotal === '' ? null : Number(row.seatsTotal),
    seatsUp: row.seatsUp == null || row.seatsUp === '' ? null : Number(row.seatsUp),
    control: row.control || '',
    leader: row.leader || '',
    mayor: row.mayor || '',
    administration: row.administration || '',
    composition: Array.isArray(row.composition)
      ? row.composition
      : row.composition && typeof row.composition === 'object'
        ? row.composition
        : null,
    governanceModel: row.governanceModel || '',
    verificationStatus: row.verificationStatus || 'verified',
    verificationSourceType: row.verificationSourceType || 'seeded from elections.js',
    lastVerifiedAt: row.lastVerifiedAt || formatUkDate(),
    sourceUrls: Array.isArray(row.sourceUrls) ? row.sourceUrls : [],
  }
}

async function enrichCouncilStatusRow(row, openCouncilMap = new Map()) {
  if (!row) return row
  if (row.composition) return row

  const openCouncilComposition = inferOpenCouncilComposition(row, row.slug, openCouncilMap)
  if (openCouncilComposition?.length) {
    return {
      ...row,
      composition: openCouncilComposition,
      sourceUrls: uniqueValues([...(Array.isArray(row.sourceUrls) ? row.sourceUrls : []), OPEN_COUNCIL_DATA_URL]),
      verificationStatus: row.verificationStatus === 'seeded' ? 'verified' : row.verificationStatus,
      verificationSourceType: row.verificationSourceType || 'Open Council Data + official council sources',
    }
  }

  return row
}

async function importCouncilStatus(councils) {
  const res = await fetch(`${API_BASE}/api/elections/import-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ councils }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Import failed ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return { ok: true, raw: text } }
}

function inferElectionStatus(row, slug) {
  if (STATUS_OVERRIDES[slug]?.electionStatus) return STATUS_OVERRIDES[slug].electionStatus
  if (cleanText(row?.electionStatus)) return cleanText(row.electionStatus)
  return 'scheduled-2026'
}

function inferCycle(row, slug) {
  if (STATUS_OVERRIDES[slug]?.cycle) return STATUS_OVERRIDES[slug].cycle
  if (cleanText(row?.cycle)) return cleanText(row.cycle)

  const type = cleanText(row?.type)
  if (type === 'County' || type === 'Unitary' || type === 'London Borough') return 'all-out'
  if (type === 'Metropolitan') return 'by-thirds'
  if (type === 'District') return 'all-out'
  return ''
}

function inferSeatsTotal(row, slug, profile = {}) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.seatsTotal != null) return override.seatsTotal
  return row?.seatsTotal ?? row?.seats ?? profile?.seats?.total ?? null
}

function inferSeatsUp(row, slug, cycle, seatsTotal, electionStatus, profile = {}) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.seatsUp != null) return override.seatsUp
  if (row?.seatsUp != null) return row.seatsUp
  if (profile?.seatsUp != null) return profile.seatsUp
  if (electionStatus === 'not-voting-2026') return 0
  if (!Number.isFinite(Number(seatsTotal))) return null
  if (cycle === 'by-thirds') return Math.round(Number(seatsTotal) / 3)
  return Number(seatsTotal)
}

function inferNextElectionYear(row, slug, electionStatus) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.nextElectionYear != null) return override.nextElectionYear
  if (row?.nextElectionYear != null && row?.nextElectionYear !== '') return Number(row.nextElectionYear)
  if (electionStatus === 'not-voting-2026') return null
  return 2026
}

function inferGovernanceModel(row, slug, profile = {}) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.governanceModel) return override.governanceModel
  if (cleanText(row?.governanceModel)) return cleanText(row.governanceModel)
  if (cleanText(profile?.governanceModel)) return cleanText(profile.governanceModel)

  const mayor = cleanText(row?.mayor || profile?.mayor)
  const type = cleanText(row?.type)
  if (/directly elected mayor/i.test(mayor)) return 'Directly elected mayor and cabinet'
  if (type === 'Metropolitan' || type === 'County' || type === 'Unitary' || type === 'District' || type === 'Borough' || type === 'London Borough') {
    return 'Leader and cabinet'
  }
  return ''
}

function inferElectionMessage(row, slug, electionStatus, cycle, seatsUp, seatsTotal, nextElectionYear) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.electionMessage) return override.electionMessage
  if (cleanText(row?.electionMessage)) return cleanText(row.electionMessage)

  const type = normaliseType(row?.type)
  if (electionStatus === 'not-voting-2026') {
    return nextElectionYear
      ? `No scheduled ${type.toLowerCase()} election here on 07-05-2026. The next scheduled council vote is ${nextElectionYear}.`
      : `No scheduled ${type.toLowerCase()} election here on 07-05-2026.`
  }

  if (cycle === 'by-thirds') {
    return `Scheduled local council election on 07-05-2026. ${seatsUp || 'A third of seats'} are up under the by-thirds cycle.`
  }

  if (cycle === 'all-out') {
    return `Scheduled all-out local council election on 07-05-2026${Number.isFinite(Number(seatsTotal)) ? ` with all ${Number(seatsTotal)} seats up` : ''}.`
  }

  return 'Scheduled local council election on 07-05-2026.'
}

function inferLeader(row, slug, profile = {}) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.leader) return override.leader
  return cleanText(row?.leader) || cleanText(profile?.leader) || ''
}

function inferMayor(row, slug, profile = {}) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.mayor != null) return override.mayor
  return cleanText(row?.mayor) || cleanText(profile?.mayor) || ''
}

function inferControl(row, slug, profile = {}) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.control) return override.control
  return cleanText(row?.control) || cleanText(profile?.control) || ''
}

function inferSourceUrls(row, slug) {
  const override = STATUS_OVERRIDES[slug]
  if (Array.isArray(override?.sourceUrls) && override.sourceUrls.length) return override.sourceUrls
  if (Array.isArray(row?.sourceUrls) && row.sourceUrls.length) return row.sourceUrls.filter(Boolean)
  const urls = [
    row?.officialWebsite,
    row?.officialElectionsUrl,
    row?.officialCompositionUrl,
    row?.website,
  ].filter(Boolean)
  return [...new Set(urls)]
}

function inferVerificationStatus(row, slug) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.verificationStatus) return override.verificationStatus
  if (cleanText(row?.verificationStatus)) return cleanText(row.verificationStatus)
  return 'seeded'
}

function inferVerificationSourceType(row, slug) {
  const override = STATUS_OVERRIDES[slug]
  if (override?.verificationSourceType) return override.verificationSourceType
  if (cleanText(row?.verificationSourceType)) return cleanText(row.verificationSourceType)
  return 'seeded from elections.js'
}

function buildCouncilStatusRows() {
  const councils = Array.isArray(LOCAL_ELECTIONS?.councils) ? LOCAL_ELECTIONS.councils : []
  const seen = new Set()

  return councils.map((row) => {
    const name = String(row?.name || '').trim()
    if (!name) return null

    const slug = slugifyCouncilName(name)
    if (seen.has(slug)) return null
    seen.add(slug)

    const profile = COUNCIL_PROFILES?.[name] || {}
    const electionStatus = inferElectionStatus(row, slug)
    const seatsTotal = inferSeatsTotal(row, slug, profile)
    const cycle = inferCycle(row, slug)
    const seatsUp = inferSeatsUp(row, slug, cycle, seatsTotal, electionStatus, profile)
    const nextElectionYear = inferNextElectionYear(row, slug, electionStatus)

    return {
      slug,
      name,
      electionStatus,
      electionMessage: inferElectionMessage(row, slug, electionStatus, cycle, seatsUp, seatsTotal, nextElectionYear),
      nextElectionYear,
      cycle,
      seatsTotal,
      seatsUp,
      control: inferControl(row, slug, profile),
      leader: inferLeader(row, slug, profile),
      mayor: inferMayor(row, slug, profile),
      administration: '',
      composition: null,
      governanceModel: inferGovernanceModel(row, slug, profile),
      verificationStatus: inferVerificationStatus(row, slug),
      verificationSourceType: inferVerificationSourceType(row, slug),
      lastVerifiedAt: STATUS_OVERRIDES[slug]?.lastVerifiedAt || formatUkDate(),
      sourceUrls: inferSourceUrls(row, slug),
    }
  }).filter(Boolean)
}

async function main() {
  console.log(`Using API base: ${API_BASE}`)
  const openCouncilMap = await fetchOpenCouncilCompositionIndex()
  console.log(`Open Council Data composition rows: ${openCouncilMap.size}`)
  const baseRows = buildCouncilStatusRows()
  const rawRows = await Promise.all(baseRows.map((row) => enrichCouncilStatusRow(row, openCouncilMap)))
  const councils = rawRows.map(normalizeCouncilStatusRow)
  const validationErrors = councils.flatMap(validateCouncilStatusRow)

  if (validationErrors.length) {
    console.error('Validation failed:')
    for (const err of validationErrors) console.error(`- ${err}`)
    process.exit(1)
  }

  console.log(`Prepared council status rows: ${councils.length}`)
  console.log('Importing to Worker...')
  const result = await importCouncilStatus(councils)
  console.log('Import result:')
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('Council status ingest failed:')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
