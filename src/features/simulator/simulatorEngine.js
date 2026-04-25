import {
  createSimulatorInitialState,
  simulatorScenes,
  simulatorIntroHeadline,
  simulatorIntroSubhead,
} from './simulatorData'

export const SIMULATOR_MAX_TURNS = 10
export const SIMULATOR_LOSS_THRESHOLDS = {
  approval: 20,
  partyUnity: 20,
  treasury: -3.5,
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function roundToTenth(value) {
  return Math.round(value * 10) / 10
}

export function formatTreasury(value) {
  const sign = value < 0 ? '-' : ''
  return `${sign}£${Math.abs(value).toFixed(1)}bn`
}

export function getPollingLead(state) {
  const government = Number(state?.polls?.LAB || 0)
  const strongestOpponent = Math.max(Number(state?.polls?.CON || 0), Number(state?.polls?.REF || 0))
  return Math.round(government - strongestOpponent)
}

export function getCurrentSimulatorScene(state, scenes = simulatorScenes) {
  return scenes[state?.turnIndex || 0] || null
}

export function getSortedPolling(state) {
  return Object.entries(state?.polls || {}).sort(([, a], [, b]) => b - a)
}

export function toggleSimulatorSfx(state) {
  return { ...state, sfxEnabled: !state.sfxEnabled }
}

export function restartSimulator() {
  return createSimulatorInitialState()
}

function applyChoiceEffects(state, effects = {}) {
  const next = {
    ...state,
    approval: clamp(Number(state.approval || 0) + Number(effects.approval || 0)),
    treasury: roundToTenth(Number(state.treasury || 0) + Number(effects.treasury || 0)),
    partyUnity: clamp(Number(state.partyUnity || 0) + Number(effects.partyUnity || 0)),
    electorate: { ...(state.electorate || {}) },
    polls: { ...(state.polls || {}) },
  }

  Object.entries(effects.electorate || {}).forEach(([group, delta]) => {
    next.electorate[group] = clamp(Number(next.electorate[group] || 50) + Number(delta || 0))
  })

  Object.entries(effects.polls || {}).forEach(([party, delta]) => {
    next.polls[party] = clamp(Number(next.polls[party] || 0) + Number(delta || 0), 1, 55)
  })

  return next
}

export function buildReactionLines(choice) {
  const effects = choice?.effects || {}
  const lines = []
  const strongestVoterShift = Object.entries(effects.electorate || {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]
  const sharpestPollShift = Object.entries(effects.polls || {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]

  if (effects.line) lines.push(effects.line)

  if ((effects.partyUnity || 0) <= -5) {
    lines.push('Whips warn of angry MPs.')
  } else if ((effects.partyUnity || 0) >= 2) {
    lines.push('Backbench pressure eases for now.')
  }

  if (strongestVoterShift) {
    lines.push(`${strongestVoterShift[0]} voters ${strongestVoterShift[1] > 0 ? 'respond well' : 'react badly'}.`)
  }

  if (sharpestPollShift) {
    lines.push(`${sharpestPollShift[0]} shows the sharpest immediate polling movement.`)
  }

  return lines.filter(Boolean).slice(0, 4)
}

export function chooseSimulatorOption(state, choiceId, scenes = simulatorScenes) {
  if (state?.phase !== 'playing' || state?.selectedChoiceId) return state

  const scene = getCurrentSimulatorScene(state, scenes)
  const choice = scene?.choices?.find((item) => item.id === choiceId)
  if (!scene || !choice) return state

  const next = applyChoiceEffects(state, choice.effects)

  return {
    ...next,
    selectedChoiceId: choice.id,
    newsHeadline: choice.headline,
    newsSubhead: choice.subhead,
    reaction: {
      headline: choice.headline,
      subhead: choice.subhead,
      body: choice.reaction,
      lines: buildReactionLines(choice),
    },
    phase: 'reacting',
  }
}

export function getLossReason(state) {
  if (Number(state?.approval || 0) <= SIMULATOR_LOSS_THRESHOLDS.approval) return 'approval'
  if (Number(state?.partyUnity || 0) <= SIMULATOR_LOSS_THRESHOLDS.partyUnity) return 'partyUnity'
  if (Number(state?.treasury || 0) <= SIMULATOR_LOSS_THRESHOLDS.treasury) return 'treasury'
  return null
}

export function getProjectedSeats(state) {
  return Math.round(
    clamp(
      270 + getPollingLead(state) * 8 + (Number(state?.approval || 0) - 40) * 2 + (Number(state?.partyUnity || 0) - 60) * 0.8,
      120,
      430,
    ),
  )
}

export function buildFinalResult(state, reason = null) {
  const projectedSeats = getProjectedSeats(state)
  let title = 'You survived the campaign'
  let summary =
    projectedSeats >= 326
      ? 'You are projected to win a majority. The mandate survives, though the country is still restless.'
      : projectedSeats >= 290
        ? 'You remain the largest party, but the next Parliament will be ugly. Survival is not the same as control.'
        : 'The government survives the campaign but is projected to lose power. The public has turned.'

  if (reason === 'approval') {
    title = 'You were forced out'
    summary =
      'Public approval collapsed. The party decided you had become an electoral liability and moved before the final campaign could finish.'
  } else if (reason === 'partyUnity') {
    title = 'Leadership challenge lost'
    summary =
      'Party unity collapsed. Backbenchers and ministers concluded the government could not survive under your leadership.'
  } else if (reason === 'treasury') {
    title = 'Treasury crisis'
    summary =
      'The fiscal position became impossible. Markets, the press and Parliament turned on the government at the same time.'
  }

  return {
    title,
    summary,
    projectedSeats,
    stats: [
      { label: 'Projected seats', value: String(projectedSeats) },
      { label: 'Approval', value: `${Math.round(state.approval)}%` },
      { label: 'Treasury', value: formatTreasury(state.treasury) },
      { label: 'Party unity', value: `${Math.round(state.partyUnity)}%` },
    ],
  }
}

export function continueSimulator(state, scenes = simulatorScenes) {
  if (state?.phase !== 'reacting') return state

  const lossReason = getLossReason(state)
  if (lossReason) {
    return {
      ...state,
      reaction: null,
      phase: 'finished',
      finalResult: buildFinalResult(state, lossReason),
    }
  }

  const nextTurnIndex = Number(state.turnIndex || 0) + 1
  if (nextTurnIndex >= Math.min(SIMULATOR_MAX_TURNS, scenes.length)) {
    return {
      ...state,
      turnIndex: nextTurnIndex,
      selectedChoiceId: null,
      reaction: null,
      phase: 'finished',
      finalResult: buildFinalResult(state),
    }
  }

  return {
    ...state,
    turnIndex: nextTurnIndex,
    selectedChoiceId: null,
    reaction: null,
    phase: 'playing',
  }
}

export function getHudMetrics(state) {
  return [
    { id: 'approval', label: 'Approval', value: `${Math.round(state.approval)}%`, tone: 'green', icon: 'APP' },
    { id: 'treasury', label: 'Treasury', value: formatTreasury(state.treasury), tone: state.treasury < 0 ? 'red' : 'gold', icon: 'TRS' },
    {
      id: 'polling',
      label: 'Polling lead',
      value: `${getPollingLead(state) >= 0 ? '+' : ''}${getPollingLead(state)}`,
      tone: getPollingLead(state) >= 0 ? 'green' : 'red',
      icon: 'POL',
    },
    { id: 'unity', label: 'Party unity', value: `${Math.round(state.partyUnity)}%`, tone: 'gold', icon: 'UNT' },
    { id: 'turn', label: 'Turn', value: `${Math.min(Number(state.turnIndex || 0) + 1, SIMULATOR_MAX_TURNS)}/${SIMULATOR_MAX_TURNS}`, tone: 'cyan', icon: 'TRN' },
  ]
}

export function getNewsDeck(state) {
  return {
    nameplate: 'Daily Herald',
    edition: 'Extra',
    headline: state?.newsHeadline || simulatorIntroHeadline,
    subhead: state?.newsSubhead || simulatorIntroSubhead,
  }
}
