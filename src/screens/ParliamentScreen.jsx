import React, { useState, useEffect } from 'react'
import { StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { API_BASE } from '../constants'
import { parseJsonResponse } from '../utils/http'

const TABS = [
  { key: 'howworks', label: 'How it Works' },
  { key: 'voting', label: 'Voting System' },
  { key: 'keydates', label: 'Key Dates' },
  { key: 'live', label: 'Parliament Live' },
]


const FALLBACK_PARLIAMENT_FACTS = {
  verifiedAt: '2026-04-14',
  sourceType: 'Official UK Parliament / Electoral Commission',
  governmentParty: 'Labour',
  primeMinister: 'Keir Starmer',
  officialOppositionParty: 'Conservative',
  leaderOfOpposition: 'Kemi Badenoch',
  houseOfCommonsSeats: 650,
  pmqsDay: 'Every Wednesday',
  pmqsTime: '12:00–12:30',
  oppositionSourceUrl: 'https://members.parliament.uk/opposition/cabinet',
  pmqsSourceUrl: 'https://www.parliament.uk/site-information/glossary/prime-ministers-question-time/',
  nextGeneralElectionDeadline: '2029-08-15',
  nextGeneralElectionSourceUrl: 'https://www.electoralcommission.org.uk/about-us/our-plans-priorities-and-spending/corporate-plan-2025/6-2029/30/our-future-priorities',
}

function buildFallbackParliament(meta = {}) {
  const facts = { ...FALLBACK_PARLIAMENT_FACTS }
  const nextElectionDate = meta?.nextElectionDate || '2026-05-07'
  const nextElectionLabel = meta?.nextElectionLabel || 'Local + Devolved Elections'

  return {
    facts,
    keyDates: [
      {
        date: nextElectionDate,
        label: nextElectionLabel,
        color: '#E4003B',
        desc: 'Major scheduled election day across England, Scotland and Wales.',
      },
      {
        date: facts.pmqsDay,
        label: `PMQs · ${facts.pmqsTime}`,
        color: '#012169',
        desc: "Prime Minister's Questions in the Commons chamber when Parliament is sitting.",
      },
      {
        date: facts.nextGeneralElectionDeadline,
        label: 'Latest possible next General Election',
        color: '#12B7D4',
        desc: 'The next UK Parliamentary general election must be held no later than 15 August 2029.',
      },
    ],
    howWorks: [
      {
        title: 'The House of Commons',
        icon: '🏛',
        body: `The Commons has ${facts.houseOfCommonsSeats} elected MPs. The party or coalition that can command a majority in the Commons forms the government. The Prime Minister is the person who can command that majority — not a directly elected president.`,
      },
      {
        title: 'The House of Lords',
        icon: '🎩',
        body: 'The Lords is the revising chamber. It can scrutinise, amend and delay legislation, but the Commons has the final say.',
      },
      {
        title: 'How a Bill becomes Law',
        icon: '📜',
        body: "1. First Reading — the Bill is introduced, no debate.\n2. Second Reading — the main debate on the Bill's principles.\n3. Committee Stage — line-by-line scrutiny, amendments proposed.\n4. Report Stage — further amendments considered.\n5. Third Reading — final vote in the Commons.\n6. Same process repeated in the Lords.\n7. Royal Assent — the monarch formally signs the Bill into law.",
      },
      {
        title: "PMQs — Prime Minister's Questions",
        icon: '🎤',
        body: `${facts.pmqsDay} from ${facts.pmqsTime} when Parliament is sitting. The Leader of the Opposition gets 6 questions. Any MP can ask a question. It shapes the media cycle far more often than it changes policy.`,
      },
      {
        title: 'The Opposition',
        icon: '⚔️',
        body: `The largest party not in government forms His Majesty's Official Opposition. Their leader becomes Leader of the Opposition and leads the Shadow Cabinet. The current Official Opposition is the ${facts.officialOppositionParty}, led by ${facts.leaderOfOpposition}.`,
      },
      {
        title: 'Confidence and Dissolution',
        icon: '⚠️',
        body: 'If a government loses the confidence of the House of Commons, the Prime Minister may have to resign or seek a general election. Under the Dissolution and Calling of Parliament Act 2022, general elections must be no more than five years apart.',
      },
    ],
    votingSystem: [
      {
        title: 'First Past the Post (FPTP)',
        icon: '🗳',
        body: "Each constituency elects one MP, and the candidate with the most votes wins. There is no proportional correction, so seat totals can diverge sharply from vote share.",
      },
      {
        title: 'Why is this controversial?',
        icon: '⚖️',
        body: 'FPTP rewards concentrated support, creates safe seats and encourages tactical voting. It can produce strong Commons majorities from relatively modest national vote shares.',
      },
      {
        title: 'Proportional Representation',
        icon: '📊',
        body: 'PR systems allocate seats more closely in line with votes cast. Westminster does not use PR, but other UK elections do use more proportional systems.',
      },
      {
        title: 'How Swing is Calculated',
        icon: '🔄',
        body: 'Traditional two-party swing is calculated as: (Party A gain + Party B loss) ÷ 2. Modern models often combine polling, demographics and constituency history instead.',
      },
      {
        title: 'Tactical Voting',
        icon: '🎯',
        body: 'In FPTP, voters often back the most viable candidate who can beat the party they most want to stop, rather than simply voting for their first preference.',
      },
      {
        title: 'MRP and seat models',
        icon: '🤖',
        body: 'MRP uses polling plus demographic and geographic data to estimate constituency outcomes. It is usually stronger than a simple uniform national swing model, but it is still probabilistic rather than certain.',
      },
    ],
    sittingPattern: [
      { day: 'Monday', commons: '14:30–22:30' },
      { day: 'Tuesday', commons: '11:30–19:00' },
      { day: 'Wednesday', commons: '11:30–19:00 · PMQs 12:00' },
      { day: 'Thursday', commons: '09:30–17:30' },
      { day: 'Friday', commons: '09:30–14:30 (when sitting)' },
    ],
    liveLinks: [
      {
        title: 'Watch House of Commons',
        desc: 'Open the official Commons live page in a full browser tab.',
        color: '#C8102E',
        cta: 'Open Commons',
        emoji: '🏛',
        url: 'https://www.parliamentlive.tv/Commons',
      },
      {
        title: 'Watch UK Parliament on YouTube',
        desc: 'Use the official YouTube channel for live streams, replays and clips.',
        color: '#E4003B',
        cta: 'Open YouTube channel',
        emoji: '▶️',
        url: 'https://www.youtube.com/@UKParliament',
      },
    ],
  }
}

function mergeParliamentData(parliament = {}, meta = {}) {
  const fallback = buildFallbackParliament(meta)
  return {
    ...fallback,
    ...parliament,
    facts: { ...fallback.facts, ...(parliament?.facts || {}) },
    keyDates: Array.isArray(parliament?.keyDates) && parliament.keyDates.length ? parliament.keyDates : fallback.keyDates,
    howWorks: Array.isArray(parliament?.howWorks) && parliament.howWorks.length ? parliament.howWorks : fallback.howWorks,
    votingSystem: Array.isArray(parliament?.votingSystem) && parliament.votingSystem.length ? parliament.votingSystem : fallback.votingSystem,
    sittingPattern: Array.isArray(parliament?.sittingPattern) && parliament.sittingPattern.length ? parliament.sittingPattern : fallback.sittingPattern,
    liveLinks: Array.isArray(parliament?.liveLinks) && parliament.liveLinks.length ? parliament.liveLinks : fallback.liveLinks,
  }
}

function getOppositionMetaLine(facts = {}) {
  const source = facts?.officialOppositionParty && facts?.leaderOfOpposition
    ? `${facts.officialOppositionParty} · ${facts.leaderOfOpposition}`
    : ''
  const verified = facts?.verifiedAt ? `Verified ${facts.verifiedAt}` : ''
  return [source, verified].filter(Boolean).join(' · ')
}

function Badge({ children, color, subtle = false }) {
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
        color,
        background: subtle ? `${color}12` : `${color}1F`,
        border: `1px solid ${color}2B`,
        borderRadius: 999,
        padding: '4px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function SectionLabel({ children, T }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: T.tl,
        marginBottom: 10,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

function ScrollAwayHeader({ T, facts = {} }) {
  return (
    <div style={{ padding: '8px 16px 10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <Badge color={T.pr}>Commons</Badge>
        <Badge color={T.tl} subtle>{facts?.officialOppositionParty ? `Opposition · ${facts.officialOppositionParty}` : 'Lords · live proceedings'}</Badge>
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
          color: T.th,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        Parliament
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
          width: '100%',
          marginTop: 6,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
          Commons · Lords · voting system · live proceedings
        </div>
        <InfoButton id="parliament_overview" T={T} size={20} />
      </div>
      {getOppositionMetaLine(facts) ? (
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.tl, opacity: 0.9, textAlign: 'center', marginTop: 8, lineHeight: 1.45 }}>
          {getOppositionMetaLine(facts)}
        </div>
      ) : null}
    </div>
  )
}

function StickyPillsBar({ T, tab, setTab }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8,
        background: T.sf,
        padding: '8px 16px 10px',
        borderBottom: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T} />
    </div>
  )
}

function ExplainerCard({ T, item }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      onClick={() => {
        haptic(4)
        setOpen((o) => !o)
      }}
      style={{
        borderRadius: 14,
        marginBottom: 8,
        overflow: 'hidden',
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.th, lineHeight: 1.3 }}>
          {item.title}
        </div>
        <div
          style={{
            fontSize: 18,
            color: T.tl,
            flexShrink: 0,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          ›
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: T.tm,
              lineHeight: 1.75,
              marginTop: 12,
              whiteSpace: 'pre-line',
            }}
          >
            {item.body}
          </div>
        </div>
      )}
    </div>
  )
}

function daysFrom(dateStr) {
  try {
    if (!dateStr.match(/^\d{1,2}\s\w+\s\d{4}/) && !dateStr.match(/^\d{4}/)) return null
    const parts = dateStr.split(' ')
    if (parts.length < 3) return null
    const d = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`)
    const diff = Math.ceil((d - new Date()) / 86400000)
    return diff > 0 ? diff : null
  } catch {
    return null
  }
}

function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function LiveLinkCard({ T, title, desc, color, cta, onClick, emoji }) {
  return (
    <div
      onClick={() => {
        haptic(6)
        onClick()
      }}
      style={{
        borderRadius: 14,
        padding: '16px',
        marginBottom: 10,
        background: T.c0,
        border: `1px solid ${color}28`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.th, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.6 }}>{desc}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 10 }}>{cta} →</div>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ T, video }) {
  if (!video?.videoId) return null

  const src = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&cc_load_policy=1&playsinline=1&rel=0`

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 12,
        background: T.c0,
        border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ padding: '14px 16px 0', fontSize: 15, fontWeight: 800, color: T.th }}>
        {video.isLive ? 'UK Parliament live' : 'Latest UK Parliament video'}
      </div>

      <div
        style={{
          padding: '6px 16px 12px',
          fontSize: 13,
          fontWeight: 500,
          color: T.tl,
          lineHeight: 1.6,
        }}
      >
        {video.title}
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: '#000',
        }}
      >
        <iframe
          src={src}
          title={video.title || 'UK Parliament video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          padding: '12px 16px 14px',
          fontSize: 13,
          fontWeight: 700,
          color: T.tl,
          flexWrap: 'wrap',
        }}
      >
        <span>{video.isLive ? 'Source: live stream' : 'Source: latest upload'}</span>
        {video.publishedAt ? (
          <span>{new Date(video.publishedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        ) : null}
      </div>
    </div>
  )
}

export default function ParliamentScreen({ T, parliament = {}, meta = {} }) {
  const [tab, setTab] = useState('howworks')
  const [video, setVideo] = useState(null)
  const [videoError, setVideoError] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)
  const parliamentData = React.useMemo(() => mergeParliamentData(parliament, meta), [parliament, meta])
  const facts = parliamentData?.facts || {}

  useEffect(() => {
    if (tab !== 'live') return

    let cancelled = false

    async function loadVideo() {
      setVideoLoading(true)
      setVideoError('')

      try {
        const res = await fetch(`${API_BASE}/api/parliament-video`)
        const data = await parseJsonResponse(res, 'Parliament video')

        if (!cancelled) {
          setVideo(data)
        }
      } catch (err) {
        if (!cancelled) {
          setVideo(null)
          setVideoError(err instanceof Error ? err.message : 'Could not load Parliament video')
        }
      } finally {
        if (!cancelled) {
          setVideoLoading(false)
        }
      }
    }

    loadVideo()

    return () => {
      cancelled = true
    }
  }, [tab])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: T.sf,
      }}
    >
      <ScrollAwayHeader T={T} facts={facts} />
      <StickyPillsBar T={T} tab={tab} setTab={setTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {tab === 'howworks' ? (
          <>
            <SectionLabel T={T}>How Parliament works</SectionLabel>
            {parliamentData.howWorks.map((item, i) => (
              <ExplainerCard key={i} T={T} item={item} />
            ))}
            {facts?.oppositionSourceUrl ? (
              <div style={{ fontSize: 12, fontWeight: 700, color: T.tl, lineHeight: 1.5, textAlign: 'center', marginTop: 10 }}>
                Official Opposition source · {facts.oppositionSourceUrl}
              </div>
            ) : null}
          </>
        ) : null}

        {tab === 'voting' ? (
          <>
            <SectionLabel T={T}>Voting system</SectionLabel>
            {parliamentData.votingSystem.map((item, i) => (
              <ExplainerCard key={i} T={T} item={item} />
            ))}
          </>
        ) : null}

        {tab === 'keydates' ? (
          <>
            <SectionLabel T={T}>Political calendar</SectionLabel>

            {parliamentData.keyDates.map((d, i) => {
              const days = daysFrom(d.date)
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 14,
                    padding: '14px 16px',
                    marginBottom: 8,
                    background: T.c0,
                    border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      borderRadius: 99,
                      alignSelf: 'stretch',
                      background: d.color,
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        marginBottom: 3,
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{d.label}</div>
                      {days ? (
                        <div style={{ fontSize: 14, fontWeight: 800, color: d.color, flexShrink: 0 }}>
                          {days}d
                        </div>
                      ) : null}
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: d.color, marginBottom: 5 }}>{d.date}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.6 }}>{d.desc}</div>
                  </div>
                </div>
              )
            })}
          </>
        ) : null}

        {tab === 'live' ? (
          <>
            <SectionLabel T={T}>Parliament live</SectionLabel>

            {videoLoading ? (
              <div
                style={{
                  borderRadius: 14,
                  padding: '16px',
                  marginBottom: 12,
                  background: T.c0,
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                  fontSize: 14,
                  fontWeight: 500,
                  color: T.tl,
                }}
              >
                Loading latest Parliament video…
              </div>
            ) : null}

            {!videoLoading && video ? <VideoCard T={T} video={video} /> : null}

            {!videoLoading && videoError ? (
              <div
                style={{
                  borderRadius: 14,
                  padding: '16px',
                  marginBottom: 12,
                  background: T.c0,
                  border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: T.th, marginBottom: 6 }}>
                  Video unavailable
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.65 }}>
                  {videoError}
                </div>
              </div>
            ) : null}
            {parliamentData.liveLinks.map((link) => (
              <LiveLinkCard
                key={link.title}
                T={T}
                title={link.title}
                desc={link.desc}
                color={link.color}
                cta={link.cta}
                emoji={link.emoji}
                onClick={() => openExternal(link.url)}
              />
            ))}


            <div
              style={{
                borderRadius: 14,
                padding: '14px 16px',
                background: T.c0,
                border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: T.th, marginBottom: 8 }}>
                When does Parliament sit?
              </div>

              {parliamentData.sittingPattern.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: i < 4 ? `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` : 'none',
                  }}
                >
                  <div style={{ width: 80, fontSize: 13, fontWeight: 700, color: T.tl }}>{r.day}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.tm }}>{r.commons}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}


