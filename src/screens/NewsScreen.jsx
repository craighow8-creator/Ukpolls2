// ─────────────────────────────────────────────────────────────────
// NewsScreen.jsx
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea, StickyPills, haptic } from '../components/ui'
import { InfoButton } from '../components/InfoGlyph'

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

export function NewsScreen({ T, nav }) {
  const [tab, setTab] = useState('all')

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
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: T.tl }}>
            Ranked by coverage · recency first
          </div>

          <InfoButton id="news_feed" T={T} size={18} />
        </div>
      </div>

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