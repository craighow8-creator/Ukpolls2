import { useState, useRef, useEffect } from 'react'
import { haptic } from '../components/ui'

// Info content — explanations for every data point in the app
export const INFO = {
  mrp: {
    title: 'MRP Seat Projection',
    body: `MRP stands for Multilevel Regression and Post-stratification. It's a statistical technique that combines national polling data with constituency-level demographic information to estimate how each of the 650 seats might vote.

Unlike a simple uniform national swing (which assumes every seat moves by the same amount), MRP accounts for local differences — a seat with many young renters responds differently to polling shifts than a rural seat with many homeowners.

The projections shown are indicative estimates based on current polling averages. Actual results would depend on local campaigns, tactical voting, and turnout.`,
    source: 'Based on BPC polling average',
  },
  net_approval: {
    title: 'Net Approval Rating',
    body: `Net approval = % who approve minus % who disapprove.

A score of +6 means 6% more people approve than disapprove. A score of -42 means 42% more disapprove than approve.

These figures come from the Ipsos Political Monitor, which has tracked leader approval monthly since 1977 — making it the longest-running measure of UK leader popularity. A nationally representative sample of ~1,000 adults is surveyed each month.`,
    source: 'Ipsos Political Monitor · Monthly',
  },
  poll_average: {
    title: '7-Poll Average',
    body: `The headline polling figure is a simple average of the seven most recent published polls from BPC (British Polling Council) member pollsters.

BPC members are required to publish their full data tables, including methodology, weighting, and fieldwork dates. This transparency requirement distinguishes them from non-member polls.

Current pollsters included: YouGov, Savanta, Opinium, Redfield & Wilton, More in Common, Techne, and BMG Research.

All polls use some form of likelihood to vote weighting. Fieldwork is typically conducted online over 2-4 days.`,
    source: 'BPC member polls · 7-poll rolling average',
  },
  news_feed: {
    title: 'About this news feed',
    body: `Stories are ranked by how many outlets cover them. If BBC, GB News, Guardian and Sky News all run the same story, it scores highly. A story only one outlet covers ranks lower. Recency breaks ties.

Sources include a mix of broadcasters, newspapers, and party-adjacent political outlets. Some outlets such as the Telegraph, Daily Mail and Times restrict automated access, so coverage can never be fully universal.

This feed is designed as a fast political briefing layer, not a complete substitute for reading full source reporting.`,
    source: 'Ranked by coverage · recency first',
  },
  betting_odds: {
    title: 'Betting Odds & Implied Probability',
    body: `Betting odds represent the bookmaker's assessment of probability, adjusted for their margin (the "overround").

To convert fractional odds to implied probability:
• 6/4 odds → probability = 4 ÷ (6+4) = 40%
• 2/1 odds → probability = 1 ÷ (2+1) = 33%
• 1/2 odds → probability = 2 ÷ (1+2) = 67%

Because bookmakers build in a profit margin, the implied probabilities across all outcomes sum to more than 100%. The shown probabilities are raw implied values before removing the overround.

Betting markets can reflect information not captured in polls — including political intelligence, market positioning, and punter sentiment.`,
    source: 'Oddschecker · Updated daily',
  },
  fptp: {
    title: 'Why Votes ≠ Seats',
    body: `The UK uses First Past The Post (FPTP) voting. In each of the 650 constituencies, the candidate with the most votes wins — even if that's just 30% of local votes. The total national vote share is irrelevant to who wins.

This produces dramatic disproportionality:
• In 2024, Labour won 63% of seats with 34% of votes
• Reform won 0.8% of seats with 14% of votes
• The Greens won 4 seats with 7% of votes; the SNP won 9 seats with 2.5% of votes

Under proportional representation, a party with 27% of votes would win roughly 176 seats. Under FPTP at current polling, the same 27% could win 335 seats — because Reform's support is spread across marginal seats where Labour previously had thin majorities.`,
    source: 'Electoral Reform Society analysis',
  },
  migration_net: {
    title: 'What is Net Migration?',
    body: `Net migration = people arriving in the UK minus people leaving the UK, over a 12-month period.

"Arrivals" includes: international students, work visa holders, family reunion cases, asylum seekers, and returning UK citizens.

"Departures" includes: UK citizens emigrating, foreign nationals whose visas expire and who leave, and those who have completed studies or work assignments.

The ONS measures this through the International Passenger Survey, border data, and National Insurance number registrations. The figures are revised significantly after initial publication — sometimes by hundreds of thousands — as better data becomes available.

Net migration of 685,000 (2023 peak) does not mean 685,000 permanent residents arrived. Many arrivals are temporary.`,
    source: 'ONS Long-Term International Migration · 2024',
  },
  hansard: {
    title: 'What is Hansard?',
    body: `Hansard is the official verbatim record of everything said in Parliament — both the House of Commons and the House of Lords.

Every speech, question, answer, intervention, and division result is published, usually within a few hours of being spoken. It has been published continuously since 1803.

The name comes from Thomas Curson Hansard, the printer who first published the reports commercially in the early 19th century.

Full transcripts are freely available at hansard.parliament.uk — searchable by MP, topic, date, or keyword.`,
    source: 'UK Parliament · hansard.parliament.uk',
  },
  pmqs: {
    title: "Prime Minister's Questions",
    body: `PMQs takes place every Wednesday when Parliament is sitting, from 12:00 to 12:30.

The Leader of the Opposition gets six questions (they can split these into follow-ups). Other MPs submit questions in a ballot, and the Speaker selects who gets called.

The Prime Minister doesn't know the questions in advance — only the Leader of the Opposition's opening question is submitted formally.

PMQs is often rowdy and adversarial. Critics argue it prioritises performance over substance. Defenders say it's one of the few mechanisms for direct weekly accountability of the head of government.

Average viewing on Parliament TV: 350,000–500,000 live, with highlights reaching millions.`,
    source: 'UK Parliament',
  },
  approval_ring: {
    title: 'How the Approval Ring Works',
    body: `The ring shows net approval as a proportion of the maximum possible score (+100 to -100 scale).

Green arc = approval portion
Red arc = disapproval portion  
Centre number = net (approve% minus disapprove%)

A full green ring would mean 100% net approval — never achieved by any UK politician in the Ipsos record. A full red ring would mean -100 net approval.

The ring makes it easy to compare leaders at a glance — a mostly-green ring is broadly popular, a mostly-red ring means the public broadly disapprove.`,
    source: 'Ipsos Political Monitor',
  },
  swing: {
    title: 'What is Electoral Swing?',
    body: `Swing measures the transfer of support between two parties between elections.

The Butler Swing formula (named after political scientist David Butler):
Swing A→B = (change in A% + change in B%) ÷ 2

Example: If Reform goes from 14% to 27% (+13) and Labour goes from 34% to 19% (-15), the swing from Labour to Reform is (13+15) ÷ 2 = 14 percentage points.

The Runcorn & Helsby by-election in May 2025 recorded a 19.8-point swing from Labour to Reform — the largest recorded swing in a UK by-election since the Second World War.`,
    source: 'Electoral data · Butler Swing formula',
  },
}

function InfoSheet({ info, T, onClose }) {
  const [dragging, setDragging] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const startY = useRef(0)

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e) => {
      const delta = Math.max(0, e.clientY - startY.current)
      setDragY(delta)
    }

    const handleMouseUp = () => {
      setDragging(false)
      setDragY((current) => {
        if (current > 110) {
          setDismissed(true)
          window.setTimeout(onClose, 260)
          return current
        }
        return 0
      })
    }

    const handleTouchMove = (e) => {
      const touch = e.touches[0]
      if (!touch) return
      const delta = Math.max(0, touch.clientY - startY.current)
      setDragY(delta)
    }

    const handleTouchEnd = () => {
      setDragging(false)
      setDragY((current) => {
        if (current > 110) {
          setDismissed(true)
          window.setTimeout(onClose, 260)
          return current
        }
        return 0
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragging, onClose])

  const beginDrag = (clientY) => {
    startY.current = clientY
    setDragging(true)
    setDragY(0)
  }

  const translateY = dismissed ? '100%' : dragging ? `${dragY}px` : '0px'
  const transition = dragging ? 'none' : 'transform 0.28s cubic-bezier(0.32,0.72,0,1)'

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.12)' }}
      />

      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          transform: `translateX(-50%) translateY(${translateY})`,
          transition,
          width: '100%',
          maxWidth: 560,
          maxHeight: '82dvh',
          zIndex: 502,
          background: T.sf,
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${T.cardBorder || 'rgba(255,255,255,0.3)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: dismissed ? 'none' : 'infoUp 0.32s cubic-bezier(0.32,0.72,0,1) forwards',
          willChange: 'transform',
        }}
      >
        <div
          onMouseDown={(e) => beginDrag(e.clientY)}
          onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 32,
            paddingTop: 12,
            paddingBottom: 8,
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 999, background: T.tl, opacity: 0.25 }} />
        </div>

        <div
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '0 24px 32px',
            flex: 1,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: T.th, marginBottom: 12 }}>
            {info.title}
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: T.th,
              lineHeight: 1.75,
              whiteSpace: 'pre-line',
              marginBottom: 16,
            }}
          >
            {info.body}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.tl,
              padding: '10px 14px',
              background: T.c1,
              borderRadius: 12,
              display: 'inline-block',
            }}
          >
            {info.source}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes infoUp {
          from { transform: translateX(-50%) translateY(100%) }
          to { transform: translateX(-50%) translateY(0) }
        }
      `}</style>
    </>
  )
}

export function InfoButton({ id, T, size = 18 }) {
  const [open, setOpen] = useState(false)
  const info = INFO[id]
  if (!info) return null

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          haptic(6)
          setOpen(true)
        }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: T.c1,
          border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          padding: 0,
        }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.tl}
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {open && <InfoSheet info={info} T={T} onClose={() => setOpen(false)} />}
    </>
  )
}

export default InfoButton