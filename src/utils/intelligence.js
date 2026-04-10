function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function sortByPct(parties = []) {
  return [...(Array.isArray(parties) ? parties : [])].sort((a, b) => (b?.pct || 0) - (a?.pct || 0))
}

export function computePartyMetrics(parties = [], trends = []) {
  const safeParties = Array.isArray(parties) ? parties : []
  const safeTrends = Array.isArray(trends) ? trends : []

  const first = safeTrends[0] || {}
  const last = safeTrends[safeTrends.length - 1] || {}

  return safeParties.map((party) => {
    const pct = Number(party?.pct ?? party?.current ?? 0) || 0
    const explicitTrend =
      typeof party?.recentDelta === 'number'
        ? party.recentDelta
        : typeof party?.trendDelta === 'number'
          ? party.trendDelta
          : null

    let inferredTrend = null
    if (explicitTrend == null && safeTrends.length >= 2) {
      const start = first?.[party?.name]
      const end = last?.[party?.name]
      if (typeof start === 'number' && typeof end === 'number') {
        inferredTrend = +(end - start).toFixed(1)
      }
    }

    const trendDelta = explicitTrend != null ? explicitTrend : inferredTrend
    const absTrend = Math.abs(trendDelta || 0)
    const incomingConfidence = String(party?.confidence || '').toLowerCase()

    let movementLabel = party?.movementLabel || 'Flat'
    let confidenceLabel = party?.confidenceLabel || 'No clear break yet'
    let confidence = incomingConfidence || 'low'
    let signalLabel = party?.signalLabel || 'steady'

    if (!party?.movementLabel || !party?.confidenceLabel || !incomingConfidence) {
      if (trendDelta != null) {
        if (absTrend < 0.5) {
          movementLabel = 'Flat'
          confidenceLabel = 'Movement remains too small to call a shift.'
          confidence = 'low'
          signalLabel = 'steady'
        } else if (absTrend < 1.5) {
          movementLabel = trendDelta > 0 ? 'Early upward pressure' : 'Early downward pressure'
          confidenceLabel = 'An early signal is emerging, but not yet established.'
          confidence = 'medium'
          signalLabel = 'early-signal'
        } else {
          movementLabel = trendDelta > 0 ? 'Clear upward trend' : 'Clear downward trend'
          confidenceLabel = 'Movement is consistent across recent polling.'
          confidence = 'high'
          signalLabel = 'firm-shift'
        }
      }
    }

    return {
      ...party,
      pct,
      trendDelta,
      movementLabel,
      confidenceLabel,
      confidence,
      signalLabel,
    }
  })
}

export function getRaceStatus(parties = []) {
  const safeParties = Array.isArray(parties) ? parties : []
  if (safeParties.length < 2) return null

  const sorted = sortByPct(safeParties)
  const leader = sorted[0]
  const second = sorted[1]
  const third = sorted[2] || null
  const gap = +((leader?.pct || 0) - (second?.pct || 0)).toFixed(1)

  let raceLabel = 'leader-clear'
  let confidence = 'high'

  if (gap < 2) {
    raceLabel = 'effectively-level'
    confidence = 'low'
  } else if (gap <= 5) {
    raceLabel = 'competitive'
    confidence = 'medium'
  }

  return { leader, second, third, gap, raceLabel, confidence }
}

export function getMomentum(parties = []) {
  const safeParties = (Array.isArray(parties) ? parties : []).filter(
    (party) => typeof party?.trendDelta === 'number'
  )
  if (!safeParties.length) return null
  return [...safeParties].sort((a, b) => (b.trendDelta || 0) - (a.trendDelta || 0))[0]
}

export function getPressure(leaders = []) {
  const safeLeaders = Array.isArray(leaders) ? leaders : []
  if (!safeLeaders.length) return null
  return [...safeLeaders].sort((a, b) => (a?.net || 0) - (b?.net || 0))[0]
}

function buildHeadline({ race, momentum }) {
  if (!race) return 'No clear national picture yet'

  const { leader, second, third, gap, raceLabel } = race
  const thirdClose = third?.name && third?.pct >= (second?.pct || 0) - 2

  if (raceLabel === 'effectively-level') {
    return `${leader.name} and ${second.name} are still in a genuinely open race`
  }

  if (raceLabel === 'competitive') {
    if (momentum?.name && momentum?.name !== leader?.name && (momentum?.trendDelta || 0) > 0.5) {
      return `${leader.name} are ahead, but ${momentum.name} are changing the shape of the race`
    }
    if (thirdClose) return `${leader.name} are ahead, but the wider race is still unsettled`
    return `${leader.name} are ahead, but the race is still live`
  }

  if (gap > 5 && thirdClose) {
    return `${leader.name} remain ahead, but the field behind them is still shifting`
  }

  return `${leader.name} have opened a clearer lead, but the story around them is still moving`
}

function buildTopLine({ race, momentum }) {
  if (!race) return 'There is not enough information yet to give a confident national read.'

  const { leader, second, third, raceLabel } = race

  let line = ''

  if (raceLabel === 'effectively-level') {
    line = `${leader.name} are only narrowly ahead of ${second.name}, so the national picture is still open and sensitive to fresh polling.`
  } else if (raceLabel === 'competitive') {
    line = `${leader.name} have moved into first place and look more settled there, but ${second.name} are still close enough to keep the race competitive.`
  } else {
    line = `${leader.name} now look more established in front, with ${second.name} chasing and the rest of the field trying to change the shape of the contest.`
  }

  if (third?.name && third?.pct >= second?.pct - 2) {
    line += ` ${third.name} are close enough to matter to the overall structure of the race, not just the margins.`
  }

  if (momentum?.name && Math.abs(momentum?.trendDelta || 0) >= 0.5) {
    if ((momentum?.trendDelta || 0) > 0) {
      line += ` ${momentum.name} are the clearest upward mover in the current trend picture.`
    } else {
      line += ` ${momentum.name} are under the most visible downward pressure in the current trend picture.`
    }
  }

  return line
}

function buildPressurePoint({ race, momentum, pressure }) {
  if (momentum?.name && (momentum?.trendDelta || 0) > 0.5) {
    return {
      title: `${momentum.name} are shaping the direction of travel`,
      body: `${momentum.name} are the clearest upward mover in the current trend picture. The pressure point now is whether that movement settles into a durable shift or fades once the next electoral test comes into view.`,
      accent: momentum?.color || '#02A95B',
    }
  }

  if (pressure && typeof pressure?.net === 'number') {
    return {
      title: 'Leadership pressure is still part of the story',
      body: `${pressure.name} remain the weakest leader on the current approval picture. That matters because weak leadership ratings make it harder for a party to turn polling movement into something durable.`,
      accent: '#555',
    }
  }

  return {
    title: 'The picture is moving, but it is not fully settled',
    body: race?.third?.name && race?.third?.pct >= (race?.second?.pct || 0) - 2
      ? `${race.third.name} are close enough to the top two to keep the wider race fluid, which means the next round of polling still matters more than any one single reading.`
      : 'No single pressure point is dominating everything at once, which usually means the next round of polling matters more than any one isolated data point.',
    accent: race?.leader?.color || '#666',
  }
}

function buildSummaryFromEnriched({ enriched = [], leaders = [], months = 6 } = {}) {
  const safeLeaders = Array.isArray(leaders) ? leaders.filter(Boolean) : []

  const race = getRaceStatus(enriched)
  const momentum = getMomentum(enriched)
  const pressure = getPressure(safeLeaders)
  const signals = []

  if (!race) {
    return {
      headline: 'No clear national picture yet',
      subhead: 'Insufficient data for a confident national read.',
      enrichedParties: enriched,
      race: null,
      momentum: null,
      pressure,
      signals,
      confidence: 'low',
      tone: 'briefing',
      topLine: {
        title: 'Top line',
        body: 'Insufficient data for a confident national read.',
        accent: '#666',
      },
      pressurePoint: {
        title: 'Pressure point',
        body: 'Not enough political signal has landed yet to identify the main pressure point.',
        accent: '#666',
      },
    }
  }

  const headline = buildHeadline({ race, momentum })
  const topLineBody = buildTopLine({ race, momentum })
  const pressurePoint = buildPressurePoint({ race, momentum, pressure })

  return {
    headline,
    subhead: topLineBody,
    enrichedParties: enriched,
    race,
    momentum,
    pressure,
    signals,
    confidence: race.confidence,
    tone: 'briefing',
    topLine: {
      title: 'Top line',
      body: topLineBody,
      accent: race?.leader?.color || '#666',
    },
    pressurePoint: {
      title: 'Pressure point',
      body: pressurePoint.body,
      accent: pressurePoint.accent,
    },
  }
}

export function buildSmartSummary({ parties = [], leaders = [], trends = [], pollContext = null, months = 6 } = {}) {
  const contextSnapshot = Array.isArray(pollContext?.partyPollSnapshot) ? pollContext.partyPollSnapshot : null
  const contextTrends = Array.isArray(pollContext?.trendSeries) ? pollContext.trendSeries : null

  const enriched = computePartyMetrics(
    contextSnapshot && contextSnapshot.length ? contextSnapshot : parties,
    contextTrends && contextTrends.length ? contextTrends : trends,
  )

  return buildSummaryFromEnriched({ enriched, leaders, months })
}
