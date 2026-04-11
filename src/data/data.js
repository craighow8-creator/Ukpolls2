/* ═══════════════════════════════════════════════════════════
   POLITISCOPE DATA — Single Source of Truth
   Edit this file to update all app data.
   Version: 2.0 · Last updated: 20 Mar 2026
   ═══════════════════════════════════════════════════════════ */

const POLITISCOPE_DATA = {

  /* ─────────────────────────────────────────
     META
  ───────────────────────────────────────── */
  meta: {
    fetchDate:     "20 Mar 2026",
    appVersion:    "2.0",
    context:       "Reform UK leads on 27% (7-poll avg, 20 Mar 2026). Greens up to 16% as YouGov (15-16 Mar) shows Con and Lab level at 17% for first time. Pollster spread: More in Common 30%, YouGov 25%. Ipsos (5-11 Mar): Starmer approval −53, new record low. 48 days to May 7 local elections. Restore Britain 7% in prompted polls, 110,000+ members. Electoral Calculus MRP: Reform UK 335 seats projected majority.",
    nextElectionDate: "2026-05-07",
    nextElectionLabel: "Local + Devolved Elections",
    ge2029Date:    "2029-05-02",
    appUrl:        "https://craighow8-creator.github.io/Ukpolls2/",
  },

  /* ─────────────────────────────────────────
     NEWS / WORKER CONFIG
  ───────────────────────────────────────── */
  news: {
    worker:  "https://throbbing-base-05b6.craighow8.workers.dev",
    token:   "afc1e6a1834e52b57a583ad850daeb3e5d41440952946f594b20fb3c9dc96542",
  },

  /* ─────────────────────────────────────────
     PARTIES — polling averages & seats
  ───────────────────────────────────────── */
  parties: [
    { name:"Reform UK",       abbr:"REF", key:"ref", pct:27, change:0,  seats:335, color:"#12B7D4" },
    { name:"Labour",          abbr:"LAB", key:"lab", pct:19, change:0,  seats:141, color:"#E4003B" },
    { name:"Conservative",    abbr:"CON", key:"con", pct:18, change:0,  seats:98,  color:"#0087DC" },
    { name:"Green",           abbr:"GRN", key:"grn", pct:16, change:1,  seats:28,  color:"#02A95B" },
    { name:"Lib Dem",         abbr:"LD",  key:"ld",  pct:12, change:0,  seats:87,  color:"#FAA61A" },
    { name:"SNP",             abbr:"SNP", key:"snp", pct:3,  change:0,  seats:44,  color:"#C4922A" },
    { name:"Plaid Cymru",     abbr:"PC",  key:"plc", pct:1,  change:0,  seats:4,   color:"#3F8428" },
    { name:"Restore Britain", abbr:"RB",  key:"rb",  pct:7,  change:0,  seats:1,   color:"#1a4a9e" },
    { name:"Other",           abbr:"OTH", key:"oth", pct:5,  change:0,  seats:null, color:"#6b7280" },
  ],

  /* ─────────────────────────────────────────
     TRENDS — monthly polling (12 months)
  ───────────────────────────────────────── */
  trends: [
    { month:"Apr",  "Reform UK":22, Labour:25, Conservative:23, "Lib Dem":11, Green:8,  "Restore Britain":null },
    { month:"May",  "Reform UK":23, Labour:24, Conservative:22, "Lib Dem":11, Green:8,  "Restore Britain":null },
    { month:"Jun",  "Reform UK":24, Labour:24, Conservative:22, "Lib Dem":11, Green:9,  "Restore Britain":null },
    { month:"Jul",  "Reform UK":25, Labour:23, Conservative:21, "Lib Dem":11, Green:9,  "Restore Britain":null },
    { month:"Aug",  "Reform UK":26, Labour:23, Conservative:21, "Lib Dem":11, Green:9,  "Restore Britain":null },
    { month:"Sep",  "Reform UK":28, Labour:22, Conservative:20, "Lib Dem":12, Green:10, "Restore Britain":null },
    { month:"Oct",  "Reform UK":29, Labour:21, Conservative:19, "Lib Dem":12, Green:11, "Restore Britain":null },
    { month:"Nov",  "Reform UK":30, Labour:20, Conservative:19, "Lib Dem":13, Green:11, "Restore Britain":null },
    { month:"Dec",  "Reform UK":29, Labour:21, Conservative:18, "Lib Dem":13, Green:11, "Restore Britain":null },
    { month:"Jan",  "Reform UK":28, Labour:20, Conservative:18, "Lib Dem":13, Green:13, "Restore Britain":null },
    { month:"Feb",  "Reform UK":27, Labour:18, Conservative:17, "Lib Dem":13, Green:17, "Restore Britain":5  },
    { month:"Mar",  "Reform UK":27, Labour:19, Conservative:18, "Lib Dem":12, Green:16, "Restore Britain":7  },
  ],

  /* ─────────────────────────────────────────
     POLLS — individual pollster readings
  ───────────────────────────────────────── */
  polls: [
    { date:"15-16 Mar", pollster:"YouGov",                  ref:25, lab:17, con:17, ld:14, grn:19, rb:null },
    { date:"11 Mar",    pollster:"Find Out Now",             ref:26, lab:15, con:17, ld:11, grn:21, rb:null },
    { date:"10-12 Mar", pollster:"Techne",                   ref:27, lab:17, con:18, ld:14, grn:17, rb:null },
    { date:"6-10 Mar",  pollster:"Focaldata",                ref:27, lab:20, con:18, ld:14, grn:13, rb:null },
    { date:"6-9 Mar",   pollster:"More in Common",           ref:30, lab:22, con:19, ld:13, grn:11, rb:null },
    { date:"5-11 Mar",  pollster:"Ipsos",                    ref:28, lab:21, con:17, ld:9,  grn:17, rb:null },
    { date:"5 Mar",     pollster:"Survation",                ref:29, lab:21, con:18, ld:10, grn:12, rb:null },
    { date:"4-6 Mar",   pollster:"Opinium",                  ref:29, lab:21, con:16, ld:10, grn:14, rb:null },
    { date:"3-4 Mar",   pollster:"Find Out Now (prompted)",  ref:24, lab:16, con:17, ld:10, grn:20, rb:7    },
  ],

  /* ─────────────────────────────────────────
     MILESTONES — polling news log
  ───────────────────────────────────────── */
  milestones: [
    { date:"20 Mar",    text:"7-poll avg: Reform 27% (NC), Lab 19% (NC), Con 18% (NC), Green 16% (▲1), LD 12% (NC) — 48 days to local elections" },
    { date:"15-16 Mar", text:"YouGov: Reform 25%, Green 19%, Con 17%, Lab 17%, LD 14% — Conservatives and Labour level for first time in current cycle. Ipsos puts Starmer approval at −53, new record low" },
    { date:"Mar 2026",  text:"Sky Bet: Reform UK 6/4 favourite for most seats, Restore Britain 12/1 — entering major markets for first time. William Hill Next PM: Rayner 3/1, Farage 6/1, Rupert Lowe 8/1" },
    { date:"13 Mar",    text:"7-poll avg: Reform UK 27% (▲1), Green 15% (▼2) — More in Common puts Reform at 30%, highest of current cycle" },
    { date:"12 Mar",    text:"Restore Britain confirmed over 100,000 paid members — odds of winning next GE cut from 80/1 to 20/1 by bookmakers" },
    { date:"10 Mar",    text:"Restore Britain confirms 110,000+ paid members — Lowe sets next target as overtaking Conservatives' estimated 123,000" },
    { date:"6 Mar",     text:"7-poll avg stable: Reform 27%, Lab 19%, Con 18%, Green 15%, LD 12%" },
    { date:"5 Mar",     text:"Labour wins Murton ward (Durham) from Reform UK — first ever Labour council gain from Reform" },
    { date:"26 Feb",    text:"Green Party wins Gorton & Denton by-election — 28.6pt swing from Labour. First Green MP north of the Midlands" },
    { date:"Feb 2026",  text:"Restore Britain launches — targeting the 42% who did not vote in 2024; support skews young and ex-non-voter" },
    { date:"Feb 2026",  text:"Mandelson-Epstein scandal: Starmer's chief of staff, communications director and cabinet secretary all resign" },
  ],

  /* ─────────────────────────────────────────
     LEADERS — full profiles
  ───────────────────────────────────────── */
  leaders: [
    {
      name: "Zack Polanski",
      party: "Green",
      color: "#02A95B",
      role: "Co-Leader",
      x: "ZackPolanski",
      approve: 35, disapprove: 20, net: 15,
      bio: "Born David Paulden on 2 November 1982 in Salford. Changed his name at 18 to restore his family's original Jewish surname. Studied at Aberystwyth University and drama school in the US. Worked in community theatre, hospitality, and as a hypnotherapist before entering politics. Joined the Greens in 2017 after leaving the Lib Dems. Elected to the London Assembly in 2021. Won the Green leadership in September 2025 with 85% of the vote — the first Jewish leader of a Westminster party since Ed Miliband. Under his leadership, Green membership has tripled to over 200,000 and the party won the Gorton & Denton by-election in February 2026.",
    },
    {
      name: "Ed Davey",
      party: "Lib Dem",
      color: "#FAA61A",
      role: "Leader",
      x: "EdwardJDavey",
      approve: 35, disapprove: 29, net: 6,
      bio: "Sir Ed Davey led the Lib Dems to their best ever result at GE2024, winning 72 seats primarily in the Blue Wall. He is known for his campaigning style and focus on health and social care issues. Approval remains positive.",
    },
    {
      name: "Kemi Badenoch",
      party: "Conservative",
      color: "#0087DC",
      role: "Leader",
      x: "KemiBadenoch",
      approve: 31, disapprove: 38, net: -7,
      bio: "Born Olukemi Olufunto Adegoke on 2 January 1980 in Wimbledon. Her mother came to the UK for medical treatment and gave birth here. Grew up between Nigeria and the US; returned to the UK at 16 with very little money and worked at McDonald's while completing her A-levels. Studied Computer Systems Engineering at Queen Mary University of London and later law at Birkbeck. MP for North West Essex since 2017. The first Black woman and first Black person to lead the Conservative Party, elected leader in November 2024.",
    },
    {
      name: "Keir Starmer",
      party: "Labour",
      color: "#E4003B",
      role: "Prime Minister",
      x: "Keir_Starmer",
      approve: 22, disapprove: 64, net: -42,
      bio: "Born 2 September 1962 in Surrey. Human rights barrister who defended high-profile cases including death row prisoners in the Caribbean. Director of Public Prosecutions 2008–2013, knighted for services to law. MP for Holborn & St Pancras since 2015. Led Labour to a 174-seat majority in July 2024 after 14 years in opposition. His approval ratings have collapsed since entering government — the most unpopular PM since Ipsos records began in 1977. In February 2026, the Mandelson-Epstein scandal triggered the resignation of his chief of staff, communications director and cabinet secretary.",
    },
    {
      name: "Nigel Farage",
      party: "Reform UK",
      color: "#12B7D4",
      role: "Leader",
      x: "Nigel_Farage",
      approve: 42, disapprove: 46, net: -4,
      bio: "Born 3 April 1964 in Farnborough, Kent. Former commodity broker in the City. A lifelong Eurosceptic, he co-founded the Brexit Party (later Reform UK) in 2019 after leading UKIP from 2006–2016. His campaigning was central to the 2016 Brexit referendum result. Elected MP for Clacton at the 2024 general election. Reform has led every national poll since May 2025. In February 2026 he announced a formal shadow cabinet including Robert Jenrick as shadow chancellor, Richard Tice as shadow deputy PM, Zia Yusuf on home affairs, and Suella Braverman on education.",
    },
    {
      name: "Rupert Lowe",
      party: "Restore Britain",
      color: "#1a4a9e",
      role: "Leader",
      x: "Rupert_Lowe_MP",
      approve: 22, disapprove: 19, net: 3,
      bio: "Born 1964. Former chairman of Southampton FC (2001–2006). Elected Reform UK MP for Great Yarmouth in July 2024. In March 2025 he publicly criticised Farage's leadership style, leading to his expulsion from Reform UK. Founded Restore Britain in early 2026, targeting the 42% of voters who did not vote in 2024. By 10 March 2026 the party had surpassed 110,000 paid members — the fastest membership growth of any party in modern UK political history.",
    },
    {
      name: "John Swinney",
      party: "SNP",
      color: "#C4922A",
      role: "First Minister of Scotland",
      x: "JohnSwinney",
      approve: 35, disapprove: 45, net: -10,
      bio: "Born 13 April 1964 in Perthshire. Studied economics at Edinburgh University. Has served in Scottish politics for over 30 years, first elected to the Scottish Parliament in 1999. Served as Deputy First Minister and Finance Secretary under Alex Salmond and Nicola Sturgeon. Became First Minister in May 2024 following Humza Yousaf's resignation. Faces the Holyrood election in May 2026 as the SNP's poll ratings continue to soften.",
    },
    {
      name: "Rhun ap Iorwerth",
      party: "Plaid Cymru",
      color: "#3F8428",
      role: "Leader",
      x: "RhunaPIorwerth",
      approve: 32, disapprove: 28, net: 4,
      bio: "Born 1971 in Llangefni, Anglesey. Raised Welsh-speaking. Former BBC Wales journalist and television presenter before entering politics. MS for Anglesey since 2011. Became Plaid Cymru leader in 2023. Leads Plaid into the 2026 Senedd election with polling suggesting they could become the largest party in Wales for the first time, as Labour's dominance collapses.",
    },
  ],

  /* ─────────────────────────────────────────
     DEMOGRAPHICS — voting by group
  ───────────────────────────────────────── */
  demographics: {
    age: {
      headline: "Reform lead 45+, Greens lead under-35",
      insight:  "Age is the single biggest predictor of vote choice in current UK polling.",
      source:   "Find Out Now, JL Partners · 2026",
      groups: [
        { label:"18–24", ref:18, grn:32, lab:20, con:8,  ld:12, note:"Greens dominate youngest voters" },
        { label:"25–34", ref:20, grn:28, lab:22, con:10, ld:13 },
        { label:"35–44", ref:24, grn:22, lab:20, con:14, ld:13 },
        { label:"45–54", ref:28, grn:16, lab:17, con:18, ld:16 },
        { label:"55–64", ref:34, grn:12, lab:16, con:20, ld:13, note:"Reform UK strongest age group" },
        { label:"65+",   ref:31, grn:8,  lab:15, con:22, ld:14 },
      ]
    },
    class: {
      headline: "Reform dominate working class",
      insight:  "The traditional Labour–working class coalition has largely collapsed.",
      source:   "Ipsos, More in Common · 2026",
      groups: [
        { label:"AB — Professional", ref:20, grn:24, lab:18, con:20, ld:18, note:"Higher earners split Green/Con/Reform roughly equally" },
        { label:"C1 — Clerical",     ref:26, grn:19, lab:18, con:18, ld:14 },
        { label:"C2 — Skilled",      ref:32, grn:14, lab:18, con:16, ld:11, note:"Reform dominate — big shift from Labour" },
        { label:"DE — Unskilled",    ref:30, grn:16, lab:20, con:12, ld:10, note:"Labour retain most ground here" },
      ]
    },
    education: {
      headline: "Graduates: Greens. Non-grads: Reform",
      insight:  "Education is now as predictive as class was in 20th century politics.",
      source:   "YouGov, Focaldata · 2026",
      groups: [
        { label:"Degree",        ref:16, grn:28, lab:22, con:16, ld:18, note:"Graduates strongly favour Greens and Labour" },
        { label:"Non-degree",    ref:33, grn:13, lab:15, con:18, ld:11, note:"Reform lead by 20pts+ among non-graduates" },
        { label:"In education",  ref:12, grn:35, lab:20, con:8,  ld:14, note:"Greens dominate among students" },
      ]
    },
    region: {
      headline: "Reform lead everywhere outside London",
      insight:  "London remains a Green/Labour stronghold. Everywhere else has shifted.",
      source:   "Multiple pollsters · 2026",
      groups: [
        { label:"London",           ref:16, grn:26, lab:26, con:14, ld:14 },
        { label:"South East",       ref:26, grn:18, lab:14, con:20, ld:18 },
        { label:"South West",       ref:24, grn:20, lab:14, con:18, ld:20 },
        { label:"Midlands",         ref:32, grn:14, lab:20, con:18, ld:10 },
        { label:"North of England", ref:30, grn:16, lab:22, con:14, ld:11 },
        { label:"Scotland",         ref:18, grn:9,  lab:16, con:10, ld:9  },
        { label:"Wales",            ref:25, grn:12, lab:13, con:12, ld:6  },
      ]
    },
    ethnicity: {
      headline: "Labour retain strong BAME lead",
      insight:  "Labour's BAME coalition remains their most stable voter group.",
      source:   "Focaldata, More in Common · 2026",
      groups: [
        { label:"White British", ref:30, grn:17, lab:17, con:17, ld:12 },
        { label:"Asian British", ref:14, grn:18, lab:36, con:16, ld:12, note:"Labour retain strong lead" },
        { label:"Black British", ref:8,  grn:22, lab:44, con:10, ld:10, note:"Labour dominant but Greens making inroads" },
        { label:"Mixed/Other",   ref:18, grn:26, lab:24, con:12, ld:14 },
      ]
    },
    nonVoters: {
      headline: "2024 Non-Voters — where are they going?",
      insight:  "42% of the electorate did not vote in 2024. Their realignment is reshaping UK politics.",
      source:   "More in Common · Feb 2026",
      groups: [
        { label:"Would now vote Reform", pct:24, color:"#12B7D4" },
        { label:"Would now vote Green",  pct:18, color:"#02A95B" },
        { label:"Would now vote RB",     pct:12, color:"#1a4a9e" },
        { label:"Still wouldn't vote",   pct:28, color:"#6b7280" },
        { label:"Other",                 pct:18, color:"#9ca3af" },
      ]
    },
  },

  /* ─────────────────────────────────────────
     MIGRATION
  ───────────────────────────────────────── */
  migration: {
    fetchYear:  "Year ending June 2025 · ONS",
    netTotal:   204000,
    netPrev:    649000,
    netPrev2:   944000,
    byNationality: [
      { name:"India",        inflow:130000, net:null,    type:"work/study (top source)" },
      { name:"China",        inflow:100000, net:null,    type:"study (24% of student visas)" },
      { name:"Nigeria",      inflow:60000,  net:null,    type:"work/study" },
      { name:"Pakistan",     inflow:55000,  net:null,    type:"study/family/work" },
      { name:"Nepal",        inflow:21000,  net:null,    type:"study (+89% rise)" },
      { name:"Philippines",  inflow:18000,  net:null,    type:"work/NHS" },
      { name:"Afghanistan",  inflow:15000,  net:null,    type:"asylum (top claimant)" },
      { name:"Zimbabwe",     inflow:14000,  net:null,    type:"work" },
      { name:"Bangladesh",   inflow:13000,  net:null,    type:"study/family" },
      { name:"Sri Lanka",    inflow:11000,  net:null,    type:"work/study" },
      { name:"EU nationals", inflow:85000,  net:-70000,  outflow:155000, type:"net outflow" },
      { name:"British",      inflow:143000, net:-109000, outflow:252000, type:"net emigration" },
    ],
    byVisa: [
      { type:"Study",        n:440000, color:"#6366f1" },
      { type:"Skilled Work", n:175000, color:"#12B7D4" },
      { type:"Asylum",       n:96000,  color:"#f97316" },
      { type:"Family",       n:68000,  color:"#FAA61A" },
      { type:"Other",        n:35000,  color:"#6b7280" },
    ],
    trend: [
      { year:"2019", net:184000 }, { year:"2020", net:87000  }, { year:"2021", net:173000 },
      { year:"2022", net:504000 }, { year:"2023", net:944000 }, { year:"2024", net:649000 },
      { year:"2025", net:204000 },
    ],
    smallBoats: {
      total2025: 41472, total2024: 36816, total2018to2025: 196019,
      topNationalities: ["Afghan","Syrian","Iranian","Iraqi","Eritrean"],
      asylumClaimRate: 95, grantRate: 68, returned: 5000,
      deaths2025: 24, deaths2024: 73,
      hotelCost: "£15bn over 10 years (NAO est.)",
      note: "Around ~1,000 crossed in Jan 2026. 193 returned to France under new pilot scheme by end of 2025.",
    },
  },

  /* ─────────────────────────────────────────
     BETTING ODDS
  ───────────────────────────────────────── */
  betting: {
    source: "Betfair / Oddschecker · Mar 2026",
    market: "Most seats at next General Election",
    odds: [
      { name:"Reform UK",       odds:"6/4",  color:"#12B7D4", favourite:true  },
      { name:"Labour",          odds:"9/4",  color:"#E4003B", favourite:false },
      { name:"Green",           odds:"4/1",  color:"#02A95B", favourite:false },
      { name:"Conservative",    odds:"7/1",  color:"#0087DC", favourite:false },
      { name:"Restore Britain", odds:"12/1", color:"#1a4a9e", favourite:false },
      { name:"Lib Dem",         odds:"28/1", color:"#FAA61A", favourite:false },
    ],
    nextPm: {
      source: "William Hill · Mar 2026",
      odds: [
        { name:"Angela Rayner", odds:"3/1"  },
        { name:"Nigel Farage",  odds:"6/1"  },
        { name:"Rupert Lowe",   odds:"8/1"  },
        { name:"Kemi Badenoch", odds:"10/1" },
        { name:"Keir Starmer",  odds:"12/1" },
      ]
    }
  },

  /* ─────────────────────────────────────────
     BY-ELECTIONS
  ───────────────────────────────────────── */
  byElections: {
    upcoming: [
      {
        id: "horsham",
        name: "Horsham",
        dateLabel: "TBC 2026",
        status: "upcoming",
        defending: "Conservative",
        defColor: "#0087DC",
        majority2024: 3027,
        majority2024Pct: 6.8,
        trigger: "Jeremy Quin resigned on health grounds",
        region: "South East England",
        leaveVote: 44,
        context: "Jeremy Quin's resignation has created a three-way fight in a safe-looking Surrey seat. The Lib Dems swept similar Blue Wall seats in 2024, Reform UK are targeting the Con vote, and the Conservatives are defending a 3,027 majority.",
        verdict: "Too close to call",
        verdictColor: "#6b7280",
        result2024: [
          { party:"Conservative", color:"#0087DC", pct:37.4 },
          { party:"Lib Dem",      color:"#FAA61A", pct:30.6 },
          { party:"Reform UK",    color:"#12B7D4", pct:14.8 },
          { party:"Labour",       color:"#E4003B", pct:12.2 },
          { party:"Green",        color:"#02A95B", pct:3.8  },
        ],
        odds: { "Lib Dem":"6/4", "Conservative":"2/1", "Reform UK":"9/2" },
        oddsDate: "Betfair Mar 2026",
        swingNeeded: 3.4,
        swingParty: "Lib Dem",
        swingFrom: "Conservative",
        watchFor: "LD-Con swing is the key number. If Reform splits the right vote, Lib Dems can win with under 35%.",
        tags: ["Con defend","LD target","Reform threat","Blue Wall"],
        tagColors: ["#0087DC","#FAA61A","#12B7D4","#1e40af"],
      },
    ],
    recent: [
      {
        id: "runcorn",
        name: "Runcorn and Helsby",
        dateLabel: "1 May 2025",
        status: "result",
        defending: "Labour",
        defColor: "#E4003B",
        winner: "Reform UK",
        winnerColor: "#12B7D4",
        gainLoss: "GAIN",
        majority2024: 14696,
        majority2024Pct: 53.7,
        trigger: "Mike Amesbury resigned after assault video went viral",
        region: "North West England",
        leaveVote: 60,
        context: "Labour defending a once-safe Red Wall seat. Reform UK overturned a 14,696 majority by just 6 votes in the largest swing in a UK by-election since WWII.",
        verdict: "Bellwether",
        verdictColor: "#C8102E",
        result2024: [
          { party:"Labour",       color:"#E4003B", pct:53.7 },
          { party:"Conservative", color:"#0087DC", pct:20.8 },
          { party:"Reform UK",    color:"#12B7D4", pct:14.2 },
          { party:"Lib Dem",      color:"#FAA61A", pct:6.1  },
          { party:"Green",        color:"#02A95B", pct:4.1  },
        ],
        result: [
          { party:"Reform UK",    color:"#12B7D4", pct:38.7, change:24.5,  winner:true },
          { party:"Labour",       color:"#E4003B", pct:34.8, change:-18.9 },
          { party:"Conservative", color:"#0087DC", pct:12.4, change:-8.4  },
          { party:"Green",        color:"#02A95B", pct:7.2,  change:3.1   },
          { party:"Lib Dem",      color:"#FAA61A", pct:4.9,  change:-1.2  },
        ],
        majority: 6,
        turnout: 46.2,
        swing: { from:"Labour", to:"Reform UK", pts:21.7 },
        significance: "Largest swing in a UK by-election since WWII. Reform's first Parliamentary gain. Majority of just 6 votes.",
        watchFor: "Starmer faced immediate leadership calls. Labour recounts demanded.",
        tags: ["Reform GAIN","Red Wall","Historic swing","Bellwether"],
        tagColors: ["#12B7D4","#8b5cf6","#C8102E","#C8102E"],
      },
      {
        id: "gorton",
        name: "Gorton and Denton",
        date: "2026-02-26",
        dateLabel: "26 Feb 2026",
        defending: "Labour",
        defColor: "#E4003B",
        winner: "Green",
        winnerColor: "#02A95B",
        gainLoss: "GAIN",
        region: "Greater Manchester",
        leaveVote: 56,
        context: "Hannah Spencer became the Greens fifth MP and their first in the North of England, overturning a 10,000 Labour majority in a shock result.",
        verdict: "Green surge",
        verdictColor: "#02A95B",
        result: [
          { party:"Green",        color:"#02A95B", pct:38.2, change:31.4,  winner:true },
          { party:"Labour",       color:"#E4003B", pct:35.8, change:-22.6 },
          { party:"Reform UK",    color:"#12B7D4", pct:14.2, change:14.2  },
          { party:"Conservative", color:"#0087DC", pct:6.4,  change:-11.8 },
          { party:"Lib Dem",      color:"#FAA61A", pct:3.8,  change:-2.1  },
        ],
        majority: 892,
        turnout: 38.4,
        swing: { from:"Labour", to:"Green", pts:27.0 },
        significance: "Greens now have 5 MPs. First Green seat north of the Midlands.",
        tags: ["Green GAIN","Lab loss","Urban left surge"],
        tagColors: ["#02A95B","#E4003B","#02A95B"],
      },
      {
        id: "kingswood",
        name: "Kingswood",
        date: "2024-02-15",
        dateLabel: "15 Feb 2024",
        defending: "Conservative",
        defColor: "#0087DC",
        winner: "Labour",
        winnerColor: "#E4003B",
        gainLoss: "GAIN",
        region: "South West England",
        leaveVote: 58,
        context: "Labour gain in a Leave-voting Bristol commuter seat, demonstrating their ability to win across Blue Wall territory.",
        verdict: "Labour gain",
        verdictColor: "#E4003B",
        result: [
          { party:"Labour",       color:"#E4003B", pct:38.7, change:13.3,  winner:true },
          { party:"Conservative", color:"#0087DC", pct:32.1, change:-15.4 },
          { party:"Reform UK",    color:"#12B7D4", pct:16.2, change:16.2  },
          { party:"Green",        color:"#02A95B", pct:6.4,  change:2.8   },
          { party:"Lib Dem",      color:"#FAA61A", pct:4.2,  change:-2.6  },
        ],
        majority: 2501,
        turnout: 41.2,
        swing: { from:"Conservative", to:"Labour", pts:14.35 },
        significance: "Confirmed Labour could win in Leave-leaning outer-suburban seats.",
        tags: ["Lab GAIN","Con loss","Red Wall crossover"],
        tagColors: ["#E4003B","#0087DC","#8b5cf6"],
      },
      {
        id: "henley",
        name: "Henley and Thame",
        date: "2024-10-10",
        dateLabel: "10 Oct 2024",
        defending: "Lib Dem",
        defColor: "#FAA61A",
        winner: "Lib Dem",
        winnerColor: "#FAA61A",
        gainLoss: "HOLD",
        region: "South East England",
        leaveVote: 46,
        context: "Lib Dems consolidated their grip on southern Blue Wall seats, increasing their majority significantly as the Conservative vote collapsed.",
        verdict: "Lib Dem fortress",
        verdictColor: "#FAA61A",
        result: [
          { party:"Lib Dem",      color:"#FAA61A", pct:52.3, change:8.1,   winner:true },
          { party:"Conservative", color:"#0087DC", pct:22.1, change:-18.4 },
          { party:"Reform UK",    color:"#12B7D4", pct:12.8, change:12.8  },
          { party:"Labour",       color:"#E4003B", pct:8.4,  change:-4.6  },
          { party:"Green",        color:"#02A95B", pct:3.2,  change:1.8   },
        ],
        majority: 10882,
        turnout: 43.7,
        swing: { from:"Conservative", to:"Lib Dem", pts:13.3 },
        significance: "LD majority tripled. Conservatives third. Blue Wall realignment confirmed.",
        tags: ["LD HOLD","Blue Wall","Con third place"],
        tagColors: ["#FAA61A","#1e40af","#C8102E"],
      },
    ],
  },

  elections: {
    date: "7 May 2026",
    totalEnglishCouncils: 136,
    scotland: {
      context: "Scottish Parliament election. SNP defending majority. Labour resurgent. Reform UK set to become the official opposition — a historic first. Scottish Greens not standing in most constituencies to avoid splitting pro-independence vote.",
      holyrood: [
        { label:"SNP",     color:"#C4922A", pct:35 },
        { label:"Reform",  color:"#12B7D4", pct:19 },
        { label:"Labour",  color:"#E4003B", pct:16 },
        { label:"Con",     color:"#0087DC", pct:10 },
        { label:"LD",      color:"#FAA61A", pct:10 },
        { label:"Green",   color:"#02A95B", pct:9  },
      ],
      westminster: [
        { label:"SNP",     color:"#C4922A", pct:33 },
        { label:"Labour",  color:"#E4003B", pct:21 },
        { label:"Reform",  color:"#12B7D4", pct:18 },
        { label:"Con",     color:"#0087DC", pct:12 },
        { label:"LD",      color:"#FAA61A", pct:9  },
      ],
      source: "PollCheck 5-poll avg · Mar 2026 · YouGov/Survation/Ipsos",
    },
    wales: {
      context: "Senedd election. First election under new PR system (96 seats, up from 60). Labour have governed Wales since 1999 — polls suggest they face devastating losses. Plaid Cymru narrowly lead Reform with both parties in genuine contention to be the largest party.",
      senedd: [
        { label:"Plaid",   color:"#3F8428", pct:26 },
        { label:"Reform",  color:"#12B7D4", pct:26 },
        { label:"Labour",  color:"#E4003B", pct:20 },
        { label:"Con",     color:"#0087DC", pct:10 },
        { label:"Green",   color:"#02A95B", pct:10 },
        { label:"LD",      color:"#FAA61A", pct:7  },
      ],
      westminster: [
        { label:"Plaid",   color:"#3F8428", pct:29 },
        { label:"Reform",  color:"#12B7D4", pct:25 },
        { label:"Labour",  color:"#E4003B", pct:13 },
        { label:"Con",     color:"#0087DC", pct:12 },
        { label:"Green",   color:"#02A95B", pct:12 },
        { label:"LD",      color:"#FAA61A", pct:6  },
      ],
      source: "More in Common · Mar 2026 · PollCheck avg",
    },
    regions: [
      {
        id:"london", emoji:"🏙", name:"London", accentColor:"#C8102E",
        councils:32, seats:1748, type:"London Boroughs + 3 Mayoral",
        difficulty:"very hard", parties:["Lab","Grn","Reform","LD","Con"],
        story:"All 32 London boroughs hold all-out elections. Mayoral elections in Hackney, Lewisham and Newham. Labour defending heartlands as Greens surge in inner London. Reform targeting outer East London.",
        watchFor:"Tower Hamlets, Newham, Barking — Labour vs Green. Havering, Barnet — Reform threat.",
        councilsList:[
          { name:"Tower Hamlets",       control:"Lab", difficulty:"very hard", note:"Green surge — mayoral too" },
          { name:"Newham",              control:"Lab", difficulty:"hard",      note:"Mayoral election + all seats" },
          { name:"Hackney",             control:"Lab", difficulty:"hard",      note:"Mayoral election" },
          { name:"Lewisham",            control:"Lab", difficulty:"hard",      note:"Mayoral election" },
          { name:"Havering",            control:"Con", difficulty:"very hard", note:"Reform prime target" },
          { name:"Barking & Dagenham",  control:"Lab", difficulty:"hard",      note:"Reform threat" },
          { name:"Barnet",              control:"Lab", difficulty:"hard",      note:"Reform/Con split" },
        ]
      },
      {
        id:"metro", emoji:"🏗", name:"Metropolitan", accentColor:"#E4003B",
        councils:32, seats:900, type:"Metropolitan Boroughs — ⅓ seats",
        difficulty:"hard", parties:["Lab","Reform","Grn","Con","LD"],
        story:"32 of 36 metropolitan boroughs elect one-third of their seats. Includes Sheffield, Birmingham, Manchester, Leeds and Liverpool.",
        watchFor:"Sheffield — Lab vs Reform. Birmingham — Lab defend post-financial crisis. Manchester — Green pressure.",
        councilsList:[
          { name:"Sheffield",    control:"Lab", difficulty:"hard",      note:"Reform UK targeting — one-third seats" },
          { name:"Birmingham",   control:"Lab", difficulty:"very hard", note:"Post-financial crisis — Reform threat" },
          { name:"Manchester",   control:"Lab", difficulty:"hard",      note:"Green pressure in city centre wards" },
          { name:"Leeds",        control:"Lab", difficulty:"hard",      note:"Three-way Lab/Grn/Reform" },
          { name:"Liverpool",    control:"Lab", difficulty:"medium",    note:"Lab stronghold but Greens growing" },
          { name:"Bradford",     control:"Lab", difficulty:"hard",      note:"Galloway effect — complex" },
          { name:"Newcastle",    control:"Lab", difficulty:"medium",    note:"Reform threat in outer wards" },
        ]
      },
      {
        id:"southeast", emoji:"🌊", name:"South East", accentColor:"#FAA61A",
        councils:8, seats:612, type:"County & Unitary",
        difficulty:"hard", parties:["Con","LD","Reform","Lab"],
        story:"Blue Wall territory. Lib Dems targeting Hampshire and Surrey. Reform splitting the right-of-centre vote.",
        watchFor:"Hampshire — LD vs Con. Surrey — LD advance. Kent — Reform prime target.",
        councilsList:[
          { name:"Hampshire",  control:"Con", difficulty:"hard",      note:"LD Blue Wall advance" },
          { name:"Surrey",     control:"Con", difficulty:"medium",    note:"LD making inroads" },
          { name:"Kent",       control:"Con", difficulty:"very hard", note:"Reform prime target" },
          { name:"West Sussex",control:"Con", difficulty:"medium",    note:"Con likely hold" },
        ]
      },
      {
        id:"east", emoji:"🌾", name:"East of England", accentColor:"#12B7D4",
        councils:5, seats:393, type:"County",
        difficulty:"very hard", parties:["Con","Reform","Lab","LD"],
        story:"Essex and Norfolk are Reform UK's biggest prizes. Leave-heavy, coastal, rural — perfect Reform territory.",
        watchFor:"Essex — Reform's most realistic county prize. Norfolk and Suffolk — Reform advance expected.",
        councilsList:[
          { name:"Essex",          control:"Con", difficulty:"very hard", note:"Reform prime target" },
          { name:"Norfolk",        control:"Con", difficulty:"medium",    note:"Reform advance" },
          { name:"Suffolk",        control:"Con", difficulty:"medium",    note:"Reform advance" },
          { name:"Hertfordshire",  control:"Con", difficulty:"medium",    note:"Con likely hold" },
          { name:"Cambridgeshire", control:"NOC", difficulty:"hard",      note:"LD urban pressure" },
        ]
      },
      {
        id:"midlands", emoji:"🏭", name:"Midlands", accentColor:"#12B7D4",
        councils:4, seats:240, type:"County & Unitary",
        difficulty:"very hard", parties:["Reform","Con","Lab","Grn"],
        story:"Reform UK target territory. Leave-heavy, ex-Labour heartlands. Nottinghamshire on a knife-edge.",
        watchFor:"Nottinghamshire — wafer-thin Con majority. Warwickshire — three-way marginal.",
        councilsList:[
          { name:"Nottinghamshire",control:"Con", difficulty:"very hard", note:"Majority of 2 — most marginal" },
          { name:"Warwickshire",   control:"Con", difficulty:"very hard", note:"Three-way marginal" },
          { name:"Leicestershire", control:"Con", difficulty:"very hard", note:"Reform and Lab competitive" },
          { name:"Worcestershire", control:"Con", difficulty:"medium",    note:"Reform advance likely" },
        ]
      },
      {
        id:"northwest", emoji:"⚽", name:"North West", accentColor:"#E4003B",
        councils:2, seats:139, type:"County & Unitary",
        difficulty:"very hard", parties:["Lab","Reform","Con","LD"],
        story:"Lancashire is Labour's most exposed council. Reform polling strongly in ex-Red Wall seats.",
        watchFor:"Lancashire — Lab majority of 4, Reform surging. Doncaster — Labour must hold.",
        councilsList:[
          { name:"Lancashire", control:"Lab", difficulty:"very hard", note:"Labour existential — majority of 4" },
          { name:"Doncaster",  control:"Lab", difficulty:"hard",      note:"Reform targeting symbolic seat" },
        ]
      },
      {
        id:"southwest", emoji:"🌾", name:"South West", accentColor:"#FAA61A",
        councils:3, seats:168, type:"County & Unitary",
        difficulty:"medium", parties:["LD","Con","Grn","Lab"],
        story:"Lib Dem heartland. Somerset held, Devon and Gloucestershire contested. Greens growing in Bristol area.",
        watchFor:"Gloucestershire — three-way marginal. Devon — LD vs Con.",
        councilsList:[
          { name:"Devon",          control:"Con", difficulty:"hard",      note:"LD making inroads" },
          { name:"Gloucestershire",control:"Con", difficulty:"very hard", note:"Three-way marginal" },
          { name:"Somerset",       control:"LD",  difficulty:"medium",    note:"LD defending" },
        ]
      },
      {
        id:"northeast", emoji:"🏔", name:"North & Yorkshire", accentColor:"#6b7280",
        councils:2, seats:157, type:"County & Unitary",
        difficulty:"hard", parties:["Con","Lab","Reform"],
        story:"Northumberland is a three-way fight. North Yorkshire is a large Con majority but Reform are polling well.",
        watchFor:"Northumberland — Reform vs Lab vs Con. Most marginal in the region.",
        councilsList:[
          { name:"Northumberland",  control:"Con", difficulty:"very hard", note:"Three-way marginal" },
          { name:"North Yorkshire", control:"Con", difficulty:"medium",    note:"Con large majority" },
          { name:"Durham",          control:"Lab", difficulty:"hard",      note:"Reform target" },
        ]
      },
    ],
    localCouncils: [
      { name:"Cambridgeshire",  region:"East",        type:"County",   control:"NOC", seats:61,  majority:0,  lastFought:2021, watchFor:"LD targeting urban Cambridge fringe.",         verdict:"LD target majority",    difficulty:"medium"    },
      { name:"Devon",           region:"South West",  type:"County",   control:"Con", seats:60,  majority:8,  lastFought:2021, watchFor:"LD making inroads in coastal and university towns.", verdict:"Con defend",         difficulty:"hard"      },
      { name:"Essex",           region:"East",        type:"County",   control:"Con", seats:75,  majority:20, lastFought:2021, watchFor:"Reform UK targeting Leave-voting Essex heartlands.", verdict:"Reform target",       difficulty:"very hard" },
      { name:"Gloucestershire", region:"South West",  type:"County",   control:"Con", seats:53,  majority:6,  lastFought:2021, watchFor:"Three-way marginal. LD, Green and Reform all competitive.", verdict:"Toss-up",        difficulty:"very hard" },
      { name:"Hampshire",       region:"South East",  type:"County",   control:"Con", seats:78,  majority:16, lastFought:2021, watchFor:"LD Blue Wall advance. Con defending large majority won at Johnson-era peak.", verdict:"LD opportunity", difficulty:"hard" },
      { name:"Hertfordshire",   region:"East",        type:"County",   control:"Con", seats:78,  majority:26, lastFought:2021, watchFor:"Con stronghold but Reform polling well in Leave areas.", verdict:"Con likely hold", difficulty:"medium"    },
      { name:"Kent",            region:"South East",  type:"County",   control:"Con", seats:81,  majority:24, lastFought:2021, watchFor:"Reform UK prime target. High Leave vote, coastal towns.", verdict:"Reform prime target", difficulty:"very hard" },
      { name:"Lancashire",      region:"North West",  type:"County",   control:"Lab", seats:84,  majority:4,  lastFought:2021, watchFor:"Lab on knife-edge. Reform targeting ex-Red Wall seats.", verdict:"Lab existential",    difficulty:"very hard" },
      { name:"Leicestershire",  region:"Midlands",    type:"County",   control:"Con", seats:55,  majority:6,  lastFought:2021, watchFor:"Con defending narrow majority. Reform and Lab both competitive.", verdict:"Three-way marginal", difficulty:"very hard" },
      { name:"Lincolnshire",    region:"East Midlands",type:"County",  control:"Con", seats:70,  majority:28, lastFought:2021, watchFor:"Strong Leave county. Reform could make big gains.", verdict:"Reform gains likely", difficulty:"medium"    },
      { name:"Norfolk",         region:"East",        type:"County",   control:"Con", seats:84,  majority:14, lastFought:2021, watchFor:"Reform UK targeting coastal and rural Norfolk.", verdict:"Reform advance",      difficulty:"medium"    },
      { name:"North Yorkshire", region:"North",       type:"County",   control:"Con", seats:90,  majority:30, lastFought:2021, watchFor:"Large rural county. Con have a big majority.", verdict:"Con likely hold",     difficulty:"medium"    },
      { name:"Nottinghamshire", region:"East Midlands",type:"County",  control:"Con", seats:66,  majority:2,  lastFought:2021, watchFor:"Wafer-thin Con majority. Lab, Reform and Green all in play.", verdict:"Toss-up",        difficulty:"very hard" },
      { name:"Oxfordshire",     region:"South East",  type:"County",   control:"NOC", seats:63,  majority:0,  lastFought:2021, watchFor:"LD aiming for outright majority.", verdict:"LD target majority",    difficulty:"medium"    },
      { name:"Suffolk",         region:"East",        type:"County",   control:"Con", seats:75,  majority:14, lastFought:2021, watchFor:"Reform UK targeting Leave-heavy Suffolk.", verdict:"Reform advance",      difficulty:"medium"    },
      { name:"Surrey",          region:"South East",  type:"County",   control:"Con", seats:80,  majority:30, lastFought:2021, watchFor:"LD Blue Wall territory.", verdict:"LD advance",             difficulty:"medium"    },
      { name:"Warwickshire",    region:"Midlands",    type:"County",   control:"Con", seats:62,  majority:4,  lastFought:2021, watchFor:"Very marginal. Lab and Reform both competitive with Con.", verdict:"Three-way marginal", difficulty:"very hard" },
      { name:"West Sussex",     region:"South East",  type:"County",   control:"Con", seats:71,  majority:22, lastFought:2021, watchFor:"LD making inroads in coastal towns.", verdict:"Con likely hold",     difficulty:"medium"    },
      { name:"Worcestershire",  region:"Midlands",    type:"County",   control:"Con", seats:57,  majority:14, lastFought:2021, watchFor:"Reform UK target. Leave-heavy county.", verdict:"Reform advance",      difficulty:"medium"    },
      { name:"Doncaster",       region:"Yorkshire",   type:"Unitary",  control:"Lab", seats:55,  majority:10, lastFought:2021, watchFor:"Traditional Labour heartland. Reform polling strongly here.", verdict:"Lab must hold",  difficulty:"hard"    },
      { name:"Durham",          region:"North East",  type:"Unitary",  control:"Lab", seats:63,  majority:8,  lastFought:2021, watchFor:"Reform UK made gains at GE2024 in Durham seats.", verdict:"Reform target",       difficulty:"hard"    },
      { name:"Northumberland",  region:"North East",  type:"Unitary",  control:"Con", seats:67,  majority:4,  lastFought:2021, watchFor:"Reform vs Lab vs Con three-way.", verdict:"Three-way marginal",   difficulty:"very hard" },
      { name:"Somerset",        region:"South West",  type:"Unitary",  control:"LD",  seats:55,  majority:12, lastFought:2021, watchFor:"LD defending majority. Green competition in university areas.", verdict:"LD defend",   difficulty:"medium"  },
    ],
  },

}

export default POLITISCOPE_DATA
