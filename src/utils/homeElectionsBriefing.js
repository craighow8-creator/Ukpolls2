import { LOCAL_ELECTIONS } from '../data/elections'
import { DEVOLVED_NATIONS } from '../data/electionsDevolved'
import { MAYORS_OVERVIEW, REGIONAL_MAYORS } from '../data/electionsMayors'
import { cleanText } from './electionsHelpers'

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function formatLongDate(value) {
  const date = startOfDay(value)
  if (!date) return cleanText(value)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function buildTargetState(targetDate, today) {
  if (!targetDate || !today) {
    return {
      state: 'future',
      daysRemaining: null,
      value: '—',
      unitPrimary: 'date',
      unitSecondary: 'to come',
    }
  }

  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / DAY_MS)
  if (diffDays === 0) {
    return {
      state: 'today',
      daysRemaining: 0,
      value: 'Today',
      unitPrimary: 'voting',
      unitSecondary: 'under way',
    }
  }

  if (diffDays < 0) {
    return {
      state: 'completed',
      daysRemaining: diffDays,
      value: 'Done',
      unitPrimary: 'result',
      unitSecondary: 'recorded',
    }
  }

  return {
    state: 'future',
    daysRemaining: diffDays,
    value: String(diffDays),
    unitPrimary: 'days',
    unitSecondary: 'remaining',
  }
}

function buildProgress(targetState) {
  if (targetState.state === 'today' || targetState.state === 'completed') return 100
  const daysRemaining = Number(targetState.daysRemaining || 0)
  const windowDays = Math.max(120, Math.min(365, daysRemaining + 75))
  const pct = ((windowDays - daysRemaining) / windowDays) * 100
  return Math.max(4, Math.min(100, Math.round(pct)))
}

function dedupeById(items = []) {
  const seen = new Set()
  return items.filter((item) => {
    const id = item?.id || item?.label
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function buildCountdownTarget(meta = {}, upcomingByElections = []) {
  const candidates = []

  if (meta?.nextElectionDate) {
    candidates.push({
      kind: 'major',
      priority: 0,
      label: cleanText(meta.nextElectionLabel) || 'Next major vote',
      date: meta.nextElectionDate,
    })
  }

  if (LOCAL_ELECTIONS?.date) {
    candidates.push({
      kind: 'locals',
      priority: 1,
      label: 'Local elections',
      date: LOCAL_ELECTIONS.date,
    })
  }

  DEVOLVED_NATIONS.forEach((nation) => {
    if (!nation?.nextElection) return
    candidates.push({
      kind: `devolved-${nation.key}`,
      priority: 2,
      label: nation.title,
      date: nation.nextElection,
    })
  })

  if (meta?.nextGeneralElectionDate) {
    candidates.push({
      kind: 'general',
      priority: 3,
      label: 'General election',
      date: meta.nextGeneralElectionDate,
    })
  }

  if (upcomingByElections[0]?.date) {
    candidates.push({
      kind: 'byelection',
      priority: 5,
      label: 'By-election watch',
      date: upcomingByElections[0].date,
    })
  }

  const today = startOfDay(new Date())
  const normalized = candidates
    .map((candidate) => ({
      ...candidate,
      parsedDate: startOfDay(candidate.date),
    }))
    .filter((candidate) => candidate.parsedDate)
    .sort((a, b) => {
      const dayDiff = a.parsedDate.getTime() - b.parsedDate.getTime()
      if (dayDiff !== 0) return dayDiff
      return a.priority - b.priority
    })

  const future = normalized.find((candidate) => candidate.parsedDate.getTime() >= today.getTime())
  const chosen = future || normalized[normalized.length - 1] || null

  return chosen
    ? {
        ...chosen,
        dateLabel: formatLongDate(chosen.parsedDate),
      }
    : {
        kind: 'major',
        label: cleanText(meta?.nextElectionLabel) || 'Elections',
        date: '',
        dateLabel: '',
        parsedDate: null,
      }
}

export function buildHomeElectionsBriefing({ meta = {}, byElections = {} } = {}) {
  const today = startOfDay(new Date())
  const upcomingByElections = Array.isArray(byElections?.upcoming)
    ? byElections.upcoming.filter((contest) => contest?.status !== 'skip')
    : []
  const recentByElections = Array.isArray(byElections?.recent) ? byElections.recent : []
  const byElectionMeta = byElections?.meta || {}

  const target = buildCountdownTarget(meta, upcomingByElections)
  const targetState = buildTargetState(target.parsedDate, today)

  const localCount = Array.isArray(LOCAL_ELECTIONS?.councils) ? LOCAL_ELECTIONS.councils.length : 0
  const devolvedUpcoming = DEVOLVED_NATIONS.filter((nation) => {
    const next = startOfDay(nation?.nextElection)
    return next && next.getTime() >= today.getTime()
  })
  const recentCount = Number(byElectionMeta?.recentCount || recentByElections.length || 0)
  const upcomingCount = Number(byElectionMeta?.upcomingCount || upcomingByElections.length || 0)
  const mayorCount = Number(MAYORS_OVERVIEW?.totalRegional || REGIONAL_MAYORS.length || 0)

  const chips = dedupeById([
    localCount
      ? { id: 'locals', label: `${localCount} councils`, color: '#12B7D4' }
      : null,
    devolvedUpcoming.find((nation) => nation.key === 'scotland')
      ? { id: 'scotland', label: 'Scottish Parliament', color: '#005EB8' }
      : null,
    devolvedUpcoming.find((nation) => nation.key === 'wales')
      ? { id: 'wales', label: 'Senedd', color: '#C8102E' }
      : null,
    mayorCount
      ? { id: 'mayors', label: `${mayorCount} mayoralties`, color: '#FAA61A' }
      : null,
    upcomingCount > 0
      ? {
          id: 'byelections-upcoming',
          label: pluralize(upcomingCount, 'by-election'),
          color: '#4F46E5',
        }
      : recentCount > 0
        ? {
            id: 'byelections-recent',
            label: `${recentCount} recent results`,
            color: '#4F46E5',
          }
        : null,
  ])

  const inPlayParts = []
  if (localCount) inPlayParts.push(`${localCount} councils`)
  if (devolvedUpcoming.length === 2) {
    inPlayParts.push('Scotland and Wales')
  } else if (devolvedUpcoming.length === 1) {
    inPlayParts.push(devolvedUpcoming[0].title)
  }
  if (upcomingCount > 0) inPlayParts.push(pluralize(upcomingCount, 'by-election watchpoint'))
  if (!inPlayParts.length && recentCount > 0) inPlayParts.push(`${recentCount} recent by-election results`)

  const summary = inPlayParts.length
    ? `${inPlayParts.join(', ')} are in play.`
    : 'The next election cycle is being tracked across the main UK contests.'

  const signals = dedupeById([
    target.dateLabel
      ? {
          id: 'target',
          text:
            targetState.state === 'completed'
              ? `${target.label} was last held on ${target.dateLabel}.`
              : `${target.label} is set for ${target.dateLabel}.`,
        }
      : null,
    localCount
      ? {
          id: 'locals',
          text: `${localCount} councils are in the current local elections map.`,
        }
      : null,
    devolvedUpcoming.length === 2
      ? {
          id: 'devolved',
          text: 'Holyrood and the Senedd both vote in the next cycle.',
        }
      : devolvedUpcoming[0]
        ? {
            id: `devolved-${devolvedUpcoming[0].key}`,
            text: `${devolvedUpcoming[0].title} remains central to the next devolved test.`,
          }
        : null,
    MAYORS_OVERVIEW?.labourRegional > MAYORS_OVERVIEW?.nonLabourRegional
      ? {
          id: 'mayors-labour',
          text: `Labour still dominate the regional mayor map.`,
        }
      : null,
    MAYORS_OVERVIEW?.reformRegional > 0
      ? {
          id: 'mayors-reform',
          text: `Reform now hold ${pluralize(MAYORS_OVERVIEW.reformRegional, 'regional mayoralty')}.`,
        }
      : null,
    upcomingByElections[0]?.name
      ? {
          id: 'byelection-next',
          text: `Next by-election watch: ${cleanText(upcomingByElections[0].name)}.`,
        }
      : recentByElections[0]?.name
        ? {
            id: 'byelection-latest',
            text: `Latest by-election: ${cleanText(recentByElections[0].name)}.`,
          }
        : null,
  ])

  return {
    label: cleanText(target.label) || 'Elections',
    dateLabel: target.dateLabel || cleanText(meta?.nextElectionDate) || '',
    countdown: {
      ...targetState,
      progressPct: buildProgress(targetState),
    },
    summary,
    chips,
    signals,
  }
}

export default buildHomeElectionsBriefing
