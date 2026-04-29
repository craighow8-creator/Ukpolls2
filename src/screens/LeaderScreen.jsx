import React, { useState } from 'react'
import { R } from '../constants'
import { StickyPills, haptic } from '../components/ui'
import { PortraitAvatar } from '../utils/portraits'
import { useSwipeNav } from '../utils/swipeNav'
import { InfoButton } from '../components/InfoGlyph'
import CompareLauncherSheet from '../components/CompareLauncherSheet'

const PILLS = [
  { key: 'bio', label: 'About' },
  { key: 'immigration', label: 'Immigration' },
  { key: 'economy', label: 'Economy' },
  { key: 'nhs', label: 'NHS' },
  { key: 'climate', label: 'Climate' },
]

function normaliseLeaderTab(tab) {
  return PILLS.some((item) => item.key === tab) ? tab : 'bio'
}

function isDarkTheme(T = {}) {
  return String(T.th || '').toLowerCase() === '#ffffff'
}

function leaderChrome(T = {}) {
  const isDark = isDarkTheme(T)
  return {
    card: isDark ? '#101820' : '#FFFFFF',
    panel: isDark ? 'rgba(255,255,255,0.045)' : '#F7F9FB',
    panelSoft: isDark ? 'rgba(255,255,255,0.035)' : '#FBFCFD',
    border: T.cardBorder || (isDark ? 'rgba(255,255,255,0.11)' : 'rgba(15,23,42,0.09)'),
    hairline: isDark ? 'rgba(255,255,255,0.075)' : 'rgba(15,23,42,0.065)',
    muted: isDark ? 'rgba(255,255,255,0.62)' : 'rgba(15,23,42,0.58)',
    faint: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(15,23,42,0.42)',
    primaryBg: isDark ? 'rgba(255,255,255,0.095)' : '#EEF3F6',
    primaryBorder: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.13)',
    primaryText: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.82)',
  }
}

function Badge({ children, color, subtle = false, T }) {
  const chrome = leaderChrome(T)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: subtle ? chrome.muted : color,
        background: subtle ? chrome.panel : chrome.card,
        border: `1px solid ${subtle ? chrome.border : `${color}38`}`,
        borderRadius: 999,
        padding: '4px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function StickyPillsBar({ T, pills, tab, setTab }) {
  const chrome = leaderChrome(T)
  const neutralPillTheme = { ...T, sf: chrome.panel, tm: chrome.muted, tl: chrome.muted }
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8,
        background: chrome.panel,
        padding: '10px 16px 12px',
        borderBottom: `1px solid ${chrome.border}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <StickyPills pills={pills} active={tab} onSelect={setTab} T={neutralPillTheme} />
    </div>
  )
}

function SectionLabel({ children, T }) {
  const chrome = leaderChrome(T)
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: chrome.faint,
        marginBottom: 10,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function shortName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : name
}

function ratingGap(value) {
  const number = Math.round(Math.abs(Number(value || 0)))
  return `${number} pt${number === 1 ? '' : 's'}`
}

function ratingMetricLabel(leader) {
  return leader?.metricLabel || (leader?.ratingSource === 'sourced' ? 'Net favourability' : 'Maintained profile rating')
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value))
}

function hasSourcedFavourability(leader) {
  if (!leader || !isFiniteNumber(leader.net)) return false
  const label = String(leader.metricLabel || '').toLowerCase()
  const hasSourceMarker =
    leader.ratingSource === 'sourced' ||
    Boolean(leader.sourceUrl || leader.source || leader.publishedAt || leader.fieldworkDate)
  return hasSourceMarker && label.includes('favourability')
}

function hasFavourabilitySplit(leader) {
  if (!leader?._hasFavourabilitySplit) return false
  return Number.isFinite(Number(leader.favourable)) && Number.isFinite(Number(leader.unfavourable))
}

function ratingSourceLine(leader) {
  if (!hasSourcedFavourability(leader)) return 'No sourced favourability row yet'
  const source = leader.source || 'Leader ratings source'
  const date = leader.publishedAt || leader.fieldworkDate || leader.updatedAt || ''
  return date ? `${source} · ${date}` : source
}

function buildProfileOnlyIntelligence(leader) {
  return {
    contextLine: 'No sourced favourability row yet',
    whyItMattersTitle: 'Profile only',
    whyItMattersBody: `${leader.name}'s profile remains available, but Politiscope is not ranking maintained profile ratings against sourced favourability polling.`,
    signals: [
      { label: 'Rank', value: 'Not ranked' },
      { label: 'Metric', value: 'Profile only' },
      { label: 'Status', value: 'Awaiting source' },
    ],
  }
}

function buildLeaderIntelligence({ leader, party, sorted, curRank, prev, next }) {
  const total = sorted.length || 1
  const top = sorted[0]
  const topGap = top && top.name !== leader.name ? top.net - leader.net : 0
  const secondGap = next ? leader.net - next.net : 0
  const partyChange = typeof party?.change === 'number' ? party.change : null
  const isTop = curRank === 0
  const isBottom = curRank === total - 1
  const alignmentLabel =
    partyChange == null
      ? 'Party link unclear'
      : leader.net >= 0 && partyChange <= 0
        ? 'Outperforming party'
        : leader.net < 0 && partyChange > 0
          ? 'Dragging party'
          : leader.net >= 0 && partyChange > 0
            ? 'Aligned upward'
            : 'Shared pressure'

  const contextLine = isTop
    ? leader.net < 0
      ? 'Highest in the table, though still underwater'
      : secondGap <= 3 && next
        ? `Highest-rated, ${ratingGap(secondGap)} ahead of ${shortName(next.name)}`
        : 'Highest-rated leader in the field'
    : isBottom
      ? `Lowest-rated, ${ratingGap(topGap)} behind ${shortName(top?.name)}`
      : curRank === 1
        ? `Closest challenger, ${ratingGap(topGap)} behind ${shortName(top?.name)}`
        : `${ratingGap(topGap)} behind ${shortName(top?.name)}`

  const gapLabel = isTop
    ? next
      ? `${ratingGap(secondGap)} clear`
      : 'No challenger'
    : `${ratingGap(topGap)} off top`

  let whyItMattersTitle = 'Current reading'
  let whyItMattersBody = 'Favourability is useful context, but the political signal depends on the party position around it.'

  if (isTop && secondGap <= 3 && next) {
    whyItMattersTitle = 'Top, but not secure'
    whyItMattersBody = `${leader.name} leads the favourability table by only ${secondGap} points, so the personal advantage is real but narrow.`
  } else if (isTop && leader.net >= 0) {
    whyItMattersTitle = 'Personal advantage at the top'
    whyItMattersBody = `${leader.name} has the clearest favourability position in the field, giving ${party?.name || 'the party'} a visible leadership asset.`
  } else if (leader.net <= -20 && partyChange != null && partyChange > 0) {
    whyItMattersTitle = 'Party stronger than leader'
    whyItMattersBody = `${party?.name || leader.party} is not moving as weakly as the personal rating, making the leader-party gap more important.`
  } else if (leader.net <= -20) {
    whyItMattersTitle = 'Heavy personal drag'
    whyItMattersBody = `${leader.name} is deeply underwater and ranks near the bottom, leaving little personal buffer for the party.`
  } else if (leader.net < 0 && partyChange != null && partyChange > 0) {
    whyItMattersTitle = 'Favourability lags party momentum'
    whyItMattersBody = `${party?.name || leader.party} has a better polling signal than the leader's personal standing, which keeps pressure on the leadership.`
  } else if (!isTop && topGap <= 5) {
    whyItMattersTitle = 'Within striking distance'
    whyItMattersBody = `${leader.name} is close enough to the top of the favourability table for small shifts to change the leadership order.`
  } else if (leader.net >= 0) {
    whyItMattersTitle = 'Positive, not dominant'
    whyItMattersBody = `${leader.name} is above water, but the ranking gap means the rating is helpful rather than commanding.`
  } else if (isBottom) {
    whyItMattersTitle = 'Weakest personal position'
    whyItMattersBody = `${leader.name} sits at the foot of the table, making leadership favourability a clear vulnerability.`
  } else {
    whyItMattersTitle = 'Pressure remains personal'
    whyItMattersBody = `${leader.name} remains underwater and behind the leading favourability figure, limiting the room for a leadership boost.`
  }

  return {
    contextLine,
    whyItMattersTitle,
    whyItMattersBody,
    gapLabel,
    alignmentLabel,
    signals: [
      { label: 'Rank', value: `#${curRank + 1} of ${total}` },
      { label: 'Gap', value: gapLabel },
      { label: 'Signal', value: alignmentLabel },
    ],
  }
}

function SignalStat({ T, label, value, divider = false }) {
  const chrome = leaderChrome(T)
  return (
    <div
      style={{
        padding: '8px 7px',
        background: 'transparent',
        borderRight: divider ? `1px solid ${chrome.hairline}` : 'none',
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.075em',
          textTransform: 'uppercase',
          color: chrome.faint,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 850, color: T.th, lineHeight: 1.18 }}>
        {value}
      </div>
    </div>
  )
}

function ActionButton({ children, T, variant = 'primary', onClick }) {
  const chrome = leaderChrome(T)

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        border: `1px solid ${variant === 'primary' ? chrome.primaryBorder : chrome.border}`,
        background: variant === 'primary' ? chrome.primaryBg : chrome.card,
        color: variant === 'primary' ? chrome.primaryText : chrome.muted,
        borderRadius: R.pill,
        padding: '8px 11px',
        minHeight: 37,
        fontSize: 13,
        fontWeight: variant === 'primary' ? 850 : 780,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

export default function LeaderScreen({ T, lIdx, nav, leaders, parties, initialTab, updateCurrentParams }) {
  const l = leaders?.[lIdx]
  const party = parties?.find((p) => p.name === l?.party)
  const [tab, setTab] = useState(() => normaliseLeaderTab(initialTab))
  const [compareOpen, setCompareOpen] = useState(false)

  React.useEffect(() => {
    setTab(normaliseLeaderTab(initialTab))
  }, [initialTab, lIdx])

  if (!l) return null

  const pills = PILLS.filter((pi) => pi.key === 'bio' || l[pi.key])
  const idx = parties?.indexOf(party)

  useSwipeNav({
    items: leaders,
    currentIdx: lIdx,
    onNavigate: (newIdx) => nav('leader', { lIdx: newIdx, openTab: tab }),
  })

  const isSourcedLeader = hasSourcedFavourability(l)
  const sorted = [...(leaders || [])]
    .filter(hasSourcedFavourability)
    .sort((a, b) => Number(b.net) - Number(a.net))
  const curRank = isSourcedLeader ? sorted.findIndex((x) => x.name === l.name) : -1
  const prev = curRank > 0 ? sorted[curRank - 1] : null
  const next = curRank >= 0 && curRank < sorted.length - 1 ? sorted[curRank + 1] : null
  const rankLabel = curRank >= 0 ? `#${curRank + 1} by net favourability` : null

  const chrome = leaderChrome(T)
  const netColor = isSourcedLeader && l.net >= 0 ? '#02A95B' : '#C8102E'
  const intelligence = isSourcedLeader
    ? buildLeaderIntelligence({ leader: l, party, sorted, curRank, prev, next })
    : buildProfileOnlyIntelligence(l)
  const compareContextArea = tab === 'bio' ? 'overview' : tab
  const openCompareWith = ({ baseParty, opponent, contextArea }) => {
    setCompareOpen(false)
    updateCurrentParams?.({ openTab: tab })
    nav('compare', {
      leftParty: baseParty.name,
      rightParty: opponent.name,
      fromScreen: 'leader',
      fromLeaderIdx: lIdx,
      returnTab: tab,
      compareContext: tab,
      policyArea: contextArea,
      tab: contextArea,
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: chrome.panel,
      }}
    >
      <div style={{ padding: '12px 16px 0' }}>
        <div
          style={{
            borderRadius: 17,
            padding: '14px 14px 13px',
            background: chrome.card,
            border: `1px solid ${chrome.border}`,
            borderTop: `3px solid ${party?.color || l.color}`,
            marginBottom: 12,
            boxShadow: '0 9px 24px rgba(15, 23, 42, 0.055)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <Badge T={T} color={party?.color || l.color}>{party?.abbr || l.party}</Badge>
            {rankLabel ? <Badge T={T} color={chrome.muted} subtle>{rankLabel}</Badge> : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 13, alignItems: 'center' }}>
            <div style={{ position: 'relative', justifySelf: 'center' }}>
              <style>{`@keyframes breathe{0%,100%{transform:scale(1);opacity:0.36}50%{transform:scale(1.04);opacity:0.72}}`}</style>
              <div
                style={{
                  position: 'absolute',
                  inset: -5,
                  borderRadius: '50%',
                  border: `2px solid ${(party?.color || l.color)}2E`,
                  animation: 'breathe 2.8s ease-in-out infinite',
                }}
              />
              <PortraitAvatar name={l.name} color={party?.color || l.color} size={76} radius={38} />
            </div>

            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: T.th,
                  lineHeight: 1.03,
                  letterSpacing: '-0.04em',
                  marginBottom: 4,
                }}
              >
                {l.name}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 7 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: chrome.muted }}>
                  {l.role} · {l.party}
                </div>
                <InfoButton id="leader_profile" T={T} size={18} />
              </div>

              {isSourcedLeader ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9 }}>
                  <div style={{ fontSize: 44, fontWeight: 950, color: netColor, lineHeight: 0.92, letterSpacing: '-0.045em' }}>
                    {l.net >= 0 ? '+' : ''}{l.net}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: chrome.muted, lineHeight: 1.34, paddingBottom: 3 }}>
                    {hasFavourabilitySplit(l) ? (
                      <>
                        {l.favourable}% favourable<br />{l.unfavourable}% unfavourable
                      </>
                    ) : (
                      ratingMetricLabel(l)
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: T.th, lineHeight: 1, letterSpacing: '-0.035em' }}>
                    Profile only
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: chrome.muted, lineHeight: 1.34, paddingBottom: 2 }}>
                    No sourced<br />favourability row yet
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 650, color: chrome.muted, textAlign: 'center', marginTop: 8, lineHeight: 1.45 }}>
            {l.sourceUrl ? (
              <a href={l.sourceUrl} target="_blank" rel="noreferrer" style={{ color: party?.color || l.color, textDecoration: 'none' }}>
                {ratingSourceLine(l)}
              </a>
            ) : (
              ratingSourceLine(l)
            )}
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: T.th,
              textAlign: 'center',
              marginTop: 10,
              marginBottom: 8,
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
            }}
          >
            {intelligence.contextLine}
          </div>

          <div
            style={{
              borderRadius: 13,
              padding: '10px 11px',
              background: chrome.panelSoft,
              border: `1px solid ${chrome.hairline}`,
              marginBottom: 9,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: chrome.faint,
                marginBottom: 5,
                textAlign: 'center',
              }}
            >
              Why this matters now
            </div>

            <div
              style={{
                fontSize: 15.5,
                fontWeight: 850,
                color: T.th,
                marginBottom: 4,
                textAlign: 'center',
                lineHeight: 1.24,
              }}
            >
              {intelligence.whyItMattersTitle}
            </div>

            <div
              style={{
                fontSize: 13.2,
                fontWeight: 500,
                color: chrome.muted,
                lineHeight: 1.48,
                textAlign: 'center',
              }}
            >
              {intelligence.whyItMattersBody}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              marginBottom: 9,
              borderRadius: 13,
              background: chrome.panelSoft,
              border: `1px solid ${chrome.hairline}`,
              overflow: 'hidden',
            }}
          >
            {intelligence.signals.map((signal, i) => (
              <SignalStat
                key={signal.label}
                T={T}
                label={signal.label}
                value={signal.value}
                divider={i < intelligence.signals.length - 1}
              />
            ))}
          </div>

          {party && idx !== -1 ? (
            <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
              <ActionButton
                T={T}
                variant="primary"
                onClick={() => {
                  haptic(6)
                  setCompareOpen(true)
                }}
              >
                Compare with…
              </ActionButton>
              <ActionButton
                T={T}
                variant="secondary"
                onClick={() => {
                  haptic(8)
                  nav('party', { idx, from: 'leaders' })
                }}
              >
                View party
              </ActionButton>
            </div>
          ) : null}

          {isSourcedLeader ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 8,
                paddingTop: 9,
                borderTop: `1px solid ${chrome.hairline}`,
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 850,
                  color: prev ? chrome.muted : 'transparent',
                  cursor: prev ? 'pointer' : 'default',
                  WebkitTapHighlightColor: 'transparent',
                  textAlign: 'left',
                }}
                onClick={() => {
                  if (!prev) return
                  haptic(6)
                  nav('leader', { lIdx: leaders.indexOf(prev), openTab: tab })
                }}
              >
                {prev ? (
                  <>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: chrome.faint,
                        marginBottom: 1,
                      }}
                    >
                      Above
                    </span>
                    <span>{shortName(prev.name)}</span>
                  </>
                ) : (
                  '•'
                )}
              </div>

              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.075em',
                  textTransform: 'uppercase',
                  color: chrome.faint,
                  whiteSpace: 'nowrap',
                }}
              >
                Sourced leaders
              </div>

              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 850,
                  color: next ? chrome.muted : 'transparent',
                  cursor: next ? 'pointer' : 'default',
                  WebkitTapHighlightColor: 'transparent',
                  textAlign: 'right',
                }}
                onClick={() => {
                  if (!next) return
                  haptic(6)
                  nav('leader', { lIdx: leaders.indexOf(next), openTab: tab })
                }}
              >
                {next ? (
                  <>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: chrome.faint,
                        marginBottom: 1,
                      }}
                    >
                      Below
                    </span>
                    <span>{shortName(next.name)}</span>
                  </>
                ) : (
                  '•'
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <StickyPillsBar T={T} pills={pills} tab={tab} setTab={setTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        <div
          style={{
            borderRadius: 14,
            padding: '18px',
            background: chrome.card,
            border: `1px solid ${chrome.border}`,
            marginBottom: 12,
          }}
        >
          <SectionLabel T={T}>
            {tab === 'bio' ? 'About' : pills.find((p) => p.key === tab)?.label || 'Detail'}
          </SectionLabel>

          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: chrome.muted,
              lineHeight: 1.7,
            }}
          >
            {tab === 'bio' ? l.bio : l[tab]}
          </div>
        </div>
      </div>

      <CompareLauncherSheet
        T={T}
        open={compareOpen}
        baseParty={party}
        parties={parties}
        contextArea={compareContextArea}
        fromScreen="leader"
        onClose={() => setCompareOpen(false)}
        onLaunch={openCompareWith}
      />
    </div>
  )
}
