const choice = (id, label, headline, subhead, reaction, effects) => ({
  id,
  label,
  headline,
  subhead,
  reaction,
  effects,
})

const scene = (id, art, speaker, prompt, choices) => ({
  id,
  art,
  speaker,
  prompt,
  choices,
})

export const simulatorElectoratePalette = {
  Workers: '#e8404f',
  Middle: '#4f8bff',
  Young: '#f5c747',
  Seniors: '#42d765',
  Business: '#a55be6',
}

export const simulatorPollingPalette = {
  LAB: '#e8404f',
  CON: '#4f8bff',
  REF: '#36d6cf',
  LD: '#f5c747',
  GRN: '#42d765',
}

export const simulatorSceneArt = {
  cabinet: 'cabinet.jpg',
  office: 'office.jpg',
  commons: 'commons.jpg',
}

export const simulatorIntroHeadline = 'PM faces first test'
export const simulatorIntroSubhead = 'Advisers split as pressure builds'

export const defaultSimulatorPolling = { LAB: 36, CON: 27, REF: 18, LD: 10, GRN: 6 }
const defaultSimulatorState = {
  approval: 42,
  treasury: 2.4,
  partyUnity: 61,
  majority: 23,
  media: 48,
  electorate: { Workers: 42, Middle: 46, Young: 35, Seniors: 54, Business: 48 },
}

const simulatorPartyAliases = {
  LAB: ['lab', 'labour'],
  CON: ['con', 'conservative', 'conservatives', 'tory', 'tories'],
  REF: ['ref', 'reform', 'reform uk', 'reformuk'],
  LD: ['ld', 'lib dem', 'lib dems', 'liberal democrat', 'liberal democrats'],
  GRN: ['grn', 'green', 'greens', 'green party'],
}

function normalisePartyLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function simulatorKeyForParty(party) {
  const labels = [
    party?.abbr,
    party?.shortName,
    party?.name,
    party?.party,
    party?.label,
    party?.id,
  ].map(normalisePartyLabel).filter(Boolean)

  return Object.entries(simulatorPartyAliases).find(([, aliases]) =>
    labels.some((label) => aliases.includes(label)),
  )?.[0] || null
}

export function buildSimulatorPollingSeed(source) {
  const rows = Array.isArray(source)
    ? source
    : Array.isArray(source?.partyPollSnapshot) && source.partyPollSnapshot.length
      ? source.partyPollSnapshot
      : Array.isArray(source?.parties)
        ? source.parties
        : []

  const nextPolls = { ...defaultSimulatorPolling }
  let matched = 0

  rows.forEach((party) => {
    const key = simulatorKeyForParty(party)
    const pct = Number(party?.pct ?? party?.voteShare ?? party?.share ?? party?.value)
    if (!key || !Number.isFinite(pct) || pct <= 0) return
    nextPolls[key] = Math.round(pct * 10) / 10
    matched += 1
  })

  if (matched < 2) {
    return {
      polls: { ...defaultSimulatorPolling },
      isLiveSeeded: false,
      leader: null,
    }
  }

  const sortedPolls = Object.entries(nextPolls).sort(([, a], [, b]) => b - a)
  const leaderKey = sortedPolls[0]?.[0] || null
  const lead = Number.isFinite(sortedPolls[0]?.[1]) && Number.isFinite(sortedPolls[1]?.[1])
    ? Math.round((sortedPolls[0][1] - sortedPolls[1][1]) * 10) / 10
    : null
  const leaderValue = Number.isFinite(sortedPolls[0]?.[1]) ? sortedPolls[0][1] : null
  return {
    polls: nextPolls,
    isLiveSeeded: true,
    leader: leaderKey,
    lead,
    leaderValue,
  }
}

const simulatorPartyDisplay = {
  LAB: 'Labour',
  CON: 'Conservative',
  REF: 'Reform',
  LD: 'Lib Dem',
  GRN: 'Green',
}

function buildOpeningNews(seed) {
  if (!seed?.isLiveSeeded || !seed.leader) {
    return {
      headline: simulatorIntroHeadline,
      subhead: simulatorIntroSubhead,
    }
  }

  const leaderName = simulatorPartyDisplay[seed.leader] || seed.leader
  const leadText = seed.lead != null ? ` by ${seed.lead.toFixed(1)} pts` : ''
  return {
    headline: `${leaderName} lead sets opening test`,
    subhead: `Latest polling puts ${leaderName} ahead${leadText}`,
  }
}

function getNewsItems(source) {
  const news = source?.news
  if (Array.isArray(news)) return news
  if (Array.isArray(news?.items)) return news.items
  if (Array.isArray(news?.newsItems)) return news.newsItems
  if (Array.isArray(source?.newsItems)) return source.newsItems
  return []
}

function getElectionUrgency(source) {
  const meta = source?.meta || {}
  const date = meta.nextElectionDate || meta.nextElection || null
  const label = meta.nextElectionLabel || 'next election'
  const ts = date ? new Date(date).getTime() : Number.NaN
  if (Number.isNaN(ts)) return null

  const days = Math.ceil((ts - Date.now()) / 86400000)
  if (days < 0 || days > 90) return null
  return { days, label }
}

function getNewsPressure(source) {
  const items = getNewsItems(source)
  if (!items.length) return { media: defaultSimulatorState.media, line: '' }

  const latest = items[0]
  const headline = String(latest?.displayHeadline || latest?.title || '').trim()
  const hasFreshAgenda = items.length >= 3
  const media = Math.min(62, defaultSimulatorState.media + (hasFreshAgenda ? 8 : 5))
  const line = headline ? `News agenda: ${headline}` : 'Live news agenda raises the media temperature'

  return { media, line }
}

function buildLiveOpeningContext(seedSource, pollingSeed) {
  const openingNews = buildOpeningNews(pollingSeed)
  const newsPressure = getNewsPressure(seedSource)
  const urgency = getElectionUrgency(seedSource)
  const contextLines = []

  if (newsPressure.line) contextLines.push(newsPressure.line)
  if (urgency) {
    contextLines.push(`${urgency.days} days to ${urgency.label}`)
  }

  return {
    headline: openingNews.headline,
    subhead: pollingSeed.isLiveSeeded ? openingNews.subhead : contextLines[0] || openingNews.subhead,
    media: newsPressure.media,
    liveContext: {
      pollingSeeded: pollingSeed.isLiveSeeded,
      pollingLeader: pollingSeed.leader,
      pollingLeaderValue: pollingSeed.leaderValue,
      pollingLead: pollingSeed.lead,
      newsSeeded: Boolean(newsPressure.line),
      newsHeadline: newsPressure.line.replace(/^News agenda:\s*/i, ''),
      electionUrgency: urgency,
      contextLines,
    },
  }
}

export function applyLiveSimulatorSeed(baseState, seedSource) {
  const pollingSeed = buildSimulatorPollingSeed(seedSource)
  const openingContext = buildLiveOpeningContext(seedSource, pollingSeed)

  return {
    ...baseState,
    polls: pollingSeed.polls,
    startingPolls: { ...pollingSeed.polls },
    media: openingContext.media,
    newsHeadline: openingContext.headline,
    newsSubhead: openingContext.subhead,
    liveContext: openingContext.liveContext,
  }
}

export function createLiveSeededSimulatorState(seedSource) {
  const baseState = {
    turnIndex: 0,
    approval: defaultSimulatorState.approval,
    treasury: defaultSimulatorState.treasury,
    partyUnity: defaultSimulatorState.partyUnity,
    majority: defaultSimulatorState.majority,
    media: defaultSimulatorState.media,
    polls: { ...defaultSimulatorPolling },
    startingPolls: { ...defaultSimulatorPolling },
    electorate: { ...defaultSimulatorState.electorate },
    newsHeadline: simulatorIntroHeadline,
    newsSubhead: simulatorIntroSubhead,
    selectedChoiceId: null,
    reaction: null,
    phase: 'playing',
    finalResult: null,
    sfxEnabled: true,
  }

  return applyLiveSimulatorSeed(baseState, seedSource)
}

export function createSimulatorInitialState(seedSource) {
  return createLiveSeededSimulatorState(seedSource)
}

export const simulatorScenes = [
  scene(
    'nhs',
    'cabinet',
    'Health Secretary',
    'Prime Minister, the NHS is under severe pressure. Waiting lists are rising, morale is collapsing, and every front page has found its horror story. We need an instruction.',
    [
      choice(
        'nhs-expand',
        'Expand the NHS and end outsourcing',
        'PM promises NHS reset',
        'Private providers pushed aside in major health gamble',
        'Unions cheer and the Health Secretary is delighted. The Chancellor looks grim. The hostile press calls it a blank cheque.',
        { approval: 3, treasury: -0.9, partyUnity: -2, electorate: { Workers: 3, Young: 4, Seniors: 2, Business: -5 }, polls: { LAB: 1, GRN: 1, CON: -1 }, line: 'The hostile press smells a spending row.' },
      ),
      choice(
        'nhs-frontline',
        'Fund frontline care and recruit staff',
        'NHS rescue package unveiled',
        'Ministers move to ease winter pressure',
        'The package lands well with staff and patients. It is expensive, but the public mood improves because the government looks like it is acting.',
        { approval: 4, treasury: -0.6, partyUnity: 1, electorate: { Workers: 3, Middle: 2, Seniors: 3 }, polls: { LAB: 1, LD: 1 }, line: 'Broadcasters frame the move as decisive.' },
      ),
      choice(
        'nhs-targeted',
        'Targeted funding with reform targets',
        'Cash tied to NHS reform',
        'Hospitals get help, but strings attached',
        'The middle ground looks competent. Nobody is thrilled, but few can call it irresponsible. The real test will be whether the targets survive reality.',
        { approval: 2, treasury: -0.3, partyUnity: 2, electorate: { Middle: 3, Seniors: 1, Business: 1 }, polls: { LAB: 1 }, line: 'The press waits for delivery before passing judgement.' },
      ),
      choice(
        'nhs-efficiency',
        'Demand efficiency and use outside capacity',
        'PM orders efficiency drive',
        'Private capacity considered to cut waiting lists',
        'Business groups approve and some newspapers like the discipline. Health unions are furious, and the Health Secretary warns morale could sink further.',
        { approval: -1, treasury: 0.2, partyUnity: 1, electorate: { Business: 4, Workers: -2, Young: -2, Seniors: 1 }, polls: { CON: 1, LAB: -1 }, line: 'Right-leaning papers praise the tougher tone.' },
      ),
      choice(
        'nhs-market',
        'Break the model and force market reform',
        'Health shake-up sparks fury',
        'Government accused of gambling with NHS future',
        'The move electrifies ideological allies but triggers a brutal backlash. The NHS crisis becomes a fight about the future of the service itself.',
        { approval: -4, treasury: 0.5, partyUnity: -7, electorate: { Business: 5, Workers: -5, Young: -4, Seniors: -3 }, polls: { CON: 2, REF: 1, LAB: -2, GRN: 1 }, line: 'The story turns into a full political war.' },
      ),
    ],
  ),
  scene(
    'inflation',
    'office',
    'Prime Minister',
    "Inflation is hurting working families, the opposition smells blood, and the media won't let up. We need a response before this becomes the story of the whole year.",
    [
      choice(
        'inflation-freeze',
        'Freeze essentials and tax excess profits',
        'Price freeze bombshell',
        'PM takes aim at profiteering firms',
        'Squeezed households like the message immediately. Business groups go on the attack and the Treasury warns the machinery will be messy.',
        { approval: 3, treasury: -0.5, partyUnity: -2, electorate: { Workers: 5, Young: 3, Business: -8 }, polls: { LAB: 1, GRN: 1, CON: -1 }, line: 'Editors call it bold, risky and interventionist.' },
      ),
      choice(
        'inflation-targeted',
        'Target help at struggling households',
        'Help for households',
        'Cost-of-living support aims at those hit hardest',
        'The package looks humane and controlled. The Chancellor accepts the cost because it is targeted rather than open-ended.',
        { approval: 4, treasury: -0.4, partyUnity: 1, electorate: { Workers: 4, Middle: 2, Young: 2 }, polls: { LAB: 1, LD: 1 }, line: 'The evening bulletins lead on relief for families.' },
      ),
      choice(
        'inflation-balanced',
        'Limited relief with fiscal guardrails',
        'Balanced relief plan',
        'No fireworks as PM chooses caution',
        'Markets stay calm and the press calls it sensible. Voters notice some help, but not enough to feel transformed.',
        { approval: 1, treasury: -0.1, partyUnity: 2, electorate: { Middle: 3, Business: 2 }, polls: {}, line: 'Responsible but modest dominates coverage.' },
      ),
      choice(
        'inflation-restraint',
        'Hold spending and fight inflation first',
        'PM holds the line',
        'Treasury discipline comes before giveaways',
        'The Chancellor wins the argument. Markets approve, but voters facing rising bills see a government choosing restraint over relief.',
        { approval: -3, treasury: 0.4, partyUnity: 2, electorate: { Business: 4, Middle: 1, Workers: -4 }, polls: { CON: 1, REF: 1, LAB: -1 }, line: 'Economic editors approve; phone-ins are brutal.' },
      ),
      choice(
        'inflation-tax-cut',
        'Slash taxes and blame the establishment',
        'Tax cut gamble rocks Treasury',
        'PM attacks economic orthodoxy',
        'The speech excites anti-establishment voters, but officials panic. The story becomes whether the government has lost control of the numbers.',
        { approval: 0, treasury: -1, partyUnity: -6, electorate: { Workers: 1, Business: -2, Middle: -3, Seniors: -2 }, polls: { REF: 3, CON: 1, LAB: -2 }, line: 'Financial papers warn of a credibility shock.' },
      ),
    ],
  ),
  scene(
    'immigration',
    'commons',
    'Opposition Leader',
    'The public can see the system is broken. Crossings are rising, the backlog is growing, and ministers are hiding behind slogans. What will the Prime Minister actually do?',
    [
      choice(
        'immigration-safe-routes',
        'Expand safe routes and end hostile enforcement',
        'PM defends safe routes',
        'Humanitarian reset triggers fierce border row',
        'Progressive voters praise the moral clarity, but the right-wing press goes nuclear. The Commons erupts and officials warn of operational confusion.',
        { approval: -2, treasury: -0.2, partyUnity: -5, electorate: { Young: 6, Workers: -3, Middle: -4, Seniors: -5 }, polls: { GRN: 2, LD: 1, REF: 3, LAB: -1 }, line: 'The front pages turn hostile overnight.' },
      ),
      choice(
        'immigration-processing',
        'Speed up decisions and improve integration',
        'Asylum backlog targeted',
        'PM chooses processing reform over slogans',
        'Policy experts like it and the Commons calms slightly. It sounds serious, but voters wanting immediate control are only partly reassured.',
        { approval: 1, treasury: -0.3, partyUnity: 1, electorate: { Young: 3, Middle: 2, Workers: 1 }, polls: { LAB: 1, LD: 1, REF: -1 }, line: 'Coverage is calmer but sceptical.' },
      ),
      choice(
        'immigration-balanced',
        'Firm-but-fair border control package',
        'PM seeks middle road',
        'More enforcement, faster decisions, calmer tone',
        'The line is deliberately balanced. It reassures some swing voters without fully satisfying either side of the argument.',
        { approval: 2, treasury: -0.2, partyUnity: 2, electorate: { Middle: 4, Workers: 2, Seniors: 2 }, polls: { LAB: 1, REF: -1 }, line: 'Most outlets call it measured, if unexciting.' },
      ),
      choice(
        'immigration-deterrence',
        'Tougher deterrence and removals plan',
        'PM toughens border line',
        'New removals drive announced after Commons clash',
        'The right flank quietens for now and hostile papers soften. Liberal MPs and campaigners warn the plan may not survive legal scrutiny.',
        { approval: 2, treasury: -0.2, partyUnity: -1, electorate: { Workers: 3, Seniors: 4, Young: -3, Middle: 1 }, polls: { CON: 1, REF: -1, GRN: 1 }, line: 'Right-leaning papers welcome a sharper tone.' },
      ),
      choice(
        'immigration-emergency',
        'Declare an emergency border crackdown',
        'Border crackdown stuns Commons',
        'Emergency rhetoric splits Parliament',
        'The chamber explodes. Hardline voters love the signal, but legal experts, moderates and international partners warn that the government has crossed a line.',
        { approval: -1, treasury: -0.4, partyUnity: -8, electorate: { Workers: 2, Seniors: 5, Young: -7, Middle: -3, Business: -2 }, polls: { REF: 4, CON: 1, LAB: -2, LD: 1, GRN: 1 }, line: 'The story becomes a constitutional and legal row.' },
      ),
    ],
  ),
  scene(
    'housing',
    'cabinet',
    'Housing Adviser',
    'Rents are rising faster than wages, councils warn of homelessness pressure, and younger voters think Westminster has abandoned them.',
    [
      choice(
        'housing-social',
        'Build social housing and cap rents',
        'Housing state steps in',
        'Renters cheer as landlords warn of retreat',
        'The decision cuts through with younger voters but triggers a fierce property-sector backlash.',
        { approval: 2, treasury: -0.7, partyUnity: -3, electorate: { Young: 7, Workers: 3, Business: -6 }, polls: { LAB: 1, GRN: 1, CON: -1 }, line: 'The property lobby is furious.' },
      ),
      choice(
        'housing-renters',
        'Protect renters and fund affordable homes',
        'Renters get new protections',
        'Ministers promise homes and security',
        'The package is credible and easier to defend, though councils say delivery will still be hard.',
        { approval: 3, treasury: -0.5, partyUnity: 1, electorate: { Young: 5, Workers: 2, Middle: 1 }, polls: { LAB: 1, LD: 1 }, line: 'Campaigners welcome movement but want speed.' },
      ),
      choice(
        'housing-planning',
        'Reform planning and balance ownership',
        'Planning reform announced',
        'Government tries to build without picking a war',
        'The centre holds for now. Local MPs are nervous, but voters see at least some plan.',
        { approval: 2, treasury: -0.2, partyUnity: -1, electorate: { Middle: 3, Young: 2, Business: 2 }, polls: { LAB: 1 }, line: 'Local backlash is brewing quietly.' },
      ),
      choice(
        'housing-buyers',
        'Back first-time buyers and developers',
        'Buyer package unveiled',
        'Ministers lean on private building',
        'Developers approve and some homeowners like it. Renters are not convinced.',
        { approval: 1, treasury: -0.2, partyUnity: 1, electorate: { Business: 4, Middle: 2, Young: -2 }, polls: { CON: 1 }, line: 'The housing debate shifts to supply.' },
      ),
      choice(
        'housing-market',
        'Slash planning barriers and let market build',
        'Planning barriers torn up',
        'Councils and campaigners accuse PM of surrendering control',
        'The policy is bold but messy. Business likes it; local resistance hardens immediately.',
        { approval: -1, treasury: 0.1, partyUnity: -5, electorate: { Business: 6, Middle: -3, Young: -2, Seniors: -2 }, polls: { CON: 1, REF: 1, LD: 1 }, line: 'Local MPs are already panicking.' },
      ),
    ],
  ),
  scene(
    'crime',
    'commons',
    'Home Secretary',
    'Shoplifting and street crime are dominating local news. Businesses are angry, and voters want to know who is in charge.',
    [
      choice(
        'crime-prevention',
        'Fund prevention and youth services',
        'Prevention plan launched',
        'Government targets roots of crime',
        'Experts like it, tabloids call it soft, and the payoff will take time.',
        { approval: 1, treasury: -0.4, partyUnity: -1, electorate: { Young: 4, Workers: 1, Business: -1 }, polls: { GRN: 1, LD: 1 }, line: 'Tabloids demand visible enforcement.' },
      ),
      choice(
        'crime-policing',
        'Expand neighbourhood policing',
        'Police back on the streets',
        'Town-centre patrols to rise',
        'The move is visible and popular. Councils and business groups welcome it.',
        { approval: 3, treasury: -0.5, partyUnity: 1, electorate: { Workers: 3, Middle: 3, Business: 3, Seniors: 2 }, polls: { LAB: 1, CON: 1 }, line: 'Local papers give it a good ride.' },
      ),
      choice(
        'crime-balanced',
        'Mix enforcement with prevention',
        'Balanced crime package',
        'PM promises action and prevention',
        'This looks sober and competent. It does not dominate the news but calms some pressure.',
        { approval: 2, treasury: -0.3, partyUnity: 2, electorate: { Middle: 3, Workers: 2 }, polls: { LAB: 1 }, line: 'Coverage is steady rather than explosive.' },
      ),
      choice(
        'crime-sentencing',
        'Tougher sentencing and enforcement',
        'Sentencing crackdown promised',
        'Ministers promise consequences',
        'The line cuts through quickly, especially with older voters, but prison capacity questions follow.',
        { approval: 2, treasury: -0.2, partyUnity: 1, electorate: { Seniors: 5, Workers: 2, Young: -2 }, polls: { CON: 1, REF: 1 }, line: 'The prison estate becomes the next question.' },
      ),
      choice(
        'crime-crackdown',
        'Zero-tolerance national crackdown',
        'Zero tolerance storm',
        'Civil liberty groups warn of overreach',
        'Hardline voters cheer. Critics warn the policy will criminalise disorder without fixing causes.',
        { approval: 0, treasury: -0.3, partyUnity: -4, electorate: { Seniors: 5, Workers: 1, Young: -5, Middle: -2 }, polls: { REF: 3, CON: 1, LAB: -1 }, line: 'The debate becomes culture war territory.' },
      ),
    ],
  ),
  scene(
    'climate',
    'office',
    'Energy Secretary',
    'Energy bills remain painful. Green groups want acceleration, households want relief, and MPs are split on net zero.',
    [
      choice(
        'climate-investment',
        'Public green investment and insulation',
        'Green investment surge',
        'PM bets on state-led energy transition',
        'Climate groups praise the scale. The Treasury winces and opponents attack the cost.',
        { approval: 1, treasury: -0.8, partyUnity: -2, electorate: { Young: 6, Business: -2, Seniors: -1 }, polls: { GRN: 2, LAB: 1, REF: 1 }, line: 'The cost argument dominates hostile coverage.' },
      ),
      choice(
        'climate-warm-homes',
        'Clean power and home-warmth programme',
        'Warm homes plan unveiled',
        'Bills and climate framed together',
        'This is easier to sell. It links climate to household savings instead of abstract targets.',
        { approval: 3, treasury: -0.5, partyUnity: 1, electorate: { Young: 4, Middle: 2, Workers: 2 }, polls: { LAB: 1, LD: 1 }, line: 'The message is practical and lands well.' },
      ),
      choice(
        'climate-practical',
        'Practical transition focused on bills',
        'Bills-first climate reset',
        'PM chooses cautious transition',
        'The tone calms the issue but pleases nobody completely.',
        { approval: 2, treasury: -0.2, partyUnity: 2, electorate: { Middle: 3, Business: 2 }, polls: { LAB: 1 }, line: 'The story becomes competence, not ideology.' },
      ),
      choice(
        'climate-slowdown',
        'Slow some targets for affordability',
        'Net zero timetable slowed',
        'PM says families come first',
        'Some voters welcome the pause. Younger voters and green groups are angry.',
        { approval: 1, treasury: 0.2, partyUnity: 1, electorate: { Seniors: 3, Workers: 2, Young: -5 }, polls: { CON: 1, REF: 2, GRN: -1 }, line: 'Climate campaigners prepare a backlash.' },
      ),
      choice(
        'climate-rollback',
        'Roll back commitments and prioritise cheap energy',
        'Net zero rollback bombshell',
        'Government tears up climate timetable',
        'The decision excites climate sceptics and detonates a national row.',
        { approval: -2, treasury: 0.3, partyUnity: -5, electorate: { Young: -8, Seniors: 3, Business: 1 }, polls: { REF: 4, CON: 1, GRN: 2, LAB: -2 }, line: 'International reaction turns sour.' },
      ),
    ],
  ),
  scene(
    'strikes',
    'cabinet',
    'Transport Secretary',
    'Rail strikes are spreading and other public-sector unions are watching. Commuters are angry, workers want fair pay, and ministers are split.',
    [
      choice(
        'strikes-settlements',
        'Back workers and fund settlements',
        'Government backs pay deals',
        'Unions claim victory as Treasury warns of precedent',
        'The strikes ease, but the Chancellor warns every union will now ask for the same.',
        { approval: 2, treasury: -0.7, partyUnity: -3, electorate: { Workers: 5, Young: 2, Business: -4 }, polls: { LAB: 1, GRN: 1 }, line: 'The precedent question is immediate.' },
      ),
      choice(
        'strikes-negotiate',
        'Negotiate fair pay with reform attached',
        'Deal with reform strings',
        'Rail talks restart with new mandate',
        'This looks constructive. Unions do not get everything, but the public sees movement.',
        { approval: 3, treasury: -0.4, partyUnity: 1, electorate: { Workers: 3, Middle: 2, Business: 1 }, polls: { LAB: 1, LD: 1 }, line: 'Commuters mostly want the trains back.' },
      ),
      choice(
        'strikes-compromise',
        'Broker a compromise settlement',
        'Strike compromise brokered',
        'Both sides give ground',
        'The solution is not glamorous but it lowers the temperature.',
        { approval: 2, treasury: -0.2, partyUnity: 2, electorate: { Middle: 3, Workers: 1 }, polls: { LAB: 1 }, line: 'The story starts to fade.' },
      ),
      choice(
        'strikes-discipline',
        'Hold pay discipline and demand reform',
        'Pay discipline holds',
        'Unions accuse PM of provocation',
        'Markets like the restraint, but disruption continues.',
        { approval: -2, treasury: 0.3, partyUnity: 2, electorate: { Business: 4, Workers: -4, Middle: -1 }, polls: { CON: 1, REF: 1, LAB: -1 }, line: 'Public patience depends on how long disruption lasts.' },
      ),
      choice(
        'strikes-crackdown',
        'Confront unions and change strike laws',
        'Union crackdown announced',
        'New strike laws trigger fury',
        'Hardliners cheer; unions escalate. The dispute becomes a test of authority.',
        { approval: -1, treasury: 0.1, partyUnity: -5, electorate: { Business: 4, Seniors: 2, Workers: -5, Young: -3 }, polls: { REF: 3, CON: 1, LAB: -1 }, line: 'The unions prepare a national campaign.' },
      ),
    ],
  ),
  scene(
    'budget',
    'office',
    'Chancellor',
    'Growth is weak, every department wants money, and the Budget is now the defining moment of the government.',
    [
      choice(
        'budget-wealth-tax',
        'Raise wealth taxes and invest heavily',
        'Wealth tax Budget lands',
        'PM chooses redistribution and investment',
        'The left of the party is thrilled. Business groups warn investment will dry up.',
        { approval: 1, treasury: 0.4, partyUnity: -2, electorate: { Workers: 4, Young: 3, Business: -7 }, polls: { LAB: 1, GRN: 1, CON: -1 }, line: 'Business confidence takes a knock.' },
      ),
      choice(
        'budget-services',
        'Tax the better-off to fund services',
        'Services Budget unveiled',
        'Tax rises fund frontline promises',
        'The package is defensible and serious, though opponents call it a tax raid.',
        { approval: 2, treasury: 0.3, partyUnity: 1, electorate: { Workers: 3, Middle: 1, Young: 2, Business: -3 }, polls: { LAB: 1, LD: 1 }, line: 'The argument becomes fairness versus tax burden.' },
      ),
      choice(
        'budget-stability',
        'Modest tax changes and stability',
        'Stability Budget delivered',
        'No shocks as PM chooses balance',
        'It is not exciting, but it is hard to attack. Markets are calm.',
        { approval: 1, treasury: 0.2, partyUnity: 2, electorate: { Middle: 3, Business: 2 }, polls: { LAB: 1 }, line: 'The Budget is described as boring but safe.' },
      ),
      choice(
        'budget-restraint',
        'Restrain spending and avoid tax rises',
        'Austerity-lite Budget',
        'Departments told to find savings',
        'The Chancellor is comfortable. Public-service campaigners are not.',
        { approval: -2, treasury: 0.6, partyUnity: 1, electorate: { Business: 4, Seniors: 1, Workers: -3, Young: -2 }, polls: { CON: 1, LAB: -1 }, line: 'Spending rows are now baked into the year.' },
      ),
      choice(
        'budget-tax-cut',
        'Cut taxes and shrink the state',
        'Tax-cut Budget gamble',
        'PM promises smaller government',
        'Anti-tax voters cheer. Officials warn the numbers are stretched and service pressure will rise.',
        { approval: 0, treasury: -0.6, partyUnity: -4, electorate: { Business: 4, Workers: -2, Young: -3 }, polls: { REF: 3, CON: 2, LAB: -2 }, line: 'Credibility questions start immediately.' },
      ),
    ],
  ),
  scene(
    'welfare',
    'commons',
    'Work and Pensions Secretary',
    'Your welfare reform package has split the party. Some want dignity and support; others want tougher rules and contribution.',
    [
      choice(
        'welfare-expand',
        'Expand benefits and remove harsh sanctions',
        'Welfare safety net expanded',
        'PM rejects punitive system',
        'Campaigners praise the compassion. Fiscal hawks and tabloids attack the cost.',
        { approval: 1, treasury: -0.6, partyUnity: -4, electorate: { Workers: 3, Young: 4, Seniors: -2, Business: -3 }, polls: { LAB: 1, GRN: 1, REF: 1 }, line: 'The fairness debate turns sharp.' },
      ),
      choice(
        'welfare-support',
        'Strengthen support and soften rules',
        'Welfare support reset',
        'Ministers soften the harshest edges',
        'The move lowers moral pressure without looking reckless.',
        { approval: 2, treasury: -0.3, partyUnity: 1, electorate: { Workers: 3, Young: 2, Middle: 1 }, polls: { LAB: 1, LD: 1 }, line: 'Charities cautiously welcome it.' },
      ),
      choice(
        'welfare-work-support',
        'Reform welfare around work support',
        'Work support reform promised',
        'PM chooses support and responsibility',
        'This is the safest framing. Critics on both sides want more.',
        { approval: 2, treasury: -0.1, partyUnity: 2, electorate: { Middle: 3, Workers: 2 }, polls: { LAB: 1 }, line: 'The line sounds balanced in interviews.' },
      ),
      choice(
        'welfare-conditions',
        'Tighten conditions and stress contribution',
        'Welfare conditions tightened',
        'PM talks responsibility and work',
        'Some voters approve the tougher message. The party left is furious.',
        { approval: 1, treasury: 0.3, partyUnity: -2, electorate: { Seniors: 3, Workers: 1, Young: -3 }, polls: { CON: 1, REF: 1, LAB: -1 }, line: 'Backbench discomfort grows.' },
      ),
      choice(
        'welfare-sanctions',
        'Go hard on sanctions and dependency',
        'Sanctions crackdown announced',
        'Government accused of cruelty',
        'The move excites hardliners but causes a serious moral backlash.',
        { approval: -3, treasury: 0.5, partyUnity: -7, electorate: { Seniors: 3, Workers: -4, Young: -6, Middle: -2 }, polls: { REF: 3, CON: 1, LAB: -2, GRN: 1 }, line: 'The story becomes compassion versus control.' },
      ),
    ],
  ),
  scene(
    'protest',
    'commons',
    'Home Secretary',
    'Large demonstrations have spread across major cities. Some are peaceful; some have tipped into disorder. The cameras are everywhere.',
    [
      choice(
        'protest-rights',
        'Protect protest rights and target violence',
        'Protest rights defended',
        'PM warns against overreaction',
        'Civil liberties groups welcome the restraint. Police chiefs ask for clarity.',
        { approval: 0, treasury: 0, partyUnity: -2, electorate: { Young: 5, Middle: -1, Seniors: -2 }, polls: { GRN: 1, LD: 1, REF: 1 }, line: 'The right-wing press calls it weak.' },
      ),
      choice(
        'protest-balanced',
        'Defend liberties while policing disorder',
        'PM balances rights and order',
        'Violence targeted without blanket restrictions',
        'This is defensible and reduces the temperature, though hardliners remain unhappy.',
        { approval: 2, treasury: -0.1, partyUnity: 1, electorate: { Middle: 3, Young: 2, Workers: 1 }, polls: { LAB: 1, LD: 1 }, line: 'Most broadcasters call the approach measured.' },
      ),
      choice(
        'protest-limited-powers',
        'Limited new powers for disruption',
        'Limited protest powers announced',
        'Ministers try to avoid overreach',
        'The package looks pragmatic, but campaigners worry about creep.',
        { approval: 1, treasury: 0, partyUnity: 2, electorate: { Middle: 3, Seniors: 2, Young: -1 }, polls: { LAB: 1 }, line: 'The legal detail will matter.' },
      ),
      choice(
        'protest-police-powers',
        'Increase police powers quickly',
        'Police powers expanded',
        'PM promises to restore control',
        'Older voters like the clarity. Civil-liberty concerns grow quickly.',
        { approval: 1, treasury: -0.1, partyUnity: 1, electorate: { Seniors: 4, Middle: 1, Young: -4 }, polls: { CON: 1, REF: 1 }, line: 'Civil liberties groups prepare a challenge.' },
      ),
      choice(
        'protest-crackdown',
        'Impose sweeping restrictions',
        'Protest crackdown shocks cities',
        'Government accused of authoritarian turn',
        'The crackdown dominates everything. Supporters call it necessary; critics call it dangerous.',
        { approval: -3, treasury: -0.2, partyUnity: -6, electorate: { Seniors: 3, Young: -8, Middle: -3, Business: -1 }, polls: { REF: 4, CON: 1, LAB: -2, LD: 1, GRN: 2 }, line: 'The courts and the streets become the next battleground.' },
      ),
    ],
  ),
]
