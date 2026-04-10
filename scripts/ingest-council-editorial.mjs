import process from 'node:process'
import { LOCAL_ELECTIONS, COUNCIL_PROFILES } from '../src/data/elections.js'

const API_BASE =
  process.env.POLITISCOPE_API_BASE ||
  'https://politiscope-api.craighow8.workers.dev'

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

const EDITORIAL_OVERRIDES = {
  sheffield: {
    verdict: 'NOC coalition test',
    difficulty: 'hard',
    watchFor: 'No overall control with Labour, Liberal Democrats and Greens sharing power through a collaborative administration. The real story is whether Labour stays the largest group, whether the Lib Dems regain ground in the west and south-west, and whether Greens keep building in student and inner-city wards.',
    targetParty: '',
    whatCountsAsShock: 'A real shock would be Labour slipping badly enough for the Liberal Democrats and Greens to emerge with a much stronger joint position, or Labour rebuilding enough to make Sheffield look less fragmented than it does now.',
    keyIssue: 'Three-party governing arithmetic in a city many people wrongly assume is a straightforward Labour hold.',
    prediction: 'This is not a simple Labour hold. Sheffield is under no overall control and is run through a Labour–Liberal Democrat–Green collaboration.',
    updatedAt: formatUkDate(),
  },
  doncaster: {
    verdict: 'Not voting this cycle',
    difficulty: 'medium',
    watchFor: 'Doncaster still matters politically because it now combines a Labour elected mayor with a Reform-dominated council chamber.',
    targetParty: 'Reform',
    whatCountsAsShock: 'The next real shock threshold is not May 2026, but whether Reform\'s council dominance holds together through to the 2029 all-out election while Labour still holds the mayoralty.',
    keyIssue: 'Split authority: Labour mayoralty, Reform-led chamber.',
    prediction: 'Doncaster should be shown as an important council profile even without a scheduled 2026 council vote.',
    updatedAt: formatUkDate(),
  },
  rotherham: {
    verdict: 'Not voting this cycle',
    difficulty: 'medium',
    watchFor: 'Rotherham still matters because it is a longer-term test of whether Labour can hold its base against Reform-style anti-establishment pressure before the next all-out vote.',
    targetParty: 'Reform',
    whatCountsAsShock: 'There is no May 2026 borough-election shock here; the real future shock would be Labour losing serious ground or overall control when Rotherham next votes all-out in 2028.',
    keyIssue: 'No scheduled 2026 borough vote, but medium-term pressure remains politically relevant.',
    prediction: 'Rotherham should remain visible in search and council profiles with a clear not-voting message rather than disappearing.',
    updatedAt: formatUkDate(),
  },
  birmingham: {
    verdict: 'Labour defend on new boundaries',
    difficulty: 'hard',
    watchFor: 'All seats are up on a new ward map. The election is being fought against the backdrop of Birmingham\'s financial crisis, governance scrutiny and a chamber reset.',
    targetParty: '',
    whatCountsAsShock: 'A shock would be Labour losing control outright on the new boundaries, or a highly fragmented chamber making stable administration much harder after the reset.',
    keyIssue: 'This is not a normal by-thirds metro cycle. It is a citywide reset.',
    prediction: 'Birmingham is one of the biggest single prizes on the 2026 map because all 101 seats are up at once.',
    updatedAt: formatUkDate(),
  },
  leeds: {
    verdict: 'Labour defend',
    difficulty: 'medium',
    watchFor: 'Labour still leads Leeds, but the chamber is more plural than a generic safe-city reading suggests. Greens, Liberal Democrats, Reform and several independent groupings all matter to the wider story.',
    targetParty: '',
    whatCountsAsShock: 'A shock would be Labour losing enough ground for its control to look genuinely unstable, or one of the smaller parties making a visibly broader breakthrough across the city.',
    keyIssue: 'Leeds is Labour-led, but not monolithic.',
    prediction: 'Leeds is still a Labour-led city, but its political shape is broader and messier than a simple safe-Labour label suggests.',
    updatedAt: formatUkDate(),
  },
  bradford: {
    verdict: 'Labour control test',
    difficulty: 'hard',
    watchFor: 'Bradford is one of the more politically fragmented big-city councils. Labour has control, but the shape of the opposition means this should not be treated as a generic safe Labour metro.',
    targetParty: '',
    whatCountsAsShock: 'A shock would be Labour slipping below effective control, or one of the independent blocs or Greens expanding enough to make Bradford look structurally less governable.',
    keyIssue: 'Fragmented opposition and 2026 all-out election after boundary review.',
    prediction: 'Bradford matters because a full-council election can change the city\'s political arithmetic much faster than a normal annual cycle.',
    updatedAt: formatUkDate(),
  },
  newcastle: {
    verdict: 'NOC balance test',
    difficulty: 'hard',
    watchFor: 'Newcastle is no longer a simple Labour-dominant city. Labour is the largest group, but there is no overall control and several opposition forces shape the chamber.',
    targetParty: '',
    whatCountsAsShock: 'A shock would be Labour slipping further away from effective control, or another bloc emerging strong enough to reshape the city\'s coalition arithmetic.',
    keyIssue: 'No overall control and multiple opposition blocs.',
    prediction: 'Newcastle is a real political-management story, not just a ward-count story.',
    updatedAt: formatUkDate(),
  },
  lancashire: {
    verdict: 'Reform-run county under pressure',
    difficulty: 'hard',
    watchFor: 'Lancashire matters nationally because Reform now leads the county council after the 2025 elections. The question is whether Reform can look like a durable governing force rather than just a protest vehicle once the pressure of office bites.',
    targetParty: 'Lab',
    whatCountsAsShock: 'A shock would be Reform rapidly losing its grip on county politics before the next ordinary election cycle, or Labour recovering local authority in places where Reform now expects to dominate the conversation.',
    keyIssue: 'Whether Reform can turn a breakthrough county win into credible local-government control.',
    prediction: 'Lancashire should be treated as one of the most politically important North West councils because it is now a real test case for Reform in office.',
    updatedAt: formatUkDate(),
  },
  'manchester-city': {
    verdict: 'Labour metropolitan fortress',
    difficulty: 'safe',
    watchFor: 'Manchester is still one of Labour\'s strongest big-city councils, but the interesting local story is not council control itself. It is whether Greens and other challengers continue to build pockets of strength in parts of the city without changing the overall balance of power.',
    targetParty: '',
    whatCountsAsShock: 'A shock would be Labour looking structurally weaker across the city rather than merely dropping votes in a few wards, because Manchester is not expected to become a close overall control contest.',
    keyIssue: 'Whether Labour\'s dominance still looks culturally and electorally secure in one of its flagship urban councils.',
    prediction: 'Manchester should remain Labour-controlled, but smaller party advances still matter because they show where future urban pressure points might emerge.',
    updatedAt: formatUkDate(),
  },
  liverpool: {
    verdict: 'Labour city stronghold',
    difficulty: 'safe',
    watchFor: 'Liverpool is still a Labour-led city, but the more interesting question is whether smaller parties can keep building footholds in specific neighbourhoods while Labour continues to dominate the overall authority.',
    targetParty: '',
    whatCountsAsShock: 'A shock would be Labour looking visibly brittle across the city rather than simply losing ground in one or two wards, because Liverpool is still expected to remain firmly Labour-led.',
    keyIssue: 'How secure Labour\'s political dominance still looks in one of its most historically important city councils.',
    prediction: 'Liverpool should remain Labour-led, but ward-level shifts are still worth watching as an indicator of local discontent or changing city politics.',
    updatedAt: formatUkDate(),
  },
  trafford: {
    verdict: 'Labour defend in mixed suburbia',
    difficulty: 'hard',
    watchFor: 'Trafford matters because it blends affluent suburbs, Labour territory and Liberal Democrat pressure in the same borough. The key question is whether Labour can keep its lead against opponents who each have real local footholds.',
    targetParty: 'LD',
    whatCountsAsShock: 'A shock would be Labour losing strategic control of the borough or the anti-Labour vote aligning strongly enough to make Trafford feel structurally less secure.',
    keyIssue: 'Whether Labour can hold a politically mixed borough where both Conservatives and Liberal Democrats still matter.',
    prediction: 'Trafford still looks defendable for Labour, but it should be treated as a live metropolitan contest rather than a sleepy hold.',
    updatedAt: formatUkDate(),
  },
  stockport: {
    verdict: 'Labour–Liberal Democrat contest',
    difficulty: 'hard',
    watchFor: 'Stockport is one of the clearest North West tests of Labour against Liberal Democrats in a mixed urban-suburban borough. It matters because the borough sits in political territory where affluent anti-Conservative voting patterns can translate into local council pressure.',
    targetParty: 'LD',
    whatCountsAsShock: 'A shock would be one side opening a decisive gap in a borough that should remain politically competitive between Labour and the Liberal Democrats.',
    keyIssue: 'Whether Labour can hold off a credible Liberal Democrat challenge in one of the region\'s most politically mixed councils.',
    prediction: 'Stockport should stay competitive and is better treated as a real two-sided local fight than as a generic Labour council.',
    updatedAt: formatUkDate(),
  },
  oldham: {
    verdict: 'Fragmented borough under pressure',
    difficulty: 'hard',
    watchFor: 'Oldham matters because the local political picture is more fragmented than a simple Labour-versus-Conservative story. Reform, local groupings and Labour all matter, which makes the borough more volatile than many metropolitan councils of similar size.',
    targetParty: 'Reform',
    whatCountsAsShock: 'A shock would be one bloc suddenly breaking out of Oldham\'s fragmented politics strongly enough to make the current messy balance look resolved.',
    keyIssue: 'Whether Labour can remain the natural governing force in a borough with a crowded and unstable opposition landscape.',
    prediction: 'Oldham should be treated as politically unsettled rather than safely banked for any one side.',
    updatedAt: formatUkDate(),
  },
  rochdale: {
    verdict: 'Labour control under pressure',
    difficulty: 'hard',
    watchFor: 'Rochdale matters because Labour still controls the council, but the borough has a visibly messier local political environment than a straightforward Labour hold would suggest. Reform, independents and the Workers Party all complicate the picture.',
    targetParty: 'Reform',
    whatCountsAsShock: 'A shock would be Labour losing control or the opposition coalescing strongly enough to make Rochdale look structurally unstable.',
    keyIssue: 'Whether Labour can remain clearly dominant in a borough where challenger parties and independents have found room to grow.',
    prediction: 'Rochdale should still be treated as Labour-held, but it is not politically tidy and should not be written up as a routine metro hold.',
    updatedAt: formatUkDate(),
  },
  'cheshire-east': {
    verdict: 'Knife-edge Cheshire battleground',
    difficulty: 'very hard',
    watchFor: 'Cheshire East is one of the most useful North West authorities for tracking multi-party competition. Labour leads the council, but Conservatives, independents and smaller groups all matter, making this a real council-arithmetic story.',
    targetParty: 'Con',
    whatCountsAsShock: 'A shock would be Labour turning a fragile lead into something that looks genuinely comfortable, or the opposition reorganising strongly enough to push Labour out of command.',
    keyIssue: 'How stable Labour\'s position really is in a politically mixed Cheshire unitary authority.',
    prediction: 'Cheshire East should be treated as a proper battleground rather than a settled Labour authority.',
    updatedAt: formatUkDate(),
  },
  'cheshire-west-and-chester': {
    verdict: 'Labour defend in broad borough',
    difficulty: 'medium',
    watchFor: 'Cheshire West and Chester matters because Labour has a clear lead, but the borough is broad enough that smaller parties and local independents still shape the wider picture. It is less secure than a simple top-line control label can imply.',
    targetParty: 'Con',
    whatCountsAsShock: 'A shock would be Labour losing its authority over the council\'s direction or the opposition narrowing the gap far more sharply than expected.',
    keyIssue: 'Whether Labour\'s lead still feels durable across a politically mixed Cheshire borough.',
    prediction: 'Labour still looks the leading force here, but this should be treated as a defend rather than a safe coast.',
    updatedAt: formatUkDate(),
  },
  warrington: {
    verdict: 'Labour-led new-town test',
    difficulty: 'medium',
    watchFor: 'Warrington matters because it is one of those authorities where Labour leads clearly, but the borough is politically mixed enough that local shifts still matter. Liberal Democrats and independents are part of the real local picture.',
    targetParty: 'LD',
    whatCountsAsShock: 'A shock would be Labour\'s lead eroding sharply enough to make the borough look genuinely unstable rather than broadly Labour-led.',
    keyIssue: 'Whether Labour can keep a convincing grip on a politically mixed new-town authority.',
    prediction: 'Warrington still looks Labour-led, but it is worth tracking because local movement here can say something wider about suburban and commuter-belt politics.',
    updatedAt: formatUkDate(),
  },
  halton: {
    verdict: 'Labour hold with local pressure',
    difficulty: 'medium',
    watchFor: 'Halton remains Labour-led, but places like Runcorn mean it cannot just be dismissed as politically static. What matters is whether Labour still looks like the natural governing force once local and national pressure are combined.',
    targetParty: 'Reform',
    whatCountsAsShock: 'A shock would be Labour suddenly looking weak enough in Halton for the borough to move from background hold to serious battleground territory.',
    keyIssue: 'Whether Labour\'s local grip still looks secure in a borough that sits near some live anti-establishment pressure points.',
    prediction: 'Halton still looks like a Labour-led authority, but it deserves more attention than a generic hold label suggests.',
    updatedAt: formatUkDate(),
  },
  blackpool: {
    verdict: 'Reform pressure on Labour-led coast',
    difficulty: 'very hard',
    watchFor: 'Blackpool matters because it combines Labour control with a political environment where Reform pressure is easy to imagine. Coastal economics, anti-establishment sentiment and churn in local voting habits all make it a live authority to watch.',
    targetParty: 'Reform',
    whatCountsAsShock: 'A shock would be Labour losing control or Reform turning coastal frustration into a much stronger borough-wide breakthrough than expected.',
    keyIssue: 'Whether Labour can hold a deprived coastal authority in the face of Reform-style insurgent pressure.',
    prediction: 'Blackpool should be treated as one of the North West councils where Reform pressure is politically meaningful, even if Labour still starts as the lead force.',
    updatedAt: formatUkDate(),
  },
  'blackburn-with-darwen': {
    verdict: 'Labour-led borough with pressure on the margins',
    difficulty: 'medium',
    watchFor: 'Blackburn with Darwen remains Labour-led, but the borough still matters because challenger parties can grow unevenly across different parts of the authority. The interesting question is whether Labour continues to look clearly dominant rather than merely ahead.',
    targetParty: 'Con',
    whatCountsAsShock: 'A shock would be Labour\'s hold weakening enough to turn Blackburn with Darwen into a genuinely uncertain borough-wide contest.',
    keyIssue: 'Whether Labour\'s lead still looks comfortable across a politically mixed borough with both Blackburn and Darwen dynamics in play.',
    prediction: 'Labour remains the obvious lead force, but this is better treated as a monitored defend than a totally closed contest.',
    updatedAt: formatUkDate(),
  },
  preston: {
    verdict: 'Labour city defend',
    difficulty: 'medium',
    watchFor: 'Preston is still Labour-led, but the city matters because its politics are not frozen. Smaller parties and local campaign currents can still shape the feel of the result even when overall control does not look immediately at risk.',
    targetParty: '',
    whatCountsAsShock: 'A shock would be Labour suddenly looking vulnerable in a city where it would normally expect to remain the lead force.',
    keyIssue: 'Whether Labour can continue to look like the natural governing party in Preston without a serious erosion of authority.',
    prediction: 'Preston still looks like a Labour-led city, but ward-level movement remains worth watching for early signs of broader change.',
    updatedAt: formatUkDate(),
  },
  sefton: {
    verdict: 'Labour-led borough with a broad map',
    difficulty: 'medium',
    watchFor: 'Sefton matters because it is a broad and internally varied borough, not a simple one-note Labour stronghold. Southport and Formby behave differently from Bootle and other Labour heartlands, so the borough is always worth reading carefully.',
    targetParty: 'LD',
    whatCountsAsShock: 'A shock would be Labour\'s position slipping enough for Sefton to stop looking like a clear Labour-led authority.',
    keyIssue: 'Whether Labour can maintain a convincing lead across a borough with very different local political cultures.',
    prediction: 'Sefton still looks Labour-led, but it is one of those metropolitan councils where local geography matters more than a single headline number suggests.',
    updatedAt: formatUkDate(),
  },
  wirral: {
    verdict: 'Committee-system battleground',
    difficulty: 'hard',
    watchFor: 'Wirral matters because its committee system and fragmented political composition make overall control less straightforward than in a classic leader-and-cabinet authority. Labour leads, but Greens, Conservatives, Liberal Democrats and Reform all matter in different parts of the borough.',
    targetParty: 'Con',
    whatCountsAsShock: 'A shock would be one bloc suddenly pulling away in a borough that is structurally set up for more fragmented politics.',
    keyIssue: 'Whether Labour can keep setting the direction of the borough in a committee-system council with multiple meaningful opposition forces.',
    prediction: 'Wirral should be treated as politically alive and strategically important, not as a routine Labour borough.',
    updatedAt: formatUkDate(),
  },


  bolton: {
    verdict: "Fragmented Bolton battleground",
    difficulty: "hard",
    watchFor: "Bolton is not a straightforward Labour-versus-Conservative contest anymore. The borough has a fragmented chamber with Liberal Democrats, Reform and strong local groups all shaping the politics, so the real question is whether Labour can stay clearly ahead in a messy field.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be Bolton's fragmented politics suddenly resolving into a much clearer anti-Labour coalition or Labour falling far enough back that leadership of the borough starts to look genuinely unstable.",
    keyIssue: "Whether Labour can remain the leading force in one of the North West's messier metropolitan chambers.",
    prediction: "Bolton should be treated as politically unsettled rather than as a routine Labour borough.",
    updatedAt: formatUkDate(),
  },
  bury: {
    verdict: "Labour-controlled borough under watch",
    difficulty: "medium",
    watchFor: "Bury matters because Labour controls the borough, but local opposition is more layered than a simple two-party fight. Radcliffe First, Reform, Conservatives and other smaller blocs all matter to the wider story.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be Labour losing enough ground for Bury to stop looking like a clearly Labour-run authority and instead become a fragmented control question.",
    keyIssue: "Whether Labour's borough-wide control still looks durable against a more complicated opposition map.",
    prediction: "Bury still looks Labour-controlled, but it is better treated as a defend than as a safe borough.",
    updatedAt: formatUkDate(),
  },
  salford: {
    verdict: "Labour mayoral stronghold",
    difficulty: "safe",
    watchFor: "Salford is a Labour-led city, but it is politically distinctive because the directly elected City Mayor is the executive leader. The live question is not overall Labour control so much as whether smaller parties can widen their local footholds without threatening the city-wide Labour grip.",
    targetParty: "",
    whatCountsAsShock: "A shock would be Labour looking weak enough in the council chamber to undermine the sense of Salford as a secure mayoral-Labour city.",
    keyIssue: "How secure Labour's executive and chamber dominance still looks in a directly elected mayor authority.",
    prediction: "Salford should remain clearly Labour-led, with most interesting movement likely to be local rather than borough-wide.",
    updatedAt: formatUkDate(),
  },
  tameside: {
    verdict: "Labour fortress with limited pressure",
    difficulty: "safe",
    watchFor: "Tameside remains one of Labour's stronger metropolitan boroughs. The live question is less about control and more about whether any opposition can build enough local traction to turn parts of the borough into future pressure points.",
    targetParty: "",
    whatCountsAsShock: "A shock would be Labour looking materially weaker across the borough rather than just dropping votes in one or two wards.",
    keyIssue: "Whether Labour's long-standing borough-wide dominance still looks secure.",
    prediction: "Tameside should remain comfortably Labour-led, though ward-level drift is still worth monitoring.",
    updatedAt: formatUkDate(),
  },
  wigan: {
    verdict: "Labour-led borough with executive stability",
    difficulty: "safe",
    watchFor: "Wigan is still Labour-led and structurally stronger for Labour than some of the North West's more fragmented boroughs. The key interest is whether opposition parties can create any meaningful local pressure in a borough where the executive leadership currently looks stable.",
    targetParty: "",
    whatCountsAsShock: "A shock would be Labour looking strategically exposed in a borough where it would normally expect to retain clear authority.",
    keyIssue: "Whether Labour's executive leadership and broad chamber dominance still look solid.",
    prediction: "Wigan should remain Labour-led, with the bigger story being whether any opposition can create future footholds rather than immediate control risk.",
    updatedAt: formatUkDate(),
  },
  knowsley: {
    verdict: "Labour fortress borough",
    difficulty: "safe",
    watchFor: "Knowsley remains one of Labour's safest local authorities. The only meaningful political question is whether any challenger can begin to establish a visible local base rather than whether overall control is truly at risk.",
    targetParty: "",
    whatCountsAsShock: "A shock would be Labour looking materially weaker in a borough that is normally treated as one of its safest councils.",
    keyIssue: "Whether Knowsley still functions as a near-automatic Labour borough in local politics.",
    prediction: "Knowsley should remain securely Labour-controlled, with any opposition movement more notable as a signal than as an immediate threat.",
    updatedAt: formatUkDate(),
  },
  'st-helens': {
    verdict: "Labour all-out test",
    difficulty: "medium",
    watchFor: "St Helens matters because it combines long-term Labour control with a whole-council election cycle. That means change, if it comes, can show up more quickly and more clearly than in by-thirds metropolitan councils.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be Labour's borough-wide position weakening sharply enough for control to look less secure after an all-out contest.",
    keyIssue: "Whether Labour's long-running dominance still holds up cleanly in an all-out borough election.",
    prediction: "St Helens still looks Labour-led, but whole-council elections make the borough more worth watching than a routine annual metro contest.",
    updatedAt: formatUkDate(),
  },
  barnsley: {
    verdict: "Labour all-out test",
    difficulty: "medium",
    watchFor: "Barnsley still leans heavily Labour, but 2026 matters because the borough has moved to a whole-council cycle. That means shifts in the balance can show up much more clearly in one go than under the old by-thirds rhythm.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be Labour losing enough ground in the all-out election for Barnsley to stop looking like one of its safer South Yorkshire boroughs.",
    keyIssue: "Whether Labour's long-term borough dominance still holds up cleanly once every seat is contested together.",
    prediction: "Barnsley still looks Labour-led, but the all-out format makes it more revealing than a routine metro election.",
    updatedAt: formatUkDate(),
  },
  wakefield: {
    verdict: "Whole-council reset in Wakefield",
    difficulty: "hard",
    watchFor: "Wakefield is one of the more interesting Yorkshire authorities in 2026 because every seat is up at once after the move to whole-council elections. Labour starts in front, but the all-out format means the electorate gets a much clearer chance to redraw the borough map in one go.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be Labour losing its clear hold over Wakefield's political direction once all 63 seats are contested together.",
    keyIssue: "Whether Labour can convert a strong current position into a convincing new mandate in the first whole-council contest for years.",
    prediction: "Wakefield still looks Labour-led, but the reset election makes it a more serious watch council than a normal annual metro cycle.",
    updatedAt: formatUkDate(),
  },
  kirklees: {
    verdict: "Kirklees all-out battleground",
    difficulty: "very hard",
    watchFor: "Kirklees is one of the most politically fragmented Yorkshire councils. Labour leads the administration, but the chamber is split across Conservatives, Liberal Democrats, Greens, independents and other local groupings. An all-out election makes that volatility much more important.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be one bloc opening up a genuinely clear advantage in a borough that currently looks built for fragmentation and bargaining.",
    keyIssue: "Whether Labour can remain the leading force in a very mixed all-out contest where no party starts near outright control.",
    prediction: "Kirklees should be treated as one of Yorkshire's most open local battlegrounds in 2026.",
    updatedAt: formatUkDate(),
  },
  calderdale: {
    verdict: "Labour defend in Calderdale",
    difficulty: "medium",
    watchFor: "Calderdale matters because Labour leads the council, but the borough is politically mixed enough that Conservatives, Liberal Democrats, Reform and independents can all still shape the wider story. It is safer than Kirklees, but not politically dead.",
    targetParty: "Con",
    whatCountsAsShock: "A shock would be Labour losing its comfortable position and turning Calderdale into a much tighter borough-wide contest.",
    keyIssue: "Whether Labour can keep a clear lead in a borough with several active opposition currents.",
    prediction: "Calderdale still looks Labour-led, but it is best treated as a monitored defend rather than a closed contest.",
    updatedAt: formatUkDate(),
  },
  hull: {
    verdict: "Liberal Democrat city defend",
    difficulty: "hard",
    watchFor: "Hull matters because it is one of the clearest Liberal Democrat-led urban councils in the north, with Labour still close enough to matter. The annual election pattern means even modest swings can change the political mood quickly.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be the Liberal Democrats losing their grip on the city's direction or Labour closing the gap sharply enough to make Hull look structurally unstable.",
    keyIssue: "Whether the Liberal Democrats can keep commanding a city where Labour still has a strong base and the margins are not enormous.",
    prediction: "Hull should be treated as a genuinely live Lib Dem\u2013Labour city contest, not a settled authority.",
    updatedAt: formatUkDate(),
  },
  'kingston-upon-hull': {
    verdict: "Liberal Democrat city defend",
    difficulty: "hard",
    watchFor: "Hull matters because it is one of the clearest Liberal Democrat-led urban councils in the north, with Labour still close enough to matter. The annual election pattern means even modest swings can change the political mood quickly.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be the Liberal Democrats losing their grip on the city's direction or Labour closing the gap sharply enough to make Hull look structurally unstable.",
    keyIssue: "Whether the Liberal Democrats can keep commanding a city where Labour still has a strong base and the margins are not enormous.",
    prediction: "Hull should be treated as a genuinely live Lib Dem\u2013Labour city contest, not a settled authority.",
    updatedAt: formatUkDate(),
  },
  'east-riding-of-yorkshire': {
    verdict: "Conservative East Riding defend",
    difficulty: "medium",
    watchFor: "East Riding matters because it remains one of the largest Conservative-led councils in Yorkshire, but local elections here are shaped by a broad rural and coastal map where independents and local factors can still matter.",
    targetParty: "Con",
    whatCountsAsShock: "A shock would be the Conservatives losing their clear command of the authority or the council moving into a more fragmented post-election shape.",
    keyIssue: "Whether Conservative control still looks resilient across a large and diverse all-out rural authority.",
    prediction: "East Riding still looks Conservative-led, but all-out elections mean any slippage would be harder to hide.",
    updatedAt: formatUkDate(),
  },
  'east-riding-of-yorks': {
    verdict: "Conservative East Riding defend",
    difficulty: "medium",
    watchFor: "East Riding matters because it remains one of the largest Conservative-led councils in Yorkshire, but local elections here are shaped by a broad rural and coastal map where independents and local factors can still matter.",
    targetParty: "Con",
    whatCountsAsShock: "A shock would be the Conservatives losing their clear command of the authority or the council moving into a more fragmented post-election shape.",
    keyIssue: "Whether Conservative control still looks resilient across a large and diverse all-out rural authority.",
    prediction: "East Riding still looks Conservative-led, but all-out elections mean any slippage would be harder to hide.",
    updatedAt: formatUkDate(),
  },
  'east-riding': {
    verdict: "Conservative East Riding defend",
    difficulty: "medium",
    watchFor: "East Riding matters because it remains one of the largest Conservative-led councils in Yorkshire, but local elections here are shaped by a broad rural and coastal map where independents and local factors can still matter.",
    targetParty: "Con",
    whatCountsAsShock: "A shock would be the Conservatives losing their clear command of the authority or the council moving into a more fragmented post-election shape.",
    keyIssue: "Whether Conservative control still looks resilient across a large and diverse all-out rural authority.",
    prediction: "East Riding still looks Conservative-led, but all-out elections mean any slippage would be harder to hide.",
    updatedAt: formatUkDate(),
  },
  york: {
    verdict: "Labour-led city under watch",
    difficulty: "medium",
    watchFor: "York is politically more competitive than its headline Labour control might suggest. Labour leads, but the Liberal Democrats remain close enough that the city cannot be treated as a routine safe hold.",
    targetParty: "LD",
    whatCountsAsShock: "A shock would be Labour losing its lead or the Liberal Democrats moving decisively back into commanding territory before the next full city election.",
    keyIssue: "Whether Labour can hold a stable lead in a city where the Lib Dems remain a credible alternative governing force.",
    prediction: "York still looks Labour-led, but it remains a proper two-sided city contest in the medium term.",
    updatedAt: formatUkDate(),
  },
  'north-yorkshire': {
    verdict: "Conservative-led county-scale authority",
    difficulty: "medium",
    watchFor: "North Yorkshire matters because it is a very large unitary authority with a Conservative-led executive and a broad mixed geography. The interesting question is less immediate control risk in 2026 and more whether opposition forces can build enough visibility before the next full election.",
    targetParty: "Con",
    whatCountsAsShock: "A shock would be the Conservatives looking significantly weaker across the authority before the next all-out council election in 2027.",
    keyIssue: "Whether the current Conservative-led settlement still looks durable across a huge rural and market-town authority.",
    prediction: "North Yorkshire should remain Conservative-led for now, but it is strategically important because it concentrates so much territory and administrative weight in one council.",
    updatedAt: formatUkDate(),
  },
  gateshead: {
    verdict: "Labour all-out reset",
    difficulty: "medium",
    watchFor: "Gateshead matters in 2026 because every seat is up at once after the ward boundary review. Labour starts from a position of control, but an all-out election gives voters a much clearer chance to reshape the borough in one go.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be Labour losing its clear command of Gateshead or the opposition cutting deeply enough into the chamber to make the borough look politically unsettled after the reset.",
    keyIssue: "Whether Labour can turn a long-standing position of strength into a convincing mandate on the new ward map.",
    prediction: "Gateshead still looks Labour-led, but the all-out format makes 2026 more revealing than a routine metro election.",
    updatedAt: formatUkDate(),
  },
  sunderland: {
    verdict: "Labour defend on new map",
    difficulty: "hard",
    watchFor: "Sunderland is a major North East prize in 2026 because all 75 seats are up at once after the boundary review. Labour remains the lead force, but the city's mixed political map means a full-chamber election can expose shifts much faster than the old cycle.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be Labour losing overall command of the council or a sharply more fragmented chamber emerging from the all-out election.",
    keyIssue: "Whether Labour can secure a strong fresh mandate when the whole city votes together under the new ward map.",
    prediction: "Sunderland still looks Labour-led, but it should be treated as a serious all-out city test rather than a routine hold.",
    updatedAt: formatUkDate(),
  },
  'north-tyneside': {
    verdict: "Mayoral Labour defend",
    difficulty: "medium",
    watchFor: "North Tyneside is politically distinctive because it combines a directly elected Labour mayor with annual ward contests. The live story is whether Labour's very strong councillor base and mayoral control still look secure after the 2025 mayoral race.",
    targetParty: "Reform",
    whatCountsAsShock: "A shock would be Labour looking materially weaker across the council chamber after holding the mayoralty, because North Tyneside is currently a mayoral-and-chamber Labour authority.",
    keyIssue: "Whether Labour can keep both executive authority and a commanding councillor position in a borough where Reform and Conservatives have both tested the water.",
    prediction: "North Tyneside still looks Labour-run, but it is worth watching because the elected-mayor model makes slippage more politically visible.",
    updatedAt: formatUkDate(),
  },
  'south-tyneside': {
    verdict: "South Tyneside all-out test",
    difficulty: "hard",
    watchFor: "South Tyneside is one of the North East councils where the headline can be misleading. Labour leads the authority, but the chamber has become more plural and the 2026 all-out election puts every seat in play at once.",
    targetParty: "Lab",
    whatCountsAsShock: "A shock would be Labour losing its leadership position or the opposition combining strongly enough to deny Labour a clear hold over the borough's direction.",
    keyIssue: "Whether Labour can remain the dominant governing force when all 54 seats are fought together under the new boundaries.",
    prediction: "South Tyneside should be treated as a real all-out watch council in 2026, not a sleepy Labour automatic.",
    updatedAt: formatUkDate(),
  },
  durham: {
    verdict: "No vote, but new county leadership",
    difficulty: "medium",
    watchFor: "County Durham does not vote in 2026, but it still matters because the 2025 county election changed the political leadership of the council. The live question is whether the new administration can look settled before the next full county election.",
    targetParty: "",
    whatCountsAsShock: "The real shock threshold here is not a 2026 election result but whether the new county leadership looks unstable or strategically directionless before 2029.",
    keyIssue: "How the post-2025 leadership change beds in across a very large county authority.",
    prediction: "Durham should remain visible in the app despite not voting in 2026, because the county's political direction changed recently and still matters.",
    updatedAt: formatUkDate(),
  },
  'county-durham': {
    verdict: "No vote, but new county leadership",
    difficulty: "medium",
    watchFor: "County Durham does not vote in 2026, but it still matters because the 2025 county election changed the political leadership of the council. The live question is whether the new administration can look settled before the next full county election.",
    targetParty: "",
    whatCountsAsShock: "The real shock threshold here is not a 2026 election result but whether the new county leadership looks unstable or strategically directionless before 2029.",
    keyIssue: "How the post-2025 leadership change beds in across a very large county authority.",
    prediction: "Durham should remain visible in the app despite not voting in 2026, because the county's political direction changed recently and still matters.",
    updatedAt: formatUkDate(),
  },
  northumberland: {
    verdict: "No vote, but strategic county authority",
    difficulty: "medium",
    watchFor: "Northumberland is not voting in 2026, but it remains strategically important because it is a very large county authority with a strong executive model and a broad rural, town and coastal geography.",
    targetParty: "",
    whatCountsAsShock: "The real shock threshold here is a loss of political grip or mounting instability before the next full county election in 2029, not a 2026 council contest.",
    keyIssue: "Whether the county leadership still looks durable between elections.",
    prediction: "Northumberland should stay visible as a major county profile even without a scheduled 2026 council vote.",
    updatedAt: formatUkDate(),
  },
  'stockton-on-tees': {
    verdict: "No vote, but leadership worth tracking",
    difficulty: "medium",
    watchFor: "Stockton-on-Tees is not voting in 2026, but it is still politically interesting because the borough's chamber is more mixed than a simple headline control label suggests and the current leadership sits in that wider context.",
    targetParty: "",
    whatCountsAsShock: "The real shock threshold is not a 2026 election night but whether the borough's current political balance looks increasingly unstable before the 2027 all-out vote.",
    keyIssue: "Whether the current leadership can look durable in a chamber with no simple one-party dominance.",
    prediction: "Stockton-on-Tees should remain on the map as a medium-term battleground rather than vanishing in non-election years.",
    updatedAt: formatUkDate(),
  },
  middlesbrough: {
    verdict: "Labour mayoralty to defend later",
    difficulty: "medium",
    watchFor: "Middlesbrough is unusual because the executive centre of gravity sits with the elected mayor. There is no scheduled 2026 council election, but the borough still matters because the mayoral model makes political responsibility very visible.",
    targetParty: "",
    whatCountsAsShock: "The real shock threshold is whether the elected mayor's authority looks weakened before the next borough-wide local cycle, not a 2026 ward result.",
    keyIssue: "How stable the Labour mayoral administration looks between elections.",
    prediction: "Middlesbrough should remain visible as a mayor-led authority even in a non-election year.",
    updatedAt: formatUkDate(),
  },
  'redcar-and-cleveland': {
    verdict: "No vote in a fragmented borough",
    difficulty: "hard",
    watchFor: "Redcar and Cleveland is not voting in 2026, but it is one of the Tees-side councils where the political map is notably fragmented. That matters because the next all-out election could move quickly if one bloc gains momentum.",
    targetParty: "",
    whatCountsAsShock: "The real shock threshold is whether the current leadership loses authority over a fragmented chamber before the next scheduled election in 2027.",
    keyIssue: "How stable the borough's leadership remains in a chamber split across several blocs.",
    prediction: "Redcar and Cleveland should be treated as a live medium-term borough story, not a dead zone between election years.",
    updatedAt: formatUkDate(),
  },
  darlington: {
    verdict: "No vote, but Tees-side bellwether",
    difficulty: "medium",
    watchFor: "Darlington is not voting in 2026, but it remains a useful Tees-side bellwether because it combines a mixed chamber with a leadership team that still has to hold together a broad coalition of local priorities.",
    targetParty: "",
    whatCountsAsShock: "The real shock threshold is whether the borough's current political settlement starts to fray before the next full local election in 2027.",
    keyIssue: "Whether Darlington's leadership still looks stable in a politically mixed borough.",
    prediction: "Darlington should stay visible as a non-voting but still politically informative North East authority.",
    updatedAt: formatUkDate(),
  },
  hartlepool: {
    verdict: "Labour-run Hartlepool under Reform pressure",
    difficulty: "very hard",
    watchFor: "Hartlepool is still one of the most symbolically charged councils in the North East. Labour now leads the council, but Reform has a visible local base and the town's recent electoral history means anti-establishment pressure cannot be dismissed.",
    targetParty: "Reform",
    whatCountsAsShock: "A shock would be Labour losing control of the council or Reform breaking through strongly enough to turn Hartlepool into the clearest local-government symbol of its North East advance.",
    keyIssue: "Whether Labour can defend its restored local lead in a town where Reform remains an obvious challenger.",
    prediction: "Hartlepool should be treated as a live Labour-versus-Reform test rather than read through stale 2021 assumptions.",
    updatedAt: formatUkDate(),
  },

}

const TYPE_LABELS = {
  Metropolitan: 'metropolitan borough',
  County: 'county council',
  District: 'district council',
  Borough: 'borough council',
  Unitary: 'unitary authority',
  'London Borough': 'london borough',
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function titleCaseWords(value) {
  return cleanText(value)
    .split(' ')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
    .join(' ')
}

function normaliseType(rawType = '') {
  const t = cleanText(rawType)
  return TYPE_LABELS[t] || t.toLowerCase() || 'council'
}

function validateCouncilEditorialRow(row) {
  const errors = []
  if (!row || typeof row !== 'object') return ['Row must be an object']
  if (!row.name || !String(row.name).trim()) errors.push('Missing name')
  if (!row.slug || !String(row.slug).trim()) errors.push(`Missing slug for ${row.name || 'unknown council'}`)
  if (!row.verdict || !String(row.verdict).trim()) errors.push(`Missing verdict for ${row.name}`)
  if (!row.difficulty || !String(row.difficulty).trim()) errors.push(`Missing difficulty for ${row.name}`)
  if (!row.watchFor || !String(row.watchFor).trim()) errors.push(`Missing watchFor for ${row.name}`)
  if (!row.keyIssue || !String(row.keyIssue).trim()) errors.push(`Missing keyIssue for ${row.name}`)
  if (!row.prediction || !String(row.prediction).trim()) errors.push(`Missing prediction for ${row.name}`)
  if (row.updatedAt && !/^\d{2}-\d{2}-\d{4}$/.test(String(row.updatedAt))) {
    errors.push(`updatedAt must be dd-mm-yyyy for ${row.name}`)
  }
  return errors
}

function normalizeCouncilEditorialRow(row) {
  const name = String(row.name || '').trim()
  return {
    slug: String(row.slug || slugifyCouncilName(name)).trim(),
    name,
    verdict: row.verdict || '',
    difficulty: row.difficulty || '',
    watchFor: row.watchFor || '',
    targetParty: row.targetParty || '',
    whatCountsAsShock: row.whatCountsAsShock || '',
    keyIssue: row.keyIssue || '',
    prediction: row.prediction || '',
    updatedAt: row.updatedAt || formatUkDate(),
  }
}

async function importCouncilEditorial(councils) {
  const res = await fetch(`${API_BASE}/api/elections/import-editorial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ councils }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Import failed ${res.status}: ${text}`)
  try {
    return JSON.parse(text)
  } catch {
    return { ok: true, raw: text }
  }
}

function inferDifficulty(row, profile = {}) {
  const direct = cleanText(row?.difficulty || profile?.difficulty).toLowerCase()
  if (direct) return direct

  const control = cleanText(row?.control).toLowerCase()
  const seats = Number(row?.seats || row?.seatsTotal || profile?.seats?.total || 0)
  const majority = Number(row?.majority ?? profile?.majority ?? NaN)
  const targetParty = cleanText(row?.targetParty || profile?.targetParty).toLowerCase()
  const electionStatus = cleanText(row?.electionStatus || profile?.electionStatus).toLowerCase()

  if (electionStatus === 'not-voting-2026') return 'medium'
  if (control === 'noc' || control === 'split control') return 'hard'
  if (targetParty === 'reform') return 'hard'
  if (Number.isFinite(majority) && majority <= 3) return 'very hard'
  if (Number.isFinite(majority) && majority <= 8) return 'hard'
  if (seats >= 90) return 'hard'
  if (seats >= 60) return 'medium'
  return 'medium'
}

function inferVerdict(row, profile = {}, difficulty = 'medium') {
  const direct = cleanText(row?.verdict || profile?.verdict)
  if (direct) return direct

  const control = cleanText(row?.control)
  const targetParty = cleanText(row?.targetParty || profile?.targetParty)
  const electionStatus = cleanText(row?.electionStatus || profile?.electionStatus)
  const type = normaliseType(row?.type || profile?.type)

  if (electionStatus === 'not-voting-2026') return 'Not voting this cycle'
  if (control === 'NOC') return 'NOC balance test'
  if (control === 'Split control') return 'Split-control test'
  if (targetParty === 'Reform') return 'Reform pressure test'
  if (difficulty === 'very hard') return `${control || titleCaseWords(type)} knife-edge test`
  if (difficulty === 'hard') return `${control || titleCaseWords(type)} control test`
  if (difficulty === 'medium') return `${control || titleCaseWords(type)} defend`
  return `${control || titleCaseWords(type)} watch`
}

function inferWatchFor(row, profile = {}, difficulty = 'medium') {
  const direct = cleanText(row?.watchFor || profile?.watchFor)
  if (direct) return direct

  const name = cleanText(row?.name || profile?.name || 'This council')
  const control = cleanText(row?.control)
  const targetParty = cleanText(row?.targetParty || profile?.targetParty)
  const region = cleanText(row?.region || profile?.region)
  const type = normaliseType(row?.type || profile?.type)
  const electionStatus = cleanText(row?.electionStatus || profile?.electionStatus)
  const seatsUp = Number(row?.seatsUp ?? profile?.seatsUp ?? 0)
  const seatsTotal = Number(row?.seats ?? row?.seatsTotal ?? profile?.seats?.total ?? 0)

  if (electionStatus === 'not-voting-2026') {
    return `${name} is not voting in May 2026, but it still matters politically because its current chamber shape and party balance will frame expectations before the next full contest.`
  }

  if (control === 'NOC') {
    return `${name} is under no overall control, so the real story is not just who tops the vote but whether one bloc emerges clearly stronger in a fragmented ${type} chamber.`
  }

  if (targetParty === 'Reform') {
    return `${name} is one of the places to watch for Reform pressure. The question is whether anti-establishment momentum becomes a real chamber story rather than just a headline vote share story.`
  }

  if (difficulty === 'very hard') {
    return `${name} looks genuinely close. Small ward-level swings could change the feel of the result quickly, especially if turnout softens or tactical voting hardens.`
  }

  if (difficulty === 'hard') {
    return `${name} is not a routine hold. ${control || 'The current administration'} has to defend its ground in a politically live ${type} contest${region ? ` in ${region}` : ''}.`
  }

  return `${name} should be watched as a live ${type} test${seatsUp ? ` with ${seatsUp} seats up` : ''}${seatsTotal ? ` out of ${seatsTotal}` : ''}. The main question is whether the current balance still looks comfortable once votes are counted.`
}

function inferWhatCountsAsShock(row, profile = {}, difficulty = 'medium') {
  const direct = cleanText(profile?.whatCountsAsShock)
  if (direct) return direct

  const name = cleanText(row?.name || profile?.name || 'This council')
  const control = cleanText(row?.control)
  const targetParty = cleanText(row?.targetParty || profile?.targetParty)
  const electionStatus = cleanText(row?.electionStatus || profile?.electionStatus)

  if (electionStatus === 'not-voting-2026') {
    return `The shock threshold for ${name} is not May 2026 itself, but whether the current political balance starts to look unstable well before the next scheduled council vote.`
  }

  if (control === 'NOC') {
    return `A shock in ${name} would be one party or bloc suddenly emerging with much clearer control than a fragmented starting position suggests.`
  }

  if (targetParty === 'Reform') {
    return `A shock in ${name} would be Reform converting pressure into a much broader local breakthrough than the underlying chamber balance currently implies.`
  }

  if (difficulty === 'very hard' || difficulty === 'hard') {
    return `A shock in ${name} would be ${control || 'the incumbent administration'} losing control or slipping much further than pre-election expectations suggest.`
  }

  return `A shock in ${name} would be the contest proving far messier than expected, either because the incumbent underperforms badly or because an opposition party breaks through more widely than expected.`
}

function inferKeyIssue(row, profile = {}) {
  const direct = cleanText(row?.keyIssue || profile?.keyIssue)
  if (direct) return direct

  const control = cleanText(row?.control)
  const targetParty = cleanText(row?.targetParty || profile?.targetParty)
  const electionStatus = cleanText(row?.electionStatus || profile?.electionStatus)
  const cycle = cleanText(row?.cycle || profile?.cycle)
  const name = cleanText(row?.name || profile?.name || 'This council')

  if (electionStatus === 'not-voting-2026') return `No scheduled 2026 council vote, but ${name}'s current political balance still matters.`
  if (control === 'NOC') return 'Coalition arithmetic and who can look like the natural lead force in a fragmented chamber.'
  if (control === 'Split control') return 'How split authority plays with voters and whether chamber politics stabilise or harden.'
  if (targetParty === 'Reform') return 'Whether Reform pressure becomes a real local-government story rather than just a protest vote story.'
  if (cycle === 'all-out') return 'A whole-chamber verdict in one go rather than a slower by-thirds adjustment.'
  return `${control || 'Current'} control and whether the result still looks politically comfortable.`
}

function inferPrediction(row, profile = {}, difficulty = 'medium') {
  const direct = cleanText(row?.prediction || profile?.prediction)
  if (direct) return direct

  const name = cleanText(row?.name || profile?.name || 'This council')
  const electionStatus = cleanText(row?.electionStatus || profile?.electionStatus)

  if (electionStatus === 'not-voting-2026') {
    return `${name} should stay visible as a council profile even without a scheduled 2026 vote, because its current chamber balance still matters to the wider local political picture.`
  }

  if (cleanText(row?.control) === 'NOC') {
    return `${name} looks more likely to stay politically fragmented than to produce a clean, simple governing picture.`
  }

  if (difficulty === 'very hard') {
    return `${name} looks genuinely volatile and should be treated as a live result rather than a comfortable hold.`
  }

  if (difficulty === 'hard') {
    return `${name} should be treated as a serious contest, with the incumbent side still competitive but not safely insulated from a meaningful setback.`
  }

  return `${name} still looks more likely than not to preserve its broad current political shape, but the margins matter because local elections can punish complacency quickly.`
}

function buildCouncilEditorialRows() {
  const councils = Array.isArray(LOCAL_ELECTIONS?.councils) ? LOCAL_ELECTIONS.councils : []
  const seen = new Set()
  const rows = []

  for (const row of councils) {
    const name = String(row?.name || '').trim()
    if (!name) continue

    const slug = slugifyCouncilName(name)
    if (seen.has(slug)) continue
    seen.add(slug)

    const profile = COUNCIL_PROFILES?.[name] || {}
    const override = EDITORIAL_OVERRIDES[slug] || {}
    const difficulty = override.difficulty || inferDifficulty(row, profile)

    rows.push({
      slug,
      name,
      verdict: override.verdict || inferVerdict(row, profile, difficulty),
      difficulty,
      watchFor: override.watchFor || inferWatchFor(row, profile, difficulty),
      targetParty: override.targetParty || row.targetParty || profile.targetParty || '',
      whatCountsAsShock: override.whatCountsAsShock || inferWhatCountsAsShock(row, profile, difficulty),
      keyIssue: override.keyIssue || inferKeyIssue(row, profile),
      prediction: override.prediction || inferPrediction(row, profile, difficulty),
      updatedAt: override.updatedAt || formatUkDate(),
    })
  }

  return rows
}

async function main() {
  console.log(`Using API base: ${API_BASE}`)
  const rawRows = buildCouncilEditorialRows()
  const councils = rawRows.map(normalizeCouncilEditorialRow)
  const validationErrors = councils.flatMap(validateCouncilEditorialRow)

  if (validationErrors.length) {
    console.error('Validation failed:')
    for (const err of validationErrors) console.error(`- ${err}`)
    process.exit(1)
  }

  console.log(`Prepared council editorial rows: ${councils.length}`)
  console.log('Importing to Worker...')
  const result = await importCouncilEditorial(councils)
  console.log('Import result:')
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('Council editorial ingest failed:')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
