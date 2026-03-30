import { useEffect, useState } from 'react'
import { StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'
import { API_BASE } from '../constants'

const TABS = [
  { key: 'howworks', label: 'How it Works' },
  { key: 'voting', label: 'Voting System' },
  { key: 'keydates', label: 'Key Dates' },
  { key: 'live', label: 'Parliament Live' },
]

const KEY_DATES = [
  {
    date: '7 May 2026',
    label: 'Local & Devolved Elections',
    color: '#E4003B',
    desc: 'English council elections, Scottish Parliament, Senedd, mayoral elections across England.',
  },
  {
    date: 'May 2026',
    label: 'Horsham By-Election (TBC)',
    color: '#0087DC',
    desc: 'Conservative defending a 3,027 majority. Three-way fight: LD, Reform and Con all competitive.',
  },
  {
    date: 'Every Wednesday',
    label: 'PMQs · 12:00–12:30',
    color: '#012169',
    desc: "Prime Minister's Questions. The most watched event in UK politics. Commons chamber, Sky News and BBC Parliament live.",
  },
  {
    date: 'Every Tuesday',
    label: 'Cabinet Meeting',
    color: '#012169',
    desc: 'Senior government ministers meet to discuss policy. Rarely reported in real time but leaks often follow.',
  },
  {
    date: 'Jun 2026',
    label: 'NATO Summit',
    color: '#1a4a9e',
    desc: 'Starmer will face scrutiny over UK defence spending pledges and US-UK relations after Iran strike fallout.',
  },
  {
    date: 'Autumn 2026',
    label: 'Spending Review',
    color: '#02A95B',
    desc: 'Government sets departmental budgets for the Parliament. Will define whether Labour can fund NHS and housing pledges.',
  },
  {
    date: 'Before May 2029',
    label: 'Next General Election',
    color: '#12B7D4',
    desc: 'Must be held by 2 May 2029. Electoral Calculus currently projects a Reform UK majority if held today.',
  },
]

const HOW_WORKS = [
  {
    title: 'The House of Commons',
    icon: '🏛',
    body: 'The Commons has 650 elected MPs. The party (or coalition) with the most MPs forms the government. The Prime Minister is whoever commands a majority in the Commons — not directly elected by the public. MPs debate and vote on laws (Bills). The government controls the timetable, meaning it decides what gets debated.',
  },
  {
    title: 'The House of Lords',
    icon: '🎩',
    body: 'The Lords has around 800 unelected members — life peers appointed by the Crown on advice of the PM, 26 Church of England bishops, and 92 hereditary peers. Lords can delay and amend legislation but cannot permanently block it. The Commons always has the final word under the Parliament Acts 1911 and 1949.',
  },
  {
    title: 'How a Bill becomes Law',
    icon: '📜',
    body: "1. First Reading — the Bill is introduced, no debate.\n2. Second Reading — the main debate on the Bill's principles.\n3. Committee Stage — line-by-line scrutiny, amendments proposed.\n4. Report Stage — further amendments considered.\n5. Third Reading — final vote in the Commons.\n6. Same process repeated in the Lords.\n7. Royal Assent — the monarch formally signs the Bill into law.",
  },
  {
    title: "PMQs — Prime Minister's Questions",
    icon: '🎤',
    body: 'Every Wednesday from 12:00–12:30 when Parliament is sitting. The Leader of the Opposition gets 6 questions. Any MP can ask a question. The PM answers without advance notice of questions. It is broadcast live on BBC Parliament and Parliament TV. It is highly theatrical and rarely changes policy — but it shapes the news cycle.',
  },
  {
    title: 'The Opposition',
    icon: '⚔️',
    body: `The largest party not in government forms "His Majesty's Official Opposition." Their leader becomes Leader of the Opposition and has a salary and official residence (Chevening). The Shadow Cabinet mirrors the Cabinet, with each Shadow Minister scrutinising their counterpart. Reform UK are now the Official Opposition in Parliament.`,
  },
  {
    title: 'Confidence Votes',
    icon: '⚠️',
    body: 'If a government loses a vote of no confidence, the Prime Minister must either resign or call a general election. The Fixed Term Parliaments Act 2011 was repealed in 2022, so the PM can now call an early election at any time — but must advise the King, who grants or refuses dissolution. In practice, dissolution is always granted.',
  },
]

const VOTING_SYSTEM = [
  {
    title: 'First Past the Post (FPTP)',
    icon: '🗳',
    body: "The UK uses FPTP for Westminster elections. Each constituency elects one MP — whoever gets the most votes wins, even if that's only 30%. There is no minimum threshold. This massively favours large established parties. In 2024, Labour won 63% of seats with just 34% of votes. Reform UK won 4 seats with 14% of votes — fewer seats than the Lib Dems who got 12%.",
  },
  {
    title: 'Why is this controversial?',
    icon: '⚖️',
    body: `FPTP creates "safe seats" where millions of votes are effectively wasted. It rewards geographically concentrated support (SNP, Lib Dems) over nationally spread support (Reform, Greens). Tactical voting becomes rational — voting for your second choice to keep out your least-preferred party. Nearly 70% of votes in 2024 did not directly elect an MP.`,
  },
  {
    title: 'Proportional Representation',
    icon: '📊',
    body: "PR systems allocate seats in proportion to votes received. Scotland uses the Additional Member System (AMS) for Holyrood — a mix of FPTP and regional lists. The Senedd (Wales) uses d'Hondt PR. European Parliament elections used PR until Brexit. Under PR in 2024, Reform UK would have won around 100 seats, Greens 50+, Labour around 220.",
  },
  {
    title: 'How Swing is Calculated',
    icon: '🔄',
    body: 'Swing measures how much support has shifted between parties. The traditional "two-party swing" (Butler swing) calculates: (Party A gain + Party B loss) ÷ 2. Example: if Reform gains 10pts and Labour loses 10pts, the swing is 10pts Reform. Modern MRP models use multilevel regression to project seats from national polling.',
  },
  {
    title: 'Tactical Voting',
    icon: '🎯',
    body: `In FPTP, voting for a candidate who cannot win in your constituency is often called a "wasted vote." Many voters choose the most viable party that shares their broad preferences. In 2024, co-ordinated tactical voting by "stop Reform" or "stop Labour" voters significantly altered results in marginal seats. Apps like Best for Britain publish tactical voting guides.`,
  },
  {
    title: 'Electoral Calculus & MRP',
    icon: '🤖',
    body: 'Multi-level Regression and Poststratification (MRP) uses national polling data plus demographic and past-election data to model how each constituency might vote. Electoral Calculus currently projects Reform UK 335 seats — a majority. These projections are more accurate than uniform national swing models but still carry wide uncertainty ranges 3 years before an election.',
  },
]

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

function ScrollAwayHeader({ T }) {
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
        <Badge color={T.tl} subtle>Lords · live proceedings</Badge>
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

export default function ParliamentScreen({ T }) {
  const [tab, setTab] = useState('howworks')
  const [video, setVideo] = useState(null)
  const [videoError, setVideoError] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)

  useEffect(() => {
    if (tab !== 'live') return

    let cancelled = false

    async function loadVideo() {
      setVideoLoading(true)
      setVideoError('')

      try {
        const res = await fetch(`${API_BASE}/api/parliament-video`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || 'Could not load Parliament video')
        }

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
      <ScrollAwayHeader T={T} />
      <StickyPillsBar T={T} tab={tab} setTab={setTab} />

      <div style={{ padding: '12px 16px 40px' }}>
        {tab === 'howworks' ? (
          <>
            <SectionLabel T={T}>How Parliament works</SectionLabel>
            {HOW_WORKS.map((item, i) => (
              <ExplainerCard key={i} T={T} item={item} />
            ))}
          </>
        ) : null}

        {tab === 'voting' ? (
          <>
            <SectionLabel T={T}>Voting system</SectionLabel>
            {VOTING_SYSTEM.map((item, i) => (
              <ExplainerCard key={i} T={T} item={item} />
            ))}
          </>
        ) : null}

        {tab === 'keydates' ? (
          <>
            <SectionLabel T={T}>Political calendar</SectionLabel>

            {KEY_DATES.map((d, i) => {
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

            <LiveLinkCard
              T={T}
              title="Watch House of Commons"
              desc="Open the official Commons live page in a full browser tab."
              color="#C8102E"
              cta="Open Commons"
              emoji="🏛"
              onClick={() => openExternal('https://www.parliamentlive.tv/Commons')}
            />

            <LiveLinkCard
              T={T}
              title="Watch UK Parliament on YouTube"
              desc="Use the official YouTube channel for live streams, replays and clips."
              color="#E4003B"
              cta="Open YouTube channel"
              emoji="▶️"
              onClick={() => openExternal('https://www.youtube.com/@UKParliament')}
            />

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

              {[
                { day: 'Monday', commons: '14:30–22:30' },
                { day: 'Tuesday', commons: '11:30–19:00' },
                { day: 'Wednesday', commons: '11:30–19:00 · PMQs 12:00' },
                { day: 'Thursday', commons: '09:30–17:30' },
                { day: 'Friday', commons: '09:30–14:30 (when sitting)' },
              ].map((r, i) => (
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