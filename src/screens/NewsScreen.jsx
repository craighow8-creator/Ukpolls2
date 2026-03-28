// ─────────────────────────────────────────────────────────────────
// NewsScreen.jsx
// ─────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea, StickyPills, haptic } from '../components/ui'

const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

const NEWS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'polls', label: 'Polls' },
  { key: 'parties', label: 'Parties' },
  { key: 'elections', label: 'Elections' },
]

const FALLBACK_NEWS = [
  { title: 'Reform UK maintains 27% poll lead for third consecutive week', source: 'Politiscope', time: '2h ago', category: 'polls', url: '#', color: '#12B7D4' },
  { title: 'Runcorn & Helsby by-election: Reform wins by just 6 votes in historic upset', source: 'BBC News', time: '3h ago', category: 'elections', url: 'https://bbc.co.uk', color: '#E4003B' },
  { title: 'Keir Starmer faces Labour backbench revolt over welfare cuts', source: 'Guardian', time: '5h ago', category: 'parties', url: '#', color: '#E4003B' },
  { title: 'Green Party surges to 16% in latest YouGov poll — highest ever', source: 'YouGov', time: '6h ago', category: 'polls', url: '#', color: '#02A95B' },
  { title: 'Kemi Badenoch unveils Conservative immigration plan ahead of May elections', source: 'Telegraph', time: '8h ago', category: 'parties', url: '#', color: '#0087DC' },
  { title: 'Scottish Parliament election: SNP vs Labour battleground intensifies', source: 'The Scotsman', time: '10h ago', category: 'elections', url: '#', color: '#C4922A' },
  { title: 'Lib Dems ahead in Horsham by-election betting markets', source: 'Oddschecker', time: '12h ago', category: 'elections', url: '#', color: '#FAA61A' },
  { title: 'Net migration falls to 204,000 — lowest since 2021', source: 'ONS', time: '1d ago', category: 'polls', url: '#', color: '#12B7D4' },
  { title: 'Nigel Farage: Reform will win more than 100 councils in May local elections', source: 'Times', time: '1d ago', category: 'elections', url: '#', color: '#12B7D4' },
  { title: 'PMQs: Starmer and Farage clash over NHS waiting times', source: 'Parliament TV', time: '2d ago', category: 'parties', url: '#', color: '#E4003B' },
  { title: 'Gorton & Denton Green MP calls for proportional representation', source: 'Green Party', time: '2d ago', category: 'parties', url: '#', color: '#02A95B' },
  { title: 'New MRP poll: Reform projected 335 seats if election held now', source: 'Electoral Calculus', time: '3d ago', category: 'polls', url: '#', color: '#12B7D4' },
]

function NewsCard({ T, item, big }) {
  const tappable = item.url && item.url !== '#'

  return (
    <motion.div
      {...TAP}
      onClick={() => {
        if (!tappable) return
        haptic(6)
        window.open(item.url, '_blank')
      }}
      style={{
        borderRadius: big ? 16 : 14,
        padding: big ? '16px' : '12px 14px',
        marginBottom: big ? 12 : 8,
        background: T.c0 || '#fff',
        border: `1px solid ${item.color || T.pr}28`,
        cursor: tappable ? 'pointer' : 'default',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {big && (
        <div
          style={{
            height: 3,
            background: item.color || T.pr,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        />
      )}

      <div style={{ paddingTop: big ? 8 : 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: big ? 8 : 5,
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: item.color || T.pr,
              background: `${item.color || T.pr}1e`,
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            {item.category}
          </span>

          <span style={{ fontSize: 13, fontWeight: 500, color: T.tl, flexShrink: 0 }}>{item.time}</span>
        </div>

        <div
          style={{
            fontSize: big ? 15 : 14,
            fontWeight: 700,
            color: T.th,
            lineHeight: 1.45,
            marginBottom: 5,
          }}
        >
          {item.title}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
          {item.source}
          {tappable ? ' ↗' : ''}
        </div>
      </div>
    </motion.div>
  )
}

const NEWS_SOURCES = [
  { name: 'BBC News', lean: 'Centre', color: '#c8102e', desc: 'Public broadcaster. Largest reach in UK. Required to be impartial.' },
  { name: 'Sky News', lean: 'Centre', color: '#0075c9', desc: 'Largest UK commercial news channel. Generally centrist.' },
  { name: 'The Guardian', lean: 'Left', color: '#002147', desc: 'Centre-left. Strong on environment and social policy.' },
  { name: 'GB News', lean: 'Right', color: '#f97316', desc: 'Right-leaning broadcaster. Launched 2021. Pro-Brexit.' },
  { name: 'The Independent', lean: 'Centre', color: '#e20a16', desc: 'Online-only. Centre-left on social issues, liberal on economics.' },
  { name: 'The Times', lean: 'Centre', color: '#c8102e', desc: 'Traditionally centre-right. Now behind paywall (articles may be limited).' },
  { name: 'LabourList', lean: 'Left', color: '#E4003B', desc: 'Labour-focused commentary. Holds Labour to account from the left.' },
  { name: 'ConservativeHome', lean: 'Right', color: '#0087DC', desc: 'Grassroots Conservative website. Scrutinises party from the right.' },
]

const LEAN_COLOR = { Left: '#E4003B', Centre: '#FAA61A', Right: '#0087DC' }

function NewsInfoSheet({ T, onClose }) {
  const [dragY, setDragY] = useState(0)
  const touchStartY = useRef(null)

  const startDrag = (clientY) => {
    touchStartY.current = clientY
  }

  const moveDrag = (clientY) => {
    if (touchStartY.current == null) return
    const delta = clientY - touchStartY.current
    setDragY(delta > 0 ? delta : 0)
  }

  const endDrag = () => {
    if (dragY > 110) {
      haptic(6)
      onClose()
    } else {
      setDragY(0)
    }
    touchStartY.current = null
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: T.sf,
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxHeight: '90dvh',
          overflowY: 'auto',
          padding: '20px 18px calc(32px + env(safe-area-inset-bottom))',
          transform: `translateY(${dragY}px)`,
          transition: touchStartY.current == null ? 'transform 0.18s ease' : 'none',
          touchAction: 'none',
        }}
        onTouchStart={(e) => startDrag(e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientY)}
        onTouchEnd={endDrag}
        onMouseDown={(e) => startDrag(e.clientY)}
        onMouseMove={(e) => {
          if (touchStartY.current == null) return
          moveDrag(e.clientY)
        }}
        onMouseUp={endDrag}
        onMouseLeave={() => {
          if (touchStartY.current != null) endDrag()
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 999,
            background: T.tl,
            opacity: 0.3,
            margin: '0 auto 20px',
            cursor: 'grab',
          }}
        />

        <div style={{ fontSize: 20, fontWeight: 800, color: T.th, marginBottom: 4 }}>About this news feed</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, marginBottom: 16 }}>
          How it works and what we include
        </div>

        <div
          style={{
            borderRadius: 14,
            padding: '14px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: T.pr,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            How stories are ranked
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.7 }}>
            Stories are ranked by how many outlets cover them. If BBC, GB News, Guardian and Sky News all run the
            same story, it scores highly. A story only one outlet covers ranks lower. Recency breaks ties. No human
            editorial decisions are made.
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: T.tl,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 10,
          }}
        >
          Sources ({NEWS_SOURCES.length})
        </div>

        {NEWS_SOURCES.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 0',
              borderBottom:
                i < NEWS_SOURCES.length - 1 ? `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` : 'none',
            }}
          >
            <div style={{ width: 3, borderRadius: 99, alignSelf: 'stretch', background: s.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{s.name}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 99,
                    background: `${LEAN_COLOR[s.lean]}18`,
                    color: LEAN_COLOR[s.lean],
                  }}
                >
                  {s.lean}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}

        <div
          style={{
            borderRadius: 14,
            padding: '14px',
            background: T.c0,
            border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
            marginTop: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: T.tl,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            Why no Telegraph, Mail, Times?
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.7 }}>
            The Telegraph, Daily Mail and Times actively block automated server requests — a technical decision on
            their end. X/Twitter restricted API access in 2023 at ~$100/month. Not viable for a free app.
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 999,
            border: 'none',
            background: T.c1 || 'rgba(0,0,0,0.07)',
            color: T.th,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Outfit,sans-serif',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export function NewsScreen({ T, nav }) {
  const [tab, setTab] = useState('all')
  const [infoOpen, setInfoOpen] = useState(false)

  const news = FALLBACK_NEWS
  const filtered = tab === 'all' ? news : news.filter((n) => n.category === tab)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: T.sf,
      }}
    >
      <div style={{ padding: '18px 18px 0', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: -0.8,
            color: T.th,
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          News
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl }}>
            Ranked by coverage · recency first
          </div>

          <button
            onClick={() => {
              haptic(6)
              setInfoOpen(true)
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              color: T.tl,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ℹ
          </button>
        </div>
      </div>

      {infoOpen && <NewsInfoSheet T={T} onClose={() => setInfoOpen(false)} />}

      <StickyPills pills={NEWS_TABS} active={tab} onSelect={setTab} T={T} />

      <ScrollArea>
        {filtered[0] && <NewsCard T={T} item={filtered[0]} big />}

        {filtered.slice(1).map((item, i) => (
          <NewsCard key={i} T={T} item={item} big={false} />
        ))}

        <div
          style={{
            textAlign: 'center',
            padding: '10px 0 16px',
            fontSize: 13,
            fontWeight: 500,
            color: T.tl,
          }}
        >
          News is curated · use AI Briefing for live analysis
        </div>

        <div style={{ height: 40 }} />
      </ScrollArea>
    </div>
  )
}

export default NewsScreen