import { cleanText, mergeCouncilLayers, slugifyCouncilName } from '../../utils/electionsHelpers'

export const LOCAL_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'reform', label: 'Reform targets' },
  { key: 'labour', label: 'Labour defences' },
  { key: 'conservative', label: 'Conservative defences' },
  { key: 'noc', label: 'NOC' },
  { key: 'veryhard', label: 'Very hard' },
  { key: 'hard', label: 'Hard' },
  { key: 'county', label: 'County' },
  { key: 'district', label: 'District' },
  { key: 'metropolitan', label: 'Metropolitan' },
  { key: 'unitary', label: 'Unitary' },
  { key: 'london', label: 'London' },
]

export function selectMergedCouncils(staticCouncils, councilRegistry, councilStatus, councilEditorial) {
  return mergeCouncilLayers(staticCouncils, councilRegistry, councilStatus, councilEditorial)
}

export function selectSearchableCouncils(councils = [], regions = []) {
  const flat = [...councils]
  regions.forEach((region) => {
    if (!region.councils_list) return
    region.councils_list.forEach((council) => {
      const slug = council.slug || slugifyCouncilName(council.name)
      if (!flat.find((item) => (item.slug || slugifyCouncilName(item.name)) === slug)) {
        flat.push({ ...council, slug, region: region.name, type: region.type || 'Metropolitan' })
      }
    })
  })
  return flat
}

export function selectFilteredCouncils(councils = [], searchableCouncils = [], search = '') {
  if (!search.trim()) return councils
  const q = search.toLowerCase()
  return searchableCouncils.filter(
    (council) =>
      cleanText(council.name).toLowerCase().includes(q) ||
      cleanText(council.region).toLowerCase().includes(q) ||
      cleanText(council.type).toLowerCase().includes(q) ||
      cleanText(council.control).toLowerCase().includes(q) ||
      cleanText(council.verdict).toLowerCase().includes(q) ||
      cleanText(council.watchFor).toLowerCase().includes(q) ||
      cleanText(council.targetParty).toLowerCase().includes(q) ||
      cleanText(council.cycle).toLowerCase().includes(q) ||
      cleanText(council.electionStatus).toLowerCase().includes(q) ||
      cleanText(council.electionMessage).toLowerCase().includes(q) ||
      cleanText(council.governanceModel).toLowerCase().includes(q),
  )
}

function hasScheduledMay2026Election(council = {}) {
  const status = cleanText(council.electionStatus).toLowerCase()
  const seatsUp = Number(council.seatsUp)
  const nextElectionYear = Number(council.nextElectionYear)

  const electionText = [
    council.electionMessage,
    council.verdict,
    council.watchFor,
    council.type,
  ]
    .map((value) => cleanText(value).toLowerCase())
    .filter(Boolean)
    .join(' ')

  if (status === 'not-voting-2026') return false
  if (Number.isFinite(seatsUp) && seatsUp <= 0) return false
  if (Number.isFinite(nextElectionYear) && nextElectionYear > 2026) return false
  if (/\b(no scheduled|not voting|does not vote|no vote in 2026|not vote in 2026)\b/i.test(electionText)) {
    return false
  }

  if (!status) return true
  return status === 'scheduled-2026' || /^scheduled(?:-|$)/i.test(status)
}

export function selectLaunchCouncils(councils = []) {
  return councils.filter(hasScheduledMay2026Election)
}

export function selectTrackedLaunchCouncils(launchCouncils = []) {
  return launchCouncils.filter((council) => {
    const hasEditorialDepth =
      !!cleanText(council.verdict) &&
      !!cleanText(council.difficulty) &&
      !!cleanText(council.watchFor)
    const isMajorCouncil =
      /county/i.test(cleanText(council.type)) ||
      /metropolitan/i.test(cleanText(council.type)) ||
      /london borough/i.test(cleanText(council.type)) ||
      /unitary/i.test(cleanText(council.type))
    return hasEditorialDepth && isMajorCouncil
  })
}

export function selectTrackedLaunchSeatsUp(trackedLaunchCouncils = []) {
  return trackedLaunchCouncils.reduce((sum, council) => {
    const seatsUp = Number(council.seatsUp ?? council.seats ?? 0) || 0
    return sum + seatsUp
  }, 0)
}

export function selectTopCouncilsToWatch(trackedLaunchCouncils = []) {
  return [...trackedLaunchCouncils]
    .sort((a, b) => {
      const difficultyScore = (value) => {
        if (value === 'very hard') return 3
        if (value === 'hard') return 2
        if (value === 'medium') return 1
        return 0
      }
      const diffGap = difficultyScore(cleanText(b.difficulty)) - difficultyScore(cleanText(a.difficulty))
      if (diffGap !== 0) return diffGap
      return (Number(b.seatsUp ?? b.seats ?? 0) || 0) - (Number(a.seatsUp ?? a.seats ?? 0) || 0)
    })
    .slice(0, 5)
}

export function buildLocalLiveBriefing(trackedLaunchCouncils = [], topCouncilsToWatch = []) {
  if (!trackedLaunchCouncils.length) return 'Politiscope is building its launch council tracking set.'
  const names = topCouncilsToWatch.map((council) => council.name).slice(0, 3)
  const joined =
    names.length === 1
      ? names[0]
      : names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names[0]}, ${names[1]} and ${names[2]}`
  return `${trackedLaunchCouncils.length} tracked councils for May 2026. ${joined} are among the key places to watch.`
}

export function selectLocalSummaryFilter(localFilter = 'all', search = '') {
  if (localFilter === 'veryhard') return 'tossups'
  if (localFilter === 'hard') return 'competitive'
  if (localFilter === 'all' && !search.trim()) return 'tracked'
  return 'other'
}

export function selectLocalFilteredCouncils(filteredCouncils = [], localFilter = 'all') {
  switch (localFilter) {
    case 'reform':
      return filteredCouncils.filter((council) =>
        /reform/i.test(cleanText(council.targetParty)) ||
        /reform/i.test(cleanText(council.verdict)) ||
        /reform/i.test(cleanText(council.watchFor)),
      )
    case 'labour':
      return filteredCouncils.filter((council) => cleanText(council.control) === 'Lab')
    case 'conservative':
      return filteredCouncils.filter((council) => cleanText(council.control) === 'Con')
    case 'noc':
      return filteredCouncils.filter((council) => council.noc || cleanText(council.control) === 'NOC')
    case 'veryhard':
      return filteredCouncils.filter((council) => cleanText(council.difficulty) === 'very hard')
    case 'hard':
      return filteredCouncils.filter((council) => cleanText(council.difficulty) === 'hard')
    case 'county':
      return filteredCouncils.filter((council) => cleanText(council.type) === 'County')
    case 'district':
      return filteredCouncils.filter(
        (council) => cleanText(council.type) === 'District' || cleanText(council.type) === 'Borough',
      )
    case 'metropolitan':
      return filteredCouncils.filter((council) => cleanText(council.type) === 'Metropolitan')
    case 'unitary':
      return filteredCouncils.filter((council) => cleanText(council.type) === 'Unitary')
    case 'london':
      return filteredCouncils.filter(
        (council) => /london/i.test(cleanText(council.region)) || /london borough/i.test(cleanText(council.type)),
      )
    default:
      return filteredCouncils
  }
}

export function selectLocalElectionModel({
  staticCouncils = [],
  regions = [],
  councilRegistry = [],
  councilStatus = [],
  councilEditorial = [],
  search = '',
  localFilter = 'all',
}) {
  const councils = selectMergedCouncils(staticCouncils, councilRegistry, councilStatus, councilEditorial)
  const searchableCouncils = selectSearchableCouncils(councils, regions)
  const filteredCouncils = selectFilteredCouncils(councils, searchableCouncils, search)
  const launchCouncils = selectLaunchCouncils(councils)
  const trackedLaunchCouncils = selectTrackedLaunchCouncils(launchCouncils)
  const trackedLaunchSeatsUp = selectTrackedLaunchSeatsUp(trackedLaunchCouncils)
  const veryContested = trackedLaunchCouncils.filter((council) => cleanText(council.difficulty) === 'very hard')
  const hardToCall = trackedLaunchCouncils.filter((council) => cleanText(council.difficulty) === 'hard')
  const topCouncilsToWatch = selectTopCouncilsToWatch(trackedLaunchCouncils)
  const liveBriefing = buildLocalLiveBriefing(trackedLaunchCouncils, topCouncilsToWatch)
  const localSummaryFilter = selectLocalSummaryFilter(localFilter, search)
  const localFilteredCouncils = selectLocalFilteredCouncils(filteredCouncils, localFilter)
  const hasLocalRefinement = !!search.trim() || localFilter !== 'all'
  const currentLocalFilterLabel = LOCAL_FILTERS.find((item) => item.key === localFilter)?.label || localFilter

  return {
    councils,
    filteredCouncils,
    trackedLaunchCouncils,
    trackedLaunchSeatsUp,
    veryContested,
    hardToCall,
    topCouncilsToWatch,
    liveBriefing,
    localSummaryFilter,
    localFilteredCouncils,
    hasLocalRefinement,
    currentLocalFilterLabel,
  }
}
