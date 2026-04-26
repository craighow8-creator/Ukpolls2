import { buildElectionsIntelligencePayload, buildMayorsIntelligencePayload, buildDevolvedIntelligencePayload } from './src/data/electionsIntelligence.js'
import { runPollIngestForWorker } from './src/shared/pollIngestCore.js'
import { runPolymarketPredictionRefresh } from './src/shared/predictionMarketsCore.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const jsonResponse = (data, init = {}) =>
      new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
        status: init.status || 200,
      })

    async function cachedJsonResponse(request, buildResponse, ttlSeconds = 600) {
      const cache = caches.default
      const cacheKey = new Request(request.url, request)
      const cached = await cache.match(cacheKey)
      if (cached) return cached

      const response = await buildResponse()
      if (response?.ok) {
        response.headers.set('Cache-Control', `public, max-age=${ttlSeconds}`)
        await cache.put(cacheKey, response.clone())
      }

      return response
    }

    function decodeHtmlEntities(value) {
      return String(value || '')
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim()
    }

    function stripTags(value) {
      return decodeHtmlEntities(String(value || '').replace(/<[^>]*>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim()
    }

    function getTagValue(block, tag) {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
      const m = block.match(re)
      return m ? m[1] : ''
    }

    function parseRssItems(xml, sourceName) {
      const source = String(xml || '')
      const itemMatches = source.match(/<item\b[\s\S]*?<\/item>/gi) || []
      const entryMatches = source.match(/<entry\b[\s\S]*?<\/entry>/gi) || []

      if (itemMatches.length) {
        return itemMatches.map((item) => {
          const title = stripTags(getTagValue(item, 'title'))
          const url = stripTags(getTagValue(item, 'link'))
          const description = stripTags(getTagValue(item, 'description') || getTagValue(item, 'summary'))
          const publishedAt = stripTags(getTagValue(item, 'pubDate') || getTagValue(item, 'published') || getTagValue(item, 'updated'))
          if (!title || !url) return null
          const parsedTime = publishedAt ? new Date(publishedAt).getTime() : NaN
          return {
            title,
            source: sourceName,
            publishedAt: !Number.isNaN(parsedTime) ? new Date(parsedTime).toISOString() : new Date().toISOString(),
            url,
            description,
            tag: inferNewsTag(title),
          }
        }).filter(Boolean)
      }

      return entryMatches.map((entry) => {
        const title = stripTags(getTagValue(entry, 'title'))
        const description = stripTags(getTagValue(entry, 'summary') || getTagValue(entry, 'content'))
        const publishedAt = stripTags(getTagValue(entry, 'published') || getTagValue(entry, 'updated'))
        let url = ''
        const linkMatch = entry.match(/<link[^>]+href=["']([^"']+)["']/i)
        if (linkMatch && linkMatch[1]) {
          url = stripTags(linkMatch[1])
        } else {
          url = stripTags(getTagValue(entry, 'link'))
        }
        if (!title || !url) return null
        const parsedTime = publishedAt ? new Date(publishedAt).getTime() : NaN
        return {
          title,
          source: sourceName,
          publishedAt: !Number.isNaN(parsedTime) ? new Date(parsedTime).toISOString() : new Date().toISOString(),
          url,
          description,
          tag: inferNewsTag(title),
        }
      }).filter(Boolean)
    }

    async function fetchText(url, timeoutMs = 10000) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch(url, {
          headers: {
            Accept: 'application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
            'User-Agent': 'Politiscope/1.0 (+https://politiscope.app)',
          },
          signal: controller.signal,
        })
        if (!res.ok) return null
        return await res.text()
      } catch {
        return null
      } finally {
        clearTimeout(timeout)
      }
    }


    const BPC_MEMBERS = new Set([
      'ipsos',
      'orb international',
      'savanta',
      'verian',
      'yougov',
      'bmg research',
      'censuswide',
      'deltapoll',
      'electoral calculus',
      'find out now',
      'focaldata',
      'hanbury strategy',
      'j.l. partners',
      'lucidtalk',
      'more in common',
      'norstat',
      'obsurvant',
      'opinium',
      'public first',
      'redfield & wilton strategies',
      'survation',
      'techne',
      'whitestone insight',
      'yonder consulting',
    ])

    const RELEASE_POLLSTERS = new Set([
      'yougov',
      'more in common',
      'opinium',
      'ipsos',
      'find out now',
      'focaldata',
    ])

    function norm(value) {
      return String(value || '').trim().toLowerCase()
    }

    function titleCase(value) {
      return String(value || '').trim().replace(/\s+/g, ' ')
    }

    function safeNumber(value) {
      if (value === null || value === undefined || value === '') return null
      const raw = String(value).trim().replace(/%/g, '').replace(/,/g, '')
      if (!raw) return null
      const n = Number(raw)
      return Number.isFinite(n) ? n : null
    }


    function sanitizeIsoDate(value) {
      if (!value) return null
      const text = String(value).trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text

      const ts = Date.parse(`${text}T00:00:00Z`)
      if (Number.isNaN(ts)) return text

      const now = Date.now()
      const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000

      if (ts <= now + fortyFiveDaysMs) return text

      const d = new Date(ts)
      d.setUTCFullYear(d.getUTCFullYear() - 1)
      return d.toISOString().slice(0, 10)
    }

    function formatDateRange(start, end, fallback) {
      if (fallback) return String(fallback)
      if (start && end && start !== end) return `${start} – ${end}`
      return start || end || null
    }

    function makePollId(pollster, publishedAt, fieldworkEnd, idx = 0) {
      return `${norm(pollster).replace(/[^a-z0-9]+/g, '-')}-${publishedAt || fieldworkEnd || 'undated'}-${idx}`
    }

    function normalizePollRecord(row, idx = 0) {
      if (!row || typeof row !== 'object') return null

      const pollster =
        row.pollster ||
        row.pollsterName ||
        row.house ||
        row.company ||
        row.organisation ||
        row.organization ||
        ''

      if (!pollster) return null

      const fieldworkStart = sanitizeIsoDate(
        row.fieldworkStart ||
        row.startDate ||
        row.fieldwork_from ||
        row.from ||
        null
      )

      const fieldworkEnd = sanitizeIsoDate(
        row.fieldworkEnd ||
        row.endDate ||
        row.fieldwork_to ||
        row.to ||
        null
      )

      const publishedAt = sanitizeIsoDate(
        row.publishedAt ||
        row.publishDate ||
        row.published ||
        row.releaseDate ||
        row.datePublished ||
        null
      )

      return {
        id: row.id || makePollId(pollster, publishedAt, fieldworkEnd, idx),
        pollster: titleCase(pollster),
        isBpcMember:
          row.isBpcMember != null ? !!row.isBpcMember : BPC_MEMBERS.has(norm(pollster)),
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
        snp: safeNumber(row.snp),
      }
    }

    function sortPollsNewestFirst(polls) {
      const score = (p) => p.publishedAt || p.fieldworkEnd || p.fieldworkStart || ''
      return [...polls].sort((a, b) => score(b).localeCompare(score(a)))
    }

    function mergePolls(existingPolls, incomingPolls) {
      const map = new Map()

      for (const poll of existingPolls || []) {
        const normal = normalizePollRecord(poll)
        if (normal?.id) map.set(normal.id, normal)
      }

      for (const poll of incomingPolls || []) {
        const normal = normalizePollRecord(poll)
        if (normal?.id) map.set(normal.id, normal)
      }

      return sortPollsNewestFirst([...map.values()])
    }

    function keepOnlyReleasePollsters(polls) {
      return (polls || []).filter((poll) => RELEASE_POLLSTERS.has(norm(poll?.pollster)))
    }

    function keepLatestPollPerPollster(polls) {
      const latestByPollster = new Map()

      for (const poll of polls || []) {
        if (!poll?.pollster) continue

        const current = latestByPollster.get(poll.pollster)
        const pollScore = poll.publishedAt || poll.fieldworkEnd || poll.fieldworkStart || ''
        const currentScore = current?.publishedAt || current?.fieldworkEnd || current?.fieldworkStart || ''

        if (!current || pollScore > currentScore) {
          latestByPollster.set(poll.pollster, poll)
        }
      }

      return sortPollsNewestFirst([...latestByPollster.values()])
    }

    async function tableExists(tableName) {
      const res = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).bind(tableName).first()
      return !!res
    }

    async function loadMeta() {
      const meta = await env.DB.prepare('SELECT key, value FROM meta').all()
      const metaObj = {}
      for (const row of meta.results || []) {
        metaObj[row.key] = row.value
      }
      return metaObj
    }


    async function loadContentSection(section) {
      const hasContent = await tableExists('content')
      if (!hasContent) return null

      const row = await env.DB.prepare(
        'SELECT section, data, updated_at FROM content WHERE section = ? LIMIT 1'
      ).bind(section).first()

      if (!row) return null

      try {
        return row.data ? JSON.parse(row.data) : null
      } catch {
        return null
      }
    }

    async function loadContentSectionRow(section) {
      const hasContent = await tableExists('content')
      if (!hasContent) return null

      const row = await env.DB.prepare(
        'SELECT section, data, updated_at FROM content WHERE section = ? LIMIT 1'
      ).bind(section).first()

      if (!row) return null

      try {
        return {
          section: row.section,
          updated_at: row.updated_at || null,
          data: row.data ? JSON.parse(row.data) : null,
        }
      } catch {
        return {
          section: row.section,
          updated_at: row.updated_at || null,
          data: null,
        }
      }
    }

    async function loadPredictionMarkets() {
      const data = await loadContentSection('predictionMarkets')
      if (data && typeof data === 'object' && !Array.isArray(data)) return data
      return null
    }

    // Loads mayor enrichments from D1 (stored via POST /api/elections/mayors-enrich).
    // Returns the stored object when present, or null to signal that
    // buildMayorsIntelligencePayload should fall back to DEFAULT_MAYOR_ENRICHMENTS.
    async function loadMayorEnrichments() {
      const data = await loadContentSection('mayorEnrichments')
      if (data && typeof data === 'object' && !Array.isArray(data)) return data
      return null
    }

    // Loads structured external-style mayor source input from D1 (stored via
    // POST /api/elections/mayors-external-source). Returns null to signal the
    // shaper should fall back to DEFAULT_MAYOR_EXTERNAL_SOURCE in the bundle.
    async function loadMayorExternalSource() {
      const data = await loadContentSection('mayorExternalSource')
      if (data && typeof data === 'object' && !Array.isArray(data)) return data
      return null
    }

    // Loads devolved enrichments from D1 (stored via POST /api/elections/devolved-enrich).
    // Returns the stored object when present, or null so the shaper falls back
    // to DEFAULT_DEVOLVED_ENRICHMENTS from the bundle.
    async function loadDevolvedEnrichments() {
      const data = await loadContentSection('devolvedEnrichments')
      if (data && typeof data === 'object' && !Array.isArray(data)) return data
      return null
    }

    async function loadElectionsIntelligence() {
      const stored = await loadContentSectionRow('electionsIntelligence')
      if (stored?.data && typeof stored.data === 'object') {
        return stored.data
      }

      // This payload is currently shaped from maintained Elections source data.
      // A future live ingestion step can save an electionsIntelligence content
      // section and keep the same frontend contract.
      const mayorEnrichments = await loadMayorEnrichments()
      const mayorExternalSource = await loadMayorExternalSource()
      const devolvedEnrichments = await loadDevolvedEnrichments()
      return buildElectionsIntelligencePayload({
        updatedAt: stored?.updated_at || new Date().toISOString(),
        mayorsSourceCount: 1,
        devolvedSourceCount: 1,
        ...(mayorExternalSource !== null ? { mayorsExternalSource: mayorExternalSource } : {}),
        ...(mayorEnrichments !== null ? { mayorsEnrichments: mayorEnrichments } : {}),
        ...(devolvedEnrichments !== null ? { devolvedEnrichments } : {}),
      })
    }

    async function loadNormalizedPolls() {
      const pollsData = await loadContentSection('pollsData')
      const raw = Array.isArray(pollsData) ? pollsData : []
      const normalized = raw
        .map((row, idx) => normalizePollRecord(row, idx))
        .filter(Boolean)

      return sortPollsNewestFirst(normalized)
    }

    function slugifyCouncilName(value) {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    function normalizeCouncilRegistryRecord(row = {}) {
      const name = titleCase(row.name || row.council || '')
      if (!name) return null

      return {
        slug: row.slug || slugifyCouncilName(name),
        name,
        type: row.type || '',
        region: row.region || '',
        governanceModel: row.governanceModel || '',
        officialWebsite: row.officialWebsite || row.website || '',
        officialElectionsUrl: row.officialElectionsUrl || '',
        officialCompositionUrl: row.officialCompositionUrl || '',
        notes: row.notes || '',
      }
    }

    function normalizeCouncilStatusRecord(row = {}) {
      const name = titleCase(row.name || row.council || '')
      const slug = row.slug || slugifyCouncilName(name)
      if (!slug) return null

      return {
        slug,
        name,
        electionStatus: row.electionStatus || '',
        electionMessage: row.electionMessage || '',
        nextElectionYear: safeNumber(row.nextElectionYear),
        cycle: row.cycle || '',
        seatsTotal: safeNumber(row.seatsTotal ?? row.seats),
        seatsUp: safeNumber(row.seatsUp),
        control: row.control || '',
        leader: row.leader || '',
        mayor: row.mayor || '',
        administration: row.administration || '',
        composition: Array.isArray(row.composition) ? row.composition : [],
        governanceModel: row.governanceModel || '',
        verificationStatus: row.verificationStatus || 'unverified',
        verificationSourceType: row.verificationSourceType || '',
        lastVerifiedAt: row.lastVerifiedAt || new Date().toISOString(),
        sourceUrls: Array.isArray(row.sourceUrls) ? row.sourceUrls : [],
      }
    }

    function normalizeCouncilEditorialRecord(row = {}) {
      const name = titleCase(row.name || row.council || '')
      const slug = row.slug || slugifyCouncilName(name)
      if (!slug) return null

      return {
        slug,
        name,
        verdict: row.verdict || '',
        difficulty: row.difficulty || '',
        watchFor: row.watchFor || '',
        targetParty: row.targetParty || '',
        whatCountsAsShock: row.whatCountsAsShock || '',
        keyIssue: row.keyIssue || '',
        prediction: row.prediction || '',
        updatedAt: row.updatedAt || new Date().toISOString(),
      }
    }

    async function loadCouncilRegistry() {
      const data = await loadContentSection('councilRegistry')
      return Array.isArray(data) ? data.map(normalizeCouncilRegistryRecord).filter(Boolean) : []
    }

    async function loadCouncilStatus() {
      const data = await loadContentSection('councilStatus')
      return Array.isArray(data) ? data.map(normalizeCouncilStatusRecord).filter(Boolean) : []
    }

    async function loadCouncilEditorial() {
      const data = await loadContentSection('councilEditorial')
      return Array.isArray(data) ? data.map(normalizeCouncilEditorialRecord).filter(Boolean) : []
    }

    function mergeCouncilLayers(registry = [], status = [], editorial = []) {
      const out = new Map()

      for (const item of registry) {
        if (!item?.slug) continue
        out.set(item.slug, { ...item })
      }

      for (const item of status) {
        if (!item?.slug) continue
        out.set(item.slug, { ...(out.get(item.slug) || {}), ...item })
      }

      for (const item of editorial) {
        if (!item?.slug) continue
        out.set(item.slug, { ...(out.get(item.slug) || {}), ...item })
      }

      return [...out.values()].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    }

    async function loadMergedCouncilData() {
      const [registry, status, editorial] = await Promise.all([
        loadCouncilRegistry(),
        loadCouncilStatus(),
        loadCouncilEditorial(),
      ])

      return {
        registry,
        status,
        editorial,
        councils: mergeCouncilLayers(registry, status, editorial),
      }
    }


    const APPROVED_NEWS_DOMAINS = new Set([
      'bbc.co.uk',
      'theguardian.com',
      'news.sky.com',
      'ft.com',
      'gbnews.com',
      'dailymail.co.uk',
      'express.co.uk',
      'telegraph.co.uk',
    ])

    const UK_POLITICS_ACTOR_TERMS = [
      'keir starmer',
      'kemi badenoch',
      'nigel farage',
      'ed davey',
      'carla denyer',
      'adrian ramsay',
      'john swinney',
      'angela rayner',
      'rachel reeves',
      'yvette cooper',
      'shabana mahmood',
      'wes streeting',
      'bridget phillipson',
      'pat mcFadden',
      'james cleverly',
      'suella braverman',
      'robert jenrick',
      'labour',
      'labour party',
      'conservative',
      'conservatives',
      'conservative party',
      'tories',
      'reform uk',
      'reform',
      'liberal democrats',
      'lib dem',
      'lib dems',
      'green party',
      'green party of england and wales',
      'snp',
      'scottish national party',
      'plaid cymru',
      'minister',
      'ministers',
      'cabinet',
      'shadow cabinet',
      'shadow minister',
      'shadow chancellor',
      'shadow home secretary',
      'mp ',
      ' mp',
      'mps',
      'prime minister',
      'deputy prime minister',
      'chancellor',
      'home secretary',
      'foreign secretary',
      'health secretary',
      'education secretary',
      'justice secretary',
    ]

    const UK_POLITICS_INSTITUTION_TERMS = [
      'westminster',
      'parliament',
      'house of commons',
      'house of lords',
      'pmqs',
      "prime minister's questions",
      'general election',
      'local election',
      'by-election',
      'byelection',
      'mayoral election',
      'council tax',
      'budget',
      'autumn statement',
      'spring statement',
      'policy',
      'policies',
      'manifesto',
      'nhs',
      'immigration',
      'housing',
      'welfare',
      'net zero',
      'north sea',
      'energy bills',
      'tax',
      'taxes',
      'benefits',
      'public spending',
    ]

    const EXCLUDED_NEWS_URL_PARTS = [
      '/news/live/',
      '/sounds/',
      '/programmes/',
      '/iplayer/',
      '/sport/',
      '/newsround/',
      '/weather/',
      '/travel/',
      '/culture/',
      '/food/',
      '/life/',
      '/business/topics/',
    ]

    const EXCLUDED_NEWS_TERMS = [
      'vaccines for children in america',
      'us voting system',
    ]

    const CIVIC_BUT_NOT_NECESSARILY_POLITICAL_TERMS = [
      'weather',
      'travel',
    ]

    const HUB_POLICY_TERMS = [
      'tax',
      'taxes',
      'inheritance tax',
      'budget',
      'economy',
      'cost of living',
      'energy bills',
      'fuel',
      'petrol',
      'diesel',
      'nhs',
      'doctor',
      'doctors',
      'strike',
      'junior doctors',
      'housing',
      'rent',
      'mortgage',
      'migration',
      'immigration',
      'asylum',
      'welfare',
      'benefits',
      'school',
      'schools',
      'crime',
      'policing',
      'police',
      'net zero',
      'farming',
      'farmers',
      'council tax',
      'public spending',
    ]

    const SKY_STRONG_POLITICS_TERMS = [
      'labour',
      'labour party',
      'conservative',
      'conservatives',
      'conservative party',
      'tories',
      'reform uk',
      'reform',
      'liberal democrats',
      'lib dem',
      'lib dems',
      'green party',
      'snp',
      'plaid cymru',
      'keir starmer',
      'kemi badenoch',
      'nigel farage',
      'ed davey',
      'john swinney',
      'angela rayner',
      'rachel reeves',
      'yvette cooper',
      'wes streeting',
      'minister',
      'ministers',
      'cabinet',
      'mp ',
      ' mp',
      'mps',
      'prime minister',
      'chancellor',
      'home secretary',
      'westminster',
      'parliament',
      'house of commons',
      'pmqs',
      "prime minister's questions",
      'general election',
      'local election',
      'by-election',
      'mayoral election',
      'budget',
      'tax',
      'taxes',
      'nhs',
      'immigration',
      'housing',
      'welfare',
      'energy bills',
    ]

    const BBC_STRONG_POLITICS_TERMS = [
      'labour',
      'labour party',
      'conservative',
      'conservatives',
      'conservative party',
      'tories',
      'reform uk',
      'reform',
      'liberal democrats',
      'lib dem',
      'lib dems',
      'green party',
      'green party of england and wales',
      'snp',
      'scottish national party',
      'plaid cymru',
      'keir starmer',
      'kemi badenoch',
      'nigel farage',
      'ed davey',
      'carla denyer',
      'adrian ramsay',
      'john swinney',
      'angela rayner',
      'rachel reeves',
      'yvette cooper',
      'wes streeting',
      'minister',
      'ministers',
      'cabinet',
      'shadow cabinet',
      'shadow minister',
      'mp ',
      ' mp',
      'mps',
      'prime minister',
      'deputy prime minister',
      'chancellor',
      'home secretary',
      'westminster',
      'parliament',
      'house of commons',
      'house of lords',
      'pmqs',
      "prime minister's questions",
      'general election',
      'local election',
      'by-election',
      'byelection',
      'mayoral election',
    ]

    function inferNewsTag(title = '') {
      const t = String(title || '').toLowerCase()

      if (t.includes('poll') || t.includes('polling') || t.includes('mrp')) return 'Polling'

      if (
        t.includes('election') ||
        t.includes('elections') ||
        t.includes('by-election') ||
        t.includes('byelection') ||
        t.includes('local election') ||
        t.includes('general election') ||
        t.includes('mayor')
      ) return 'Elections'

      if (
        t.includes('labour') ||
        t.includes('conservative') ||
        t.includes('reform') ||
        t.includes('liberal democrats') ||
        t.includes('lib dem') ||
        t.includes('green party') ||
        t.includes('snp') ||
        t.includes('plaid') ||
        t.includes('farage') ||
        t.includes('starmer') ||
        t.includes('badenoch') ||
        t.includes('minister') ||
        t.includes('cabinet') ||
        t.includes('mp')
      ) return 'Party'

      if (
        t.includes('policy') ||
        t.includes('budget') ||
        t.includes('tax') ||
        t.includes('immigration') ||
        t.includes('nhs') ||
        t.includes('welfare') ||
        t.includes('housing') ||
        t.includes('energy') ||
        t.includes('net zero') ||
        t.includes('benefit')
      ) return 'Policy'

      return ''
    }

    function getHostname(rawUrl) {
      try {
        return new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase()
      } catch {
        return ''
      }
    }

    function isApprovedNewsDomain(hostname) {
      return APPROVED_NEWS_DOMAINS.has(hostname)
    }

    function textMatchesAny(text, terms) {
      const t = String(text || '').toLowerCase()
      return terms.some((term) => t.includes(term))
    }

    function countMatches(text, terms) {
      const t = String(text || '').toLowerCase()
      return terms.reduce((sum, term) => sum + (t.includes(term) ? 1 : 0), 0)
    }

    function hasPoliticsSignal(text) {
      const combined = String(text || '').toLowerCase()
      const actorMatches = countMatches(combined, UK_POLITICS_ACTOR_TERMS)
      const institutionMatches = countMatches(combined, UK_POLITICS_INSTITUTION_TERMS)
      const hubPolicyMatches = countMatches(combined, HUB_POLICY_TERMS)
      return actorMatches > 0 || institutionMatches > 0 || hubPolicyMatches > 0
    }

    function isAllowedNewsPath(url) {
      const lowerUrl = String(url || '').toLowerCase()
      return !EXCLUDED_NEWS_URL_PARTS.some((part) => lowerUrl.includes(part))
    }

    function scoreNewsArticle(article) {
      if (!article || typeof article !== 'object') return null

      const title = titleCase(article.title || '')
      const description = titleCase(article.description || '')
      const url = String(article.url || '')
      const hostname = getHostname(url)

      if (!title || !url || !hostname) return null
      if (!isApprovedNewsDomain(hostname)) return null

      const lowerUrl = url.toLowerCase()
      if (EXCLUDED_NEWS_URL_PARTS.some((part) => lowerUrl.includes(part))) return null

      const combined = `${title} ${description}`.toLowerCase()

      if (textMatchesAny(combined, EXCLUDED_NEWS_TERMS)) return null

      const actorMatches = countMatches(combined, UK_POLITICS_ACTOR_TERMS)
      const institutionMatches = countMatches(combined, UK_POLITICS_INSTITUTION_TERMS)
      const hubPolicyMatches = countMatches(combined, HUB_POLICY_TERMS)

      let score = 0
      score += actorMatches * 3
      score += institutionMatches * 2

      if (hostname === 'bbc.co.uk' && textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS)) {
        score += 2
      }
      if (hostname === 'theguardian.com' && lowerUrl.includes('/politics/')) score += 2
      if (
        hostname === 'theguardian.com' &&
        lowerUrl.includes('/uk-news/') &&
        (actorMatches > 0 || institutionMatches > 0 || hubPolicyMatches > 0)
      ) {
        score += 1
      }

      if (combined.includes('labour party')) score += 1
      if (combined.includes('conservative party')) score += 1
      if (combined.includes('reform uk')) score += 1
      if (combined.includes('liberal democrats')) score += 1
      if (combined.includes('green party')) score += 1
      if (combined.includes('scottish national party')) score += 1

      if (combined.includes('celebrity')) score -= 2
      if (combined.includes('showbiz')) score -= 2
      if (combined.includes('tv star')) score -= 1
      if (combined.includes('death plans')) score -= 3
      if (textMatchesAny(combined, CIVIC_BUT_NOT_NECESSARILY_POLITICAL_TERMS)) score -= 2

      if (actorMatches === 0 && institutionMatches === 0) return null

      if (
        hostname === 'bbc.co.uk' &&
        !textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS) &&
        score < 5
      ) {
        return null
      }

      if (score < 3) return null

      return {
        title,
        source: titleCase(article?.source?.name || article.source || ''),
        publishedAt: article.publishedAt || null,
        url,
        tag: inferNewsTag(title),
        score,
      }
    }

    function normalizeNewsItem(article) {
      const scored = scoreNewsArticle(article)
      if (!scored) return null

      if (!scored.title || !scored.source || !scored.publishedAt || !scored.url) return null

      return {
        title: scored.title,
        source: scored.source,
        publishedAt: scored.publishedAt,
        url: scored.url,
        tag: scored.tag,
        score: scored.score,
      }
    }

    function dedupeNewsItems(items) {
      const seen = new Set()
      const out = []

      for (const item of items || []) {
        const key = String(item.url || item.title || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim()
          .split(' ')
          .slice(0, 10)
          .join(' ')

        if (!key || seen.has(key)) continue
        seen.add(key)
        out.push(item)
      }

      return out
    }

    function capNewsItemsBySource(items, maxPerSource = 2, maxItems = 10) {
      const counts = new Map()
      const out = []

      for (const item of items || []) {
        const source = String(item.source || '').toLowerCase()
        const current = counts.get(source) || 0
        if (current >= maxPerSource) continue

        counts.set(source, current + 1)
        out.push(item)

        if (out.length >= maxItems) break
      }

      return out
    }
    function isOpinionLikeTitle(title) {
      const t = String(title || '').toLowerCase()
      return (
        t.includes('opinion') ||
        t.includes('editorial') ||
        t.includes('comment') ||
        t.includes('analysis:') ||
        t.includes('somehow always makes')
      )
    }

    function isExplainerLikeTitle(title) {
      const t = String(title || '').toLowerCase().trim()
      return (
        t.startsWith('how ') ||
        t.startsWith('why ') ||
        t.startsWith('what ') ||
        t.startsWith('who ') ||
        t.startsWith('a simple guide') ||
        t.includes('explained')
      )
    }

    function hasHardPoliticsSignal(text) {
      const t = String(text || '').toLowerCase()
      return (
        t.includes('prime minister') ||
        t.includes('chancellor') ||
        t.includes('home secretary') ||
        t.includes('cabinet') ||
        t.includes('minister') ||
        t.includes('labour') ||
        t.includes('conservative') ||
        t.includes('reform uk') ||
        t.includes('liberal democrats') ||
        t.includes('green party') ||
        t.includes('snp') ||
        t.includes('plaid cymru') ||
        t.includes('westminster') ||
        t.includes('parliament') ||
        t.includes('pmqs') ||
        t.includes('election') ||
        t.includes('by-election') ||
        t.includes('budget') ||
        t.includes('tax') ||
        t.includes('energy bills') ||
        t.includes('nhs') ||
        t.includes('immigration') ||
        t.includes('housing') ||
        t.includes('welfare') ||
        t.includes('manifesto')
      )
    }

    function isWeakCivicStory(text) {
      const t = String(text || '').toLowerCase()
      return (
        t.includes('public sexual harassment') ||
        t.includes('ev charger') ||
        t.includes('car production') ||
        t.includes('family voting') ||
        t.includes('churchill') ||
        t.includes('who is ')
      )
    }

    async function fetchBbcNews() {
      const feedUrls = [
        'https://feeds.bbci.co.uk/news/politics/rss.xml',
        'https://feeds.bbci.co.uk/news/rss.xml',
      ]

      for (const feedUrl of feedUrls) {
        const xml = await fetchText(feedUrl)
        if (!xml) continue

        const blocks = String(xml).split(/<item\b/i).slice(1)
        if (!blocks.length) continue

        const items = blocks.map((block) => {
          const item = '<item' + block

          const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i)
          const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i)
          const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || item.match(/<description>([\s\S]*?)<\/description>/i)
          const pubMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)

          const title = stripTags(titleMatch?.[1] || '')
          const url = stripTags(linkMatch?.[1] || '')
          const description = stripTags(descMatch?.[1] || '')
          const publishedAtRaw = stripTags(pubMatch?.[1] || '')
          const publishedAtTs = publishedAtRaw ? new Date(publishedAtRaw).getTime() : NaN

          if (!title || !url) return null
          if (!isAllowedNewsPath(url)) return null

          const combined = `${title} ${description}`.toLowerCase()
          const lowerUrl = url.toLowerCase()

          const looksPolitical =
            hasPoliticsSignal(combined) ||
            lowerUrl.includes('/news/politics') ||
            lowerUrl.includes('/news/uk-politics') ||
            textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS)

          if (!looksPolitical) return null
          if (title.toLowerCase().includes('uk politics live')) return null
          if (title.toLowerCase().includes('as it happened')) return null

          let score = 4
          if (textMatchesAny(combined, BBC_STRONG_POLITICS_TERMS)) score += 2
          if (hasPoliticsSignal(combined)) score += 1
          if (hasHardPoliticsSignal(combined)) score += 2
          if (lowerUrl.includes('/news/')) score += 1
          if (isOpinionLikeTitle(title)) score -= 2
          if (isExplainerLikeTitle(title)) score -= 2
          if (isWeakCivicStory(combined)) score -= 2
          if (score < 5) return null

          return {
            title,
            source: 'BBC News',
            publishedAt: !Number.isNaN(publishedAtTs)
              ? new Date(publishedAtTs).toISOString()
              : new Date().toISOString(),
            url,
            tag: inferNewsTag(title),
            score,
          }
        }).filter(Boolean)

        if (items.length) return items
      }

      return []
    }

    async function fetchSkyNews() {
      const xml = await fetchText('https://feeds.skynews.com/feeds/rss/politics.xml')
      if (!xml) return []

      return parseRssItems(xml, 'Sky News')
        .map((item) => {
          const title = stripTags(item.title || '')
          const description = stripTags(item.description || '')
          const url = String(item.url || '')
          const publishedAt = item.publishedAt || null
          const lowerUrl = url.toLowerCase()
          const combined = `${title} ${description}`.toLowerCase()

          if (!title || !url || !publishedAt) return null
          if (!isAllowedNewsPath(url)) return null
          if (!hasPoliticsSignal(combined)) return null
          if (isOpinionLikeTitle(title) && !textMatchesAny(combined, SKY_STRONG_POLITICS_TERMS)) return null
          if (isExplainerLikeTitle(title) && !hasHardPoliticsSignal(combined)) return null
          if (isWeakCivicStory(combined) && !hasHardPoliticsSignal(combined)) return null

          let score = 3
          if (lowerUrl.includes('/politics')) score += 2
          if (textMatchesAny(combined, SKY_STRONG_POLITICS_TERMS)) score += 2
          if (hasHardPoliticsSignal(combined)) score += 2
          if (isExplainerLikeTitle(title)) score -= 2
          if (isWeakCivicStory(combined)) score -= 2
          if (score < 4) return null

          return {
            title,
            source: 'Sky News',
            publishedAt,
            url,
            tag: inferNewsTag(title),
            score,
          }
        })
        .filter(Boolean)
    }

    async function fetchGuardianNews(env) {
      if (!env.GUARDIAN_API_KEY) return []

      const apiUrl = new URL('https://content.guardianapis.com/search')
      apiUrl.searchParams.set('api-key', env.GUARDIAN_API_KEY)
      apiUrl.searchParams.set('section', 'politics')
      apiUrl.searchParams.set('page-size', '10')
      apiUrl.searchParams.set('order-by', 'newest')
      apiUrl.searchParams.set('show-fields', 'headline,trailText,shortUrl')
      apiUrl.searchParams.set(
        'from-date',
        new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString().slice(0, 10)
      )

      try {
        const res = await fetch(apiUrl.toString(), {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Politiscope/1.0 (+https://politiscope.app)',
          },
        })

        if (!res.ok) return []

        const data = await res.json()
        const results = Array.isArray(data?.response?.results) ? data.response.results : []

        return results
          .map((item) => {
            const title = titleCase(item.fields?.headline || item.webTitle || '')
            const description = titleCase(item.fields?.trailText || '')
            const url = item.webUrl || item.fields?.shortUrl || ''
            const publishedAt = item.webPublicationDate || null
            const lowerUrl = String(url || '').toLowerCase()
            const combined = `${title} ${description}`.toLowerCase()

            if (!title || !url || !publishedAt) return null
            if (!isAllowedNewsPath(url)) return null
            if (lowerUrl.includes('/politics/live/')) return null
            if (title.toLowerCase().includes('uk politics live')) return null
            if (title.toLowerCase().includes('as it happened')) return null
            if (!lowerUrl.includes('/politics/') && !lowerUrl.includes('/uk-news/')) return null
            if (!hasPoliticsSignal(combined) && !lowerUrl.includes('/politics/')) return null
            if (isOpinionLikeTitle(title) && !combined.includes('starmer') && !combined.includes('farage') && !combined.includes('badenoch')) return null
            if (isExplainerLikeTitle(title) && !hasHardPoliticsSignal(combined)) return null

            let score = 3
            if (lowerUrl.includes('/politics/')) score += 2
            if (lowerUrl.includes('/uk-news/')) score += 1
            if (hasHardPoliticsSignal(combined)) score += 2
            if (isOpinionLikeTitle(title)) score -= 1
            if (isExplainerLikeTitle(title)) score -= 2
            if (score < 4) return null

            return {
              title,
              source: 'The Guardian',
              publishedAt,
              url,
              tag: inferNewsTag(title),
              score,
            }
          })
          .filter(Boolean)
      } catch {
        return []
      }
    }

    async function fetchLiveNews(env) {
      const now = Date.now()

      const bbcItems = await fetchBbcNews()
      const guardianItems = await fetchGuardianNews(env)
      const skyItems = await fetchSkyNews()

      const ranked = [...bbcItems, ...guardianItems, ...skyItems]
        .sort((a, b) => {
          const aTime = new Date(a.publishedAt || 0).getTime()
          const bTime = new Date(b.publishedAt || 0).getTime()

          const aAgeHours = Number.isFinite(aTime) ? Math.max(0, (now - aTime) / 3600000) : 999
          const bAgeHours = Number.isFinite(bTime) ? Math.max(0, (now - bTime) / 3600000) : 999

          const aRank = (a.score || 0) - Math.min(aAgeHours * 0.12, 6)
          const bRank = (b.score || 0) - Math.min(bAgeHours * 0.12, 6)

          if (bRank !== aRank) return bRank - aRank
          return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))
        })

      const deduped = dedupeNewsItems(ranked)
      const balanced = capNewsItemsBySource(deduped, 3, 12)

      return balanced.map(({ score, ...item }) => item)
    }

    const NEWS_CACHE_SECTION = 'newsItems'
    const NEWS_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000

    function isFreshEnough(iso, maxAgeMs = NEWS_CACHE_MAX_AGE_MS) {
      if (!iso) return false
      const ts = new Date(iso).getTime()
      if (Number.isNaN(ts)) return false
      return (Date.now() - ts) < maxAgeMs
    }

    async function getNewsItems() {
      const hasContent = await tableExists('content')

      if (!hasContent) {
        return await fetchLiveNews(env)
      }

      const cached = await loadContentSectionRow(NEWS_CACHE_SECTION)

      if (
        cached?.data &&
        Array.isArray(cached.data.items) &&
        cached.data.items.length > 0 &&
        isFreshEnough(cached.data.fetchedAt || cached.updated_at)
      ) {
        return cached.data.items
      }

      const items = await fetchLiveNews(env)
      const payload = {
        fetchedAt: new Date().toISOString(),
        items,
      }

      await saveContentSection(NEWS_CACHE_SECTION, payload)
      return items
    }

    async function saveContentSection(section, payload) {
      const hasContent = await tableExists('content')
      if (!hasContent) {
        throw new Error(`Missing D1 table: content`)
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
        new Date().toISOString()
      ).run()
    }

    async function ytFetch(url, apiKey) {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`YouTube API ${res.status}: ${text}`)
      }

      return res.json()
    }

    async function getChannelIdFromHandle(apiKey, handle = '@UKParliament') {
      const endpoint =
        `https://www.googleapis.com/youtube/v3/channels?` +
        `part=id,contentDetails,snippet&forHandle=${encodeURIComponent(handle)}&key=${encodeURIComponent(apiKey)}`

      const data = await ytFetch(endpoint, apiKey)
      const item = data?.items?.[0]
      if (!item?.id) throw new Error('Could not resolve UK Parliament YouTube channel')
      return {
        channelId: item.id,
        uploadsPlaylistId: item?.contentDetails?.relatedPlaylists?.uploads || null,
        channelTitle: item?.snippet?.title || 'UK Parliament',
      }
    }

    async function getLiveVideo(apiKey, channelId) {
      const endpoint =
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&channelId=${encodeURIComponent(channelId)}` +
        `&eventType=live&type=video&order=date&maxResults=1&key=${encodeURIComponent(apiKey)}`

      const data = await ytFetch(endpoint, apiKey)
      const item = data?.items?.[0]
      const videoId = item?.id?.videoId
      if (!videoId) return null

      return {
        videoId,
        title: item?.snippet?.title || 'Live stream',
        publishedAt: item?.snippet?.publishedAt || null,
        thumbnail:
          item?.snippet?.thumbnails?.high?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          item?.snippet?.thumbnails?.default?.url ||
          null,
        isLive: true,
        source: 'live',
      }
    }

    async function getLatestUploadedVideo(apiKey, uploadsPlaylistId) {
      if (!uploadsPlaylistId) return null

      const endpoint =
        `https://www.googleapis.com/youtube/v3/playlistItems?` +
        `part=snippet&playlistId=${encodeURIComponent(uploadsPlaylistId)}` +
        `&maxResults=1&key=${encodeURIComponent(apiKey)}`

      const data = await ytFetch(endpoint, apiKey)
      const item = data?.items?.[0]
      const videoId = item?.snippet?.resourceId?.videoId
      if (!videoId) return null

      return {
        videoId,
        title: item?.snippet?.title || 'Latest upload',
        publishedAt: item?.snippet?.publishedAt || null,
        thumbnail:
          item?.snippet?.thumbnails?.high?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          item?.snippet?.thumbnails?.default?.url ||
          null,
        isLive: false,
        source: 'latest',
      }
    }

    try {
      if (request.method === 'GET' && url.pathname === '/api/news/bbc-debug') {
        const politicsUrl = 'https://feeds.bbci.co.uk/news/politics/rss.xml'
        const generalUrl = 'https://feeds.bbci.co.uk/news/rss.xml'
        const politicsXml = await fetchText(politicsUrl)
        const generalXml = await fetchText(generalUrl)
        const politicsItems = politicsXml ? parseRssItems(politicsXml, 'BBC News') : []
        const generalItems = generalXml ? parseRssItems(generalXml, 'BBC News') : []
        const politicsBlockCount = politicsXml ? String(politicsXml).split(/<item\b/i).slice(1).length : 0
        const generalBlockCount = generalXml ? String(generalXml).split(/<item\b/i).slice(1).length : 0

        return jsonResponse({
          politicsFeedFetched: !!politicsXml,
          generalFeedFetched: !!generalXml,
          politicsParsedCount: politicsItems.length,
          generalParsedCount: generalItems.length,
          politicsBlockCount,
          generalBlockCount,
          politicsSample: politicsItems.slice(0, 3),
          generalSample: generalItems.slice(0, 3),
          politicsXmlSnippet: politicsXml ? politicsXml.slice(0, 500) : '',
          generalXmlSnippet: generalXml ? generalXml.slice(0, 500) : '',
        })
      }

      if (request.method === 'GET' && url.pathname === '/api/news/bbc') {
        const items = await fetchBbcNews()
        return jsonResponse({ items })
      }

      if (request.method === 'GET' && url.pathname === '/api/news/guardian') {
        const items = await fetchGuardianNews(env)
        return jsonResponse({ items })
      }

      if (request.method === 'GET' && url.pathname === '/api/news/sky') {
        const items = await fetchSkyNews()
        return jsonResponse({ items })
      }
      if (request.method === 'GET' && url.pathname === '/api/news') {
        const items = await getNewsItems()
        const updatedAt = items[0]?.publishedAt || new Date().toISOString()
        return jsonResponse({
          items,
          meta: {
            updatedAt,
            fetchedAt: updatedAt,
            storyCount: items.length,
            sourceCount: new Set(items.map((item) => item.source).filter(Boolean)).size,
            sources: [...new Set(items.map((item) => item.source).filter(Boolean))],
            sourceType: 'live-fetch',
          },
        })
      }

      if (request.method === 'GET' && url.pathname === '/api/parliament-video') {
        if (!env.YOUTUBE_API_KEY) {
          return jsonResponse(
            {
              error: 'Missing YOUTUBE_API_KEY',
              message: 'Set the YOUTUBE_API_KEY secret in Cloudflare Workers.',
            },
            { status: 500 }
          )
        }

        const { channelId, uploadsPlaylistId, channelTitle } = await getChannelIdFromHandle(
          env.YOUTUBE_API_KEY,
          '@UKParliament'
        )

        let video = await getLiveVideo(env.YOUTUBE_API_KEY, channelId)

        if (!video) {
          video = await getLatestUploadedVideo(env.YOUTUBE_API_KEY, uploadsPlaylistId)
        }

        if (!video) {
          return jsonResponse(
            {
              error: 'No video found',
              message: 'Could not find a live or latest UK Parliament video.',
              channelId,
              channelTitle,
            },
            { status: 404 }
          )
        }

        return jsonResponse({
          ...video,
          channelId,
          channelTitle,
          youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          channelUrl: 'https://www.youtube.com/@UKParliament',
          commonsUrl: 'https://www.parliamentlive.tv/Commons',
          meta: {
            updatedAt: new Date().toISOString(),
            sourceType: video.isLive ? 'live-stream' : 'latest-upload',
            maintained: false,
          },
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/polls/import') {
        const body = await request.json()
        const polls = Array.isArray(body?.polls) ? body.polls : null

        if (!polls) {
          return jsonResponse({ error: 'Missing polls array' }, { status: 400 })
        }

        const existingPolls = await loadContentSection('pollsData')
        const mergedPolls = mergePolls(existingPolls, polls)

        await saveContentSection('pollsData', mergedPolls)

        return jsonResponse({
          ok: true,
          imported: polls.length,
          totalPolls: mergedPolls.length,
        })
      }

            if (request.method === 'GET' && url.pathname === '/api/polls') {
        const polls = await loadNormalizedPolls()

        return jsonResponse({
          count: polls.length,
          polls,
        })
      }
      
      if (request.method === 'GET' && url.pathname === '/api/polls/latest') {
        const polls = keepLatestPollPerPollster(
          keepOnlyReleasePollsters(await loadNormalizedPolls())
        )

        return jsonResponse({
          count: polls.length,
          polls,
        })
      }

      if (request.method === 'GET' && url.pathname === '/api/pollsters') {
        const polls = keepOnlyReleasePollsters(await loadNormalizedPolls())
        const groups = new Map()

        for (const poll of polls) {
          if (!poll.pollster) continue

          if (!groups.has(poll.pollster)) {
            groups.set(poll.pollster, {
              name: poll.pollster,
              isBpcMember: !!poll.isBpcMember,
              pollCount: 0,
              latestPoll: null,
            })
          }

          const g = groups.get(poll.pollster)
          g.pollCount += 1

          if (
            !g.latestPoll ||
            (poll.publishedAt || poll.fieldworkEnd || poll.fieldworkStart || '') >
            (g.latestPoll.publishedAt || g.latestPoll.fieldworkEnd || g.latestPoll.fieldworkStart || '')
          ) {
            g.latestPoll = poll
          }
        }

        return jsonResponse({
          count: groups.size,
          pollsters: [...groups.values()].sort(
            (a, b) => b.pollCount - a.pollCount || a.name.localeCompare(b.name)
          ),
        })
      }

      if (request.method === 'GET' && url.pathname === '/api/elections/councils') {
        const merged = await loadMergedCouncilData()
        return jsonResponse(merged)
      }

      if (request.method === 'GET' && url.pathname === '/api/elections/byelections') {
        const byElections = await loadContentSection('byElections')
        return jsonResponse(
          byElections && typeof byElections === 'object'
            ? byElections
            : { upcoming: [], recent: [], meta: null }
        )
      }

      if (request.method === 'GET' && url.pathname === '/api/elections/intelligence') {
        const electionsIntelligence = await loadElectionsIntelligence()
        return jsonResponse(electionsIntelligence)
      }

      if (request.method === 'GET' && url.pathname.startsWith('/api/elections/council/')) {
        const slug = decodeURIComponent(url.pathname.split('/').pop() || '').trim().toLowerCase()
        if (!slug) {
          return jsonResponse({ error: 'Missing council slug' }, { status: 400 })
        }

        const merged = await loadMergedCouncilData()
        const council = merged.councils.find((item) => String(item.slug || '').toLowerCase() === slug)

        if (!council) {
          return jsonResponse({ error: 'Council not found', slug }, { status: 404 })
        }

        return jsonResponse({ council })
      }

      if (request.method === 'POST' && url.pathname === '/api/elections/import-registry') {
        const body = await request.json()
        const rows = Array.isArray(body?.councils) ? body.councils : body

        if (!Array.isArray(rows)) {
          return jsonResponse({ error: 'Expected an array of council registry rows' }, { status: 400 })
        }

        const normalized = rows.map(normalizeCouncilRegistryRecord).filter(Boolean)
        await saveContentSection('councilRegistry', normalized)

        return jsonResponse({
          ok: true,
          section: 'councilRegistry',
          count: normalized.length,
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/elections/import-editorial') {
        const body = await request.json()
        const rows = Array.isArray(body?.councils) ? body.councils : body

        if (!Array.isArray(rows)) {
          return jsonResponse({ error: 'Expected an array of council editorial rows' }, { status: 400 })
        }

        const normalized = rows.map(normalizeCouncilEditorialRecord).filter(Boolean)
        await saveContentSection('councilEditorial', normalized)

        return jsonResponse({
          ok: true,
          section: 'councilEditorial',
          count: normalized.length,
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/elections/import-status') {
        const body = await request.json()
        const rows = Array.isArray(body?.councils) ? body.councils : body

        if (!Array.isArray(rows)) {
          return jsonResponse({ error: 'Expected an array of council status rows' }, { status: 400 })
        }

        const normalized = rows.map(normalizeCouncilStatusRecord).filter(Boolean)
        await saveContentSection('councilStatus', normalized)

        return jsonResponse({
          ok: true,
          section: 'councilStatus',
          count: normalized.length,
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/elections/import-byelections') {
        const body = await request.json()
        const payload =
          body && typeof body === 'object'
            ? {
                upcoming: Array.isArray(body.upcoming) ? body.upcoming : [],
                recent: Array.isArray(body.recent) ? body.recent : [],
                meta: body.meta && typeof body.meta === 'object' ? body.meta : null,
              }
            : null

        if (!payload) {
          return jsonResponse(
            { error: 'Expected a by-elections payload with upcoming, recent, and optional meta fields' },
            { status: 400 }
          )
        }

        await saveContentSection('byElections', payload)

        return jsonResponse({
          ok: true,
          section: 'byElections',
          upcoming: payload.upcoming.length,
          recent: payload.recent.length,
          hasMeta: !!payload.meta,
        })
      }

      // ─── Mayors enrichment store ──────────────────────────────────────────────
      // Accepts a { regional: {...}, council: {...} } payload of field-level
      // overrides and saves it to the mayorEnrichments content section in D1.
      // Run elections:intelligence:refresh (or mayors-refresh) afterwards to apply.
      //
      // Body shape:
      //   {
      //     regional: { '<area name>': { <field>: <value>, updatedAt: '...' }, ... },
      //     council:  { '<area name>': { <field>: <value>, updatedAt: '...' }, ... }
      //   }
      //
      // Only include fields that differ from the maintained source.
      // See src/data/electionsMayorsEnrichment.js for full schema and examples.
      if (request.method === 'POST' && url.pathname === '/api/elections/mayors-enrich') {
        const body = await request.json()

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return jsonResponse(
            { error: 'Expected { regional: {...}, council: {...} }' },
            { status: 400 },
          )
        }

        const enrichments = {
          regional: body.regional && typeof body.regional === 'object' && !Array.isArray(body.regional)
            ? body.regional
            : {},
          council: body.council && typeof body.council === 'object' && !Array.isArray(body.council)
            ? body.council
            : {},
        }

        await saveContentSection('mayorEnrichments', enrichments)

        const regionalCount = Object.keys(enrichments.regional).length
        const councilCount = Object.keys(enrichments.council).length

        return jsonResponse({
          ok: true,
          section: 'mayorEnrichments',
          regionalEnrichments: regionalCount,
          councilEnrichments: councilCount,
          totalEnrichments: regionalCount + councilCount,
          note: 'Mayor enrichments saved. Run elections:intelligence:refresh to apply.',
        })
      }

      // ─── Mayors external-source input store ──────────────────────────────────
      // Accepts a structured external-style source payload and saves it to the
      // mayorExternalSource content section in D1.
      //
      // Body shape:
      //   {
      //     meta?: { sourceCount?, sourceType?, coverageNote? },
      //     regional?: [{ name, holder?, electedDate?, website?, ... }],
      //     council?:  [{ area, holder?, electedDate?, website?, ... }]
      //   }
      //
      // This is an adapter-ready input layer, not the final Mayors payload.
      // Run elections:intelligence:refresh afterwards to normalize and apply it.
      if (request.method === 'POST' && url.pathname === '/api/elections/mayors-external-source') {
        const body = await request.json()

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return jsonResponse(
            { error: 'Expected { meta?, regional?: [...], council?: [...] }' },
            { status: 400 },
          )
        }

        const externalSource = {
          ...(body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta) ? { meta: body.meta } : {}),
          regional: Array.isArray(body.regional) ? body.regional : [],
          council: Array.isArray(body.council) ? body.council : [],
        }

        await saveContentSection('mayorExternalSource', externalSource)

        return jsonResponse({
          ok: true,
          section: 'mayorExternalSource',
          regionalRecords: externalSource.regional.length,
          councilRecords: externalSource.council.length,
          totalRecords: externalSource.regional.length + externalSource.council.length,
          sourceType: externalSource.meta?.sourceType || null,
          note: 'Mayors external-source input saved. Run elections:intelligence:refresh to apply.',
        })
      }

      // ─── Devolved enrichment store ────────────────────────────────────────────
      // Accepts a { nations: {...} } payload of field-level overrides and saves
      // it to the devolvedEnrichments content section in D1.
      // Run elections:intelligence:refresh (or devolved-refresh) afterwards to apply.
      //
      // Body shape:
      //   {
      //     nations: {
      //       '<nation key/title>': { <field>: <value>, updatedAt: '...' },
      //       ...
      //     }
      //   }
      //
      // Only include fields that differ from the maintained source. Future
      // semi-live or live inputs can populate this payload without changing the
      // frontend contract.
      if (request.method === 'POST' && url.pathname === '/api/elections/devolved-enrich') {
        const body = await request.json()

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return jsonResponse(
            { error: 'Expected { nations: {...} }' },
            { status: 400 },
          )
        }

        const enrichments = {
          nations: body.nations && typeof body.nations === 'object' && !Array.isArray(body.nations)
            ? body.nations
            : {},
        }

        await saveContentSection('devolvedEnrichments', enrichments)

        const nationCount = Object.keys(enrichments.nations).length

        return jsonResponse({
          ok: true,
          section: 'devolvedEnrichments',
          nationEnrichments: nationCount,
          totalEnrichments: nationCount,
          note: 'Devolved enrichments saved. Run elections:intelligence:refresh to apply.',
        })
      }

      // ─── Unified Elections intelligence refresh ───────────────────────────────
      // Rebuilds all Elections intelligence sections (Mayors + Devolved) in one
      // pass and saves the complete payload to the electionsIntelligence content
      // section. Use this as the default refresh command after source edits.
      //
      // Use a section-specific refresh (mayors-refresh / devolved-refresh) when:
      //   - you only changed one section's source data
      //   - you want to preserve manually-stored data in the other section
      //   - a future live-source hook feeds only one section at a time
      //
      // Future enrichment: insert per-section live-fetch calls here before the
      // two buildXxxIntelligencePayload calls and pass the fetched data through
      // as options, without touching the frontend contract.
      if (request.method === 'POST' && url.pathname === '/api/elections/intelligence-refresh') {
        const now = new Date().toISOString()

        // Load any stored mayor enrichments before shaping.
        // Returns null when nothing is stored — buildMayorsIntelligencePayload
        // will then fall back to DEFAULT_MAYOR_ENRICHMENTS from the bundle.
        const mayorEnrichments = await loadMayorEnrichments()
        const mayorExternalSource = await loadMayorExternalSource()
        const devolvedEnrichments = await loadDevolvedEnrichments()

        // Re-derive both sections. Mayors gets enrichments; Devolved uses source only for now.
        const freshMayorsWithDebug = buildMayorsIntelligencePayload({
          updatedAt: now,
          sourceCount: 1,
          includeDebug: true,
          ...(mayorExternalSource !== null ? { externalSource: mayorExternalSource } : {}),
          ...(mayorEnrichments !== null ? { enrichments: mayorEnrichments } : {}),
        })
        const { _debug: mayorsDebug = null, ...freshMayors } = freshMayorsWithDebug
        const freshDevolved = buildDevolvedIntelligencePayload({
          updatedAt: now,
          sourceCount: 1,
          ...(devolvedEnrichments !== null ? { enrichments: devolvedEnrichments } : {}),
        })

        // Save the complete payload — both sections are fresh so no merge needed.
        await saveContentSection('electionsIntelligence', { mayors: freshMayors, devolved: freshDevolved })

        const ov = freshMayors.overview || {}
        const devolvedNations = freshDevolved.nations || []

        return jsonResponse({
          ok: true,
          sections: ['mayors', 'devolved'],
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
            sourceType: freshMayors.meta?.sourceType ?? null,
          },
          debug: mayorsDebug
            ? {
                temporary: 'Remove after local verification of mayor enrichment matching.',
                mayorsEnrichment: mayorsDebug,
              }
            : null,
          devolved: {
            nationsCount: devolvedNations.length,
            nations: devolvedNations.map((n) => ({ key: n.key, title: n.title, nextElection: n.nextElection })),
            enrichedCount: freshDevolved.meta?.enrichedCount ?? 0,
            sourceType: freshDevolved.meta?.sourceType ?? null,
          },
          note: 'All Elections intelligence sections re-derived from maintained source and saved.',
        })
      }

      // ─── Mayors refresh ──────────────────────────────────────────────────────
      // Re-derives the full mayors intelligence payload from the maintained
      // source arrays and saves it to the electionsIntelligence content section.
      //
      // This preserves any existing devolved data in the stored payload — only
      // the mayors section is replaced.
      //
      // Future enrichment: before saving, this handler can fetch live mayor
      // data and merge it into the source arrays before calling
      // buildMayorsIntelligencePayload, without touching the frontend contract.
      if (request.method === 'POST' && url.pathname === '/api/elections/mayors-refresh') {
        const now = new Date().toISOString()

        // Load whatever is currently stored so we can preserve the devolved section.
        const existing = await loadElectionsIntelligence()

        // Load stored enrichments; fall back to DEFAULT_MAYOR_ENRICHMENTS when absent.
        const enrichments = await loadMayorEnrichments()
        const externalSource = await loadMayorExternalSource()

        // Re-derive mayors from current source data, applying enrichments.
        const freshMayorsWithDebug = buildMayorsIntelligencePayload({
          updatedAt: now,
          sourceCount: 1,
          includeDebug: true,
          ...(externalSource !== null ? { externalSource } : {}),
          ...(enrichments !== null ? { enrichments } : {}),
        })
        const { _debug: mayorsDebug = null, ...freshMayors } = freshMayorsWithDebug

        // Merge: only mayors is refreshed — devolved and any other sections are kept.
        const updated = { ...existing, mayors: freshMayors }
        await saveContentSection('electionsIntelligence', updated)

        const ov = freshMayors.overview || {}
        return jsonResponse({
          ok: true,
          section: 'mayors',
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
          debug: mayorsDebug
            ? {
                temporary: 'Remove after local verification of mayor enrichment matching.',
                mayorsEnrichment: mayorsDebug,
              }
            : null,
          note: 'Mayors intelligence re-derived from maintained source and saved to electionsIntelligence.',
        })
      }

      // ─── Devolved refresh ─────────────────────────────────────────────────────
      // Re-derives the devolved intelligence payload (Scotland + Wales) from the
      // maintained source records in src/data/electionsDevolved.js and saves it
      // to the electionsIntelligence content section.
      //
      // The existing mayors section in the stored payload is preserved — only the
      // devolved section is replaced.
      //
      // Future enrichment: fetch polled or scraped devolved data here and merge it
      // into the nation source records before calling buildDevolvedIntelligencePayload,
      // without touching the frontend contract.
      if (request.method === 'POST' && url.pathname === '/api/elections/devolved-refresh') {
        const now = new Date().toISOString()

        // Load whatever is currently stored so we can preserve the mayors section.
        const existing = await loadElectionsIntelligence()

        // Load stored enrichments; fall back to DEFAULT_DEVOLVED_ENRICHMENTS when absent.
        const enrichments = await loadDevolvedEnrichments()

        // Re-derive devolved from current source data.
        const freshDevolved = buildDevolvedIntelligencePayload({
          updatedAt: now,
          sourceCount: 1,
          ...(enrichments !== null ? { enrichments } : {}),
        })

        // Merge: only devolved is refreshed — mayors and any other sections are kept.
        const updated = { ...existing, devolved: freshDevolved }
        await saveContentSection('electionsIntelligence', updated)

        const nations = freshDevolved.nations || []
        return jsonResponse({
          ok: true,
          section: 'devolved',
          refreshedAt: now,
          nationsCount: nations.length,
          nations: nations.map((n) => ({ key: n.key, title: n.title, nextElection: n.nextElection })),
          enrichedCount: freshDevolved.meta?.enrichedCount ?? 0,
          sourceType: freshDevolved.meta?.sourceType ?? null,
          note: 'Devolved intelligence re-derived from maintained source and saved to electionsIntelligence.',
        })
      }

      const LOCAL_VOTE_ROUTE_MAP = {
        sheffield: 'sheffield-city-council',
      }
      const LOCAL_VOTE_BATCH_SIZE = 20
      const LOCAL_VOTE_ID_DELETE_CHUNK_SIZE = 50

      function slugifyLocalVote(value) {
        return String(value || '')
          .trim()
          .toLowerCase()
          .replace(/&/g, ' and ')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }

      function parseJsonText(value, fallback) {
        if (!value) return fallback
        try {
          return JSON.parse(value)
        } catch {
          return fallback
        }
      }

      function routeSlugToCouncilSlug(routeSlug = '') {
        return LOCAL_VOTE_ROUTE_MAP[String(routeSlug || '').trim().toLowerCase()] || ''
      }

      function makeLocalVoteSourceId(label, url) {
        return `source_${slugifyLocalVote(label)}_${slugifyLocalVote(url)}`
      }

      function makeLocalVoteEntitySourceId(entityType, entityId, sourceId, fieldScope = 'record') {
        return `${entityType}_${entityId}_${fieldScope}_${sourceId}`
      }

      function toArray(value) {
        return Array.isArray(value) ? value : []
      }

      function chunkArray(values, size) {
        const chunks = []
        for (let i = 0; i < values.length; i += size) {
          chunks.push(values.slice(i, i + size))
        }
        return chunks
      }

      function validateLocalVoteCouncilPayload(council) {
        const errors = []
        if (!council || typeof council !== 'object') {
          errors.push('Missing council payload.')
          return errors
        }

        if (String(council.councilSlug || '').trim() !== 'sheffield-city-council') {
          errors.push('Expected Sheffield council slug.')
        }

        const wards = toArray(council.wards)
        if (wards.length !== 28) {
          errors.push(`Expected 28 wards, found ${wards.length}.`)
        }

        for (const ward of wards) {
          if (!toArray(ward.councillors).length) {
            errors.push(`Ward "${ward.name}" is missing councillors.`)
          }
          if (!toArray(ward.candidates).length) {
            errors.push(`Ward "${ward.name}" is missing candidates.`)
          }
          if (!toArray(ward.sources).length) {
            errors.push(`Ward "${ward.name}" is missing ward sources.`)
          }

          for (const councillor of toArray(ward.councillors)) {
            for (const field of ['name', 'party', 'sourceLabel', 'sourceUrl', 'lastChecked', 'verificationStatus']) {
              if (!councillor?.[field]) {
                errors.push(`Councillor "${councillor?.name || '(unknown)'}" in "${ward.name}" is missing ${field}.`)
              }
            }
          }

          for (const candidate of toArray(ward.candidates)) {
            for (const field of ['name', 'party', 'sourceLabel', 'sourceUrl', 'lastChecked', 'verificationStatus']) {
              if (!candidate?.[field]) {
                errors.push(`Candidate "${candidate?.name || '(unknown)'}" in "${ward.name}" is missing ${field}.`)
              }
            }
          }
        }

        if (!toArray(council.sources).length) {
          errors.push('Council-level sources are missing.')
        }

        return errors
      }

      function createLocalVoteBatchRunner() {
        const statements = []

        return {
          async push(statement) {
            statements.push(statement)
            if (statements.length >= LOCAL_VOTE_BATCH_SIZE) {
              await env.DB.batch(statements.splice(0, statements.length))
            }
          },
          async flush() {
            if (!statements.length) return
            await env.DB.batch(statements.splice(0, statements.length))
          },
        }
      }

      async function upsertLocalSource(source = {}, sourceType = 'reference', batchRunner) {
        const label = String(source.label || source.sourceLabel || '').trim()
        const url = String(source.url || source.sourceUrl || '').trim()
        if (!label || !url) return null

        const sourceId = makeLocalVoteSourceId(label, url)
        await batchRunner.push(env.DB.prepare(
          `INSERT INTO local_sources (id, label, url, publisher, source_type, published_at, retrieved_at, checksum)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             label = excluded.label,
             url = excluded.url,
             publisher = excluded.publisher,
             source_type = excluded.source_type,
             published_at = excluded.published_at,
             retrieved_at = excluded.retrieved_at,
             checksum = excluded.checksum`
        ).bind(
          sourceId,
          label,
          url,
          source.publisher || 'Politiscope maintained source',
          source.sourceType || sourceType,
          source.publishedAt || source.updatedAt || null,
          source.retrievedAt || source.lastChecked || source.updatedAt || null,
          `${label}|${url}`,
        ))

        return sourceId
      }

      async function linkEntitySource(entityType, entityId, sourceId, verificationStatus, lastChecked, fieldScope = 'record', batchRunner) {
        if (!entityId || !sourceId) return
        const linkId = makeLocalVoteEntitySourceId(entityType, entityId, sourceId, fieldScope)
        await batchRunner.push(env.DB.prepare(
          `INSERT INTO local_entity_sources (id, entity_type, entity_id, source_id, field_scope, verification_status, last_checked)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             verification_status = excluded.verification_status,
             last_checked = excluded.last_checked`
        ).bind(
          linkId,
          entityType,
          entityId,
          sourceId,
          fieldScope,
          verificationStatus || 'verified',
          lastChecked || null,
        ))
      }

      async function loadLocalVoteEntitySources(entityType, entityIds = []) {
        if (!entityIds.length) return new Map()

        const placeholders = entityIds.map(() => '?').join(', ')
        const rows = await env.DB.prepare(
          `SELECT
             les.entity_id,
             les.field_scope,
             les.verification_status,
             les.last_checked,
             ls.label,
             ls.url,
             ls.source_type,
             ls.published_at,
             ls.retrieved_at
           FROM local_entity_sources les
           JOIN local_sources ls ON ls.id = les.source_id
           WHERE les.entity_type = ?
             AND les.entity_id IN (${placeholders})
           ORDER BY ls.label ASC`
        ).bind(entityType, ...entityIds).all()

        const grouped = new Map()
        for (const row of rows.results || []) {
          const list = grouped.get(row.entity_id) || []
          list.push({
            label: row.label,
            url: row.url,
            updatedAt: row.last_checked || row.retrieved_at || row.published_at || null,
            verificationStatus: row.verification_status,
            sourceType: row.source_type,
            fieldScope: row.field_scope,
          })
          grouped.set(row.entity_id, list)
        }
        return grouped
      }

      async function loadLocalVoteCouncilPayload(councilSlug) {
        const councilRow = await env.DB.prepare(
          `SELECT
             id, slug, name, supported_area_label, next_election_date, source_note,
             controls_json, updated_at, fetched_at
           FROM local_councils
           WHERE slug = ? AND active = 1
           LIMIT 1`
        ).bind(councilSlug).first()

        if (!councilRow) return null

        const wardRows = await env.DB.prepare(
          `SELECT
             id, slug, name, aliases_json, notes, candidate_list_status, updated_at, fetched_at
           FROM local_wards
           WHERE council_id = ? AND active = 1
           ORDER BY name ASC`
        ).bind(councilRow.id).all()

        const wards = wardRows.results || []
        const wardIds = wards.map((ward) => ward.id)

        const councilSourceMap = await loadLocalVoteEntitySources('council', [councilRow.id])
        const wardSourceMap = await loadLocalVoteEntitySources('ward', wardIds)

        const officeholderRows = await env.DB.prepare(
          `SELECT
             o.id, o.ward_id, o.name, o.party, o.seat_status, o.source_attribution,
             o.verification_status, o.last_checked, s.label AS source_label, s.url AS source_url
           FROM local_officeholders o
           LEFT JOIN local_sources s ON s.id = o.primary_source_id
           WHERE o.council_id = ? AND o.is_current = 1
           ORDER BY o.ward_id ASC, o.name ASC`
        ).bind(councilRow.id).all()

        const candidateRows = await env.DB.prepare(
          `SELECT
             c.id, c.ward_id, c.name, c.party, c.election_date, c.source_attribution,
             c.issue_statements_json, c.verification_status, c.last_checked,
             s.label AS source_label, s.url AS source_url
           FROM local_candidates c
           LEFT JOIN local_sources s ON s.id = c.primary_source_id
           WHERE c.council_id = ?
           ORDER BY c.ward_id ASC, c.name ASC`
        ).bind(councilRow.id).all()

        const officeholdersByWard = new Map()
        for (const row of officeholderRows.results || []) {
          const list = officeholdersByWard.get(row.ward_id) || []
          list.push({
            id: row.id,
            ward: '',
            name: row.name,
            party: row.party,
            sourceUrl: row.source_url || '',
            sourceLabel: row.source_label || '',
            lastChecked: row.last_checked || '',
            verificationStatus: row.verification_status || 'verified',
            seatStatus: row.seat_status || 'occupied',
            sourceAttribution: row.source_attribution || 'official',
          })
          officeholdersByWard.set(row.ward_id, list)
        }

        const candidatesByWard = new Map()
        for (const row of candidateRows.results || []) {
          const list = candidatesByWard.get(row.ward_id) || []
          list.push({
            id: row.id,
            ward: '',
            name: row.name,
            party: row.party,
            electionDate: row.election_date,
            sourceUrl: row.source_url || '',
            sourceLabel: row.source_label || '',
            lastChecked: row.last_checked || '',
            verificationStatus: row.verification_status || 'verified',
            sourceAttribution: row.source_attribution || 'official',
            issueStatements: parseJsonText(row.issue_statements_json, {}),
          })
          candidatesByWard.set(row.ward_id, list)
        }

        const wardPayloads = wards.map((ward) => {
          const councillors = officeholdersByWard.get(ward.id) || []
          const candidates = candidatesByWard.get(ward.id) || []
          const wardName = ward.name

          return {
            slug: ward.slug,
            name: wardName,
            aliases: parseJsonText(ward.aliases_json, []),
            notes: ward.notes || '',
            updatedAt: ward.updated_at,
            fetchedAt: ward.fetched_at || ward.updated_at,
            candidateListStatus:
              ward.candidate_list_status || (candidates.length ? 'Verified candidate list' : 'No verified candidate list yet'),
            sources: wardSourceMap.get(ward.id) || [],
            councillors: councillors.map((item) => ({ ...item, ward: wardName })),
            candidates: candidates.map((item) => ({ ...item, ward: wardName })),
          }
        })

        return {
          councilSlug: councilRow.slug,
          councilName: councilRow.name,
          supportedAreaLabel: councilRow.supported_area_label || councilRow.name,
          nextElectionDate: councilRow.next_election_date,
          updatedAt: councilRow.updated_at,
          fetchedAt: councilRow.fetched_at || councilRow.updated_at,
          sourceNote: councilRow.source_note || '',
          controls: parseJsonText(councilRow.controls_json, []),
          sources: councilSourceMap.get(councilRow.id) || [],
          wards: wardPayloads,
        }
      }

      async function deleteExistingLocalVoteCouncil(councilSlug) {
        const council = await env.DB.prepare(
          'SELECT id FROM local_councils WHERE slug = ? LIMIT 1'
        ).bind(councilSlug).first()

        if (!council?.id) return

        const wardRows = await env.DB.prepare(
          'SELECT id FROM local_wards WHERE council_id = ?'
        ).bind(council.id).all()
        const wardIds = (wardRows.results || []).map((row) => row.id)

        const officeholderRows = await env.DB.prepare(
          'SELECT id FROM local_officeholders WHERE council_id = ?'
        ).bind(council.id).all()
        const officeholderIds = (officeholderRows.results || []).map((row) => row.id)

        const ballotRows = await env.DB.prepare(
          'SELECT id FROM local_ballots WHERE council_id = ?'
        ).bind(council.id).all()
        const ballotIds = (ballotRows.results || []).map((row) => row.id)

        const candidateRows = await env.DB.prepare(
          'SELECT id FROM local_candidates WHERE council_id = ?'
        ).bind(council.id).all()
        const candidateIds = (candidateRows.results || []).map((row) => row.id)

        const eventRows = await env.DB.prepare(
          'SELECT id FROM local_election_events WHERE council_id = ?'
        ).bind(council.id).all()
        const eventIds = (eventRows.results || []).map((row) => row.id)

        const deleteStatements = []
        const addDelete = (statement) => {
          deleteStatements.push(statement)
        }

        const deleteEntitySources = (entityType, ids) => {
          if (!ids.length) return
          for (const idChunk of chunkArray(ids, LOCAL_VOTE_ID_DELETE_CHUNK_SIZE)) {
            const placeholders = idChunk.map(() => '?').join(', ')
            addDelete(env.DB.prepare(
              `DELETE FROM local_entity_sources
               WHERE entity_type = ? AND entity_id IN (${placeholders})`
            ).bind(entityType, ...idChunk))
          }
        }

        deleteEntitySources('candidate', candidateIds)
        deleteEntitySources('officeholder', officeholderIds)
        deleteEntitySources('ward', wardIds)
        deleteEntitySources('ballot', ballotIds)
        deleteEntitySources('election_event', eventIds)
        deleteEntitySources('council', [council.id])

        addDelete(env.DB.prepare('DELETE FROM local_candidates WHERE council_id = ?').bind(council.id))
        addDelete(env.DB.prepare('DELETE FROM local_officeholders WHERE council_id = ?').bind(council.id))
        addDelete(env.DB.prepare('DELETE FROM local_ballots WHERE council_id = ?').bind(council.id))
        addDelete(env.DB.prepare('DELETE FROM local_election_events WHERE council_id = ?').bind(council.id))
        addDelete(env.DB.prepare('DELETE FROM local_wards WHERE council_id = ?').bind(council.id))
        addDelete(env.DB.prepare('DELETE FROM local_councils WHERE id = ?').bind(council.id))

        while (deleteStatements.length) {
          await env.DB.batch(deleteStatements.splice(0, LOCAL_VOTE_BATCH_SIZE))
        }
      }

      async function saveLocalVoteCouncilPayload(council) {
        const councilId = `council_${slugifyLocalVote(council.councilSlug)}`
        let rowsUpserted = 0
        const batchRunner = createLocalVoteBatchRunner()

        await deleteExistingLocalVoteCouncil(council.councilSlug)

        await batchRunner.push(env.DB.prepare(
          `INSERT INTO local_councils (
             id, slug, name, supported_area_label, nation, tier, gss_code, official_website,
             governance_model, election_model, next_election_date, source_note, controls_json,
             active, updated_at, fetched_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          councilId,
          council.councilSlug,
          council.councilName,
          council.supportedAreaLabel || council.councilName,
          'England',
          'Metropolitan Borough',
          null,
          'https://www.sheffield.gov.uk',
          null,
          null,
          council.nextElectionDate || null,
          council.sourceNote || '',
          JSON.stringify(council.controls || []),
          1,
          council.updatedAt || new Date().toISOString(),
          council.fetchedAt || council.updatedAt || new Date().toISOString(),
        ))
        rowsUpserted += 1

        for (const source of toArray(council.sources)) {
          const sourceId = await upsertLocalSource(source, 'council', batchRunner)
          await linkEntitySource('council', councilId, sourceId, source.verificationStatus || 'verified', source.updatedAt || source.lastChecked || null, 'metadata', batchRunner)
          rowsUpserted += 1
        }

        const eventId = `election_event_${slugifyLocalVote(council.councilSlug)}_${slugifyLocalVote(council.nextElectionDate || 'undated')}`
        await batchRunner.push(env.DB.prepare(
          `INSERT INTO local_election_events (id, council_id, election_date, label, source_system, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          eventId,
          councilId,
          council.nextElectionDate || null,
          `${council.councilName} local election`,
          'static-sheffield-seed',
          council.updatedAt || new Date().toISOString(),
        ))
        rowsUpserted += 1

        for (const ward of toArray(council.wards)) {
          const wardId = `ward_${slugifyLocalVote(council.councilSlug)}_${slugifyLocalVote(ward.slug)}`
          await batchRunner.push(env.DB.prepare(
            `INSERT INTO local_wards (
               id, council_id, slug, name, gss_code, mapit_area_id, aliases_json, notes,
               candidate_list_status, active, updated_at, fetched_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            wardId,
            councilId,
            ward.slug,
            ward.name,
            null,
            null,
            JSON.stringify(ward.aliases || []),
            ward.notes || '',
            ward.candidateListStatus || (toArray(ward.candidates).length ? 'Verified candidate list' : 'No verified candidate list yet'),
            1,
            ward.updatedAt || council.updatedAt || new Date().toISOString(),
            ward.fetchedAt || ward.updatedAt || council.updatedAt || new Date().toISOString(),
          ))
          rowsUpserted += 1

          for (const source of toArray(ward.sources)) {
            const sourceId = await upsertLocalSource(source, 'ward', batchRunner)
            await linkEntitySource('ward', wardId, sourceId, source.verificationStatus || 'verified', source.updatedAt || source.lastChecked || null, 'metadata', batchRunner)
            rowsUpserted += 1
          }

          const ballotId = `ballot_${slugifyLocalVote(council.councilSlug)}_${slugifyLocalVote(ward.slug)}_${slugifyLocalVote(council.nextElectionDate || 'undated')}`
          await batchRunner.push(env.DB.prepare(
            `INSERT INTO local_ballots (id, election_event_id, council_id, ward_id, ballot_paper_id, ballot_name, status, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            ballotId,
            eventId,
            councilId,
            wardId,
            ballotId,
            `${council.councilName} local election ${ward.name}`,
            toArray(ward.candidates).length ? 'verified' : 'unavailable',
            ward.updatedAt || council.updatedAt || new Date().toISOString(),
          ))
          rowsUpserted += 1

          for (const councillor of toArray(ward.councillors)) {
            const officeholderId = `officeholder_${slugifyLocalVote(council.councilSlug)}_${slugifyLocalVote(ward.slug)}_${slugifyLocalVote(councillor.name)}_${slugifyLocalVote(councillor.party)}`
            const sourceId = await upsertLocalSource(
              {
                label: councillor.sourceLabel,
                url: councillor.sourceUrl,
                updatedAt: councillor.lastChecked,
              },
              'officeholder',
              batchRunner,
            )

            await batchRunner.push(env.DB.prepare(
              `INSERT INTO local_officeholders (
                 id, council_id, ward_id, name, party, seat_status, role, is_current,
                 source_attribution, primary_source_id, verification_status, last_checked, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              officeholderId,
              councilId,
              wardId,
              councillor.name,
              councillor.party,
              councillor.seatStatus || 'occupied',
              'Councillor',
              1,
              councillor.sourceAttribution || 'official',
              sourceId,
              councillor.verificationStatus || 'verified',
              councillor.lastChecked || null,
              ward.updatedAt || council.updatedAt || new Date().toISOString(),
            ))
            await linkEntitySource(
              'officeholder',
              officeholderId,
              sourceId,
              councillor.verificationStatus || 'verified',
              councillor.lastChecked || null,
              'record',
              batchRunner,
            )
            rowsUpserted += 1
          }

          for (const candidate of toArray(ward.candidates)) {
            const candidateId = `candidate_${slugifyLocalVote(council.councilSlug)}_${slugifyLocalVote(ward.slug)}_${slugifyLocalVote(candidate.name)}_${slugifyLocalVote(candidate.party)}`
            const sourceId = await upsertLocalSource(
              {
                label: candidate.sourceLabel,
                url: candidate.sourceUrl,
                updatedAt: candidate.lastChecked,
              },
              candidate.sourceAttribution || 'candidate',
              batchRunner,
            )

            await batchRunner.push(env.DB.prepare(
              `INSERT INTO local_candidates (
                 id, ballot_id, council_id, ward_id, name, party, election_date,
                 democracy_club_person_url, source_attribution, issue_statements_json,
                 primary_source_id, verification_status, last_checked, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              candidateId,
              ballotId,
              councilId,
              wardId,
              candidate.name,
              candidate.party,
              candidate.electionDate || council.nextElectionDate || null,
              candidate.democracyClubPersonUrl || null,
              candidate.sourceAttribution || 'official',
              JSON.stringify(candidate.issueStatements || {}),
              sourceId,
              candidate.verificationStatus || 'verified',
              candidate.lastChecked || null,
              ward.updatedAt || council.updatedAt || new Date().toISOString(),
            ))
            await linkEntitySource(
              'candidate',
              candidateId,
              sourceId,
              candidate.verificationStatus || 'verified',
              candidate.lastChecked || null,
              'record',
              batchRunner,
            )
            rowsUpserted += 1
          }
        }

        await batchRunner.flush()

        return { councilId, rowsUpserted }
      }

      function normaliseD1Boolean(value) {
        if (typeof value === 'boolean') return value
        const text = String(value || '').trim().toLowerCase()
        return text === 'true' || text === '1' || text === 'yes'
      }

      function buildLocalVoteDcSource(label, url, electionDate) {
        return {
          label,
          url,
          publisher: 'Democracy Club',
          sourceType: 'democracy-club-csv',
          publishedAt: electionDate || null,
          retrievedAt: new Date().toISOString(),
        }
      }

      async function loadLocalVoteLookupIndex() {
        const rows = await env.DB.prepare(
          `SELECT
             c.id AS council_id,
             c.slug AS council_slug,
             c.name AS council_name,
             c.supported_area_label,
             c.gss_code AS council_gss_code,
             c.official_website,
             w.id AS ward_id,
             w.slug AS ward_slug,
             w.name AS ward_name,
             w.gss_code,
             w.mapit_area_id,
             w.aliases_json
           FROM local_councils c
           LEFT JOIN local_wards w
             ON w.council_id = c.id
            AND w.active = 1
           WHERE c.active = 1
           ORDER BY c.name ASC, w.name ASC`
        ).all()

        const councils = new Map()
        const wards = []

        for (const row of rows.results || []) {
          if (!councils.has(row.council_id)) {
            councils.set(row.council_id, {
              id: row.council_id,
              slug: row.council_slug,
              name: row.council_name,
              supportedAreaLabel: row.supported_area_label || '',
              gssCode: row.council_gss_code || '',
              officialWebsite: row.official_website || '',
            })
          }

          if (!row.ward_id) continue

          wards.push({
            id: row.ward_id,
            councilId: row.council_id,
            councilSlug: row.council_slug,
            slug: row.ward_slug,
            name: row.ward_name,
            gssCode: row.gss_code || '',
            mapitAreaId: row.mapit_area_id || '',
            aliases: parseJsonText(row.aliases_json, []),
          })
        }

        return {
          councils: [...councils.values()],
          wards,
        }
      }

      async function loadLocalVoteWardCandidates(councilSlug, wardSlug) {
        const councilRow = await env.DB.prepare(
          `SELECT id, slug, name
           FROM local_councils
           WHERE slug = ? AND active = 1
           LIMIT 1`
        ).bind(councilSlug).first()

        if (!councilRow?.id) return null

        const wardRow = await env.DB.prepare(
          `SELECT id, slug, name
           FROM local_wards
           WHERE council_id = ? AND slug = ? AND active = 1
           LIMIT 1`
        ).bind(councilRow.id, wardSlug).first()

        if (!wardRow?.id) return null

        const candidateRows = await env.DB.prepare(
          `SELECT
             c.id,
             c.name,
             c.party,
             c.election_date,
             c.democracy_club_person_url,
             c.source_attribution,
             c.verification_status,
             c.last_checked,
             s.label AS source_label,
             s.url AS source_url
           FROM local_candidates c
           LEFT JOIN local_sources s ON s.id = c.primary_source_id
           WHERE c.council_id = ? AND c.ward_id = ?
           ORDER BY c.name ASC`
        ).bind(councilRow.id, wardRow.id).all()

        return {
          councilSlug: councilRow.slug,
          councilName: councilRow.name,
          wardSlug: wardRow.slug,
          wardName: wardRow.name,
          candidates: (candidateRows.results || []).map((row) => ({
            id: row.id,
            ward: wardRow.name,
            name: row.name,
            party: row.party,
            electionDate: row.election_date,
            sourceUrl: row.source_url || '',
            sourceLabel: row.source_label || '',
            lastChecked: row.last_checked || '',
            verificationStatus: row.verification_status || 'verified',
            sourceAttribution: row.source_attribution || 'official',
            democracyClubPersonUrl: row.democracy_club_person_url || '',
            issueStatements: {},
          })),
        }
      }

      async function upsertLocalVoteDemocracyClubChunk({
        electionDate,
        csvUrl,
        rows,
        runId,
      }) {
        const batchRunner = createLocalVoteBatchRunner()
        const sourceId = await upsertLocalSource(
          buildLocalVoteDcSource(`Democracy Club candidate CSV ${electionDate}`, csvUrl, electionDate),
          'democracy-club-csv',
          batchRunner,
        )

        const rowsReceived = toArray(rows).length
        let rowsUpserted = 0
        let matchedRows = 0
        let skippedRows = 0
        let insertedBallots = 0
        let insertedCandidates = 0
        let candidateBallotLinks = 0
        const processedEventIds = new Set()
        const processedBallotIds = new Set()
        const processedWardIds = new Set()

        const unmatchedCouncils = new Map()
        const unmatchedWards = new Map()

        const noteUnmatched = (targetMap, key, sample) => {
          if (!key) return
          const existing = targetMap.get(key) || { count: 0, sample }
          existing.count += 1
          if (!existing.sample && sample) existing.sample = sample
          targetMap.set(key, existing)
        }

        for (const row of toArray(rows)) {
          const council = row?.councilId && row?.councilSlug
            ? {
                id: String(row.councilId).trim(),
                slug: String(row.councilSlug).trim(),
                name: String(row.councilName || '').trim(),
              }
            : null
          const ward = row?.wardId && row?.wardSlug
            ? {
                id: String(row.wardId).trim(),
                slug: String(row.wardSlug).trim(),
                name: String(row.wardName || '').trim(),
              }
            : null

          if (!council) {
            skippedRows += 1
            noteUnmatched(
              unmatchedCouncils,
              String(row.organisationName || row.organisation_name || '(unknown council)').trim(),
              {
                organisationName: row.organisationName || row.organisation_name || '',
                postLabel: row.postLabel || row.post_label || '',
                gss: row.gss || '',
                postId: row.postId || row.post_id || '',
              },
            )
            continue
          }

          if (!ward) {
            skippedRows += 1
            noteUnmatched(
              unmatchedWards,
              `${council.slug}:${String(row.postLabel || row.post_label || '(unknown ward)').trim()}`,
              {
                councilSlug: council.slug,
                organisationName: row.organisationName || row.organisation_name || '',
                postLabel: row.postLabel || row.post_label || '',
                gss: row.gss || '',
                postId: row.postId || row.post_id || '',
              },
            )
            continue
          }

          matchedRows += 1

          const eventId = `election_event_${slugifyLocalVote(council.slug)}_${slugifyLocalVote(electionDate || 'undated')}`
          const ballotId = `ballot_${slugifyLocalVote(council.slug)}_${slugifyLocalVote(ward.slug)}_${slugifyLocalVote(electionDate || 'undated')}`
          const candidateId = `candidate_${slugifyLocalVote(council.slug)}_${slugifyLocalVote(ward.slug)}_${slugifyLocalVote(row.personName)}_${slugifyLocalVote(row.partyName)}`
          const updatedAt = String(row.updatedAt || row.personLastUpdated || row.statementLastUpdated || electionDate || new Date().toISOString()).trim()
          const candidateUrl = String(row.personUrl || row.person_url || '').trim() || null
          const ballotName =
            String(row.postLabel || row.post_label || '').trim()
              ? `${council.name} local election ${String(row.postLabel || row.post_label || '').trim()}`
              : `${council.name} local election`
          const ballotStatus = normaliseD1Boolean(row.cancelledPoll ?? row.cancelled_poll) ? 'cancelled' : 'verified'

          if (!processedEventIds.has(eventId)) {
            await batchRunner.push(env.DB.prepare(
              `INSERT INTO local_election_events (id, council_id, election_date, label, source_system, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 election_date = excluded.election_date,
                 label = excluded.label,
                 source_system = excluded.source_system,
                 updated_at = excluded.updated_at`
            ).bind(
              eventId,
              council.id,
              electionDate,
              `${council.name} local election`,
              'democracy-club-csv',
              updatedAt,
            ))
            await linkEntitySource('election_event', eventId, sourceId, 'verified', updatedAt, 'record', batchRunner)
            processedEventIds.add(eventId)
            rowsUpserted += 1
          }

          if (!processedBallotIds.has(ballotId)) {
            await batchRunner.push(env.DB.prepare(
              `INSERT INTO local_ballots (id, election_event_id, council_id, ward_id, ballot_paper_id, ballot_name, status, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 election_event_id = excluded.election_event_id,
                 council_id = excluded.council_id,
                 ward_id = excluded.ward_id,
                 ballot_paper_id = excluded.ballot_paper_id,
                 ballot_name = excluded.ballot_name,
                 status = excluded.status,
                 updated_at = excluded.updated_at`
            ).bind(
              ballotId,
              eventId,
              council.id,
              ward.id,
              row.ballotPaperId || row.ballot_paper_id || ballotId,
              ballotName,
              ballotStatus,
              updatedAt,
            ))
            await linkEntitySource('ballot', ballotId, sourceId, 'verified', updatedAt, 'record', batchRunner)
            processedBallotIds.add(ballotId)
            insertedBallots += 1
            rowsUpserted += 1
          }

          if (!processedWardIds.has(ward.id)) {
            await batchRunner.push(env.DB.prepare(
              `UPDATE local_wards
               SET candidate_list_status = ?, updated_at = ?
               WHERE id = ?`
            ).bind('Verified candidate list', updatedAt, ward.id))
            processedWardIds.add(ward.id)
          }

          await batchRunner.push(env.DB.prepare(
            `INSERT INTO local_candidates (
               id, ballot_id, council_id, ward_id, name, party, election_date,
               democracy_club_person_url, source_attribution, issue_statements_json,
               primary_source_id, verification_status, last_checked, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               ballot_id = excluded.ballot_id,
               council_id = excluded.council_id,
               ward_id = excluded.ward_id,
               name = excluded.name,
               party = excluded.party,
               election_date = excluded.election_date,
               democracy_club_person_url = excluded.democracy_club_person_url,
               source_attribution = excluded.source_attribution,
               issue_statements_json = excluded.issue_statements_json,
               primary_source_id = excluded.primary_source_id,
               verification_status = excluded.verification_status,
               last_checked = excluded.last_checked,
               updated_at = excluded.updated_at`
            ).bind(
              candidateId,
              ballotId,
              council.id,
              ward.id,
              row.personName,
              row.partyName || '',
              electionDate,
              candidateUrl,
              'democracy-club-csv',
            JSON.stringify({}),
            sourceId,
            'verified',
            updatedAt,
            updatedAt,
          ))
          await linkEntitySource('candidate', candidateId, sourceId, 'verified', updatedAt, 'record', batchRunner)

          rowsUpserted += 1
          insertedCandidates += 1
          candidateBallotLinks += ballotId ? 1 : 0
        }

        await batchRunner.flush()

        if (runId) {
          const unmatchedSummary = {
            unmatchedCouncils: [...unmatchedCouncils.entries()].slice(0, 50).map(([key, value]) => ({
              key,
              count: value.count,
              sample: value.sample,
            })),
            unmatchedWards: [...unmatchedWards.entries()].slice(0, 50).map(([key, value]) => ({
              key,
              count: value.count,
              sample: value.sample,
            })),
          }

          await env.DB.prepare(
            `UPDATE local_ingest_runs
             SET rows_upserted = COALESCE(rows_upserted, 0) + ?, meta_json = ?
             WHERE id = ?`
          ).bind(
            rowsUpserted,
            JSON.stringify({
              electionDate,
              rowsReceived,
              matchedRows,
              skippedRows,
              insertedBallots,
              insertedCandidates,
              candidateBallotLinks,
              ...unmatchedSummary,
            }),
            runId,
          ).run()
        }

        return {
          rowsReceived,
          matchedRows,
          skippedRows,
          insertedBallots,
          insertedCandidates,
          candidateBallotLinks,
          rowsUpserted,
          unmatchedCouncils: [...unmatchedCouncils.entries()].map(([key, value]) => ({
            key,
            count: value.count,
            sample: value.sample,
          })),
          unmatchedWards: [...unmatchedWards.entries()].map(([key, value]) => ({
            key,
            count: value.count,
            sample: value.sample,
          })),
        }
      }

      async function validateLocalVoteDemocracyClubImport(electionDate) {
        const ballotRow = await env.DB.prepare(
          `SELECT COUNT(*) AS count
           FROM local_ballots b
           JOIN local_election_events e ON e.id = b.election_event_id
           WHERE e.election_date = ?
             AND e.source_system = ?`
        ).bind(electionDate, 'democracy-club-csv').first()

        const candidateRow = await env.DB.prepare(
          `SELECT COUNT(*) AS count
           FROM local_candidates c
           WHERE c.election_date = ?
             AND c.source_attribution = ?`
        ).bind(electionDate, 'democracy-club-csv').first()

        const linkedRow = await env.DB.prepare(
          `SELECT COUNT(*) AS count
           FROM local_candidates c
           JOIN local_ballots b ON b.id = c.ballot_id
           WHERE c.election_date = ?
             AND c.source_attribution = ?`
        ).bind(electionDate, 'democracy-club-csv').first()

        return {
          ballotCount: Number(ballotRow?.count || 0),
          candidateCount: Number(candidateRow?.count || 0),
          linkedCandidateCount: Number(linkedRow?.count || 0),
        }
      }

      async function upsertLocalVoteCouncilBaselineChunk({
        councils,
        runId,
      }) {
        const batchRunner = createLocalVoteBatchRunner()
        let rowsUpserted = 0

        for (const council of toArray(councils)) {
          const councilSlug = String(council.slug || '').trim()
          const councilName = String(council.name || '').trim()
          if (!councilSlug || !councilName) continue

          const councilId = `council_${slugifyLocalVote(councilSlug)}`

          await batchRunner.push(env.DB.prepare(
            `INSERT INTO local_councils (
               id, slug, name, supported_area_label, nation, tier, gss_code, official_website,
               governance_model, election_model, next_election_date, source_note, controls_json,
               active, updated_at, fetched_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               slug = excluded.slug,
               name = excluded.name,
               supported_area_label = excluded.supported_area_label,
               nation = excluded.nation,
               tier = CASE WHEN excluded.tier IS NOT NULL AND excluded.tier != '' THEN excluded.tier ELSE local_councils.tier END,
               gss_code = CASE WHEN excluded.gss_code IS NOT NULL AND excluded.gss_code != '' THEN excluded.gss_code ELSE local_councils.gss_code END,
               official_website = CASE
                 WHEN excluded.official_website IS NOT NULL AND excluded.official_website != ''
                 THEN excluded.official_website
                 ELSE local_councils.official_website
               END,
               governance_model = CASE
                 WHEN excluded.governance_model IS NOT NULL AND excluded.governance_model != ''
                 THEN excluded.governance_model
                 ELSE local_councils.governance_model
               END,
               election_model = CASE
                 WHEN excluded.election_model IS NOT NULL AND excluded.election_model != ''
                 THEN excluded.election_model
                 ELSE local_councils.election_model
               END,
               next_election_date = COALESCE(local_councils.next_election_date, excluded.next_election_date),
               source_note = CASE
                 WHEN local_councils.source_note IS NOT NULL AND local_councils.source_note != ''
                 THEN local_councils.source_note
                 ELSE excluded.source_note
               END,
               controls_json = CASE
                 WHEN local_councils.controls_json IS NOT NULL AND local_councils.controls_json != ''
                 THEN local_councils.controls_json
                 ELSE excluded.controls_json
               END,
               active = excluded.active,
               updated_at = excluded.updated_at,
               fetched_at = excluded.fetched_at`
          ).bind(
            councilId,
            councilSlug,
            councilName,
            council.supportedAreaLabel || councilName,
            council.nation || 'England',
            council.tier || '',
            council.gssCode || null,
            council.officialWebsite || '',
            council.governanceModel || '',
            council.electionModel || '',
            council.nextElectionDate || null,
            council.sourceNote || '',
            JSON.stringify(council.controls || []),
            1,
            council.updatedAt || new Date().toISOString(),
            council.fetchedAt || council.updatedAt || new Date().toISOString(),
          ))
          rowsUpserted += 1

          for (const source of toArray(council.sources)) {
            const sourceId = await upsertLocalSource(source, 'council-baseline', batchRunner)
            await linkEntitySource(
              'council',
              councilId,
              sourceId,
              source.verificationStatus || 'verified',
              source.updatedAt || source.lastChecked || null,
              'metadata',
              batchRunner,
            )
            rowsUpserted += 1
          }
        }

        await batchRunner.flush()

        if (runId) {
          await env.DB.prepare(
            `UPDATE local_ingest_runs
             SET rows_upserted = COALESCE(rows_upserted, 0) + ?, meta_json = ?
             WHERE id = ?`
          ).bind(
            rowsUpserted,
            JSON.stringify({
              action: 'councils',
              councilCount: toArray(councils).length,
            }),
            runId,
          ).run()
        }

        return {
          councilCount: toArray(councils).length,
          rowsUpserted,
        }
      }

      async function upsertLocalVoteWardBaselineChunk({
        wards,
        runId,
      }) {
        const batchRunner = createLocalVoteBatchRunner()
        let rowsUpserted = 0
        let skippedRows = 0

        for (const ward of toArray(wards)) {
          const councilSlug = String(ward.councilSlug || '').trim()
          const wardSlug = String(ward.slug || '').trim()
          const wardName = String(ward.name || '').trim()

          if (!councilSlug || !wardSlug || !wardName) {
            skippedRows += 1
            continue
          }

          const councilId = `council_${slugifyLocalVote(councilSlug)}`
          const wardId = `ward_${slugifyLocalVote(councilSlug)}_${slugifyLocalVote(wardSlug)}`

          await batchRunner.push(env.DB.prepare(
            `INSERT INTO local_wards (
               id, council_id, slug, name, gss_code, mapit_area_id, aliases_json, notes,
               candidate_list_status, active, updated_at, fetched_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               council_id = excluded.council_id,
               slug = excluded.slug,
               name = excluded.name,
               gss_code = CASE WHEN excluded.gss_code IS NOT NULL AND excluded.gss_code != '' THEN excluded.gss_code ELSE local_wards.gss_code END,
               mapit_area_id = CASE WHEN excluded.mapit_area_id IS NOT NULL AND excluded.mapit_area_id != '' THEN excluded.mapit_area_id ELSE local_wards.mapit_area_id END,
               aliases_json = CASE
                 WHEN excluded.aliases_json IS NOT NULL AND excluded.aliases_json != '[]'
                 THEN excluded.aliases_json
                 ELSE local_wards.aliases_json
               END,
               notes = CASE
                 WHEN local_wards.notes IS NOT NULL AND local_wards.notes != ''
                 THEN local_wards.notes
                 ELSE excluded.notes
               END,
               candidate_list_status = CASE
                 WHEN excluded.candidate_list_status IS NOT NULL AND excluded.candidate_list_status != ''
                 THEN excluded.candidate_list_status
                 ELSE local_wards.candidate_list_status
               END,
               active = excluded.active,
               updated_at = excluded.updated_at,
               fetched_at = excluded.fetched_at`
          ).bind(
            wardId,
            councilId,
            wardSlug,
            wardName,
            ward.gssCode || null,
            ward.mapitAreaId || null,
            JSON.stringify(ward.aliases || []),
            ward.notes || '',
            ward.candidateListStatus || '',
            1,
            ward.updatedAt || new Date().toISOString(),
            ward.fetchedAt || ward.updatedAt || new Date().toISOString(),
          ))
          rowsUpserted += 1

          for (const source of toArray(ward.sources)) {
            const sourceId = await upsertLocalSource(source, 'ward-baseline', batchRunner)
            await linkEntitySource(
              'ward',
              wardId,
              sourceId,
              source.verificationStatus || 'verified',
              source.updatedAt || source.lastChecked || null,
              'metadata',
              batchRunner,
            )
            rowsUpserted += 1
          }
        }

        await batchRunner.flush()

        if (runId) {
          await env.DB.prepare(
            `UPDATE local_ingest_runs
             SET rows_upserted = COALESCE(rows_upserted, 0) + ?, meta_json = ?
             WHERE id = ?`
          ).bind(
            rowsUpserted,
            JSON.stringify({
              action: 'wards',
              wardCount: toArray(wards).length,
              skippedRows,
            }),
            runId,
          ).run()
        }

        return {
          wardCount: toArray(wards).length,
          skippedRows,
          rowsUpserted,
        }
      }

      async function validateLocalVoteBaselineImport() {
        const councilRow = await env.DB.prepare(
          `SELECT COUNT(*) AS count
           FROM local_councils
           WHERE active = 1`
        ).first()

        const wardRow = await env.DB.prepare(
          `SELECT COUNT(*) AS count
           FROM local_wards
           WHERE active = 1`
        ).first()

        const sheffieldRow = await env.DB.prepare(
          `SELECT COUNT(*) AS count
           FROM local_wards
           WHERE council_id = ?`
        ).bind('council_sheffield-city-council').first()

        return {
          councilCount: Number(councilRow?.count || 0),
          wardCount: Number(wardRow?.count || 0),
          sheffieldWardCount: Number(sheffieldRow?.count || 0),
        }
      }

      if (request.method === 'POST' && url.pathname === '/api/local-vote/ingest/sheffield') {
        const startedAt = new Date().toISOString()
        const runId = `local_vote_ingest_sheffield_${Date.now()}`
        await env.DB.prepare(
          `INSERT INTO local_ingest_runs (id, pipeline, status, started_at, finished_at, rows_upserted, error_summary, meta_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(runId, 'local-vote-sheffield-seed', 'running', startedAt, null, 0, null, null).run()

        try {
          const body = await request.json()
          const council = body?.council || null
          const errors = validateLocalVoteCouncilPayload(council)

          if (errors.length) {
            await env.DB.prepare(
              `UPDATE local_ingest_runs
               SET status = ?, finished_at = ?, error_summary = ?, meta_json = ?
               WHERE id = ?`
            ).bind('failed', new Date().toISOString(), errors.join(' | '), JSON.stringify({ errors }), runId).run()

            return jsonResponse({
              ok: false,
              errors,
            }, { status: 400 })
          }

          const saved = await saveLocalVoteCouncilPayload(council)
          const payload = await loadLocalVoteCouncilPayload(council.councilSlug)

          const wardCount = payload?.wards?.length || 0
          const councillorCount = (payload?.wards || []).reduce((total, ward) => total + (ward.councillors?.length || 0), 0)
          const candidateCount = (payload?.wards || []).reduce((total, ward) => total + (ward.candidates?.length || 0), 0)

          await env.DB.prepare(
            `UPDATE local_ingest_runs
             SET status = ?, finished_at = ?, rows_upserted = ?, meta_json = ?
             WHERE id = ?`
          ).bind(
            'success',
            new Date().toISOString(),
            saved.rowsUpserted,
            JSON.stringify({ wardCount, councillorCount, candidateCount }),
            runId,
          ).run()

          return jsonResponse({
            ok: true,
            councilSlug: council.councilSlug,
            wardCount,
            councillorCount,
            candidateCount,
            rowsUpserted: saved.rowsUpserted,
            validation: {
              wards: wardCount === 28,
              councillorsPresent: councillorCount > 0,
              candidatesPresent: candidateCount > 0,
              sourcesPresent: (payload?.sources?.length || 0) > 0,
            },
          })
        } catch (error) {
          await env.DB.prepare(
            `UPDATE local_ingest_runs
             SET status = ?, finished_at = ?, error_summary = ?
             WHERE id = ?`
          ).bind(
            'failed',
            new Date().toISOString(),
            error instanceof Error ? error.message : String(error),
            runId,
          ).run()

          return jsonResponse(
            {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          )
        }
      }

      if (request.method === 'POST' && url.pathname === '/api/local-vote/ingest/councils-wards') {
        try {
          const body = await request.json()
          const action = String(body?.action || '').trim().toLowerCase()
          const runId = String(body?.runId || `local_vote_ingest_councils_wards_${Date.now()}`).trim()

          if (action === 'start') {
            await env.DB.prepare(
              `INSERT INTO local_ingest_runs (id, pipeline, status, started_at, finished_at, rows_upserted, error_summary, meta_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 pipeline = excluded.pipeline,
                 status = excluded.status,
                 started_at = excluded.started_at,
                 finished_at = excluded.finished_at,
                 rows_upserted = excluded.rows_upserted,
                 error_summary = excluded.error_summary,
                 meta_json = excluded.meta_json`
            ).bind(
              runId,
              'local-vote-councils-wards-baseline',
              'running',
              new Date().toISOString(),
              null,
              0,
              null,
              JSON.stringify({
                councilCount: Number(body?.councilCount || 0),
                wardCount: Number(body?.wardCount || 0),
                wardsSourceUrl: body?.wardsSourceUrl || '',
              }),
            ).run()

            return jsonResponse({
              ok: true,
              runId,
            })
          }

          if (action === 'councils') {
            const summary = await upsertLocalVoteCouncilBaselineChunk({
              councils: body?.councils,
              runId,
            })

            return jsonResponse({
              ok: true,
              runId,
              ...summary,
            })
          }

          if (action === 'wards') {
            const summary = await upsertLocalVoteWardBaselineChunk({
              wards: body?.wards,
              runId,
            })

            return jsonResponse({
              ok: true,
              runId,
              ...summary,
            })
          }

          if (action === 'finish') {
            const validation = await validateLocalVoteBaselineImport()
            const failed = validation.councilCount <= 0 || validation.wardCount <= 0 || validation.sheffieldWardCount < 28

            await env.DB.prepare(
              `UPDATE local_ingest_runs
               SET status = ?, finished_at = ?, error_summary = ?, meta_json = ?
               WHERE id = ?`
            ).bind(
              failed ? 'failed' : 'success',
              new Date().toISOString(),
              failed ? 'Validation failed for councils/wards baseline ingest.' : null,
              JSON.stringify({
                validation,
                unmatchedCouncils: body?.unmatchedCouncils || [],
                unmatchedWards: body?.unmatchedWards || [],
              }),
              runId,
            ).run()

            return jsonResponse({
              ok: !failed,
              runId,
              validation,
            }, { status: failed ? 500 : 200 })
          }

          return jsonResponse({ ok: false, error: 'Unknown action.' }, { status: 400 })
        } catch (error) {
          return jsonResponse(
            {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          )
        }
      }

      if (request.method === 'POST' && url.pathname === '/api/local-vote/ingest/democracy-club-candidates') {
        try {
          const body = await request.json()
          const action = String(body?.action || 'chunk').trim().toLowerCase()
          const electionDate = String(body?.electionDate || '').trim()
          const csvUrl = String(body?.csvUrl || '').trim()
          const runId = String(body?.runId || `local_vote_ingest_democracy_club_${Date.now()}`).trim()

          if (!electionDate) {
            return jsonResponse({ ok: false, error: 'Missing electionDate.' }, { status: 400 })
          }

          if (action === 'start') {
            await env.DB.prepare(
              `INSERT INTO local_ingest_runs (id, pipeline, status, started_at, finished_at, rows_upserted, error_summary, meta_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 pipeline = excluded.pipeline,
                 status = excluded.status,
                 started_at = excluded.started_at,
                 finished_at = excluded.finished_at,
                 rows_upserted = excluded.rows_upserted,
                 error_summary = excluded.error_summary,
                 meta_json = excluded.meta_json`
            ).bind(
              runId,
              'local-vote-democracy-club-csv',
              'running',
              new Date().toISOString(),
              null,
              0,
              null,
              JSON.stringify({
                electionDate,
                csvUrl,
                totalRows: Number(body?.totalRows || 0),
              }),
            ).run()

            return jsonResponse({
              ok: true,
              runId,
              electionDate,
              csvUrl,
            })
          }

          if (action === 'chunk') {
            const rows = toArray(body?.rows)
            if (!rows.length) {
              return jsonResponse({ ok: false, error: 'Missing candidate rows.' }, { status: 400 })
            }

            const summary = await upsertLocalVoteDemocracyClubChunk({
              electionDate,
              csvUrl,
              rows,
              runId,
            })

            return jsonResponse({
              ok: true,
              runId,
              electionDate,
              chunkIndex: Number(body?.chunkIndex || 0),
              totalChunks: Number(body?.totalChunks || 0),
              ...summary,
            })
          }

          if (action === 'finish') {
            const validation = await validateLocalVoteDemocracyClubImport(electionDate)
            const failed =
              validation.ballotCount <= 0 ||
              validation.candidateCount <= 0 ||
              validation.linkedCandidateCount !== validation.candidateCount

            await env.DB.prepare(
              `UPDATE local_ingest_runs
               SET status = ?, finished_at = ?, error_summary = ?, meta_json = ?
               WHERE id = ?`
            ).bind(
              failed ? 'failed' : 'success',
              new Date().toISOString(),
              failed
                ? 'Validation failed for Democracy Club candidate ingest.'
                : null,
              JSON.stringify({
                electionDate,
                csvUrl,
                validation,
                unmatchedCouncils: body?.unmatchedCouncils || [],
                unmatchedWards: body?.unmatchedWards || [],
              }),
              runId,
            ).run()

            return jsonResponse({
              ok: !failed,
              runId,
              electionDate,
              validation,
            }, { status: failed ? 500 : 200 })
          }

          return jsonResponse({ ok: false, error: 'Unknown action.' }, { status: 400 })
        } catch (error) {
          return jsonResponse(
            {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          )
        }
      }

      const localVoteCouncilMatch = url.pathname.match(/^\/api\/local-vote\/councils\/([^/]+)$/)
      const localVoteWardsMatch = url.pathname.match(/^\/api\/local-vote\/councils\/([^/]+)\/wards$/)
      const localVoteWardMatch = url.pathname.match(/^\/api\/local-vote\/councils\/([^/]+)\/wards\/([^/]+)$/)
      const localVoteLookupIndexMatch = url.pathname === '/api/local-vote/lookup-index'
      const localVoteCandidatesMatch = url.pathname === '/api/local-vote/candidates'

      if (request.method === 'GET' && localVoteCouncilMatch) {
        const councilSlug = routeSlugToCouncilSlug(decodeURIComponent(localVoteCouncilMatch[1] || ''))
        return cachedJsonResponse(request, async () => {
          if (!councilSlug) {
            return jsonResponse({ error: 'Unknown local vote guide council' }, { status: 404 })
          }

          const council = await loadLocalVoteCouncilPayload(councilSlug)
          if (!council) {
            return jsonResponse({ error: 'Local vote guide council not found' }, { status: 404 })
          }

          return jsonResponse(council)
        })
      }

      if (request.method === 'GET' && localVoteWardsMatch) {
        const councilSlug = routeSlugToCouncilSlug(decodeURIComponent(localVoteWardsMatch[1] || ''))
        return cachedJsonResponse(request, async () => {
          if (!councilSlug) {
            return jsonResponse({ error: 'Unknown local vote guide council' }, { status: 404 })
          }

          const council = await loadLocalVoteCouncilPayload(councilSlug)
          if (!council) {
            return jsonResponse({ error: 'Local vote guide council not found' }, { status: 404 })
          }

          return jsonResponse(council.wards || [])
        })
      }

      if (request.method === 'GET' && localVoteWardMatch) {
        const councilSlug = routeSlugToCouncilSlug(decodeURIComponent(localVoteWardMatch[1] || ''))
        const wardSlug = decodeURIComponent(localVoteWardMatch[2] || '')
        return cachedJsonResponse(request, async () => {
          if (!councilSlug || !wardSlug) {
            return jsonResponse({ error: 'Unknown local vote guide ward' }, { status: 404 })
          }

          const council = await loadLocalVoteCouncilPayload(councilSlug)
          const ward = council?.wards?.find((entry) => entry.slug === wardSlug) || null
          if (!ward) {
            return jsonResponse({ error: 'Local vote guide ward not found' }, { status: 404 })
          }

          return jsonResponse(ward)
        })
      }

      if (request.method === 'GET' && localVoteLookupIndexMatch) {
        return cachedJsonResponse(request, async () => {
          const payload = await loadLocalVoteLookupIndex()
          return jsonResponse(payload)
        })
      }

      if (request.method === 'GET' && localVoteCandidatesMatch) {
        return cachedJsonResponse(request, async () => {
          const councilSlug = String(url.searchParams.get('councilSlug') || '').trim()
          const wardSlug = String(url.searchParams.get('wardSlug') || '').trim()

          if (!councilSlug || !wardSlug) {
            return jsonResponse({ error: 'Missing councilSlug or wardSlug' }, { status: 400 })
          }

          const payload = await loadLocalVoteWardCandidates(councilSlug, wardSlug)
          if (!payload) {
            return jsonResponse({ error: 'Local vote candidates not found' }, { status: 404 })
          }

          return jsonResponse(payload)
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/elections/refresh-status') {
        const existing = await loadCouncilStatus()
        const refreshed = existing.map((row) => ({
          ...row,
          lastVerifiedAt: new Date().toISOString(),
          verificationStatus: row.verificationStatus || 'unverified',
        }))

        await saveContentSection('councilStatus', refreshed)

        return jsonResponse({
          ok: true,
          section: 'councilStatus',
          count: refreshed.length,
          refreshedAt: new Date().toISOString(),
          note: 'This endpoint currently refreshes verification timestamps and is ready for automated council-source fetch logic.',
        })
      }

      if (request.method === 'GET' && url.pathname === '/api/data') {
        const polls = await env.DB.prepare(
          'SELECT id, name, pct, change, seats, updated_at FROM polls ORDER BY id ASC'
        ).all()

        const leaders = await env.DB.prepare(
          'SELECT id, name, net, role, bio, party FROM leaders ORDER BY id ASC'
        ).all()

        const elections = await env.DB.prepare(
          'SELECT id, name, date, data FROM elections ORDER BY id ASC'
        ).all()

        const metaObj = await loadMeta()

        const trends = await loadContentSection('trends')
        const betting = await loadContentSection('betting')
        const predictionMarkets = await loadContentSection('predictionMarkets')
        const byElections = await loadContentSection('byElections')
        const migration = await loadContentSection('migration')
        const milestones = await loadContentSection('milestones')
        const pollsData = await loadContentSection('pollsData')
        const ingestStatus = await loadContentSection('ingestStatus')
        const demographics = await loadContentSection('demographics')
        const newsItems = await loadContentSection('newsItems')
        const mergedCouncilData = await loadMergedCouncilData()
        const electionsIntelligence = await loadElectionsIntelligence()

        const parsedElectionRows = (elections.results || []).map((row) => ({
          ...row,
          data: row.data ? JSON.parse(row.data) : null,
        }))

        const electionsPayload =
          parsedElectionRows.length > 0 && parsedElectionRows[0]?.data && typeof parsedElectionRows[0].data === 'object'
            ? parsedElectionRows[0].data
            : {}

        return jsonResponse({
          polls: polls.results || [],
          leaders: leaders.results || [],
          elections: {
            ...electionsPayload,
            intelligence: electionsIntelligence,
          },
          meta: metaObj,
          trends: trends || [],
          betting: betting || null,
          predictionMarkets: predictionMarkets || null,
          byElections: byElections || null,
          migration: migration || null,
          milestones: milestones || [],
          pollsData: pollsData || [],
          ingestStatus: ingestStatus || null,
          demographics: demographics || null,
          newsItems: newsItems || [],
          councilRegistry: mergedCouncilData.registry || [],
          councilStatus: mergedCouncilData.status || [],
          councilEditorial: mergedCouncilData.editorial || [],
          electionsIntelligence,
          dataState: {
            polls: {
              section: 'polls',
              label: ingestStatus?.status === 'success' ? 'Live' : 'Cached',
              tone: ingestStatus?.status === 'success' ? 'live' : 'cached',
              updatedAt: ingestStatus?.lastRunAt || metaObj?.fetchDate || null,
              source: ingestStatus?.status === 'success' ? 'Cloudflare cron ingest to D1' : 'D1 poll store',
              fallback: ingestStatus?.status !== 'success',
            },
            trends: {
              section: 'trends',
              label: 'Derived',
              tone: 'derived',
              updatedAt: ingestStatus?.lastRunAt || metaObj?.fetchDate || null,
              source: 'Derived from D1 polls',
              fallback: false,
            },
            leaders: {
              section: 'leaders',
              label: 'Maintained',
              tone: 'maintained',
              source: 'D1 leaders table',
              fallback: false,
              maintained: true,
            },
            betting: {
              section: 'betting',
              label: 'Static',
              tone: 'static',
              source: 'Maintained editorial odds',
              fallback: true,
              maintained: true,
            },
            predictionMarkets: {
              section: 'predictionMarkets',
              label: 'Live',
              tone: 'live',
              source: 'Polymarket',
              fallback: true,
            },
            elections: {
              section: 'elections',
              label: 'Semi-live',
              tone: 'semi-live',
              updatedAt: electionsIntelligence?.mayors?.meta?.updatedAt || electionsIntelligence?.devolved?.meta?.updatedAt || null,
              source: 'D1 election intelligence',
              maintained: true,
            },
            byElections: {
              section: 'byElections',
              label: byElections?.meta?.updatedAt ? 'Maintained' : 'Static',
              tone: byElections?.meta?.updatedAt ? 'maintained' : 'static',
              updatedAt: byElections?.meta?.updatedAt || null,
              source: byElections?.meta?.source || 'D1 by-election tracker',
              maintained: true,
            },
            migration: {
              section: 'migration',
              label: 'Static',
              tone: 'static',
              source: 'Static reference data',
              fallback: true,
            },
            demographics: {
              section: 'demographics',
              label: 'Static',
              tone: 'static',
              source: 'Static reference data',
              fallback: true,
            },
            newsItems: {
              section: 'newsItems',
              label: 'Live',
              tone: 'live',
              updatedAt: newsItems?.meta?.updatedAt || newsItems?.[0]?.publishedAt || null,
              source: 'Worker live fetch',
            },
            councilRegistry: {
              section: 'councilRegistry',
              label: 'Maintained',
              tone: 'maintained',
              updatedAt: mergedCouncilData.registry?.meta?.updatedAt || null,
              source: 'D1 council registry',
              maintained: true,
            },
            councilStatus: {
              section: 'councilStatus',
              label: 'Maintained',
              tone: 'maintained',
              updatedAt: mergedCouncilData.status?.meta?.updatedAt || null,
              source: 'D1 council status',
              maintained: true,
            },
            councilEditorial: {
              section: 'councilEditorial',
              label: 'Maintained',
              tone: 'maintained',
              updatedAt: mergedCouncilData.editorial?.meta?.updatedAt || null,
              source: 'D1 council editorial',
              maintained: true,
            },
            parliament: {
              section: 'parliament',
              label: 'Semi-live',
              tone: 'semi-live',
              updatedAt: metaObj?.parliamentUpdatedAt || null,
              source: 'Official Parliament / YouTube',
            },
            electionsIntelligence: {
              section: 'electionsIntelligence',
              label: 'Maintained',
              tone: 'maintained',
              updatedAt: electionsIntelligence?.mayors?.meta?.updatedAt || electionsIntelligence?.devolved?.meta?.updatedAt || null,
              source: 'D1-maintained election intelligence',
              maintained: true,
            },
          },
        })
      }

      if (request.method === 'POST' && url.pathname === '/api/save') {
        const body = await request.json()
        const { section, payload } = body || {}

        if (!section) {
          return new Response('Missing section', { status: 400, headers: corsHeaders })
        }

        if (section === 'meta') {
          const entries = Object.entries(payload || {})
          for (const [key, value] of entries) {
            await env.DB.prepare(
              'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)'
            ).bind(key, String(value ?? '')).run()
          }

          return new Response('ok', { headers: corsHeaders })
        }

        if (section === 'polls') {
          await env.DB.prepare('DELETE FROM polls').run()

          for (const row of payload || []) {
            await env.DB.prepare(
              'INSERT INTO polls (id, name, pct, change, seats, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(
              row.id ?? null,
              row.name ?? '',
              row.pct ?? 0,
              row.change ?? 0,
              row.seats ?? 0,
              row.updated_at ?? new Date().toISOString()
            ).run()
          }

          return new Response('ok', { headers: corsHeaders })
        }

        if (section === 'leaders') {
          await env.DB.prepare('DELETE FROM leaders').run()

          for (const row of payload || []) {
            await env.DB.prepare(
              'INSERT INTO leaders (id, name, net, role, bio, party) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(
              row.id ?? null,
              row.name ?? '',
              row.net ?? 0,
              row.role ?? '',
              row.bio ?? '',
              row.party ?? ''
            ).run()
          }

          return new Response('ok', { headers: corsHeaders })
        }

        if (section === 'elections') {
          await env.DB.prepare('DELETE FROM elections').run()

          for (const row of payload || []) {
            await env.DB.prepare(
              'INSERT INTO elections (id, name, date, data) VALUES (?, ?, ?, ?)'
            ).bind(
              row.id ?? null,
              row.name ?? '',
              row.date ?? '',
              JSON.stringify(row.data ?? null)
            ).run()
          }

          return new Response('ok', { headers: corsHeaders })
        }

        if (
          [
            'trends',
            'betting',
            'predictionMarkets',
            'byElections',
            'electionsIntelligence',
            'migration',
            'milestones',
            'pollsData',
            'ingestStatus',
            'demographics',
            'newsItems',
            'councilRegistry',
            'councilStatus',
            'councilEditorial',
            'parliament',
          ].includes(section)
        ) {
          await saveContentSection(section, payload)
          return new Response('ok', { headers: corsHeaders })
        }

        return new Response('Unknown section', { status: 400, headers: corsHeaders })
      }
      if (request.method === 'GET' && url.pathname === '/api/predictions') {
        const refresh = url.searchParams.get('refresh') === '1'
        const existing = await loadPredictionMarkets()
        if (existing && !refresh) {
          return jsonResponse(existing)
        }

        const payload = await runPolymarketPredictionRefresh({ logger: console })
        await saveContentSection('predictionMarkets', payload)
        return jsonResponse(payload)
      }

        if (request.method === 'GET' && url.pathname.startsWith('/api/debug/council/')) {
          const slug = decodeURIComponent(url.pathname.split('/').pop() || '').trim().toLowerCase()

          const rawStatus = await loadContentSection('councilStatus')
          const rawRow = Array.isArray(rawStatus)
            ? rawStatus.find((item) => String(item?.slug || '').toLowerCase() === slug) || null
            : null

          const normalizedStatus = await loadCouncilStatus()
          const normalizedRow = normalizedStatus.find((item) => String(item?.slug || '').toLowerCase() === slug) || null

          const merged = await loadMergedCouncilData()
          const mergedRow = merged.councils.find((item) => String(item?.slug || '').toLowerCase() === slug) || null

          return jsonResponse({
            slug,
            rawRow,
            normalizedRow,
            mergedRow,
          })
        }

        return new Response('Not found', { status: 404, headers: corsHeaders })
      } catch (err) {
        return jsonResponse(
          {
            error: 'Worker failed',
            message: err instanceof Error ? err.message : String(err),
          },
          { status: 500 }
        )
      }
  },
  async scheduled(controller, env, ctx) {
    console.log(`[worker] scheduled trigger fired: ${controller?.cron || 'unknown cron'}`)
    try {
      await runPollIngestForWorker(env, ctx, console)
      console.log('[worker] poll ingest completed')
    } catch (err) {
      console.error('[worker] poll ingest failed:', err)
    }
    try {
      const payload = await runPolymarketPredictionRefresh({ logger: console })
      if (payload) {
        await env.DB.prepare(
          `INSERT INTO content (section, data, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(section) DO UPDATE SET
             data = excluded.data,
             updated_at = excluded.updated_at`
        ).bind('predictionMarkets', JSON.stringify(payload), new Date().toISOString()).run()
      }
      console.log('[worker] prediction markets refresh completed')
    } catch (err) {
      console.error('[worker] prediction markets refresh failed:', err)
    }
  },
}
