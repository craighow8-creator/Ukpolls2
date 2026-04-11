var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-TyaL7K/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/utils/electionsHelpers.js
function cleanText(value) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}
__name(cleanText, "cleanText");
function slugifyCouncilName(value) {
  return cleanText(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
__name(slugifyCouncilName, "slugifyCouncilName");
function normalizeMayorParty(party) {
  const value = cleanText(party).toLowerCase();
  if (!value) return { key: "other", label: "Other" };
  if (value.includes("labour")) return { key: "labour", label: "Labour" };
  if (value.includes("conservative")) return { key: "conservative", label: "Conservative" };
  if (value.includes("reform")) return { key: "reform", label: "Reform" };
  if (value.includes("liberal")) return { key: "libdem", label: "Liberal Democrats" };
  if (value.includes("aspire")) return { key: "aspire", label: "Aspire" };
  return { key: "other", label: cleanText(party) || "Other" };
}
__name(normalizeMayorParty, "normalizeMayorParty");
function createRegionalMayorProfile(row = {}) {
  return {
    name: cleanText(row.name),
    holder: cleanText(row.holder),
    party: cleanText(row.party),
    color: row.color || "#12B7D4",
    status: cleanText(row.status) || "Regional mayor",
    electedDate: row.electedDate || "",
    officeStartDate: row.officeStartDate || "",
    website: cleanText(row.website),
    contactUrl: cleanText(row.contactUrl),
    email: cleanText(row.email),
    contactNote: cleanText(row.contactNote),
    category: cleanText(row.category),
    signal: cleanText(row.signal),
    breakthroughType: cleanText(row.breakthroughType),
    politicalWeight: cleanText(row.politicalWeight),
    importance: cleanText(row.importance),
    politicalReading: cleanText(row.politicalReading),
    whyItMattersNow: cleanText(row.whyItMattersNow || row.mattersNow),
    note: cleanText(row.note),
    context: cleanText(row.context),
    nationalProfile: !!row.nationalProfile,
    mixedRegion: !!row.mixedRegion,
    newMayoralty: !!row.newMayoralty
  };
}
__name(createRegionalMayorProfile, "createRegionalMayorProfile");
function createDevolvedNationProfile(row = {}) {
  const partyLandscape = (row.partyLandscape || row.parties || []).map((party) => ({
    party: cleanText(party.party),
    pct: Number(party.pct || 0),
    color: party.color || "#12B7D4",
    trend: cleanText(party.trend)
  }));
  return {
    key: cleanText(row.key),
    title: cleanText(row.title),
    institution: cleanText(row.institution),
    regionLabel: cleanText(row.regionLabel),
    system: cleanText(row.system),
    nextElection: row.nextElection || "",
    accent: row.accent || "#12B7D4",
    politicalPicture: cleanText(row.politicalPicture),
    watch: cleanText(row.watch),
    signal: cleanText(row.signal),
    whyItMattersNow: cleanText(row.whyItMattersNow),
    keyStrategicQuestion: cleanText(row.keyStrategicQuestion),
    partyLandscape,
    // Keep the current screen-compatible key while preparing for a cleaner
    // intelligence-first structure.
    parties: partyLandscape
  };
}
__name(createDevolvedNationProfile, "createDevolvedNationProfile");
function joinLabels(values = []) {
  const list = values.filter(Boolean);
  if (list.length <= 1) return list[0] || "";
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}
__name(joinLabels, "joinLabels");
function buildMayoralLandscape(regionalMayors = [], councilMayors = []) {
  const counts = regionalMayors.reduce(
    (acc, mayor) => {
      const family = normalizeMayorParty(mayor.party).key;
      acc[family] = (acc[family] || 0) + 1;
      return acc;
    },
    { labour: 0, conservative: 0, reform: 0, other: 0 }
  );
  const conservativeRegions = regionalMayors.filter((mayor) => normalizeMayorParty(mayor.party).key === "conservative").map((mayor) => mayor.name);
  const reformRegions = regionalMayors.filter((mayor) => normalizeMayorParty(mayor.party).key === "reform").map((mayor) => mayor.name);
  const newMayoralties = regionalMayors.filter((mayor) => mayor.newMayoralty);
  const nonLabourRegional = regionalMayors.filter(
    (mayor) => normalizeMayorParty(mayor.party).key !== "labour"
  );
  const summaryParts = [];
  if (counts.labour > regionalMayors.length / 2) {
    summaryParts.push(
      `Labour hold ${counts.labour} of ${regionalMayors.length} regional mayoralties`
    );
  }
  if (counts.conservative > 0) {
    summaryParts.push(
      counts.conservative === 1 ? "Conservative strength now rests on a single regional holdout" : `Conservatives are down to ${counts.conservative} regional holdouts`
    );
  }
  if (counts.reform > 0) {
    summaryParts.push(
      counts.reform === 1 ? "Reform have broken through in one new mayoralty" : `Reform have broken through in ${counts.reform} new mayoralties`
    );
  }
  if (newMayoralties.length > 0) {
    summaryParts.push(
      newMayoralties.length === 1 ? "One newly created office is still defining its political role" : `${newMayoralties.length} newly created offices are still settling into the map`
    );
  }
  const whatMatters = [];
  if (counts.labour > 0) {
    whatMatters.push(
      `Labour's regional strength is broadest across the big metro offices.`
    );
  }
  if (counts.conservative > 0) {
    whatMatters.push(
      conservativeRegions.length <= 2 ? `Conservative resilience is concentrated in ${joinLabels(conservativeRegions)}.` : "Conservative mayoral strength is now concentrated rather than broad."
    );
  }
  if (counts.reform > 0) {
    whatMatters.push(
      reformRegions.length <= 2 ? `${joinLabels(reformRegions)} now test whether Reform can turn breakthroughs into governing records.` : "Reform now have to turn fresh breakthroughs into durable regional authority."
    );
  }
  if (newMayoralties.length > 0) {
    whatMatters.push(
      `${newMayoralties.length} newer mayoralties still matter as devolution test cases, not settled institutions.`
    );
  }
  return {
    totalRegional: regionalMayors.length,
    totalCouncil: councilMayors.length,
    totalTracked: regionalMayors.length + councilMayors.length,
    labourRegional: counts.labour,
    conservativeRegional: counts.conservative,
    reformRegional: counts.reform,
    nonLabourRegional: nonLabourRegional.length,
    newRegional: newMayoralties.length,
    summary: summaryParts.length ? `${summaryParts.slice(0, 2).join(". ")}.` : "Regional mayoralties now matter as tests of executive delivery as well as party strength.",
    whatMatters: whatMatters.slice(0, 3)
  };
}
__name(buildMayoralLandscape, "buildMayoralLandscape");
function deriveDevolvedOverview(nations = []) {
  const scotland = nations.find((nation) => nation.key === "scotland");
  const wales = nations.find((nation) => nation.key === "wales");
  const parts = [];
  if (scotland?.keyStrategicQuestion) parts.push(scotland.keyStrategicQuestion);
  if (wales?.keyStrategicQuestion) parts.push(wales.keyStrategicQuestion);
  return {
    title: "Why this matters now",
    summary: parts.length > 0 ? `${parts.join(" ")} In both systems, finishing first does not guarantee control \u2014 the seat maths can produce more complicated outcomes.` : "In Scotland and Wales, proportional systems make the contest about coalition maths as well as who finishes first."
  };
}
__name(deriveDevolvedOverview, "deriveDevolvedOverview");

// src/data/electionsMayorsEnrichment.js
var REGIONAL_ENRICHMENTS = {
  // ── Example structure (uncomment and adjust to apply) ──────────────────────
  // 'Tees Valley': {
  //   signal: 'Conservative holdout under increased national pressure',
  //   note: 'Updated note for current political context.',
  //   updatedAt: '2026-04-10',   // provenance only — stripped from shaped output
  // },
  // 'Hull & East Yorkshire': {
  //   note: 'First full year of the mayoralty is now the real test of delivery.',
  //   mattersNow: 'Reform now has to show it can govern, not just win.',
  //   updatedAt: '2026-04-10',
  // },
};
var COUNCIL_ENRICHMENTS = {
  // ── Example structure ──────────────────────────────────────────────────────
  // 'Bedford': {
  //   holder: 'Updated Holder Name',
  //   party: 'Labour',
  //   color: '#E4003B',
  //   updatedAt: '2026-04-10',
  // },
};
var DEFAULT_MAYOR_ENRICHMENTS = {
  regional: REGIONAL_ENRICHMENTS,
  council: COUNCIL_ENRICHMENTS
};

// src/data/electionsMayorsExternalSource.js
var MAYOR_EXTERNAL_ALLOWED_FIELDS = [
  "holder",
  "electedDate",
  "officeStartDate",
  "website",
  "contactUrl",
  "email",
  "contactNote",
  "note",
  "importance"
];
var DEFAULT_MAYOR_EXTERNAL_SOURCE = {
  meta: {
    sourceCount: 1,
    sourceType: "adapter-ready-maintained-external-source",
    coverageNote: "Mayors external-source adapter currently uses a maintained structured input file and can later be replaced by a live feed."
  },
  regional: [
    {
      name: "London",
      source: "official-city-hall-directory",
      fetchedAt: "2026-04-10",
      holder: "Sadiq Khan",
      website: "https://www.london.gov.uk/home-page-london-city-hall",
      contactUrl: "https://www.london.gov.uk/who-we-are/what-mayor-does/contact-city-hall-or-mayor",
      email: "mayor@london.gov.uk",
      contactNote: "Official City Hall contact route."
    },
    {
      name: "Greater Manchester",
      source: "greater-manchester-mayor-profile",
      fetchedAt: "2026-04-10",
      holder: "Andy Burnham",
      website: "https://www.greatermanchester-ca.gov.uk/the-mayor/",
      contactUrl: "https://www.greatermanchester-ca.gov.uk/contact/mayor/",
      email: "andy.burnham@greatermanchester-ca.gov.uk"
    }
  ],
  council: []
};

// src/data/electionsMayors.js
var REGIONAL_MAYOR_SOURCE = [
  {
    name: "London",
    holder: "Sadiq Khan",
    party: "Labour",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Labour stronghold",
    category: "capital",
    importance: "Highest-profile regional office",
    politicalWeight: "high",
    nationalProfile: true,
    note: "England\u2019s highest-profile mayoralty, combining city-wide visibility with major transport and planning clout.",
    mattersNow: "Labour\u2019s flagship mayoralty still sets the tone for whether city leadership can carry national political weight.",
    context: "London is the best-known example of the English mayoral model. The office-holder shapes transport, housing, planning, policing oversight and city-wide political messaging, so the Mayor of London is judged both as an executive manager and as a national political figure. That makes this role more exposed than almost any other directly elected office below Westminster.",
    electedDate: "2024-05-04",
    website: "https://www.london.gov.uk/home-page-london-city-hall",
    contactUrl: "https://www.london.gov.uk/who-we-are/what-mayor-does/contact-city-hall-or-mayor",
    email: "mayor@london.gov.uk",
    contactNote: "Official City Hall contact route."
  },
  {
    name: "Greater Manchester",
    holder: "Andy Burnham",
    party: "Labour Co-op",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Labour stronghold",
    category: "metro",
    importance: "Flagship metro mayoralty",
    politicalWeight: "high",
    nationalProfile: true,
    note: "One of the strongest metro mayor offices in England, with real political weight beyond the city-region itself.",
    mattersNow: "Greater Manchester remains one of Labour\u2019s clearest regional power bases and a visible test of English devolution.",
    context: "Greater Manchester matters because the mayor is expected to be more than a local administrator. The office often shapes wider debates about English devolution, transport reform, regional identity and Labour\u2019s strength outside London. In practice, the role works best when the mayor looks visible enough to represent the whole city-region while still delivering tangible policy wins.",
    electedDate: "2024-05-04",
    website: "https://www.greatermanchester-ca.gov.uk/the-mayor/",
    contactUrl: "https://www.greatermanchester-ca.gov.uk/contact/mayor/",
    email: "andy.burnham@greatermanchester-ca.gov.uk",
    contactNote: "Official mayor contact page."
  },
  {
    name: "West Midlands",
    holder: "Richard Parker",
    party: "Labour Co-op",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Politically mixed region",
    category: "mixed-region",
    importance: "Major swing-region mayoralty",
    politicalWeight: "high",
    mixedRegion: true,
    note: "A politically mixed region where the mayoralty can swing with the broader mood, but local credibility still matters.",
    mattersNow: "This is one of the clearest regional tests of whether Labour can hold a mixed urban and suburban coalition.",
    context: "The West Midlands is one of the clearest tests of whether a mayor can hold together very different urban, suburban and town priorities under one regional brand. It is politically mixed enough that party alone does not settle the argument. The mayor has to look like a practical regional leader rather than just a party representative.",
    electedDate: "2024-05-04",
    website: "https://www.wmca.org.uk/mayor-of-the-west-midlands-more-information-about-the-role/",
    contactUrl: "https://governance.wmca.org.uk/mgUserInfo.aspx?UID=2555",
    email: "richard.parker@wmca.org.uk",
    contactNote: "Official WMCA profile and contact details."
  },
  {
    name: "West Yorkshire",
    holder: "Tracy Brabin",
    party: "Labour Co-op",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Labour stronghold",
    category: "metro",
    politicalWeight: "medium",
    note: "A major northern mayoralty where transport, regeneration and visibility all matter to how the office is judged.",
    mattersNow: "West Yorkshire helps show whether Labour can pair northern urban strength with visible regional delivery.",
    context: "West Yorkshire matters because voters are not only judging party loyalty. They are also judging whether the mayor looks like a recognisable advocate for the region, with enough political weight to push investment, safer streets and transport integration across Bradford, Calderdale, Kirklees, Leeds and Wakefield.",
    electedDate: "2024-05-04",
    website: "https://www.westyorks-ca.gov.uk/the-mayor-of-west-yorkshire/",
    contactUrl: "https://www.westyorks-ca.gov.uk/contact-us/",
    email: "Mayoral.Enquiries@westyorks-ca.gov.uk",
    contactNote: "Official mayoral enquiries route."
  },
  {
    name: "South Yorkshire",
    holder: "Oliver Coppard",
    party: "Labour Co-op",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Labour stronghold",
    category: "metro",
    politicalWeight: "medium",
    note: "A South Yorkshire mayor now combines regional leadership with policing powers, making the office more politically significant.",
    mattersNow: "The added policing brief makes this office a sharper test of Labour\u2019s grip on both delivery and visible public order.",
    context: "This office is no longer just about regional investment and transport. The added policing role raises the political stakes and makes performance easier for voters to judge. A South Yorkshire mayor has to look capable on both long-term economic strategy and immediate public concerns.",
    electedDate: "2024-05-04",
    website: "https://www.southyorkshire-ca.gov.uk/about-the-mayor",
    contactUrl: "https://www.southyorkshire-ca.gov.uk/about-the-mayor",
    email: "Mayor@southyorkshire-ca.gov.uk",
    contactNote: "Official mayoral office email."
  },
  {
    name: "Liverpool City Region",
    holder: "Steve Rotheram",
    party: "Labour",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Labour stronghold",
    category: "metro",
    politicalWeight: "medium",
    note: "A strong regional identity makes this a mayoralty where the office-holder is expected to act as a public champion, not just an administrator.",
    mattersNow: "Liverpool City Region is one of the clearest examples of a mayoralty becoming part of a region\u2019s political identity.",
    context: "Liverpool City Region matters because the mayor has to look like the voice of the region while also delivering practical gains. Symbolism and delivery both count here. It is one of the clearest examples of a mayoralty becoming part of how a region presents itself politically and economically.",
    electedDate: "2024-05-04",
    website: "https://www.liverpoolcityregion-ca.gov.uk/your-metro-mayor",
    contactUrl: "https://www.liverpoolcityregion-ca.gov.uk/",
    email: "",
    contactNote: "Official combined authority contact page and phone route are published; no direct public mayor email was surfaced."
  },
  {
    name: "North East",
    holder: "Kim McGuinness",
    party: "Labour Co-op",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Devolution test case",
    category: "devolution-test",
    importance: "New regional office with broad reach",
    politicalWeight: "medium",
    newMayoralty: true,
    note: "A newer, larger North East mayoralty covering a broad region with big expectations around growth and connectivity.",
    mattersNow: "The question now is whether a still-new office can turn regional scale into visible economic and transport gains.",
    context: "This office matters because it is part of a bigger devolution story in the North East. The challenge is turning a new regional structure into something voters actually feel in jobs, transport, investment and visible leadership across a very broad patch.",
    electedDate: "2024-05-02",
    officeStartDate: "2024-05-07",
    website: "https://www.northeast-ca.gov.uk/about/the-mayor",
    contactUrl: "https://www.northeast-ca.gov.uk/contact-us",
    email: "mayorsoffice@northeast-ca.gov.uk",
    contactNote: "Official mayor\u2019s office email."
  },
  {
    name: "East Midlands",
    holder: "Claire Ward",
    party: "Labour Co-op",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Devolution test case",
    category: "devolution-test",
    importance: "New combined-county office",
    politicalWeight: "medium",
    newMayoralty: true,
    mixedRegion: true,
    note: "A new combined-county mayoralty trying to turn a large, varied region into a recognisable political unit.",
    mattersNow: "East Midlands will show whether Labour can make a new and uneven region feel politically coherent quickly.",
    context: "The East Midlands office matters because the region is politically and geographically broad. The task is to make the mayoralty feel coherent rather than artificial, and to prove that one regional office can speak credibly to different places with different priorities.",
    electedDate: "2024-05-03",
    website: "https://www.eastmidlands-cca.gov.uk/the-mayor/",
    contactUrl: "https://democracy.eastmidlands-cca.gov.uk/mgUserInfo.aspx?UID=107",
    email: "Claire.Ward@eastmidlands-cca.gov.uk",
    contactNote: "Official mayor profile and contact details."
  },
  {
    name: "York and North Yorkshire",
    holder: "David Skaith",
    party: "Labour Co-op",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Devolution test case",
    category: "devolution-test",
    importance: "Mixed urban-rural mayoralty",
    politicalWeight: "medium",
    newMayoralty: true,
    mixedRegion: true,
    note: "A mixed urban-rural mayoralty where the office-holder has to balance York\u2019s priorities with those of a much wider county.",
    mattersNow: "This office matters because Labour has to show it can hold together a mixed city-and-county coalition.",
    context: "This role matters because it forces one regional leader to bridge very different local identities. Success depends on looking credible across the whole patch, not just one centre. The office has to feel relevant to both York and a much wider rural and market-town landscape.",
    electedDate: "2024-05-03",
    officeStartDate: "2024-05-07",
    website: "https://yorknorthyorks-ca.gov.uk/meet-your-mayor/",
    contactUrl: "https://yorknorthyorks-ca.gov.uk/contact-us/",
    email: "",
    contactNote: "Official combined authority contact page is public; no direct public mayor email was surfaced."
  },
  {
    name: "Tees Valley",
    holder: "Ben Houchen",
    party: "Conservative",
    color: "#0087DC",
    status: "Regional mayor",
    signal: "Conservative holdout",
    category: "holdout",
    importance: "High-profile Conservative base",
    politicalWeight: "high",
    nationalProfile: true,
    note: "One of the best-known Conservative mayoralties, with a strong focus on visible economic projects and regional branding.",
    mattersNow: "Tees Valley remains a key Conservative holdout and a test of whether a strong personal brand can outlast the national tide.",
    context: "Tees Valley matters because it has often been used as proof that a mayor can build a personal brand that cuts across wider party trends. The office is judged heavily on visible development, industrial politics and whether the mayor can keep looking like a deal-maker for the region.",
    electedDate: "2024-05-02",
    website: "https://teesvalley-ca.gov.uk/about/leadership/mayor/",
    contactUrl: "https://teesvalley-ca.gov.uk/about/leadership/mayor/",
    email: "ben.houchen@teesvalley-ca.gov.uk",
    contactNote: "Official mayor page plus publicly cited official email in authority documents."
  },
  {
    name: "Cambridgeshire & Peterborough",
    holder: "Paul Bristow",
    party: "Conservative",
    color: "#0087DC",
    status: "Regional mayor",
    signal: "Conservative holdout",
    category: "holdout",
    importance: "Growth-region Conservative test",
    politicalWeight: "medium",
    mixedRegion: true,
    note: "A broad and politically uneven region where the mayor has to speak to very different communities and priorities.",
    mattersNow: "This is one of the few remaining Conservative regional bases and a live test of centre-right resilience outside Westminster.",
    context: "This office matters because success depends on holding together places with very different pressures, from growth corridors and science-driven expansion to market towns and suburban concerns. A regional mayor here has to look balanced, practical and attentive to competing local demands.",
    electedDate: "2025-05-02",
    website: "https://democracy.cambridgeshirepeterborough-ca.gov.uk/mgUserInfo.aspx?UID=362",
    contactUrl: "https://democracy.cambridgeshirepeterborough-ca.gov.uk/mgUserInfo.aspx?UID=362",
    email: "mayorsoffice@cambridgeshirepeterborough-ca.gov.uk",
    contactNote: "Official mayor profile and office email."
  },
  {
    name: "West of England",
    holder: "Helen Godwin",
    party: "Labour",
    color: "#E4003B",
    status: "Regional mayor",
    signal: "Politically mixed region",
    category: "mixed-region",
    importance: "Urban coalition test",
    politicalWeight: "medium",
    mixedRegion: true,
    note: "A politically mixed region where the mayoralty is a live test of whether Labour can hold together an urban regional coalition.",
    mattersNow: "West of England is a good test of whether Labour can turn a mixed region into a durable mayoral coalition.",
    context: "West of England matters because it is not naturally tidy political territory. The mayor has to look practical, local and visible enough to hold a mixed electorate together across Bristol, Bath and surrounding areas, while still showing clear regional purpose.",
    electedDate: "2025-05-02",
    website: "https://www.westofengland-ca.gov.uk/about-us/the-mayor/",
    contactUrl: "https://www.westofengland-ca.gov.uk/about-us/contact-us/",
    email: "info@westofengland-ca.gov.uk",
    contactNote: "Official combined authority contact route."
  },
  {
    name: "Hull & East Yorkshire",
    holder: "Luke Campbell",
    party: "Reform UK",
    color: "#12B7D4",
    status: "Regional mayor",
    signal: "Reform breakthrough",
    category: "new-mayoralty",
    importance: "First-wave Reform test case",
    breakthroughType: "Reform breakthrough now under delivery test",
    politicalWeight: "high",
    newMayoralty: true,
    note: "A new mayoralty where the first winner now has to prove that a breakthrough result can become durable regional leadership.",
    mattersNow: "Hull and East Yorkshire is now a test of whether Reform can turn a first breakthrough into credible regional government.",
    context: "Hull and East Yorkshire matters because the launch election is over. The real question now is whether a high-profile first mayor can turn attention into lasting authority, shape the regional agenda and make the office feel meaningful quickly.",
    electedDate: "2025-05-02",
    officeStartDate: "2025-05-06",
    website: "https://www.hullandeastyorkshire.gov.uk/mayor",
    contactUrl: "https://www.hullandeastyorkshire.gov.uk/executive-board",
    email: "louise.hawkins@ca.hullandeastyorkshire.gov.uk",
    contactNote: "Official authority contact officer listed on the Executive Board page."
  },
  {
    name: "Greater Lincolnshire",
    holder: "Andrea Jenkyns",
    party: "Reform UK",
    color: "#12B7D4",
    status: "Regional mayor",
    signal: "Reform breakthrough",
    category: "new-mayoralty",
    importance: "Reform breakthrough office",
    breakthroughType: "Reform breakthrough now under delivery test",
    politicalWeight: "high",
    newMayoralty: true,
    note: "Another new mayoralty where Reform moved first and now has to show it can turn a breakthrough into credible regional power.",
    mattersNow: "Greater Lincolnshire is another early test of whether Reform can make its first mayoral wins look durable and competent.",
    context: "Greater Lincolnshire matters because it tests whether a new mayoralty can quickly become politically meaningful, and whether Reform can make first-mover advantage stick. The office now has to move from symbolic breakthrough to visible regional leverage.",
    electedDate: "2025-05-02",
    officeStartDate: "2025-05-06",
    website: "https://greaterlincolnshire-cca.gov.uk/about-1/mayor",
    contactUrl: "https://greaterlincolnshire-cca.gov.uk/",
    email: "info@greaterlincolnshire-cca.gov.uk",
    contactNote: "Official authority contact route used by the mayor\u2019s office in published correspondence."
  }
];
var COUNCIL_MAYOR_SOURCE = [
  { area: "Bedford", holder: "Tom Wootton", party: "Conservative", color: "#0087DC", type: "Unitary authority", website: "https://www.bedford.gov.uk/your-council/councillors-and-senior-staff/mayor-bedford-borough", email: "MayorsCasework@bedford.gov.uk" },
  { area: "Croydon", holder: "Jason Perry", party: "Conservative", color: "#0087DC", type: "London borough", website: "https://www.croydon.gov.uk/council-and-elections/mayors-croydon/elected-mayor-croydon/contact-mayor", email: "mayor@croydon.gov.uk" },
  { area: "Doncaster", holder: "Ros Jones", party: "Labour", color: "#E4003B", type: "Metropolitan borough", website: "https://www.doncaster.gov.uk/mayor/mayor-home", email: "" },
  { area: "Hackney", holder: "Caroline Woodley", party: "Labour", color: "#E4003B", type: "London borough", website: "https://www.hackney.gov.uk/council-and-elections/mayor-cabinet-and-councillors/mayor-and-cabinet/mayor-hackney", email: "mayor@hackney.gov.uk" },
  { area: "Leicester", holder: "Peter Soulsby", party: "Labour", color: "#E4003B", type: "Unitary authority", website: "https://www.leicester.gov.uk/about-council/city-mayor-peter-soulsby/contact-me", email: "TheMayor@leicester.gov.uk" },
  { area: "Lewisham", holder: "Brenda Dacres", party: "Labour Co-op", color: "#E4003B", type: "London borough", website: "https://lewisham.gov.uk/mayorandcouncil/mayor-and-cabinet", email: "brenda.dacres@lewisham.gov.uk" },
  { area: "Mansfield", holder: "Andy Abrahams", party: "Labour", color: "#E4003B", type: "District", website: "https://www.mansfield.gov.uk/council-councillors-democracy/meet-mayor-1", email: "mayor@mansfield.gov.uk" },
  { area: "Middlesbrough", holder: "Chris Cooke", party: "Labour Co-op", color: "#E4003B", type: "Unitary authority", website: "https://moderngov.middlesbrough.gov.uk/mgUserInfo.aspx?UID=153", email: "mayor@middlesbrough.gov.uk" },
  { area: "Newham", holder: "Rokhsana Fiaz", party: "Labour Co-op", color: "#E4003B", type: "London borough", website: "https://www.newham.gov.uk/council/mayor-newham-1", email: "" },
  { area: "North Tyneside", holder: "Karen Clark", party: "Labour", color: "#E4003B", type: "Metropolitan borough", website: "https://democracy.northtyneside.gov.uk/mgUserInfo.aspx?UID=141", email: "karen.clark@northtyneside.gov.uk" },
  { area: "Salford", holder: "Paul Dennett", party: "Labour", color: "#E4003B", type: "Metropolitan borough", website: "https://www.salford.gov.uk/your-council/city-mayor/", email: "" },
  { area: "Tower Hamlets", holder: "Lutfur Rahman", party: "Aspire", color: "#8B5CF6", type: "London borough", website: "https://democracy.towerhamlets.gov.uk/mgUserInfo.aspx?UID=312", email: "mayor@towerhamlets.gov.uk" },
  { area: "Watford", holder: "Peter Taylor", party: "Liberal Democrats", color: "#FAA61A", type: "District", website: "https://www.watford.gov.uk/councillors-decision-making/mayor-cabinet", email: "" }
];
function applyEnrichment(sourceRow, enrichmentRecord) {
  if (!enrichmentRecord || Object.keys(enrichmentRecord).length === 0) return sourceRow;
  const { updatedAt: _enrichedAt, ...overrides } = enrichmentRecord;
  return { ...sourceRow, ...overrides };
}
__name(applyEnrichment, "applyEnrichment");
function hasMeaningfulEnrichment(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  return Object.keys(record).some((key) => key !== "updatedAt");
}
__name(hasMeaningfulEnrichment, "hasMeaningfulEnrichment");
function enrichmentCandidateKeys(value) {
  const exact = cleanText(value);
  const lower = exact.toLowerCase();
  const slug = slugifyCouncilName(exact);
  return [...new Set([exact, lower, slug].filter(Boolean))];
}
__name(enrichmentCandidateKeys, "enrichmentCandidateKeys");
function resolveEnrichmentRecord(sourceKey, enrichmentMap = {}) {
  for (const candidate of enrichmentCandidateKeys(sourceKey)) {
    if (Object.prototype.hasOwnProperty.call(enrichmentMap, candidate) && enrichmentMap[candidate] && typeof enrichmentMap[candidate] === "object" && !Array.isArray(enrichmentMap[candidate])) {
      return {
        matchedKey: candidate,
        record: enrichmentMap[candidate]
      };
    }
  }
  return { matchedKey: null, record: null };
}
__name(resolveEnrichmentRecord, "resolveEnrichmentRecord");
function buildEnrichmentDebug(enrichmentMap = {}, matches = []) {
  const loadedKeys = Object.keys(enrichmentMap || {});
  const matchedEntries = matches.filter((match) => match.matchedKey && hasMeaningfulEnrichment(match.record)).map((match) => ({
    sourceKey: match.sourceKey,
    matchedKey: match.matchedKey
  }));
  const matchedKeySet = new Set(matchedEntries.map((entry) => entry.matchedKey));
  return {
    loadedKeys,
    matchedKeys: matchedEntries,
    unmatchedLoadedKeys: loadedKeys.filter((key) => !matchedKeySet.has(key))
  };
}
__name(buildEnrichmentDebug, "buildEnrichmentDebug");
function buildSourceKeyIndex(rows = [], keyField) {
  const index = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const sourceKey = cleanText(row?.[keyField]);
    if (!sourceKey) continue;
    for (const candidate of enrichmentCandidateKeys(sourceKey)) {
      if (!index.has(candidate)) index.set(candidate, sourceKey);
    }
  }
  return index;
}
__name(buildSourceKeyIndex, "buildSourceKeyIndex");
function pickExternalOverrideFields(record = {}) {
  const override = {};
  for (const field of MAYOR_EXTERNAL_ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      override[field] = record[field];
    }
  }
  return override;
}
__name(pickExternalOverrideFields, "pickExternalOverrideFields");
function normalizeMayorExternalSource(externalSource = {}, sourceRows = [], keyField) {
  const rows = Array.isArray(externalSource) ? externalSource : [];
  const keyIndex = buildSourceKeyIndex(sourceRows, keyField);
  const overrides = {};
  const loadedKeys = [];
  const matched = [];
  const unmatched = [];
  for (const record of rows) {
    const rawKey = cleanText(record?.[keyField] || record?.name || record?.area || record?.office || record?.matchKey);
    if (!rawKey) continue;
    loadedKeys.push(rawKey);
    let canonicalSourceKey = "";
    let matchedKey = "";
    for (const candidate of enrichmentCandidateKeys(rawKey)) {
      if (keyIndex.has(candidate)) {
        canonicalSourceKey = keyIndex.get(candidate) || "";
        matchedKey = candidate;
        break;
      }
    }
    if (!canonicalSourceKey) {
      unmatched.push(rawKey);
      continue;
    }
    const safeFields = pickExternalOverrideFields(record);
    if (!Object.keys(safeFields).length) continue;
    const previous = overrides[canonicalSourceKey] || {};
    overrides[canonicalSourceKey] = {
      ...previous,
      ...safeFields,
      updatedAt: record.fetchedAt || record.updatedAt || previous.updatedAt || ""
    };
    matched.push({
      sourceKey: canonicalSourceKey,
      matchedKey,
      loadedKey: rawKey,
      updatedFields: Object.keys(safeFields)
    });
  }
  return {
    overrides,
    loadedKeys,
    matched,
    unmatched,
    appliedCount: Object.keys(overrides).length
  };
}
__name(normalizeMayorExternalSource, "normalizeMayorExternalSource");
function mergeOverrideMaps(baseMap = {}, higherPriorityMap = {}) {
  const merged = { ...baseMap };
  for (const [key, value] of Object.entries(higherPriorityMap || {})) {
    merged[key] = { ...baseMap[key] || {}, ...value || {} };
  }
  return merged;
}
__name(mergeOverrideMaps, "mergeOverrideMaps");
function buildMayorsIntelligencePayload(options = {}) {
  const updatedAt = options.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
  const sourceCount = Number(options.sourceCount || 1);
  const enrichments = options.enrichments !== void 0 ? options.enrichments : DEFAULT_MAYOR_ENRICHMENTS;
  const externalSource = options.externalSource !== void 0 ? options.externalSource : DEFAULT_MAYOR_EXTERNAL_SOURCE;
  const regionalEnrich = enrichments && enrichments.regional || {};
  const councilEnrich = enrichments && enrichments.council || {};
  const externalRegional = normalizeMayorExternalSource(
    externalSource && externalSource.regional,
    REGIONAL_MAYOR_SOURCE,
    "name"
  );
  const externalCouncil = normalizeMayorExternalSource(
    externalSource && externalSource.council,
    COUNCIL_MAYOR_SOURCE,
    "area"
  );
  const mergedRegionalOverrides = mergeOverrideMaps(externalRegional.overrides, regionalEnrich);
  const mergedCouncilOverrides = mergeOverrideMaps(externalCouncil.overrides, councilEnrich);
  const regionalMatches = REGIONAL_MAYOR_SOURCE.map((row) => ({
    sourceKey: row.name,
    ...resolveEnrichmentRecord(row.name, mergedRegionalOverrides)
  }));
  const councilMatches = COUNCIL_MAYOR_SOURCE.map((row) => ({
    sourceKey: row.area,
    ...resolveEnrichmentRecord(row.area, mergedCouncilOverrides)
  }));
  const regionalEnrichedCount = regionalMatches.filter((match) => hasMeaningfulEnrichment(match.record)).length;
  const councilEnrichedCount = councilMatches.filter((match) => hasMeaningfulEnrichment(match.record)).length;
  const enrichedCount = regionalEnrichedCount + councilEnrichedCount;
  const externalOverrideCount = externalRegional.appliedCount + externalCouncil.appliedCount;
  const regional = REGIONAL_MAYOR_SOURCE.map((row) => applyEnrichment(row, resolveEnrichmentRecord(row.name, mergedRegionalOverrides).record)).map(createRegionalMayorProfile);
  const council = COUNCIL_MAYOR_SOURCE.map((row) => applyEnrichment(row, resolveEnrichmentRecord(row.area, mergedCouncilOverrides).record)).map((row) => ({ ...row }));
  const landscape = buildMayoralLandscape(regional, council);
  const enrichmentActive = enrichedCount > 0;
  const externalActive = externalOverrideCount > 0;
  const externalSourceType = cleanText(externalSource?.meta?.sourceType) || "adapter-ready-maintained-external-source";
  const externalCoverageNote = cleanText(externalSource?.meta?.coverageNote) || "Mayors external-source adapter currently uses a maintained structured input file and can later be replaced by a live feed.";
  const effectiveSourceCount = Math.max(sourceCount, Number(externalSource?.meta?.sourceCount || 0) || 0, 1);
  return {
    // Derived landscape summary: party counts, summary line, whatMatters points.
    overview: {
      ...landscape,
      keyPoliticalPicture: [...landscape.whatMatters || []]
    },
    // Shaped regional mayor profiles — enrichment overrides applied where present.
    regional,
    // Council mayor directory rows — enrichment overrides applied where present.
    council,
    // Provenance and enrichment metadata updated on every refresh run.
    meta: {
      updatedAt,
      sourceCount: effectiveSourceCount,
      // enrichedCount: how many source records had at least one overridden field.
      enrichedCount,
      externalOverrideCount,
      externalSourceUsed: externalActive,
      // sourceType shifts from 'maintained' to 'maintained-with-enrichment' as
      // soon as higher layers are active.
      sourceType: enrichmentActive ? externalActive ? "maintained-with-external-and-manual-enrichment" : "maintained-with-enrichment" : externalActive ? "maintained-with-external-adapter" : "backend-shaped-from-maintained-source",
      coverageNote: enrichmentActive ? externalActive ? `Mayors intelligence shaped from maintained source, ${externalSourceType}, and ${enrichedCount} manual override record(s).` : `Mayors intelligence shaped from maintained source with ${enrichedCount} enriched record override(s).` : externalActive ? `${externalCoverageNote} ${externalOverrideCount} external override record(s) currently apply.` : "Regional and council mayor intelligence is currently shaped from the maintained Elections source set."
    },
    ...options.includeDebug ? {
      // Temporary local verification aid while the first refreshable Elections
      // enrichment path is being bedded in. Remove once the matching flow is trusted.
      _debug: {
        regional: buildEnrichmentDebug(regionalEnrich, regionalMatches),
        council: buildEnrichmentDebug(councilEnrich, councilMatches),
        external: {
          regional: {
            loadedKeys: externalRegional.loadedKeys,
            matchedKeys: externalRegional.matched,
            unmatchedLoadedKeys: externalRegional.unmatched
          },
          council: {
            loadedKeys: externalCouncil.loadedKeys,
            matchedKeys: externalCouncil.matched,
            unmatchedLoadedKeys: externalCouncil.unmatched
          }
        }
      }
    } : {}
  };
}
__name(buildMayorsIntelligencePayload, "buildMayorsIntelligencePayload");
var REGIONAL_MAYORS = REGIONAL_MAYOR_SOURCE.map(createRegionalMayorProfile);
var COUNCIL_MAYORS = COUNCIL_MAYOR_SOURCE.map((row) => ({ ...row }));
var MAYORS_OVERVIEW = buildMayoralLandscape(REGIONAL_MAYORS, COUNCIL_MAYORS);

// src/data/electionsDevolvedEnrichment.js
var DEVOLVED_NATION_ENRICHMENTS = {
  // Example:
  // scotland: {
  //   politicalPicture: 'Labour have narrowed the contest, but the SNP remain ahead.',
  //   updatedAt: '2026-04-10',
  // },
};
var DEFAULT_DEVOLVED_ENRICHMENTS = {
  nations: DEVOLVED_NATION_ENRICHMENTS
};

// src/data/electionsDevolved.js
var DEVOLVED_NATION_SOURCE = [
  {
    key: "scotland",
    title: "Scotland",
    institution: "Scottish Parliament",
    regionLabel: "Holyrood",
    system: "Additional Member System",
    nextElection: "2026-05-07",
    accent: "#C4922A",
    keyStrategicQuestion: "In Scotland, the question is whether Labour can seriously threaten the SNP.",
    whyItMattersNow: "Scotland matters because the next Holyrood election is no longer just about SNP dominance, but whether Labour can make the contest genuinely competitive.",
    politicalPicture: "The SNP remain the largest force, but Labour are back in contention and the shape of the pro-union vote matters more again.",
    watch: "Whether Labour can narrow the gap enough to make the next government question look open.",
    signal: "Scottish politics now looks more competitive than it did at the last Holyrood election.",
    partyLandscape: [
      { party: "SNP", pct: 34, color: "#C4922A", trend: "Softening" },
      { party: "Labour", pct: 28, color: "#E4003B", trend: "Recovering" },
      { party: "Conservative", pct: 16, color: "#0087DC", trend: "Under pressure" },
      { party: "Green", pct: 9, color: "#02A95B", trend: "Relevant to balance" },
      { party: "Lib Dem", pct: 7, color: "#FAA61A", trend: "Holding pockets" },
      { party: "Reform", pct: 5, color: "#12B7D4", trend: "Testing appeal" }
    ]
  },
  {
    key: "wales",
    title: "Wales",
    institution: "Senedd Cymru",
    regionLabel: "The Senedd",
    system: "More proportional list system",
    nextElection: "2026-05-07",
    accent: "#3F8428",
    keyStrategicQuestion: "In Wales, Labour still leads but faces pressure from Plaid Cymru and a rising Reform vote.",
    whyItMattersNow: "Wales matters because a more proportional contest could make the route to control less straightforward than finishing first.",
    politicalPicture: "Labour still sits at the centre of Welsh politics, but Plaid Cymru and Reform both matter more in a more proportional contest.",
    watch: "Whether Reform can turn momentum into seats, or whether Labour and Plaid still shape the core contest.",
    signal: "The first election under Wales\u2019s new system could produce a less familiar seat map.",
    partyLandscape: [
      { party: "Labour", pct: 33, color: "#E4003B", trend: "Still strongest" },
      { party: "Reform", pct: 22, color: "#12B7D4", trend: "Rising fast" },
      { party: "Conservative", pct: 16, color: "#0087DC", trend: "Squeezed" },
      { party: "Plaid Cymru", pct: 15, color: "#3F8428", trend: "Holding base" },
      { party: "Green", pct: 7, color: "#02A95B", trend: "Gradual growth" },
      { party: "Lib Dem", pct: 5, color: "#FAA61A", trend: "Secondary force" }
    ]
  }
];
function applyEnrichment2(sourceRow, enrichmentRecord) {
  if (!enrichmentRecord || Object.keys(enrichmentRecord).length === 0) return sourceRow;
  const { updatedAt: _enrichedAt, ...overrides } = enrichmentRecord;
  return { ...sourceRow, ...overrides };
}
__name(applyEnrichment2, "applyEnrichment");
function hasMeaningfulEnrichment2(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  return Object.keys(record).some((key) => key !== "updatedAt");
}
__name(hasMeaningfulEnrichment2, "hasMeaningfulEnrichment");
function enrichmentCandidateKeys2(row = {}) {
  const values = [row.key, row.title].map((value) => cleanText(value)).filter(Boolean);
  const variants = values.flatMap((value) => [value, value.toLowerCase(), slugifyCouncilName(value)]);
  return [...new Set(variants.filter(Boolean))];
}
__name(enrichmentCandidateKeys2, "enrichmentCandidateKeys");
function resolveEnrichmentRecord2(row = {}, enrichmentMap = {}) {
  for (const candidate of enrichmentCandidateKeys2(row)) {
    if (Object.prototype.hasOwnProperty.call(enrichmentMap, candidate) && enrichmentMap[candidate] && typeof enrichmentMap[candidate] === "object" && !Array.isArray(enrichmentMap[candidate])) {
      return {
        matchedKey: candidate,
        record: enrichmentMap[candidate]
      };
    }
  }
  return { matchedKey: null, record: null };
}
__name(resolveEnrichmentRecord2, "resolveEnrichmentRecord");
function buildDevolvedIntelligencePayload(options = {}) {
  const updatedAt = options.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
  const sourceCount = Number(options.sourceCount || 1);
  const enrichments = options.enrichments !== void 0 ? options.enrichments : DEFAULT_DEVOLVED_ENRICHMENTS;
  const nationEnrich = enrichments && enrichments.nations || {};
  const nationMatches = DEVOLVED_NATION_SOURCE.map((row) => ({
    sourceKey: cleanText(row.key) || cleanText(row.title),
    ...resolveEnrichmentRecord2(row, nationEnrich)
  }));
  const enrichedCount = nationMatches.filter((match) => hasMeaningfulEnrichment2(match.record)).length;
  const nations = DEVOLVED_NATION_SOURCE.map((row) => applyEnrichment2(row, resolveEnrichmentRecord2(row, nationEnrich).record)).map(createDevolvedNationProfile);
  const landscape = deriveDevolvedOverview(nations);
  const keyStrategicQuestion = nations.map((n) => n.keyStrategicQuestion).filter(Boolean).join(" ");
  return {
    // Derived overview summary: why devolved elections matter now.
    overview: {
      ...landscape,
      keyStrategicQuestion
    },
    // Shaped nation profiles — one per DEVOLVED_NATION_SOURCE entry.
    nations,
    // Provenance metadata updated on every refresh run.
    meta: {
      updatedAt,
      sourceCount,
      enrichedCount,
      // When live or semi-live feeds are wired in, change sourceType to
      // 'live' or 'semi-live' and update coverageNote accordingly.
      sourceType: enrichedCount > 0 ? "maintained-with-enrichment" : "backend-shaped-from-maintained-source",
      coverageNote: enrichedCount > 0 ? `Scotland and Wales intelligence is shaped from maintained source with ${enrichedCount} enriched nation override(s).` : "Scotland and Wales intelligence is currently shaped from maintained devolved-election source profiles."
    }
  };
}
__name(buildDevolvedIntelligencePayload, "buildDevolvedIntelligencePayload");
var DEVOLVED_NATIONS = DEVOLVED_NATION_SOURCE.map(createDevolvedNationProfile);
var DEVOLVED_OVERVIEW = deriveDevolvedOverview(DEVOLVED_NATIONS);

// src/data/electionsIntelligence.js
function buildElectionsIntelligencePayload(options = {}) {
  const updatedAt = options.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
  const mayorsSourceCount = Number(options.mayorsSourceCount || 1);
  const devolvedSourceCount = Number(options.devolvedSourceCount || 1);
  const mayorsEnrichments = options.mayorsEnrichments;
  const mayorsExternalSource = options.mayorsExternalSource;
  const devolvedEnrichments = options.devolvedEnrichments;
  return {
    // Mayors section fully derived by buildMayorsIntelligencePayload.
    // Refresh independently via POST /api/elections/mayors-refresh.
    mayors: buildMayorsIntelligencePayload({
      updatedAt,
      sourceCount: mayorsSourceCount,
      ...mayorsExternalSource !== void 0 ? { externalSource: mayorsExternalSource } : {},
      ...mayorsEnrichments !== void 0 ? { enrichments: mayorsEnrichments } : {}
    }),
    // Devolved section fully derived by buildDevolvedIntelligencePayload.
    // Refresh independently via POST /api/elections/devolved-refresh.
    devolved: buildDevolvedIntelligencePayload({
      updatedAt,
      sourceCount: devolvedSourceCount,
      ...devolvedEnrichments !== void 0 ? { enrichments: devolvedEnrichments } : {}
    })
  };
}
__name(buildElectionsIntelligencePayload, "buildElectionsIntelligencePayload");
var FALLBACK_ELECTIONS_INTELLIGENCE = buildElectionsIntelligencePayload();

// worker.js
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const jsonResponse = /* @__PURE__ */ __name((data, init = {}) => new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        ...init.headers || {}
      },
      status: init.status || 200
    }), "jsonResponse");
    function decodeHtmlEntities(value) {
      return String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ").trim();
    }
    __name(decodeHtmlEntities, "decodeHtmlEntities");
    function stripTags(value) {
      return decodeHtmlEntities(String(value || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    }
    __name(stripTags, "stripTags");
    function getTagValue(block, tag) {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
      const m = block.match(re);
      return m ? m[1] : "";
    }
    __name(getTagValue, "getTagValue");
    function parseRssItems(xml, sourceName) {
      const source = String(xml || "");
      const itemMatches = source.match(/<item\b[\s\S]*?<\/item>/gi) || [];
      const entryMatches = source.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
      if (itemMatches.length) {
        return itemMatches.map((item) => {
          const title = stripTags(getTagValue(item, "title"));
          const url2 = stripTags(getTagValue(item, "link"));
          const description = stripTags(getTagValue(item, "description") || getTagValue(item, "summary"));
          const publishedAt = stripTags(getTagValue(item, "pubDate") || getTagValue(item, "published") || getTagValue(item, "updated"));
          if (!title || !url2) return null;
          const parsedTime = publishedAt ? new Date(publishedAt).getTime() : NaN;
          return {
            title,
            source: sourceName,
            publishedAt: !Number.isNaN(parsedTime) ? new Date(parsedTime).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
            url: url2,
            description,
            tag: inferNewsTag(title)
          };
        }).filter(Boolean);
      }
      return entryMatches.map((entry) => {
        const title = stripTags(getTagValue(entry, "title"));
        const description = stripTags(getTagValue(entry, "summary") || getTagValue(entry, "content"));
        const publishedAt = stripTags(getTagValue(entry, "published") || getTagValue(entry, "updated"));
        let url2 = "";
        const linkMatch = entry.match(/<link[^>]+href=["']([^"']+)["']/i);
        if (linkMatch && linkMatch[1]) {
          url2 = stripTags(linkMatch[1]);
        } else {
          url2 = stripTags(getTagValue(entry, "link"));
        }
        if (!title || !url2) return null;
        const parsedTime = publishedAt ? new Date(publishedAt).getTime() : NaN;
        return {
          title,
          source: sourceName,
          publishedAt: !Number.isNaN(parsedTime) ? new Date(parsedTime).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          url: url2,
          description,
          tag: inferNewsTag(title)
        };
      }).filter(Boolean);
    }
    __name(parseRssItems, "parseRssItems");
    async function fetchText(url2, timeoutMs = 1e4) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url2, {
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
            "User-Agent": "Politiscope/1.0 (+https://politiscope.app)"
          },
          signal: controller.signal
        });
        if (!res.ok) return null;
        return await res.text();
      } catch {
        return null;
      } finally {
        clearTimeout(timeout);
      }
    }
    __name(fetchText, "fetchText");
    const BPC_MEMBERS = /* @__PURE__ */ new Set([
      "ipsos",
      "orb international",
      "savanta",
      "verian",
      "yougov",
      "bmg research",
      "censuswide",
      "deltapoll",
      "electoral calculus",
      "find out now",
      "focaldata",
      "hanbury strategy",
      "j.l. partners",
      "lucidtalk",
      "more in common",
      "norstat",
      "obsurvant",
      "opinium",
      "public first",
      "redfield & wilton strategies",
      "survation",
      "techne",
      "whitestone insight",
      "yonder consulting"
    ]);
    const RELEASE_POLLSTERS = /* @__PURE__ */ new Set([
      "yougov",
      "more in common",
      "opinium",
      "ipsos",
      "find out now",
      "focaldata"
    ]);
    function norm(value) {
      return String(value || "").trim().toLowerCase();
    }
    __name(norm, "norm");
    function titleCase(value) {
      return String(value || "").trim().replace(/\s+/g, " ");
    }
    __name(titleCase, "titleCase");
    function safeNumber(value) {
      if (value === null || value === void 0 || value === "") return null;
      const raw = String(value).trim().replace(/%/g, "").replace(/,/g, "");
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    __name(safeNumber, "safeNumber");
    function sanitizeIsoDate(value) {
      if (!value) return null;
      const text = String(value).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
      const ts = Date.parse(`${text}T00:00:00Z`);
      if (Number.isNaN(ts)) return text;
      const now = Date.now();
      const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1e3;
      if (ts <= now + fortyFiveDaysMs) return text;
      const d = new Date(ts);
      d.setUTCFullYear(d.getUTCFullYear() - 1);
      return d.toISOString().slice(0, 10);
    }
    __name(sanitizeIsoDate, "sanitizeIsoDate");
    function formatDateRange(start, end, fallback) {
      if (fallback) return String(fallback);
      if (start && end && start !== end) return `${start} \u2013 ${end}`;
      return start || end || null;
    }
    __name(formatDateRange, "formatDateRange");
    function makePollId(pollster, publishedAt, fieldworkEnd, idx = 0) {
      return `${norm(pollster).replace(/[^a-z0-9]+/g, "-")}-${publishedAt || fieldworkEnd || "undated"}-${idx}`;
    }
    __name(makePollId, "makePollId");
    function normalizePollRecord(row, idx = 0) {
      if (!row || typeof row !== "object") return null;
      const pollster = row.pollster || row.pollsterName || row.house || row.company || row.organisation || row.organization || "";
      if (!pollster) return null;
      const fieldworkStart = sanitizeIsoDate(
        row.fieldworkStart || row.startDate || row.fieldwork_from || row.from || null
      );
      const fieldworkEnd = sanitizeIsoDate(
        row.fieldworkEnd || row.endDate || row.fieldwork_to || row.to || null
      );
      const publishedAt = sanitizeIsoDate(
        row.publishedAt || row.publishDate || row.published || row.releaseDate || row.datePublished || null
      );
      return {
        id: row.id || makePollId(pollster, publishedAt, fieldworkEnd, idx),
        pollster: titleCase(pollster),
        isBpcMember: row.isBpcMember != null ? !!row.isBpcMember : BPC_MEMBERS.has(norm(pollster)),
        fieldworkStart,
        fieldworkEnd,
        publishedAt,
        date: row.date || formatDateRange(fieldworkStart, fieldworkEnd, null),
        sample: safeNumber(row.sample || row.sampleSize || row.n),
        method: row.method || row.methodology || null,
        mode: row.mode || row.collectionMode || null,
        commissioner: row.commissioner || row.client || null,
        sourceUrl: row.sourceUrl || row.url || row.link || null,
        source: row.source || row.sourceLabel || null,
        ref: safeNumber(row.ref ?? row.reform ?? row.reform_uk),
        lab: safeNumber(row.lab ?? row.labour),
        con: safeNumber(row.con ?? row.conservative),
        grn: safeNumber(row.grn ?? row.green),
        ld: safeNumber(row.ld ?? row.libdem ?? row.lib_dem ?? row.liberal_democrats),
        rb: safeNumber(row.rb ?? row.restore_britain),
        snp: safeNumber(row.snp)
      };
    }
    __name(normalizePollRecord, "normalizePollRecord");
    function sortPollsNewestFirst(polls) {
      const score = /* @__PURE__ */ __name((p) => p.publishedAt || p.fieldworkEnd || p.fieldworkStart || "", "score");
      return [...polls].sort((a, b) => score(b).localeCompare(score(a)));
    }
    __name(sortPollsNewestFirst, "sortPollsNewestFirst");
    function mergePolls(existingPolls, incomingPolls) {
      const map = /* @__PURE__ */ new Map();
      for (const poll of existingPolls || []) {
        const normal = normalizePollRecord(poll);
        if (normal?.id) map.set(normal.id, normal);
      }
      for (const poll of incomingPolls || []) {
        const normal = normalizePollRecord(poll);
        if (normal?.id) map.set(normal.id, normal);
      }
      return sortPollsNewestFirst([...map.values()]);
    }
    __name(mergePolls, "mergePolls");
    function keepOnlyReleasePollsters(polls) {
      return (polls || []).filter((poll) => RELEASE_POLLSTERS.has(norm(poll?.pollster)));
    }
    __name(keepOnlyReleasePollsters, "keepOnlyReleasePollsters");
    function keepLatestPollPerPollster(polls) {
      const latestByPollster = /* @__PURE__ */ new Map();
      for (const poll of polls || []) {
        if (!poll?.pollster) continue;
        const current = latestByPollster.get(poll.pollster);
        const pollScore = poll.publishedAt || poll.fieldworkEnd || poll.fieldworkStart || "";
        const currentScore = current?.publishedAt || current?.fieldworkEnd || current?.fieldworkStart || "";
        if (!current || pollScore > currentScore) {
          latestByPollster.set(poll.pollster, poll);
        }
      }
      return sortPollsNewestFirst([...latestByPollster.values()]);
    }
    __name(keepLatestPollPerPollster, "keepLatestPollPerPollster");
    async function tableExists(tableName) {
      const res = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).bind(tableName).first();
      return !!res;
    }
    __name(tableExists, "tableExists");
    async function loadMeta() {
      const meta = await env.DB.prepare("SELECT key, value FROM meta").all();
      const metaObj = {};
      for (const row of meta.results || []) {
        metaObj[row.key] = row.value;
      }
      return metaObj;
    }
    __name(loadMeta, "loadMeta");
    async function loadContentSection(section) {
      const hasContent = await tableExists("content");
      if (!hasContent) return null;
      const row = await env.DB.prepare(
        "SELECT section, data, updated_at FROM content WHERE section = ? LIMIT 1"
      ).bind(section).first();
      if (!row) return null;
      try {
        return row.data ? JSON.parse(row.data) : null;
      } catch {
        return null;
      }
    }
    __name(loadContentSection, "loadContentSection");
    async function loadContentSectionRow(section) {
      const hasContent = await tableExists("content");
      if (!hasContent) return null;
      const row = await env.DB.prepare(
        "SELECT section, data, updated_at FROM content WHERE section = ? LIMIT 1"
      ).bind(section).first();
      if (!row) return null;
      try {
        return {
          section: row.section,
          updated_at: row.updated_at || null,
          data: row.data ? JSON.parse(row.data) : null
        };
      } catch {
        return {
          section: row.section,
          updated_at: row.updated_at || null,
          data: null
        };
      }
    }
    __name(loadContentSectionRow, "loadContentSectionRow");
    async function loadMayorEnrichments() {
      const data = await loadContentSection("mayorEnrichments");
      if (data && typeof data === "object" && !Array.isArray(data)) return data;
      return null;
    }
    __name(loadMayorEnrichments, "loadMayorEnrichments");
    async function loadMayorExternalSource() {
      const data = await loadContentSection("mayorExternalSource");
      if (data && typeof data === "object" && !Array.isArray(data)) return data;
      return null;
    }
    __name(loadMayorExternalSource, "loadMayorExternalSource");
    async function loadDevolvedEnrichments() {
      const data = await loadContentSection("devolvedEnrichments");
      if (data && typeof data === "object" && !Array.isArray(data)) return data;
      return null;
    }
    __name(loadDevolvedEnrichments, "loadDevolvedEnrichments");
    async function loadElectionsIntelligence() {
      const stored = await loadContentSectionRow("electionsIntelligence");
      if (stored?.data && typeof stored.data === "object") {
        return stored.data;
      }
      const mayorEnrichments = await loadMayorEnrichments();
      const mayorExternalSource = await loadMayorExternalSource();
      const devolvedEnrichments = await loadDevolvedEnrichments();
      return buildElectionsIntelligencePayload({
        updatedAt: stored?.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
        mayorsSourceCount: 1,
        devolvedSourceCount: 1,
        ...mayorExternalSource !== null ? { mayorsExternalSource: mayorExternalSource } : {},
        ...mayorEnrichments !== null ? { mayorsEnrichments: mayorEnrichments } : {},
        ...devolvedEnrichments !== null ? { devolvedEnrichments } : {}
      });
    }
    __name(loadElectionsIntelligence, "loadElectionsIntelligence");
    function normalizeMigrationPayload(data, updatedAt = null) {
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return null;
      }
      return {
        ...data,
        netTotal: safeNumber(data.netTotal),
        netPrev: safeNumber(data.netPrev),
        netPrev2: safeNumber(data.netPrev2),
        byNationality: Array.isArray(data.byNationality) ? data.byNationality : [],
        byVisa: Array.isArray(data.byVisa) ? data.byVisa : [],
        updatedAt: data.updatedAt || updatedAt || null
      };
    }
    __name(normalizeMigrationPayload, "normalizeMigrationPayload");
    async function loadMigrationData() {
      const primary = await loadContentSectionRow("migrationData");
      const primaryPayload = normalizeMigrationPayload(primary?.data, primary?.updated_at);
      if (primaryPayload) return primaryPayload;
      const legacy = await loadContentSectionRow("migration");
      return normalizeMigrationPayload(legacy?.data, legacy?.updated_at);
    }
    __name(loadMigrationData, "loadMigrationData");
    async function loadNormalizedPolls() {
      const pollsData = await loadContentSection("pollsData");
      const raw = Array.isArray(pollsData) ? pollsData : [];
      const normalized = raw.map((row, idx) => normalizePollRecord(row, idx)).filter(Boolean);
      return sortPollsNewestFirst(normalized);
    }
    __name(loadNormalizedPolls, "loadNormalizedPolls");
    function slugifyCouncilName2(value) {
      return String(value || "").trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    __name(slugifyCouncilName2, "slugifyCouncilName");
    function normalizeCouncilRegistryRecord(row = {}) {
      const name = titleCase(row.name || row.council || "");
      if (!name) return null;
      return {
        slug: row.slug || slugifyCouncilName2(name),
        name,
        type: row.type || "",
        region: row.region || "",
        governanceModel: row.governanceModel || "",
        officialWebsite: row.officialWebsite || row.website || "",
        officialElectionsUrl: row.officialElectionsUrl || "",
        officialCompositionUrl: row.officialCompositionUrl || "",
        notes: row.notes || ""
      };
    }
    __name(normalizeCouncilRegistryRecord, "normalizeCouncilRegistryRecord");
    function normalizeCouncilStatusRecord(row = {}) {
      const name = titleCase(row.name || row.council || "");
      const slug = row.slug || slugifyCouncilName2(name);
      if (!slug) return null;
      return {
        slug,
        name,
        electionStatus: row.electionStatus || "",
        electionMessage: row.electionMessage || "",
        nextElectionYear: safeNumber(row.nextElectionYear),
        cycle: row.cycle || "",
        seatsTotal: safeNumber(row.seatsTotal ?? row.seats),
        seatsUp: safeNumber(row.seatsUp),
        control: row.control || "",
        leader: row.leader || "",
        mayor: row.mayor || "",
        governanceModel: row.governanceModel || "",
        verificationStatus: row.verificationStatus || "unverified",
        verificationSourceType: row.verificationSourceType || "",
        lastVerifiedAt: row.lastVerifiedAt || (/* @__PURE__ */ new Date()).toISOString(),
        sourceUrls: Array.isArray(row.sourceUrls) ? row.sourceUrls : []
      };
    }
    __name(normalizeCouncilStatusRecord, "normalizeCouncilStatusRecord");
    function normalizeCouncilEditorialRecord(row = {}) {
      const name = titleCase(row.name || row.council || "");
      const slug = row.slug || slugifyCouncilName2(name);
      if (!slug) return null;
      return {
        slug,
        name,
        verdict: row.verdict || "",
        difficulty: row.difficulty || "",
        watchFor: row.watchFor || "",
        targetParty: row.targetParty || "",
        whatCountsAsShock: row.whatCountsAsShock || "",
        keyIssue: row.keyIssue || "",
        prediction: row.prediction || "",
        updatedAt: row.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    __name(normalizeCouncilEditorialRecord, "normalizeCouncilEditorialRecord");
    async function loadCouncilRegistry() {
      const data = await loadContentSection("councilRegistry");
      return Array.isArray(data) ? data.map(normalizeCouncilRegistryRecord).filter(Boolean) : [];
    }
    __name(loadCouncilRegistry, "loadCouncilRegistry");
    async function loadCouncilStatus() {
      const data = await loadContentSection("councilStatus");
      return Array.isArray(data) ? data.map(normalizeCouncilStatusRecord).filter(Boolean) : [];
    }
    __name(loadCouncilStatus, "loadCouncilStatus");
    async function loadCouncilEditorial() {
      const data = await loadContentSection("councilEditorial");
      return Array.isArray(data) ? data.map(normalizeCouncilEditorialRecord).filter(Boolean) : [];
    }
    __name(loadCouncilEditorial, "loadCouncilEditorial");
    function mergeCouncilLayers(registry = [], status = [], editorial = []) {
      const out = /* @__PURE__ */ new Map();
      for (const item of registry) {
        if (!item?.slug) continue;
        out.set(item.slug, { ...item });
      }
      for (const item of status) {
        if (!item?.slug) continue;
        out.set(item.slug, { ...out.get(item.slug) || {}, ...item });
      }
      for (const item of editorial) {
        if (!item?.slug) continue;
        out.set(item.slug, { ...out.get(item.slug) || {}, ...item });
      }
      return [...out.values()].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }
    __name(mergeCouncilLayers, "mergeCouncilLayers");
    async function loadMergedCouncilData() {
      const [registry, status, editorial] = await Promise.all([
        loadCouncilRegistry(),
        loadCouncilStatus(),
        loadCouncilEditorial()
      ]);
      return {
        registry,
        status,
        editorial,
        councils: mergeCouncilLayers(registry, status, editorial)
      };
    }
    __name(loadMergedCouncilData, "loadMergedCouncilData");
    const APPROVED_NEWS_DOMAINS = /* @__PURE__ */ new Set([
      "bbc.co.uk",
      "theguardian.com",
      "news.sky.com",
      "ft.com",
      "gbnews.com",
      "dailymail.co.uk",
      "express.co.uk",
      "telegraph.co.uk"
    ]);
    const UK_POLITICS_ACTOR_TERMS = [
      "keir starmer",
      "kemi badenoch",
      "nigel farage",
      "ed davey",
      "carla denyer",
      "adrian ramsay",
      "john swinney",
      "angela rayner",
      "rachel reeves",
      "yvette cooper",
      "shabana mahmood",
      "wes streeting",
      "bridget phillipson",
      "pat mcFadden",
      "james cleverly",
      "suella braverman",
      "robert jenrick",
      "labour",
      "labour party",
      "conservative",
      "conservatives",
      "conservative party",
      "tories",
      "reform uk",
      "reform",
      "liberal democrats",
      "lib dem",
      "lib dems",
      "green party",
      "green party of england and wales",
      "snp",
      "scottish national party",
      "plaid cymru",
      "minister",
      "ministers",
      "cabinet",
      "shadow cabinet",
      "shadow minister",
      "shadow chancellor",
      "shadow home secretary",
      "mp ",
      " mp",
      "mps",
      "prime minister",
      "deputy prime minister",
      "chancellor",
      "home secretary",
      "foreign secretary",
      "health secretary",
      "education secretary",
      "justice secretary"
    ];
    const UK_POLITICS_INSTITUTION_TERMS = [
      "westminster",
      "parliament",
      "house of commons",
      "house of lords",
      "pmqs",
      "prime minister's questions",
      "general election",
      "local election",
      "by-election",
      "byelection",
      "mayoral election",
      "council tax",
      "budget",
      "autumn statement",
      "spring statement",
      "policy",
      "policies",
      "manifesto",
      "nhs",
      "immigration",
      "housing",
      "welfare",
      "net zero",
      "north sea",
      "energy bills",
      "tax",
      "taxes",
      "benefits",
      "public spending"
    ];
    const EXCLUDED_NEWS_URL_PARTS = [
      "/news/live/",
      "/sounds/",
      "/programmes/",
      "/iplayer/",
      "/sport/",
      "/newsround/",
      "/weather/",
      "/travel/",
      "/culture/",
      "/food/",
      "/life/",
      "/business/topics/"
    ];
    const EXCLUDED_NEWS_TERMS = [
      "vaccines for children in america",
      "us voting system"
    ];
    const CIVIC_BUT_NOT_NECESSARILY_POLITICAL_TERMS = [
      "weather",
      "travel"
    ];
    const HUB_POLICY_TERMS = [
      "tax",
      "taxes",
      "inheritance tax",
      "budget",
      "economy",
      "cost of living",
      "energy bills",
      "fuel",
      "petrol",
      "diesel",
      "nhs",
      "doctor",
      "doctors",
      "strike",
      "junior doctors",
      "housing",
      "rent",
      "mortgage",
      "migration",
      "immigration",
      "asylum",
      "welfare",
      "benefits",
      "school",
      "schools",
      "crime",
      "policing",
      "police",
      "net zero",
      "farming",
      "farmers",
      "council tax",
      "public spending"
    ];
    const SKY_STRONG_POLITICS_TERMS = [
      "labour",
      "labour party",
      "conservative",
      "conservatives",
      "conservative party",
      "tories",
      "reform uk",
      "reform",
      "liberal democrats",
      "lib dem",
      "lib dems",
      "green party",
      "snp",
      "plaid cymru",
      "keir starmer",
      "kemi badenoch",
      "nigel farage",
      "ed davey",
      "john swinney",
      "angela rayner",
      "rachel reeves",
      "yvette cooper",
      "wes streeting",
      "minister",
      "ministers",
      "cabinet",
      "mp ",
      " mp",
      "mps",
      "prime minister",
      "chancellor",
      "home secretary",
      "westminster",
      "parliament",
      "house of commons",
      "pmqs",
      "prime minister's questions",
      "general election",
      "local election",
      "by-election",
      "mayoral election",
      "budget",
      "tax",
      "taxes",
      "nhs",
      "immigration",
      "housing",
      "welfare",
      "energy bills"
    ];
    const BBC_STRONG_POLITICS_TERMS = [
      "labour",
      "labour party",
      "conservative",
      "conservatives",
      "conservative party",
      "tories",
      "reform uk",
      "reform",
      "liberal democrats",
      "lib dem",
      "lib dems",
      "green party",
      "green party of england and wales",
      "snp",
      "scottish national party",
      "plaid cymru",
      "keir starmer",
      "kemi badenoch",
      "nigel farage",
      "ed davey",
      "carla denyer",
      "adrian ramsay",
      "john swinney",
      "angela rayner",
      "rachel reeves",
      "yvette cooper",
      "wes streeting",
      "minister",
      "ministers",
      "cabinet",
      "shadow cabinet",
      "shadow minister",
      "mp ",
      " mp",
      "mps",
      "prime minister",
      "deputy prime minister",
      "chancellor",
      "home secretary",
      "westminster",
      "parliament",
      "house of commons",
      "house of lords",
      "pmqs",
      "prime minister's questions",
      "general election",
      "local election",
      "by-election",
      "byelection",
      "mayoral election"
    ];
    function inferNewsTag(title = "") {
      const t = String(title || "").toLowerCase();
      if (t.includes("poll") || t.includes("polling") || t.includes("mrp")) return "Polling";
      if (t.includes("election") || t.includes("elections") || t.includes("by-election") || t.includes("byelection") || t.includes("local election") || t.includes("general election") || t.includes("mayor")) return "Elections";
      if (t.includes("parliament") || t.includes("commons") || t.includes("lords") || t.includes("pmqs") || t.includes("mp ") || t.includes(" mps") || t.includes("select committee")) return "Parliament";
      if (t.includes("budget") || t.includes("tax") || t.includes("economy") || t.includes("growth") || t.includes("inflation") || t.includes("borrowing") || t.includes("spending")) return "Economy";
      if (t.includes("foreign") || t.includes("ukraine") || t.includes("russia") || t.includes("gaza") || t.includes("israel") || t.includes("trump") || t.includes("eu ")) return "Foreign Affairs";
      if (t.includes("prime minister") || t.includes("minister") || t.includes("cabinet") || t.includes("chancellor") || t.includes("home secretary") || t.includes("government") || t.includes("no 10") || t.includes("downing street")) return "Government";
      if (t.includes("campaign") || t.includes("candidate") || t.includes("manifesto") || t.includes("leaflet")) return "Campaign";
      if (t.includes("labour") || t.includes("conservative") || t.includes("reform") || t.includes("liberal democrats") || t.includes("lib dem") || t.includes("green party") || t.includes("snp") || t.includes("plaid") || t.includes("farage") || t.includes("starmer") || t.includes("badenoch") || t.includes("mp")) return "Party";
      if (t.includes("policy") || t.includes("budget") || t.includes("tax") || t.includes("immigration") || t.includes("nhs") || t.includes("welfare") || t.includes("housing") || t.includes("energy") || t.includes("net zero") || t.includes("benefit")) return "Policy";
      return "";
    }
    __name(inferNewsTag, "inferNewsTag");
    function getHostname(rawUrl) {
      try {
        return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return "";
      }
    }
    __name(getHostname, "getHostname");
    function isApprovedNewsDomain(hostname) {
      return APPROVED_NEWS_DOMAINS.has(hostname);
    }
    __name(isApprovedNewsDomain, "isApprovedNewsDomain");
    function textMatchesAny(text, terms) {
      const t = String(text || "").toLowerCase();
      return terms.some((term) => t.includes(term));
    }
    __name(textMatchesAny, "textMatchesAny");
    function countMatches(text, terms) {
      const t = String(text || "").toLowerCase();
      return terms.reduce((sum, term) => sum + (t.includes(term) ? 1 : 0), 0);
    }
    __name(countMatches, "countMatches");
    function hasPoliticsSignal(text) {
      const combined = String(text || "").toLowerCase();
      const actorMatches = countMatches(combined, UK_POLITICS_ACTOR_TERMS);
      const institutionMatches = countMatches(combined, UK_POLITICS_INSTITUTION_TERMS);
      const hubPolicyMatches = countMatches(combined, HUB_POLICY_TERMS);
      return actorMatches > 0 || institutionMatches > 0 || hubPolicyMatches > 0;
    }
    __name(hasPoliticsSignal, "hasPoliticsSignal");
    function isAllowedNewsPath(url2) {
      const lowerUrl = String(url2 || "").toLowerCase();
      return !EXCLUDED_NEWS_URL_PARTS.some((part) => lowerUrl.includes(part));
    }
    __name(isAllowedNewsPath, "isAllowedNewsPath");
    function scoreNewsArticle(article) {
      if (!article || typeof article !== "object") return null;
      const title = titleCase(article.title || "");
      const description = titleCase(article.description || "");
      const url2 = String(article.url || "");
      const hostname = getHostname(url2);
      if (!title || !url2 || !hostname) return null;
      if (!isApprovedNewsDomain(hostname)) return null;
      const lowerUrl = url2.toLowerCase();
      if (EXCLUDED_NEWS_URL_PARTS.some((part) => lowerUrl.includes(part))) return null;
      const combined = `${title} ${description}`.toLowerCase();
      if (textMatchesAny(combined, EXCLUDED_NEWS_TERMS)) return null;
      const actorMatches = countMatches(combined, UK_POLITICS_ACTOR_TERMS);
      const institutionMatches = countMatches(combined, UK_POLITICS_INSTITUTION_TERMS);
      const hubPolicyMatches = countMatches(combined, HUB_POLICY_TERMS);
      let score = 0;
      score += actorMatches * 3;
      score += institutionMatches * 2;
      if (hostname === "bbc.co.uk" && textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS)) {
        score += 2;
      }
      if (hostname === "theguardian.com" && lowerUrl.includes("/politics/")) score += 2;
      if (hostname === "theguardian.com" && lowerUrl.includes("/uk-news/") && (actorMatches > 0 || institutionMatches > 0 || hubPolicyMatches > 0)) {
        score += 1;
      }
      if (combined.includes("labour party")) score += 1;
      if (combined.includes("conservative party")) score += 1;
      if (combined.includes("reform uk")) score += 1;
      if (combined.includes("liberal democrats")) score += 1;
      if (combined.includes("green party")) score += 1;
      if (combined.includes("scottish national party")) score += 1;
      if (combined.includes("celebrity")) score -= 2;
      if (combined.includes("showbiz")) score -= 2;
      if (combined.includes("tv star")) score -= 1;
      if (combined.includes("death plans")) score -= 3;
      if (textMatchesAny(combined, CIVIC_BUT_NOT_NECESSARILY_POLITICAL_TERMS)) score -= 2;
      if (actorMatches === 0 && institutionMatches === 0 && hubPolicyMatches === 0) return null;
      if (hostname === "bbc.co.uk" && !textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS) && score < 5) {
        return null;
      }
      if (score < 3) return null;
      return {
        title,
        source: titleCase(article?.source?.name || article.source || ""),
        description,
        publishedAt: article.publishedAt || null,
        url: url2,
        tag: inferNewsTag(title),
        score
      };
    }
    __name(scoreNewsArticle, "scoreNewsArticle");
    function normalizeNewsItem(article) {
      const scored = scoreNewsArticle(article);
      if (!scored) return null;
      if (!scored.title || !scored.source || !scored.publishedAt || !scored.url) return null;
      return {
        title: scored.title,
        source: scored.source,
        description: scored.description,
        publishedAt: scored.publishedAt,
        url: scored.url,
        tag: scored.tag,
        score: scored.score
      };
    }
    __name(normalizeNewsItem, "normalizeNewsItem");
    function newsTitleKey(title) {
      return String(title || "").toLowerCase().replace(/['"]/g, "").replace(/\b(live|latest|breaking|updates?|uk|politics|says|said|after|over|amid)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().split(" ").slice(0, 12).join(" ");
    }
    __name(newsTitleKey, "newsTitleKey");
    function dedupeNewsItems(items) {
      const seen = /* @__PURE__ */ new Set();
      const seenTitles = /* @__PURE__ */ new Set();
      const out = [];
      for (const item of items || []) {
        const key = String(item.url || item.title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").slice(0, 10).join(" ");
        const titleKey = newsTitleKey(item.title);
        if (!key || seen.has(key) || titleKey && seenTitles.has(titleKey)) continue;
        seen.add(key);
        if (titleKey) seenTitles.add(titleKey);
        out.push(item);
      }
      return out;
    }
    __name(dedupeNewsItems, "dedupeNewsItems");
    function capNewsItemsBySource(items, maxPerSource = 2, maxItems = 10) {
      const counts = /* @__PURE__ */ new Map();
      const out = [];
      for (const item of items || []) {
        const source = String(item.source || "").toLowerCase();
        const current = counts.get(source) || 0;
        if (current >= maxPerSource) continue;
        counts.set(source, current + 1);
        out.push(item);
        if (out.length >= maxItems) break;
      }
      return out;
    }
    __name(capNewsItemsBySource, "capNewsItemsBySource");
    function isOpinionLikeTitle(title) {
      const t = String(title || "").toLowerCase();
      return t.includes("opinion") || t.includes("editorial") || t.includes("comment") || t.includes("analysis:") || t.includes("somehow always makes");
    }
    __name(isOpinionLikeTitle, "isOpinionLikeTitle");
    function isExplainerLikeTitle(title) {
      const t = String(title || "").toLowerCase().trim();
      return t.startsWith("how ") || t.startsWith("why ") || t.startsWith("what ") || t.startsWith("who ") || t.startsWith("a simple guide") || t.includes("explained");
    }
    __name(isExplainerLikeTitle, "isExplainerLikeTitle");
    function hasHardPoliticsSignal(text) {
      const t = String(text || "").toLowerCase();
      return t.includes("prime minister") || t.includes("chancellor") || t.includes("home secretary") || t.includes("cabinet") || t.includes("minister") || t.includes("labour") || t.includes("conservative") || t.includes("reform uk") || t.includes("liberal democrats") || t.includes("green party") || t.includes("snp") || t.includes("plaid cymru") || t.includes("westminster") || t.includes("parliament") || t.includes("pmqs") || t.includes("election") || t.includes("by-election") || t.includes("budget") || t.includes("tax") || t.includes("energy bills") || t.includes("nhs") || t.includes("immigration") || t.includes("housing") || t.includes("welfare") || t.includes("manifesto");
    }
    __name(hasHardPoliticsSignal, "hasHardPoliticsSignal");
    function isWeakCivicStory(text) {
      const t = String(text || "").toLowerCase();
      return t.includes("public sexual harassment") || t.includes("ev charger") || t.includes("car production") || t.includes("family voting") || t.includes("churchill") || t.includes("who is ");
    }
    __name(isWeakCivicStory, "isWeakCivicStory");
    async function fetchBbcNews() {
      const feedUrls = [
        "https://feeds.bbci.co.uk/news/politics/rss.xml",
        "https://feeds.bbci.co.uk/news/rss.xml"
      ];
      for (const feedUrl of feedUrls) {
        const xml = await fetchText(feedUrl);
        if (!xml) continue;
        const blocks = String(xml).split(/<item\b/i).slice(1);
        if (!blocks.length) continue;
        const items = blocks.map((block) => {
          const item = "<item" + block;
          const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i);
          const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
          const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || item.match(/<description>([\s\S]*?)<\/description>/i);
          const pubMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
          const title = stripTags(titleMatch?.[1] || "");
          const url2 = stripTags(linkMatch?.[1] || "");
          const description = stripTags(descMatch?.[1] || "");
          const publishedAtRaw = stripTags(pubMatch?.[1] || "");
          const publishedAtTs = publishedAtRaw ? new Date(publishedAtRaw).getTime() : NaN;
          if (!title || !url2) return null;
          if (!isAllowedNewsPath(url2)) return null;
          const combined = `${title} ${description}`.toLowerCase();
          const lowerUrl = url2.toLowerCase();
          const looksPolitical = hasPoliticsSignal(combined) || lowerUrl.includes("/news/politics") || lowerUrl.includes("/news/uk-politics") || textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS);
          if (!looksPolitical) return null;
          if (title.toLowerCase().includes("uk politics live")) return null;
          if (title.toLowerCase().includes("as it happened")) return null;
          let score = 4;
          if (textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS)) score += 2;
          if (hasPoliticsSignal(combined)) score += 1;
          if (hasHardPoliticsSignal(combined)) score += 2;
          if (lowerUrl.includes("/news/")) score += 1;
          if (isOpinionLikeTitle(title)) score -= 2;
          if (isExplainerLikeTitle(title)) score -= 2;
          if (isWeakCivicStory(combined)) score -= 2;
          if (score < 5) return null;
          return {
            title,
            source: "BBC News",
            description,
            publishedAt: !Number.isNaN(publishedAtTs) ? new Date(publishedAtTs).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
            url: url2,
            tag: inferNewsTag(title),
            score
          };
        }).filter(Boolean);
        if (items.length) return items;
      }
      return [];
    }
    __name(fetchBbcNews, "fetchBbcNews");
    async function fetchSkyNews() {
      const xml = await fetchText("https://feeds.skynews.com/feeds/rss/politics.xml");
      if (!xml) return [];
      return parseRssItems(xml, "Sky News").map((item) => {
        const title = stripTags(item.title || "");
        const description = stripTags(item.description || "");
        const url2 = String(item.url || "");
        const publishedAt = item.publishedAt || null;
        const lowerUrl = url2.toLowerCase();
        const combined = `${title} ${description}`.toLowerCase();
        if (!title || !url2 || !publishedAt) return null;
        if (!isAllowedNewsPath(url2)) return null;
        if (!hasPoliticsSignal(combined)) return null;
        if (isOpinionLikeTitle(title) && !textMatchesAny(combined, SKY_STRONG_POLITICS_TERMS)) return null;
        if (isExplainerLikeTitle(title) && !hasHardPoliticsSignal(combined)) return null;
        if (isWeakCivicStory(combined) && !hasHardPoliticsSignal(combined)) return null;
        let score = 3;
        if (lowerUrl.includes("/politics")) score += 2;
        if (textMatchesAny(combined, SKY_STRONG_POLITICS_TERMS)) score += 2;
        if (hasHardPoliticsSignal(combined)) score += 2;
        if (isExplainerLikeTitle(title)) score -= 2;
        if (isWeakCivicStory(combined)) score -= 2;
        if (score < 4) return null;
        return {
          title,
          source: "Sky News",
          description,
          publishedAt,
          url: url2,
          tag: inferNewsTag(title),
          score
        };
      }).filter(Boolean);
    }
    __name(fetchSkyNews, "fetchSkyNews");
    async function fetchGuardianNews(env2) {
      if (!env2.GUARDIAN_API_KEY) return [];
      const apiUrl = new URL("https://content.guardianapis.com/search");
      apiUrl.searchParams.set("api-key", env2.GUARDIAN_API_KEY);
      apiUrl.searchParams.set("section", "politics");
      apiUrl.searchParams.set("page-size", "10");
      apiUrl.searchParams.set("order-by", "newest");
      apiUrl.searchParams.set("show-fields", "headline,trailText,shortUrl");
      apiUrl.searchParams.set(
        "from-date",
        new Date(Date.now() - 96 * 60 * 60 * 1e3).toISOString().slice(0, 10)
      );
      try {
        const res = await fetch(apiUrl.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": "Politiscope/1.0 (+https://politiscope.app)"
          }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const results = Array.isArray(data?.response?.results) ? data.response.results : [];
        return results.map((item) => {
          const title = titleCase(item.fields?.headline || item.webTitle || "");
          const description = titleCase(item.fields?.trailText || "");
          const url2 = item.webUrl || item.fields?.shortUrl || "";
          const publishedAt = item.webPublicationDate || null;
          const lowerUrl = String(url2 || "").toLowerCase();
          const combined = `${title} ${description}`.toLowerCase();
          if (!title || !url2 || !publishedAt) return null;
          if (!isAllowedNewsPath(url2)) return null;
          if (lowerUrl.includes("/politics/live/")) return null;
          if (title.toLowerCase().includes("uk politics live")) return null;
          if (title.toLowerCase().includes("as it happened")) return null;
          if (!lowerUrl.includes("/politics/") && !lowerUrl.includes("/uk-news/")) return null;
          if (!hasPoliticsSignal(combined) && !lowerUrl.includes("/politics/")) return null;
          if (isOpinionLikeTitle(title) && !combined.includes("starmer") && !combined.includes("farage") && !combined.includes("badenoch")) return null;
          if (isExplainerLikeTitle(title) && !hasHardPoliticsSignal(combined)) return null;
          let score = 3;
          if (lowerUrl.includes("/politics/")) score += 2;
          if (lowerUrl.includes("/uk-news/")) score += 1;
          if (hasHardPoliticsSignal(combined)) score += 2;
          if (isOpinionLikeTitle(title)) score -= 1;
          if (isExplainerLikeTitle(title)) score -= 2;
          if (score < 4) return null;
          return {
            title,
            source: "The Guardian",
            description,
            publishedAt,
            url: url2,
            tag: inferNewsTag(title),
            score
          };
        }).filter(Boolean);
      } catch {
        return [];
      }
    }
    __name(fetchGuardianNews, "fetchGuardianNews");
    const NEWS_RSS_SOURCES = [
      {
        name: "Financial Times",
        urls: [
          "https://www.ft.com/uk-politics?format=rss",
          "https://www.ft.com/world/uk?format=rss"
        ],
        minScore: 4
      },
      {
        name: "GB News",
        urls: [
          "https://www.gbnews.com/politics.rss",
          "https://www.gbnews.com/feeds/news.xml"
        ],
        minScore: 4
      },
      {
        name: "Daily Mail",
        urls: [
          "https://www.dailymail.co.uk/news/index.rss"
        ],
        minScore: 5
      },
      {
        name: "Daily Express",
        urls: [
          "https://www.express.co.uk/news/politics/rss"
        ],
        minScore: 4
      },
      {
        name: "The Telegraph",
        urls: [
          "https://www.telegraph.co.uk/politics/rss.xml"
        ],
        minScore: 4
      }
    ];
    async function fetchRssNewsSource(sourceConfig) {
      for (const feedUrl of sourceConfig.urls || []) {
        const xml = await fetchText(feedUrl);
        if (!xml) continue;
        const items = parseRssItems(xml, sourceConfig.name).map((item) => {
          const normalized = normalizeNewsItem(item);
          if (!normalized) return null;
          if ((normalized.score || 0) < (sourceConfig.minScore || 3)) return null;
          return normalized;
        }).filter(Boolean);
        if (items.length) return items;
      }
      return [];
    }
    __name(fetchRssNewsSource, "fetchRssNewsSource");
    function buildNewsMeta(items = [], fetchedAt = (/* @__PURE__ */ new Date()).toISOString()) {
      const sourceNames = [...new Set((items || []).map((item) => item.source).filter(Boolean))];
      const latestPublishedAt = items?.[0]?.publishedAt || null;
      return {
        updatedAt: fetchedAt,
        fetchedAt,
        storyCount: Array.isArray(items) ? items.length : 0,
        sourceCount: sourceNames.length,
        sources: sourceNames,
        latestPublishedAt,
        latestHeadline: items?.[0]?.title || "",
        headlines: (items || []).slice(0, 3).map((item) => item.title).filter(Boolean),
        coverageNote: "Live RSS/API politics feed with per-source balancing and duplicate suppression."
      };
    }
    __name(buildNewsMeta, "buildNewsMeta");
    async function fetchLiveNews(env2) {
      const now = Date.now();
      const sourceResults = await Promise.all([
        fetchBbcNews(),
        fetchGuardianNews(env2),
        fetchSkyNews(),
        ...NEWS_RSS_SOURCES.map((sourceConfig) => fetchRssNewsSource(sourceConfig))
      ]);
      const ranked = sourceResults.flat().sort((a, b) => {
        const aTime = new Date(a.publishedAt || 0).getTime();
        const bTime = new Date(b.publishedAt || 0).getTime();
        const aAgeHours = Number.isFinite(aTime) ? Math.max(0, (now - aTime) / 36e5) : 999;
        const bAgeHours = Number.isFinite(bTime) ? Math.max(0, (now - bTime) / 36e5) : 999;
        const aRank = (a.score || 0) - Math.min(aAgeHours * 0.12, 6);
        const bRank = (b.score || 0) - Math.min(bAgeHours * 0.12, 6);
        if (bRank !== aRank) return bRank - aRank;
        return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
      });
      const deduped = dedupeNewsItems(ranked);
      const balanced = capNewsItemsBySource(deduped, 3, 18);
      return balanced.map(({ score, ...item }) => item);
    }
    __name(fetchLiveNews, "fetchLiveNews");
    const NEWS_CACHE_SECTION = "newsItems";
    const NEWS_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1e3;
    function isFreshEnough(iso, maxAgeMs = NEWS_CACHE_MAX_AGE_MS) {
      if (!iso) return false;
      const ts = new Date(iso).getTime();
      if (Number.isNaN(ts)) return false;
      return Date.now() - ts < maxAgeMs;
    }
    __name(isFreshEnough, "isFreshEnough");
    async function getNewsPayload() {
      const hasContent = await tableExists("content");
      if (!hasContent) {
        const fetchedAt2 = (/* @__PURE__ */ new Date()).toISOString();
        const items2 = await fetchLiveNews(env);
        return {
          fetchedAt: fetchedAt2,
          items: items2,
          meta: buildNewsMeta(items2, fetchedAt2)
        };
      }
      const cached = await loadContentSectionRow(NEWS_CACHE_SECTION);
      if (cached?.data && Array.isArray(cached.data.items) && cached.data.items.length > 0 && isFreshEnough(cached.data.fetchedAt || cached.updated_at)) {
        const fetchedAt2 = cached.data.fetchedAt || cached.updated_at || (/* @__PURE__ */ new Date()).toISOString();
        return {
          ...cached.data,
          fetchedAt: fetchedAt2,
          items: cached.data.items,
          meta: {
            ...buildNewsMeta(cached.data.items, fetchedAt2),
            ...cached.data.meta || {}
          }
        };
      }
      const items = await fetchLiveNews(env);
      const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
      const payload = {
        fetchedAt,
        items,
        meta: buildNewsMeta(items, fetchedAt)
      };
      await saveContentSection(NEWS_CACHE_SECTION, payload);
      return payload;
    }
    __name(getNewsPayload, "getNewsPayload");
    async function getNewsItems() {
      const payload = await getNewsPayload();
      return Array.isArray(payload?.items) ? payload.items : [];
    }
    __name(getNewsItems, "getNewsItems");
    async function saveContentSection(section, payload) {
      const hasContent = await tableExists("content");
      if (!hasContent) {
        throw new Error(`Missing D1 table: content`);
      }
      await env.DB.prepare(
        `INSERT INTO content (section, data, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(section) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at`
      ).bind(
        section,
        JSON.stringify(payload ?? null),
        (/* @__PURE__ */ new Date()).toISOString()
      ).run();
    }
    __name(saveContentSection, "saveContentSection");
    async function ytFetch(url2, apiKey) {
      const res = await fetch(url2, {
        headers: {
          Accept: "application/json"
        }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`YouTube API ${res.status}: ${text}`);
      }
      return res.json();
    }
    __name(ytFetch, "ytFetch");
    async function getChannelIdFromHandle(apiKey, handle = "@UKParliament") {
      const endpoint = `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails,snippet&forHandle=${encodeURIComponent(handle)}&key=${encodeURIComponent(apiKey)}`;
      const data = await ytFetch(endpoint, apiKey);
      const item = data?.items?.[0];
      if (!item?.id) throw new Error("Could not resolve UK Parliament YouTube channel");
      return {
        channelId: item.id,
        uploadsPlaylistId: item?.contentDetails?.relatedPlaylists?.uploads || null,
        channelTitle: item?.snippet?.title || "UK Parliament"
      };
    }
    __name(getChannelIdFromHandle, "getChannelIdFromHandle");
    async function getLiveVideo(apiKey, channelId) {
      const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&eventType=live&type=video&order=date&maxResults=1&key=${encodeURIComponent(apiKey)}`;
      const data = await ytFetch(endpoint, apiKey);
      const item = data?.items?.[0];
      const videoId = item?.id?.videoId;
      if (!videoId) return null;
      return {
        videoId,
        title: item?.snippet?.title || "Live stream",
        publishedAt: item?.snippet?.publishedAt || null,
        thumbnail: item?.snippet?.thumbnails?.high?.url || item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || null,
        isLive: true,
        source: "live"
      };
    }
    __name(getLiveVideo, "getLiveVideo");
    async function getLatestUploadedVideo(apiKey, uploadsPlaylistId) {
      if (!uploadsPlaylistId) return null;
      const endpoint = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=1&key=${encodeURIComponent(apiKey)}`;
      const data = await ytFetch(endpoint, apiKey);
      const item = data?.items?.[0];
      const videoId = item?.snippet?.resourceId?.videoId;
      if (!videoId) return null;
      return {
        videoId,
        title: item?.snippet?.title || "Latest upload",
        publishedAt: item?.snippet?.publishedAt || null,
        thumbnail: item?.snippet?.thumbnails?.high?.url || item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || null,
        isLive: false,
        source: "latest"
      };
    }
    __name(getLatestUploadedVideo, "getLatestUploadedVideo");
    try {
      if (request.method === "GET" && url.pathname === "/api/news/bbc-debug") {
        const politicsUrl = "https://feeds.bbci.co.uk/news/politics/rss.xml";
        const generalUrl = "https://feeds.bbci.co.uk/news/rss.xml";
        const politicsXml = await fetchText(politicsUrl);
        const generalXml = await fetchText(generalUrl);
        const politicsItems = politicsXml ? parseRssItems(politicsXml, "BBC News") : [];
        const generalItems = generalXml ? parseRssItems(generalXml, "BBC News") : [];
        const politicsBlockCount = politicsXml ? String(politicsXml).split(/<item\b/i).slice(1).length : 0;
        const generalBlockCount = generalXml ? String(generalXml).split(/<item\b/i).slice(1).length : 0;
        return jsonResponse({
          politicsFeedFetched: !!politicsXml,
          generalFeedFetched: !!generalXml,
          politicsParsedCount: politicsItems.length,
          generalParsedCount: generalItems.length,
          politicsBlockCount,
          generalBlockCount,
          politicsSample: politicsItems.slice(0, 3),
          generalSample: generalItems.slice(0, 3),
          politicsXmlSnippet: politicsXml ? politicsXml.slice(0, 500) : "",
          generalXmlSnippet: generalXml ? generalXml.slice(0, 500) : ""
        });
      }
      if (request.method === "GET" && url.pathname === "/api/news/bbc") {
        const items = await fetchBbcNews();
        return jsonResponse({ items });
      }
      if (request.method === "GET" && url.pathname === "/api/news/guardian") {
        const items = await fetchGuardianNews(env);
        return jsonResponse({ items });
      }
      if (request.method === "GET" && url.pathname === "/api/news/sky") {
        const items = await fetchSkyNews();
        return jsonResponse({ items });
      }
      if (request.method === "GET" && url.pathname === "/api/news") {
        const payload = await getNewsPayload();
        return jsonResponse(payload);
      }
      if (request.method === "GET" && url.pathname === "/api/parliament-video") {
        if (!env.YOUTUBE_API_KEY) {
          return jsonResponse(
            {
              error: "Missing YOUTUBE_API_KEY",
              message: "Set the YOUTUBE_API_KEY secret in Cloudflare Workers."
            },
            { status: 500 }
          );
        }
        const { channelId, uploadsPlaylistId, channelTitle } = await getChannelIdFromHandle(
          env.YOUTUBE_API_KEY,
          "@UKParliament"
        );
        let video = await getLiveVideo(env.YOUTUBE_API_KEY, channelId);
        if (!video) {
          video = await getLatestUploadedVideo(env.YOUTUBE_API_KEY, uploadsPlaylistId);
        }
        if (!video) {
          return jsonResponse(
            {
              error: "No video found",
              message: "Could not find a live or latest UK Parliament video.",
              channelId,
              channelTitle
            },
            { status: 404 }
          );
        }
        return jsonResponse({
          ...video,
          channelId,
          channelTitle,
          youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          channelUrl: "https://www.youtube.com/@UKParliament",
          commonsUrl: "https://www.parliamentlive.tv/Commons"
        });
      }
      if (request.method === "POST" && url.pathname === "/api/polls/import") {
        const body = await request.json();
        const polls = Array.isArray(body?.polls) ? body.polls : null;
        if (!polls) {
          return jsonResponse({ error: "Missing polls array" }, { status: 400 });
        }
        const existingPolls = await loadContentSection("pollsData");
        const mergedPolls = mergePolls(existingPolls, polls);
        await saveContentSection("pollsData", mergedPolls);
        return jsonResponse({
          ok: true,
          imported: polls.length,
          totalPolls: mergedPolls.length
        });
      }
      if (request.method === "GET" && url.pathname === "/api/polls") {
        const polls = await loadNormalizedPolls();
        return jsonResponse({
          count: polls.length,
          polls
        });
      }
      if (request.method === "GET" && url.pathname === "/api/polls/latest") {
        const polls = keepLatestPollPerPollster(
          keepOnlyReleasePollsters(await loadNormalizedPolls())
        );
        return jsonResponse({
          count: polls.length,
          polls
        });
      }
      if (request.method === "GET" && url.pathname === "/api/pollsters") {
        const polls = keepOnlyReleasePollsters(await loadNormalizedPolls());
        const groups = /* @__PURE__ */ new Map();
        for (const poll of polls) {
          if (!poll.pollster) continue;
          if (!groups.has(poll.pollster)) {
            groups.set(poll.pollster, {
              name: poll.pollster,
              isBpcMember: !!poll.isBpcMember,
              pollCount: 0,
              latestPoll: null
            });
          }
          const g = groups.get(poll.pollster);
          g.pollCount += 1;
          if (!g.latestPoll || (poll.publishedAt || poll.fieldworkEnd || poll.fieldworkStart || "") > (g.latestPoll.publishedAt || g.latestPoll.fieldworkEnd || g.latestPoll.fieldworkStart || "")) {
            g.latestPoll = poll;
          }
        }
        return jsonResponse({
          count: groups.size,
          pollsters: [...groups.values()].sort(
            (a, b) => b.pollCount - a.pollCount || a.name.localeCompare(b.name)
          )
        });
      }
      if (request.method === "GET" && url.pathname === "/api/elections/councils") {
        const merged = await loadMergedCouncilData();
        return jsonResponse(merged);
      }
      if (request.method === "GET" && url.pathname === "/api/elections/byelections") {
        const byElections = await loadContentSection("byElections");
        return jsonResponse(
          byElections && typeof byElections === "object" ? byElections : { upcoming: [], recent: [], meta: null }
        );
      }
      if (request.method === "GET" && url.pathname === "/api/elections/intelligence") {
        const electionsIntelligence = await loadElectionsIntelligence();
        return jsonResponse(electionsIntelligence);
      }
      if (request.method === "GET" && url.pathname.startsWith("/api/elections/council/")) {
        const slug = decodeURIComponent(url.pathname.split("/").pop() || "").trim().toLowerCase();
        if (!slug) {
          return jsonResponse({ error: "Missing council slug" }, { status: 400 });
        }
        const merged = await loadMergedCouncilData();
        const council = merged.councils.find((item) => String(item.slug || "").toLowerCase() === slug);
        if (!council) {
          return jsonResponse({ error: "Council not found", slug }, { status: 404 });
        }
        return jsonResponse({ council });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/import-registry") {
        const body = await request.json();
        const rows = Array.isArray(body?.councils) ? body.councils : body;
        if (!Array.isArray(rows)) {
          return jsonResponse({ error: "Expected an array of council registry rows" }, { status: 400 });
        }
        const normalized = rows.map(normalizeCouncilRegistryRecord).filter(Boolean);
        await saveContentSection("councilRegistry", normalized);
        return jsonResponse({
          ok: true,
          section: "councilRegistry",
          count: normalized.length
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/import-editorial") {
        const body = await request.json();
        const rows = Array.isArray(body?.councils) ? body.councils : body;
        if (!Array.isArray(rows)) {
          return jsonResponse({ error: "Expected an array of council editorial rows" }, { status: 400 });
        }
        const normalized = rows.map(normalizeCouncilEditorialRecord).filter(Boolean);
        await saveContentSection("councilEditorial", normalized);
        return jsonResponse({
          ok: true,
          section: "councilEditorial",
          count: normalized.length
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/import-status") {
        const body = await request.json();
        const rows = Array.isArray(body?.councils) ? body.councils : body;
        if (!Array.isArray(rows)) {
          return jsonResponse({ error: "Expected an array of council status rows" }, { status: 400 });
        }
        const normalized = rows.map(normalizeCouncilStatusRecord).filter(Boolean);
        await saveContentSection("councilStatus", normalized);
        return jsonResponse({
          ok: true,
          section: "councilStatus",
          count: normalized.length
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/import-byelections") {
        const body = await request.json();
        const payload = body && typeof body === "object" ? {
          upcoming: Array.isArray(body.upcoming) ? body.upcoming : [],
          recent: Array.isArray(body.recent) ? body.recent : [],
          meta: body.meta && typeof body.meta === "object" ? body.meta : null
        } : null;
        if (!payload) {
          return jsonResponse(
            { error: "Expected a by-elections payload with upcoming, recent, and optional meta fields" },
            { status: 400 }
          );
        }
        await saveContentSection("byElections", payload);
        return jsonResponse({
          ok: true,
          section: "byElections",
          upcoming: payload.upcoming.length,
          recent: payload.recent.length,
          hasMeta: !!payload.meta
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/mayors-enrich") {
        const body = await request.json();
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return jsonResponse(
            { error: "Expected { regional: {...}, council: {...} }" },
            { status: 400 }
          );
        }
        const enrichments = {
          regional: body.regional && typeof body.regional === "object" && !Array.isArray(body.regional) ? body.regional : {},
          council: body.council && typeof body.council === "object" && !Array.isArray(body.council) ? body.council : {}
        };
        await saveContentSection("mayorEnrichments", enrichments);
        const regionalCount = Object.keys(enrichments.regional).length;
        const councilCount = Object.keys(enrichments.council).length;
        return jsonResponse({
          ok: true,
          section: "mayorEnrichments",
          regionalEnrichments: regionalCount,
          councilEnrichments: councilCount,
          totalEnrichments: regionalCount + councilCount,
          note: "Mayor enrichments saved. Run elections:intelligence:refresh to apply."
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/mayors-external-source") {
        const body = await request.json();
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return jsonResponse(
            { error: "Expected { meta?, regional?: [...], council?: [...] }" },
            { status: 400 }
          );
        }
        const externalSource = {
          ...body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? { meta: body.meta } : {},
          regional: Array.isArray(body.regional) ? body.regional : [],
          council: Array.isArray(body.council) ? body.council : []
        };
        await saveContentSection("mayorExternalSource", externalSource);
        return jsonResponse({
          ok: true,
          section: "mayorExternalSource",
          regionalRecords: externalSource.regional.length,
          councilRecords: externalSource.council.length,
          totalRecords: externalSource.regional.length + externalSource.council.length,
          sourceType: externalSource.meta?.sourceType || null,
          note: "Mayors external-source input saved. Run elections:intelligence:refresh to apply."
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/devolved-enrich") {
        const body = await request.json();
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return jsonResponse(
            { error: "Expected { nations: {...} }" },
            { status: 400 }
          );
        }
        const enrichments = {
          nations: body.nations && typeof body.nations === "object" && !Array.isArray(body.nations) ? body.nations : {}
        };
        await saveContentSection("devolvedEnrichments", enrichments);
        const nationCount = Object.keys(enrichments.nations).length;
        return jsonResponse({
          ok: true,
          section: "devolvedEnrichments",
          nationEnrichments: nationCount,
          totalEnrichments: nationCount,
          note: "Devolved enrichments saved. Run elections:intelligence:refresh to apply."
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/intelligence-refresh") {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const mayorEnrichments = await loadMayorEnrichments();
        const mayorExternalSource = await loadMayorExternalSource();
        const devolvedEnrichments = await loadDevolvedEnrichments();
        const freshMayorsWithDebug = buildMayorsIntelligencePayload({
          updatedAt: now,
          sourceCount: 1,
          includeDebug: true,
          ...mayorExternalSource !== null ? { externalSource: mayorExternalSource } : {},
          ...mayorEnrichments !== null ? { enrichments: mayorEnrichments } : {}
        });
        const { _debug: mayorsDebug = null, ...freshMayors } = freshMayorsWithDebug;
        const freshDevolved = buildDevolvedIntelligencePayload({
          updatedAt: now,
          sourceCount: 1,
          ...devolvedEnrichments !== null ? { enrichments: devolvedEnrichments } : {}
        });
        await saveContentSection("electionsIntelligence", { mayors: freshMayors, devolved: freshDevolved });
        const ov = freshMayors.overview || {};
        const devolvedNations = freshDevolved.nations || [];
        return jsonResponse({
          ok: true,
          sections: ["mayors", "devolved"],
          refreshedAt: now,
          mayors: {
            totalRegional: ov.totalRegional ?? null,
            totalCouncil: ov.totalCouncil ?? null,
            labourRegional: ov.labourRegional ?? null,
            conservativeRegional: ov.conservativeRegional ?? null,
            reformRegional: ov.reformRegional ?? null,
            newRegional: ov.newRegional ?? null,
            enrichedCount: freshMayors.meta?.enrichedCount ?? 0,
            externalOverrideCount: freshMayors.meta?.externalOverrideCount ?? 0,
            externalSourceUsed: freshMayors.meta?.externalSourceUsed ?? false,
            sourceType: freshMayors.meta?.sourceType ?? null
          },
          debug: mayorsDebug ? {
            temporary: "Remove after local verification of mayor enrichment matching.",
            mayorsEnrichment: mayorsDebug
          } : null,
          devolved: {
            nationsCount: devolvedNations.length,
            nations: devolvedNations.map((n) => ({ key: n.key, title: n.title, nextElection: n.nextElection })),
            enrichedCount: freshDevolved.meta?.enrichedCount ?? 0,
            sourceType: freshDevolved.meta?.sourceType ?? null
          },
          note: "All Elections intelligence sections re-derived from maintained source and saved."
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/mayors-refresh") {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const existing = await loadElectionsIntelligence();
        const enrichments = await loadMayorEnrichments();
        const externalSource = await loadMayorExternalSource();
        const freshMayorsWithDebug = buildMayorsIntelligencePayload({
          updatedAt: now,
          sourceCount: 1,
          includeDebug: true,
          ...externalSource !== null ? { externalSource } : {},
          ...enrichments !== null ? { enrichments } : {}
        });
        const { _debug: mayorsDebug = null, ...freshMayors } = freshMayorsWithDebug;
        const updated = { ...existing, mayors: freshMayors };
        await saveContentSection("electionsIntelligence", updated);
        const ov = freshMayors.overview || {};
        return jsonResponse({
          ok: true,
          section: "mayors",
          refreshedAt: now,
          totalRegional: ov.totalRegional ?? null,
          totalCouncil: ov.totalCouncil ?? null,
          labourRegional: ov.labourRegional ?? null,
          conservativeRegional: ov.conservativeRegional ?? null,
          reformRegional: ov.reformRegional ?? null,
          newRegional: ov.newRegional ?? null,
          enrichedCount: freshMayors.meta?.enrichedCount ?? 0,
          externalOverrideCount: freshMayors.meta?.externalOverrideCount ?? 0,
          externalSourceUsed: freshMayors.meta?.externalSourceUsed ?? false,
          sourceType: freshMayors.meta?.sourceType ?? null,
          debug: mayorsDebug ? {
            temporary: "Remove after local verification of mayor enrichment matching.",
            mayorsEnrichment: mayorsDebug
          } : null,
          note: "Mayors intelligence re-derived from maintained source and saved to electionsIntelligence."
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/devolved-refresh") {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const existing = await loadElectionsIntelligence();
        const enrichments = await loadDevolvedEnrichments();
        const freshDevolved = buildDevolvedIntelligencePayload({
          updatedAt: now,
          sourceCount: 1,
          ...enrichments !== null ? { enrichments } : {}
        });
        const updated = { ...existing, devolved: freshDevolved };
        await saveContentSection("electionsIntelligence", updated);
        const nations = freshDevolved.nations || [];
        return jsonResponse({
          ok: true,
          section: "devolved",
          refreshedAt: now,
          nationsCount: nations.length,
          nations: nations.map((n) => ({ key: n.key, title: n.title, nextElection: n.nextElection })),
          enrichedCount: freshDevolved.meta?.enrichedCount ?? 0,
          sourceType: freshDevolved.meta?.sourceType ?? null,
          note: "Devolved intelligence re-derived from maintained source and saved to electionsIntelligence."
        });
      }
      if (request.method === "POST" && url.pathname === "/api/elections/refresh-status") {
        const existing = await loadCouncilStatus();
        const refreshed = existing.map((row) => ({
          ...row,
          lastVerifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
          verificationStatus: row.verificationStatus || "unverified"
        }));
        await saveContentSection("councilStatus", refreshed);
        return jsonResponse({
          ok: true,
          section: "councilStatus",
          count: refreshed.length,
          refreshedAt: (/* @__PURE__ */ new Date()).toISOString(),
          note: "This endpoint currently refreshes verification timestamps and is ready for automated council-source fetch logic."
        });
      }
      if (request.method === "GET" && url.pathname === "/api/data") {
        const polls = await env.DB.prepare(
          "SELECT id, name, pct, change, seats, updated_at FROM polls ORDER BY id ASC"
        ).all();
        const leaders = await env.DB.prepare(
          "SELECT id, name, net, role, bio, party FROM leaders ORDER BY id ASC"
        ).all();
        const elections = await env.DB.prepare(
          "SELECT id, name, date, data FROM elections ORDER BY id ASC"
        ).all();
        const metaObj = await loadMeta();
        const trends = await loadContentSection("trends");
        const betting = await loadContentSection("betting");
        const byElections = await loadContentSection("byElections");
        const migration = await loadMigrationData();
        const milestones = await loadContentSection("milestones");
        const pollsData = await loadContentSection("pollsData");
        const ingestStatus = await loadContentSection("ingestStatus");
        const demographics = await loadContentSection("demographics");
        const policyRecords = await loadContentSection("policyRecords");
        const policyTaxonomy = await loadContentSection("policyTaxonomy");
        const policyDelivery = await loadContentSection("policyDelivery");
        const newsPayload = await getNewsPayload();
        const councilRegistry = await loadContentSection("councilRegistry");
        const councilStatus = await loadContentSection("councilStatus");
        const councilEditorial = await loadContentSection("councilEditorial");
        const electionsIntelligence = await loadElectionsIntelligence();
        const parsedElectionRows = (elections.results || []).map((row) => ({
          ...row,
          data: row.data ? JSON.parse(row.data) : null
        }));
        const electionsPayload = parsedElectionRows.length > 0 && parsedElectionRows[0]?.data && typeof parsedElectionRows[0].data === "object" ? parsedElectionRows[0].data : {};
        return jsonResponse({
          polls: polls.results || [],
          leaders: leaders.results || [],
          elections: {
            ...electionsPayload,
            intelligence: electionsIntelligence
          },
          meta: metaObj,
          trends: trends || [],
          betting: betting || null,
          byElections: byElections || null,
          migration: migration || null,
          milestones: milestones || [],
          pollsData: pollsData || [],
          ingestStatus: ingestStatus || null,
          demographics: demographics || null,
          policyRecords: Array.isArray(policyRecords) ? policyRecords : null,
          policyTaxonomy: policyTaxonomy || null,
          policyDelivery: Array.isArray(policyDelivery) ? policyDelivery : null,
          news: newsPayload || { items: [], meta: null },
          newsItems: Array.isArray(newsPayload?.items) ? newsPayload.items : [],
          councilRegistry: councilRegistry || [],
          councilStatus: councilStatus || [],
          councilEditorial: councilEditorial || [],
          electionsIntelligence
        });
      }
      if (request.method === "POST" && url.pathname === "/api/save") {
        const body = await request.json();
        const { section, payload } = body || {};
        if (!section) {
          return new Response("Missing section", { status: 400, headers: corsHeaders });
        }
        if (section === "meta") {
          const entries = Object.entries(payload || {});
          for (const [key, value] of entries) {
            await env.DB.prepare(
              "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)"
            ).bind(key, String(value ?? "")).run();
          }
          return new Response("ok", { headers: corsHeaders });
        }
        if (section === "polls") {
          await env.DB.prepare("DELETE FROM polls").run();
          for (const row of payload || []) {
            await env.DB.prepare(
              "INSERT INTO polls (id, name, pct, change, seats, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(
              row.id ?? null,
              row.name ?? "",
              row.pct ?? 0,
              row.change ?? 0,
              row.seats ?? 0,
              row.updated_at ?? (/* @__PURE__ */ new Date()).toISOString()
            ).run();
          }
          return new Response("ok", { headers: corsHeaders });
        }
        if (section === "leaders") {
          await env.DB.prepare("DELETE FROM leaders").run();
          for (const row of payload || []) {
            await env.DB.prepare(
              "INSERT INTO leaders (id, name, net, role, bio, party) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(
              row.id ?? null,
              row.name ?? "",
              row.net ?? 0,
              row.role ?? "",
              row.bio ?? "",
              row.party ?? ""
            ).run();
          }
          return new Response("ok", { headers: corsHeaders });
        }
        if (section === "elections") {
          await env.DB.prepare("DELETE FROM elections").run();
          for (const row of payload || []) {
            await env.DB.prepare(
              "INSERT INTO elections (id, name, date, data) VALUES (?, ?, ?, ?)"
            ).bind(
              row.id ?? null,
              row.name ?? "",
              row.date ?? "",
              JSON.stringify(row.data ?? null)
            ).run();
          }
          return new Response("ok", { headers: corsHeaders });
        }
        if ([
          "trends",
          "betting",
          "byElections",
          "electionsIntelligence",
          "migrationData",
          "migration",
          "milestones",
          "pollsData",
          "ingestStatus",
          "demographics",
          "policyRecords",
          "policyTaxonomy",
          "policyDelivery",
          "newsItems",
          "councilRegistry",
          "councilStatus",
          "councilEditorial"
        ].includes(section)) {
          await saveContentSection(section, payload);
          return new Response("ok", { headers: corsHeaders });
        }
        return new Response("Unknown section", { status: 400, headers: corsHeaders });
      }
      if (request.method === "POST" && url.pathname === "/api/seed") {
        const body = await request.json();
        await env.DB.prepare("DELETE FROM polls").run();
        await env.DB.prepare("DELETE FROM leaders").run();
        await env.DB.prepare("DELETE FROM elections").run();
        await env.DB.prepare("DELETE FROM meta").run();
        if (await tableExists("content")) {
          await env.DB.prepare("DELETE FROM content").run();
        }
        for (const p of body.parties || []) {
          await env.DB.prepare(
            "INSERT INTO polls (id, name, pct, change, seats, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            p.id ?? null,
            p.name ?? "",
            p.pct ?? 0,
            p.change ?? 0,
            p.seats ?? 0,
            (/* @__PURE__ */ new Date()).toISOString()
          ).run();
        }
        for (const leader of body.leaders || []) {
          await env.DB.prepare(
            "INSERT INTO leaders (id, name, net, role, bio, party) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(
            leader.id ?? null,
            leader.name ?? "",
            leader.net ?? 0,
            leader.role ?? "",
            leader.bio ?? "",
            leader.party ?? ""
          ).run();
        }
        await env.DB.prepare(
          "INSERT INTO elections (id, name, date, data) VALUES (?, ?, ?, ?)"
        ).bind(1, "main", "", JSON.stringify(body.elections ?? {})).run();
        for (const [key, value] of Object.entries(body.meta || {})) {
          await env.DB.prepare("INSERT INTO meta (key, value) VALUES (?, ?)").bind(key, String(value ?? "")).run();
        }
        if (await tableExists("content")) {
          const contentSections = {
            trends: body.trends || [],
            betting: body.betting || null,
            byElections: body.byElections || null,
            electionsIntelligence: body.electionsIntelligence || null,
            migrationData: body.migrationData || body.migration || null,
            migration: body.migration || null,
            milestones: body.milestones || [],
            pollsData: body.polls || [],
            ingestStatus: body.ingestStatus || null,
            demographics: body.demographics || null,
            policyRecords: body.policyRecords || null,
            policyTaxonomy: body.policyTaxonomy || null,
            policyDelivery: body.policyDelivery || null,
            newsItems: body.newsItems || [],
            councilRegistry: body.councilRegistry || [],
            councilStatus: body.councilStatus || [],
            councilEditorial: body.councilEditorial || []
          };
          for (const [section, data] of Object.entries(contentSections)) {
            await env.DB.prepare(
              `INSERT INTO content (section, data, updated_at)
               VALUES (?, ?, ?)
               ON CONFLICT(section) DO UPDATE SET
                 data = excluded.data,
                 updated_at = excluded.updated_at`
            ).bind(section, JSON.stringify(data), (/* @__PURE__ */ new Date()).toISOString()).run();
          }
        }
        return new Response("seeded", { headers: corsHeaders });
      }
      return new Response("Not found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return jsonResponse(
        {
          error: "Worker failed",
          message: err instanceof Error ? err.message : String(err)
        },
        { status: 500 }
      );
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-TyaL7K/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-TyaL7K/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
