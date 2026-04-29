import React, { useMemo, useRef, useState } from 'react'
import { haptic } from '../components/ui'
import '../features/simulator/GovernmentSimulator.css'
import {
  createSimulatorInitialState,
  simulatorElectoratePalette,
  simulatorPollingPalette,
  simulatorSceneArt,
  simulatorScenes,
} from '../features/simulator/simulatorData'
import {
  chooseSimulatorOption,
  continueSimulator,
  getCurrentSimulatorScene,
  getHudMetrics,
  getNewsDeck,
  getSortedPolling,
  restartSimulator,
  toggleSimulatorSfx,
} from '../features/simulator/simulatorEngine'

const HUD_TONES = {
  green: '#42d765',
  red: '#e8404f',
  gold: '#f0c956',
  cyan: '#36d6cf',
}

function MeterList({ items, palette }) {
  return items.map(([label, value]) => (
    <div className="mandate-meter" key={label}>
      <span>{label}</span>
      <div className="mandate-track">
        <div className="mandate-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: palette[label] || '#aaaaaa' }} />
      </div>
      <strong>{Math.round(value)}</strong>
    </div>
  ))
}

export default function GovernmentSimulatorScreen({ T, pollContext = {}, parties = [] }) {
  const simulatorSeed = useMemo(
    () => ({
      partyPollSnapshot: Array.isArray(pollContext?.partyPollSnapshot) ? pollContext.partyPollSnapshot : [],
      parties: Array.isArray(parties) ? parties : [],
    }),
    [pollContext?.partyPollSnapshot, parties],
  )
  const [state, setState] = useState(() => createSimulatorInitialState(simulatorSeed))
  const audioRef = useRef(null)
  const scrollRef = useRef(null)
  const currentScene = getCurrentSimulatorScene(state, simulatorScenes)
  const hudMetrics = getHudMetrics(state)
  const newsDeck = getNewsDeck(state)
  const pollingItems = useMemo(() => getSortedPolling(state), [state])
  const sceneImage = currentScene ? `${import.meta.env.BASE_URL}simulator/${simulatorSceneArt[currentScene.art]}` : ''
  const portraitStyle = currentScene ? { backgroundImage: `url(${sceneImage})` } : undefined

  const isDark = T.th === '#ffffff' || T.th?.toLowerCase?.() === '#ffffff'
  const screenStyle = {
    '--mandate-shell-bg': isDark
      ? T.sf
      : 'radial-gradient(circle at top, rgba(93, 177, 195, 0.16), transparent 26rem), linear-gradient(180deg, #eef6fa 0%, #ddebf3 48%, #d8e7f0 100%)',
    '--mandate-line': isDark ? '#53679e' : '#465f98',
    '--mandate-gold': '#f0c956',
    '--mandate-cyan': isDark ? '#36d6cf' : '#138d98',
    '--mandate-cream': '#f0ead3',
    '--mandate-title-color': '#f0c956',
    '--mandate-title-shadow': isDark ? '3px 3px #02030a' : '3px 3px rgba(9, 24, 40, 0.92)',
    '--mandate-subtitle-color': isDark ? 'rgba(240, 234, 211, 0.82)' : 'rgba(11, 36, 56, 0.66)',
    '--mandate-header-bg': isDark ? 'transparent' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.48))',
    '--mandate-header-border': isDark ? 'transparent' : 'rgba(12, 64, 96, 0.08)',
    '--mandate-header-shadow': isDark ? 'none' : '0 16px 40px rgba(120, 146, 168, 0.14)',
  }

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getAudioContext = () => {
    if (!audioRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return null
      audioRef.current = new AudioContextClass()
    }
    return audioRef.current
  }

  const playBeep = (type = 'choice') => {
    if (!state.sfxEnabled) return
    const audioContext = getAudioContext()
    if (!audioContext) return

    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = type === 'choice' ? 'square' : 'sawtooth'
    oscillator.frequency.value = type === 'choice' ? 440 : 220
    gain.gain.setValueAtTime(0.05, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12)
    oscillator.connect(gain).connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.13)
  }

  const handleRestart = () => {
    haptic(6)
    setState(restartSimulator(simulatorSeed))
    scrollToTop()
  }

  const handleToggleSfx = () => {
    haptic(4)
    if (state.sfxEnabled) playBeep('choice')
    setState((prev) => toggleSimulatorSfx(prev))
  }

  const handleChoice = (choiceId) => {
    if (state.phase !== 'playing' || state.selectedChoiceId) return
    haptic(8)
    playBeep('choice')
    setState((prev) => chooseSimulatorOption(prev, choiceId, simulatorScenes))
  }

  const handleContinue = () => {
    haptic(6)
    setState((prev) => continueSimulator(prev, simulatorScenes))
    scrollToTop()
  }

  return (
    <div className="mandate-screen" style={screenStyle}>
      <div className="mandate-scroll" ref={scrollRef} data-scroll-root>
        <div className="mandate-shell">
          <header className="mandate-header">
            <div className="mandate-kicker">Government Simulator</div>
            <h1 className="mandate-title">The Mandate</h1>
            <p className="mandate-subtitle">
              Run the country for ten turns. Make policy choices, manage voters, survive Parliament.
            </p>
          </header>

          <div className="mandate-top-actions">
            <button className="mandate-button" type="button" onClick={handleRestart}>
              Restart Game
            </button>
            <button className="mandate-button" type="button" onClick={handleToggleSfx}>
              {state.sfxEnabled ? 'SFX On' : 'SFX Off'}
            </button>
          </div>

          <section className="mandate-game">
            <div className="mandate-hud">
              {hudMetrics.map((metric) => (
                <div className="mandate-hudbox" key={metric.id}>
                  <div className="mandate-hudicon">{metric.icon}</div>
                  <div>
                    <span className="mandate-hudlabel">{metric.label}</span>
                    <span className="mandate-hudvalue" style={{ color: HUD_TONES[metric.tone] || '#f0ead3' }}>
                      {metric.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {state.phase === 'finished' ? (
              <section className="mandate-end">
                <h2 className="mandate-end-title">{state.finalResult?.title}</h2>
                <p className="mandate-end-body">{state.finalResult?.summary}</p>
                <div className="mandate-status-grid">
                  {(state.finalResult?.stats || []).map((stat) => (
                    <div className="mandate-status" key={stat.label}>
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="mandate-top-actions" style={{ justifyContent: 'flex-start', marginTop: 18, marginBottom: 0 }}>
                  <button className="mandate-button" type="button" onClick={handleRestart}>
                    Play Again
                  </button>
                </div>
              </section>
            ) : (
              <section className="mandate-layout">
                <section className="mandate-scene-panel">
                  <div className="mandate-scene-frame">
                    <img
                      className="mandate-scene-image"
                      data-scene={currentScene?.art}
                      src={sceneImage}
                      alt={`${currentScene?.speaker || 'Government'} scene`}
                    />
                  </div>
                </section>

                <section className="mandate-dialogue">
                  <div className="mandate-portrait" style={portraitStyle} />
                  <div>
                    <div className="mandate-speaker">{currentScene?.speaker}:</div>
                    <div className="mandate-dialogue-text">{currentScene?.prompt}</div>
                  </div>
                </section>

                <section className="mandate-choices">
                  {(currentScene?.choices || []).map((choice, index) => {
                    const selected = state.selectedChoiceId === choice.id
                    return (
                      <button
                        className={`mandate-choice${selected ? ' is-selected' : ''}`}
                        disabled={Boolean(state.selectedChoiceId)}
                        key={choice.id}
                        type="button"
                        onClick={() => handleChoice(choice.id)}
                      >
                        <span className="mandate-choice-index">{index + 1}</span>
                        <span className="mandate-choice-label">{choice.label}</span>
                      </button>
                    )
                  })}
                </section>

                <aside className="mandate-side">
                  <section className="mandate-card mandate-logo">
                    <div>
                      <small>THE</small>
                      <strong>MANDATE</strong>
                    </div>
                  </section>

                  <section className="mandate-card">
                    <div className="mandate-card-title">Electorate</div>
                    <MeterList items={Object.entries(state.electorate)} palette={simulatorElectoratePalette} />
                  </section>

                  <section className="mandate-card">
                    <div className="mandate-card-title">Polling</div>
                    <MeterList items={pollingItems} palette={simulatorPollingPalette} />
                  </section>

                  <section className="mandate-card mandate-paper">
                    <div className="mandate-paper-name">
                      <span>{newsDeck.nameplate}</span>
                      <span className="mandate-paper-extra">{newsDeck.edition}</span>
                    </div>
                    <div className="mandate-headline">{newsDeck.headline}</div>
                    <div className="mandate-subhead-text">{newsDeck.subhead}</div>
                  </section>
                </aside>
              </section>
            )}

            {state.reaction && (
              <div className="mandate-modal" role="dialog" aria-modal="true" aria-labelledby="mandate-reaction-title">
                <div className="mandate-modal-card">
                  <section className="mandate-modal-paper">
                    <div className="mandate-paper-name">
                      <span>{newsDeck.nameplate}</span>
                      <span className="mandate-paper-extra">{newsDeck.edition}</span>
                    </div>
                    <div className="mandate-modal-headline" id="mandate-reaction-title">
                      {state.reaction.headline}
                    </div>
                    <div className="mandate-subhead-text">{state.reaction.subhead}</div>
                  </section>

                  <section className="mandate-modal-info">
                    <h2>Political Reaction</h2>
                    <p>{state.reaction.body}</p>
                    {state.reaction.lines.map((line) => (
                      <div className="mandate-reaction-line" key={line}>
                        {line}
                      </div>
                    ))}
                    <div className="mandate-top-actions" style={{ justifyContent: 'flex-start', marginTop: 14, marginBottom: 0 }}>
                      <button className="mandate-button" type="button" onClick={handleContinue}>
                        Continue
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
