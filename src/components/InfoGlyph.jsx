import React, { useState, useEffect, useRef } from 'react'
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
    title: 'Polling Snapshot',
    body: `• Polls are refreshed automatically through the ingest pipeline.

• Each pollster contributes its latest validated eligible poll to the headline snapshot.

• Direct-source polls are preferred where available, with validated fallback or archive rows used when needed.

• The snapshot is weighted by recency and sample size, while trend lines are built from the validated poll archive over time.

• Pollster freshness can vary because some houses publish more often than others.`,
    source: 'Validated poll archive · weighted latest-by-pollster snapshot',
  },
  voting_by_thirds: {
    title: 'What does “voting by thirds” mean?',
    body: `Some councils do not elect every councillor at the same time. Instead, roughly one third of councillors are elected in each ordinary election year, usually across a three-year cycle, followed by one fallow year with no ordinary election.

That means a council with 60 seats will often have about 20 seats up in one year, another 20 the next year, and another 20 the year after that.

This matters because a party can perform well in one year without taking full control immediately. It also means the political story is often about momentum, ward targeting, and whether a party is steadily building over several cycles.`,
    source: 'UK local government election cycles',
  },
  all_out_election: {
    title: 'What is an all-out election?',
    body: `An all-out election means every council seat is contested at the same time.

So if a council has 63 seats, all 63 are up for election in one go. That makes the result much more dramatic than a by-thirds contest, because control of the whole council can change in a single night.

All-out elections often happen in London boroughs, county councils, many unitary authorities, and councils that have recently had boundary reviews.`,
    source: 'UK local government election cycles',
  },
  noc: {
    title: 'No Overall Control (NOC)',
    body: `No Overall Control means no single party has enough councillors to run the council on its own.

That does not mean the council stops working. It usually means parties have to govern through coalitions, confidence-and-supply deals, committee arrangements, or issue-by-issue bargaining.

A council can be politically very important even under NOC, because small seat changes can alter who is able to run it.`,
    source: 'Common UK local government term',
  },
  directly_elected_mayor: {
    title: 'Directly elected mayor',
    body: `Some councils have a mayor elected directly by voters across the whole council area.

That mayor is separate from ordinary ward councillors and can have executive power even if the council chamber has a different party balance.

So a place can have a Labour mayor but a Reform-leaning or fragmented council chamber, or vice versa. That is why mayoral control and council control are not always the same thing.`,
    source: 'UK local government governance models',
  },
  seats_up: {
    title: 'What does “seats up” mean?',
    body: `“Seats up” means how many council seats are actually being contested in the current election.

This is not always the same as the total number of councillors. In an all-out election, every seat is up. In a by-thirds council, only about one third of seats are up this time.

That number matters because it tells you how big the immediate electoral test really is.`,
    source: 'UK local election terminology',
  },
  majority_local: {
    title: 'Council majority',
    body: `A council majority is the cushion a ruling group has above the line needed for overall control.

A big majority usually means control is secure. A small majority means a few losses can change who runs the council. A majority of zero means there is no single-party overall control.

This is one of the quickest ways to judge whether a council is genuinely at risk of changing hands.`,
    source: 'Local council control arithmetic',
  },
  not_voting_this_time: {
    title: 'Why is this council shown if it is not voting this year?',
    body: `Some councils are still politically important even when they do not have scheduled local elections in the current cycle.

Showing them avoids confusing blank results, and it helps users understand the wider political map — especially where governance, mayoral control, or recent breakthroughs still matter.

In those cases, the app should clearly say there is no scheduled election this time, while still showing the council’s current political context.`,
    source: 'Politiscope council status design',
  },
  news_feed: {
    title: 'About this news feed',
    body: `This feed is limited to approved UK politics sources and is filtered to try to remove non-political, foreign, audio, live-blog, and lifestyle stories.

Stories do not refresh constantly. The app checks for fresh news roughly every 12 hours rather than hammering the API all day. That keeps usage sensible while still updating the feed regularly.

Because filtering is intentionally strict, the feed may sometimes show fewer stories, older stories, or a source mix that leans heavily toward whichever outlet has the clearest matching UK politics coverage at that moment.

This feed is designed as a fast political briefing layer, not a complete substitute for reading the original reporting.`,
    source: 'Approved sources · filtered UK politics feed · ~12h refresh',
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
  prediction_markets: {
    title: 'Prediction Markets',
    body: `Prediction markets show how traders are pricing an outcome on an exchange-style market.

These are not bookmaker odds. The prices are public market prices and can move quickly as new information arrives.

Politiscope surfaces them separately so you can compare exchange pricing with the bookmaker market without mixing the two together.`,
    source: 'Polymarket · public read data',
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
