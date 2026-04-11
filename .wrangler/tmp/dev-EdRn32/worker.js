var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-0uMR6J/checked-fetch.js
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
      "techne",
      "opinium",
      "ipsos"
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
      const fieldworkStart = row.fieldworkStart || row.startDate || row.fieldwork_from || row.from || null;
      const fieldworkEnd = row.fieldworkEnd || row.endDate || row.fieldwork_to || row.to || null;
      const publishedAt = row.publishedAt || row.publishDate || row.published || row.releaseDate || row.datePublished || null;
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
    async function loadNormalizedPolls() {
      const pollsData = await loadContentSection("pollsData");
      const raw = Array.isArray(pollsData) ? pollsData : [];
      const normalized = raw.map((row, idx) => normalizePollRecord(row, idx)).filter(Boolean);
      return sortPollsNewestFirst(normalized);
    }
    __name(loadNormalizedPolls, "loadNormalizedPolls");
    function slugifyCouncilName(value) {
      return String(value || "").trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    __name(slugifyCouncilName, "slugifyCouncilName");
    function normalizeCouncilRegistryRecord(row = {}) {
      const name = titleCase(row.name || row.council || "");
      if (!name) return null;
      return {
        slug: row.slug || slugifyCouncilName(name),
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
      const slug = row.slug || slugifyCouncilName(name);
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
      const slug = row.slug || slugifyCouncilName(name);
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
      if (t.includes("labour") || t.includes("conservative") || t.includes("reform") || t.includes("liberal democrats") || t.includes("lib dem") || t.includes("green party") || t.includes("snp") || t.includes("plaid") || t.includes("farage") || t.includes("starmer") || t.includes("badenoch") || t.includes("minister") || t.includes("cabinet") || t.includes("mp")) return "Party";
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
      if (actorMatches === 0 && institutionMatches === 0) return null;
      if (hostname === "bbc.co.uk" && !textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS) && score < 5) {
        return null;
      }
      if (score < 3) return null;
      return {
        title,
        source: titleCase(article?.source?.name || article.source || ""),
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
        publishedAt: scored.publishedAt,
        url: scored.url,
        tag: scored.tag,
        score: scored.score
      };
    }
    __name(normalizeNewsItem, "normalizeNewsItem");
    function dedupeNewsItems(items) {
      const seen = /* @__PURE__ */ new Set();
      const out = [];
      for (const item of items || []) {
        const key = String(item.url || item.title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").slice(0, 10).join(" ");
        if (!key || seen.has(key)) continue;
        seen.add(key);
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
    async function fetchLiveNews(env2) {
      const now = Date.now();
      const bbcItems = await fetchBbcNews();
      const guardianItems = await fetchGuardianNews(env2);
      const skyItems = await fetchSkyNews();
      const ranked = [...bbcItems, ...guardianItems, ...skyItems].sort((a, b) => {
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
      const balanced = capNewsItemsBySource(deduped, 3, 12);
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
    async function getNewsItems() {
      const hasContent = await tableExists("content");
      if (!hasContent) {
        return await fetchLiveNews(env);
      }
      const cached = await loadContentSectionRow(NEWS_CACHE_SECTION);
      if (cached?.data && Array.isArray(cached.data.items) && cached.data.items.length > 0 && isFreshEnough(cached.data.fetchedAt || cached.updated_at)) {
        return cached.data.items;
      }
      const items = await fetchLiveNews(env);
      const payload = {
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
        items
      };
      await saveContentSection(NEWS_CACHE_SECTION, payload);
      return items;
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
        const items = await getNewsItems();
        return jsonResponse({ items });
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
        const migration = await loadContentSection("migration");
        const milestones = await loadContentSection("milestones");
        const pollsData = await loadContentSection("pollsData");
        const demographics = await loadContentSection("demographics");
        const newsItems = await loadContentSection("newsItems");
        const councilRegistry = await loadContentSection("councilRegistry");
        const councilStatus = await loadContentSection("councilStatus");
        const councilEditorial = await loadContentSection("councilEditorial");
        return jsonResponse({
          polls: polls.results || [],
          leaders: leaders.results || [],
          elections: (elections.results || []).map((row) => ({
            ...row,
            data: row.data ? JSON.parse(row.data) : null
          })),
          meta: metaObj,
          trends: trends || [],
          betting: betting || null,
          byElections: byElections || null,
          migration: migration || null,
          milestones: milestones || [],
          pollsData: pollsData || [],
          demographics: demographics || null,
          newsItems: newsItems || [],
          councilRegistry: councilRegistry || [],
          councilStatus: councilStatus || [],
          councilEditorial: councilEditorial || []
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
          "migration",
          "milestones",
          "pollsData",
          "demographics",
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
            migration: body.migration || null,
            milestones: body.milestones || [],
            pollsData: body.polls || [],
            demographics: body.demographics || null,
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

// .wrangler/tmp/bundle-0uMR6J/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-0uMR6J/middleware-loader.entry.ts
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
