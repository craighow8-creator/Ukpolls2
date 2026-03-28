import { useState } from 'react'
import { ScrollArea, StickyPills, PushHeader, haptic } from '../components/ui'

const TABS = [
  { key:'howworks', label:'How it Works' },
  { key:'voting',   label:'Voting System' },
  { key:'keydates', label:'Key Dates' },
  { key:'live',     label:'Parliament Live' },
]

const KEY_DATES = [
  { date:'7 May 2026',     label:'Local & Devolved Elections',        color:'#E4003B',  desc:'English council elections, Scottish Parliament, Senedd, mayoral elections across England.' },
  { date:'May 2026',       label:'Horsham By-Election (TBC)',         color:'#0087DC',  desc:'Conservative defending a 3,027 majority. Three-way fight: LD, Reform and Con all competitive.' },
  { date:'Every Wednesday',label:'PMQs · 12:00–12:30',               color:'#012169',  desc:'Prime Minister\'s Questions. The most watched event in UK politics. Commons chamber, Sky News and BBC Parliament live.' },
  { date:'Every Tuesday',  label:'Cabinet Meeting',                   color:'#012169',  desc:'Senior government ministers meet to discuss policy. Rarely reported in real time but leaks often follow.' },
  { date:'Jun 2026',       label:'NATO Summit',                       color:'#1a4a9e',  desc:'Starmer will face scrutiny over UK defence spending pledges and US-UK relations after Iran strike fallout.' },
  { date:'Autumn 2026',    label:'Spending Review',                   color:'#02A95B',  desc:'Government sets departmental budgets for the Parliament. Will define whether Labour can fund NHS and housing pledges.' },
  { date:'Before May 2029',label:'Next General Election',             color:'#12B7D4',  desc:'Must be held by 2 May 2029. Electoral Calculus currently projects a Reform UK majority if held today.' },
]

const HOW_WORKS = [
  {
    title: 'The House of Commons',
    icon: '🏛',
    body: 'The Commons has 650 elected MPs. The party (or coalition) with the most MPs forms the government. The Prime Minister is whoever commands a majority in the Commons — not directly elected by the public. MPs debate and vote on laws (Bills). The government controls the timetable, meaning it decides what gets debated.'
  },
  {
    title: 'The House of Lords',
    icon: '🎩',
    body: 'The Lords has around 800 unelected members — life peers appointed by the Crown on advice of the PM, 26 Church of England bishops, and 92 hereditary peers. Lords can delay and amend legislation but cannot permanently block it. The Commons always has the final word under the Parliament Acts 1911 and 1949.'
  },
  {
    title: 'How a Bill becomes Law',
    icon: '📜',
    body: '1. First Reading — the Bill is introduced, no debate.\n2. Second Reading — the main debate on the Bill\'s principles.\n3. Committee Stage — line-by-line scrutiny, amendments proposed.\n4. Report Stage — further amendments considered.\n5. Third Reading — final vote in the Commons.\n6. Same process repeated in the Lords.\n7. Royal Assent — the monarch formally signs the Bill into law.'
  },
  {
    title: 'PMQs — Prime Minister\'s Questions',
    icon: '🎤',
    body: 'Every Wednesday from 12:00–12:30 when Parliament is sitting. The Leader of the Opposition gets 6 questions. Any MP can ask a question. The PM answers without advance notice of questions. It is broadcast live on BBC Parliament and Parliament TV. It is highly theatrical and rarely changes policy — but it shapes the news cycle.'
  },
  {
    title: 'The Opposition',
    icon: '⚔️',
    body: 'The largest party not in government forms "His Majesty\'s Official Opposition." Their leader becomes Leader of the Opposition and has a salary and official residence (Chevening). The Shadow Cabinet mirrors the Cabinet, with each Shadow Minister scrutinising their counterpart. Reform UK are now the Official Opposition in Parliament.'
  },
  {
    title: 'Confidence Votes',
    icon: '⚠️',
    body: 'If a government loses a vote of no confidence, the Prime Minister must either resign or call a general election. The Fixed Term Parliaments Act 2011 was repealed in 2022, so the PM can now call an early election at any time — but must advise the King, who grants or refuses dissolution. In practice, dissolution is always granted.'
  },
]

const VOTING_SYSTEM = [
  {
    title: 'First Past the Post (FPTP)',
    icon: '🗳',
    body: 'The UK uses FPTP for Westminster elections. Each constituency elects one MP — whoever gets the most votes wins, even if that\'s only 30%. There is no minimum threshold. This massively favours large established parties. In 2024, Labour won 63% of seats with just 34% of votes. Reform UK won 4 seats with 14% of votes — fewer seats than the Lib Dems who got 12%.'
  },
  {
    title: 'Why is this controversial?',
    icon: '⚖️',
    body: 'FPTP creates "safe seats" where millions of votes are effectively wasted. It rewards geographically concentrated support (SNP, Lib Dems) over nationally spread support (Reform, Greens). Tactical voting becomes rational — voting for your second choice to keep out your least-preferred party. Nearly 70% of votes in 2024 did not directly elect an MP.'
  },
  {
    title: 'Proportional Representation',
    icon: '📊',
    body: 'PR systems allocate seats in proportion to votes received. Scotland uses the Additional Member System (AMS) for Holyrood — a mix of FPTP and regional lists. The Senedd (Wales) uses d\'Hondt PR. European Parliament elections used PR until Brexit. Under PR in 2024, Reform UK would have won around 100 seats, Greens 50+, Labour around 220.'
  },
  {
    title: 'How Swing is Calculated',
    icon: '🔄',
    body: 'Swing measures how much support has shifted between parties. The traditional "two-party swing" (Butler swing) calculates: (Party A gain + Party B loss) ÷ 2. Example: if Reform gains 10pts and Labour loses 10pts, the swing is 10pts Reform. Modern MRP models use multilevel regression to project seats from national polling.'
  },
  {
    title: 'Tactical Voting',
    icon: '🎯',
    body: 'In FPTP, voting for a candidate who cannot win in your constituency is often called a "wasted vote." Many voters choose the most viable party that shares their broad preferences. In 2024, co-ordinated tactical voting by "stop Reform" or "stop Labour" voters significantly altered results in marginal seats. Apps like Best for Britain publish tactical voting guides.'
  },
  {
    title: 'Electoral Calculus & MRP',
    icon: '🤖',
    body: 'Multi-level Regression and Poststratification (MRP) uses national polling data plus demographic and past-election data to model how each constituency might vote. Electoral Calculus currently projects Reform UK 335 seats — a majority. These projections are more accurate than uniform national swing models but still carry wide uncertainty ranges 3 years before an election.'
  },
]

function ExplainerCard({ T, item }) {
  const [open, setOpen] = useState(false)
  const isDark = T.th === '#ffffff'
  return (
    <div
      onClick={() => { haptic(4); setOpen(o => !o) }}
      style={{
        borderRadius: 14, marginBottom: 8, overflow: 'hidden',
        background: T.c0, border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.th, lineHeight: 1.3 }}>{item.title}</div>
        <div style={{ fontSize: 18, color: T.tl, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.06)'}` }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: T.tm, lineHeight: 1.75, marginTop: 12, whiteSpace: 'pre-line' }}>
            {item.body}
          </div>
        </div>
      )}
    </div>
  )
}

function daysFrom(dateStr) {
  try {
    // Handle non-specific dates
    if (!dateStr.match(/^\d{1,2}\s\w+\s\d{4}/) && !dateStr.match(/^\d{4}/)) return null
    const parts = dateStr.split(' ')
    if (parts.length < 3) return null
    const d = new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`)
    const diff = Math.ceil((d - new Date()) / 86400000)
    return diff > 0 ? diff : null
  } catch { return null }
}

export default function ParliamentScreen({ T, nav }) {
  const [tab, setTab] = useState('howworks')

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:T.sf }}>
      <PushHeader back={() => nav('home')} title="Parliament" T={T}/>
      <StickyPills pills={TABS} active={tab} onSelect={setTab} T={T}/>

      <ScrollArea>
        <div style={{ padding: '8px 14px 48px' }}>

          {/* HOW IT WORKS */}
          {tab === 'howworks' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, marginBottom: 14, lineHeight: 1.6 }}>
                How the UK Parliament works — tap any section to expand.
              </div>
              {HOW_WORKS.map((item, i) => <ExplainerCard key={i} T={T} item={item} />)}
            </>
          )}

          {/* VOTING SYSTEM */}
          {tab === 'voting' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, marginBottom: 14, lineHeight: 1.6 }}>
                The UK voting system, how seats are won, and what the alternatives are.
              </div>
              {VOTING_SYSTEM.map((item, i) => <ExplainerCard key={i} T={T} item={item} />)}
            </>
          )}

          {/* KEY DATES */}
          {tab === 'keydates' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.tl, marginBottom: 14, lineHeight: 1.6 }}>
                Upcoming dates that matter in UK politics.
              </div>
              {KEY_DATES.map((d, i) => {
                const days = daysFrom(d.date)
                return (
                  <div key={i} style={{
                    borderRadius: 14, padding: '14px 16px', marginBottom: 8,
                    background: T.c0, border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`,
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    <div style={{ width: 4, borderRadius: 99, alignSelf: 'stretch', background: d.color, flexShrink: 0 }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: T.th }}>{d.label}</div>
                        {days && <div style={{ fontSize: 14, fontWeight: 800, color: d.color, flexShrink: 0 }}>{days}d</div>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: d.color, marginBottom: 5 }}>{d.date}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.tm, lineHeight: 1.6 }}>{d.desc}</div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* PARLIAMENT LIVE */}
          {tab === 'live' && (
            <>
              <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 14, background: '#000', position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                  src="https://www.parliamentlive.tv/live"
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                  allowFullScreen
                  title="Parliament Live TV"
                />
              </div>
              <div style={{ borderRadius: 14, padding: '14px 16px', background: T.c0, border: `1px solid ${T.cardBorder || 'rgba(0,0,0,0.08)'}`, marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.th, marginBottom: 8 }}>When does Parliament sit?</div>
                {[
                  { day:'Monday',    commons:'14:30–22:30', lords:'15:00+' },
                  { day:'Tuesday',   commons:'11:30–19:00', lords:'14:00+' },
                  { day:'Wednesday', commons:'11:30–19:00 · PMQs 12:00', lords:'15:00+' },
                  { day:'Thursday',  commons:'09:30–17:30', lords:'11:00+' },
                  { day:'Friday',    commons:'09:30–14:30 (when sitting)', lords:'—' },
                ].map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < 4 ? `1px solid ${T.cardBorder||'rgba(0,0,0,0.06)'}` : 'none' }}>
                    <div style={{ width: 80, fontSize: 13, fontWeight: 700, color: T.tl }}>{r.day}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.tm }}>{r.commons}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
