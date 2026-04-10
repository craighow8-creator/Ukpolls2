// Maintained static devolved-election reference data for the Elections area.
// This is currently curated in-app data; future live or backend-fed sources can replace it.
import {
  cleanText,
  createDevolvedNationProfile,
  deriveDevolvedOverview,
  slugifyCouncilName,
} from '../utils/electionsHelpers'
import { DEFAULT_DEVOLVED_ENRICHMENTS } from './electionsDevolvedEnrichment'

// Hand-maintained devolved election intelligence input.
// Future backend-fed data can replace or enrich these nation profiles without changing the screen layer.
const DEVOLVED_NATION_SOURCE = [
  {
    key: 'scotland',
    title: 'Scotland',
    institution: 'Scottish Parliament',
    regionLabel: 'Holyrood',
    system: 'Additional Member System',
    nextElection: '2026-05-07',
    accent: '#C4922A',
    keyStrategicQuestion: 'In Scotland, the question is whether Labour can seriously threaten the SNP.',
    whyItMattersNow: 'Scotland matters because the next Holyrood election is no longer just about SNP dominance, but whether Labour can make the contest genuinely competitive.',
    politicalPicture:
      'The SNP remain the largest force, but Labour are back in contention and the shape of the pro-union vote matters more again.',
    watch:
      'Whether Labour can narrow the gap enough to make the next government question look open.',
    signal:
      'Scottish politics now looks more competitive than it did at the last Holyrood election.',
    partyLandscape: [
      { party: 'SNP', pct: 34, color: '#C4922A', trend: 'Softening' },
      { party: 'Labour', pct: 28, color: '#E4003B', trend: 'Recovering' },
      { party: 'Conservative', pct: 16, color: '#0087DC', trend: 'Under pressure' },
      { party: 'Green', pct: 9, color: '#02A95B', trend: 'Relevant to balance' },
      { party: 'Lib Dem', pct: 7, color: '#FAA61A', trend: 'Holding pockets' },
      { party: 'Reform', pct: 5, color: '#12B7D4', trend: 'Testing appeal' },
    ],
  },
  {
    key: 'wales',
    title: 'Wales',
    institution: 'Senedd Cymru',
    regionLabel: 'The Senedd',
    system: 'More proportional list system',
    nextElection: '2026-05-07',
    accent: '#3F8428',
    keyStrategicQuestion: 'In Wales, Labour still leads but faces pressure from Plaid Cymru and a rising Reform vote.',
    whyItMattersNow: 'Wales matters because a more proportional contest could make the route to control less straightforward than finishing first.',
    politicalPicture:
      'Labour still sits at the centre of Welsh politics, but Plaid Cymru and Reform both matter more in a more proportional contest.',
    watch:
      'Whether Reform can turn momentum into seats, or whether Labour and Plaid still shape the core contest.',
    signal:
      'The first election under Wales’s new system could produce a less familiar seat map.',
    partyLandscape: [
      { party: 'Labour', pct: 33, color: '#E4003B', trend: 'Still strongest' },
      { party: 'Reform', pct: 22, color: '#12B7D4', trend: 'Rising fast' },
      { party: 'Conservative', pct: 16, color: '#0087DC', trend: 'Squeezed' },
      { party: 'Plaid Cymru', pct: 15, color: '#3F8428', trend: 'Holding base' },
      { party: 'Green', pct: 7, color: '#02A95B', trend: 'Gradual growth' },
      { party: 'Lib Dem', pct: 5, color: '#FAA61A', trend: 'Secondary force' },
    ],
  },
]

function applyEnrichment(sourceRow, enrichmentRecord) {
  if (!enrichmentRecord || Object.keys(enrichmentRecord).length === 0) return sourceRow
  const { updatedAt: _enrichedAt, ...overrides } = enrichmentRecord
  return { ...sourceRow, ...overrides }
}

function hasMeaningfulEnrichment(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false
  return Object.keys(record).some((key) => key !== 'updatedAt')
}

function enrichmentCandidateKeys(row = {}) {
  const values = [row.key, row.title]
    .map((value) => cleanText(value))
    .filter(Boolean)

  const variants = values.flatMap((value) => [value, value.toLowerCase(), slugifyCouncilName(value)])
  return [...new Set(variants.filter(Boolean))]
}

function resolveEnrichmentRecord(row = {}, enrichmentMap = {}) {
  for (const candidate of enrichmentCandidateKeys(row)) {
    if (
      Object.prototype.hasOwnProperty.call(enrichmentMap, candidate) &&
      enrichmentMap[candidate] &&
      typeof enrichmentMap[candidate] === 'object' &&
      !Array.isArray(enrichmentMap[candidate])
    ) {
      return {
        matchedKey: candidate,
        record: enrichmentMap[candidate],
      }
    }
  }

  return { matchedKey: null, record: null }
}

// ─── Source-to-intelligence shaping ──────────────────────────────────────────
// buildDevolvedIntelligencePayload is the single function responsible for
// turning maintained source records into the full devolved intelligence payload.
//
// It works across three layers:
//   Layer 1  Maintained source records (DEVOLVED_NATION_SOURCE)
//   Layer 2  Controlled enrichment overrides (options.enrichments, or
//            DEFAULT_DEVOLVED_ENRICHMENTS as fallback)
//   Layer 3  Derived overview/meta computed from the merged records
//
// Future live hook:
//   A later poll/scrape/API layer can populate the enrichments payload with
//   fresher politicalPicture/watch/nextElection values before calling this
//   shaper, without changing the frontend contract.
//
// The frontend contract this must satisfy:
//   devolved.overview  – summary + combined strategic question
//   devolved.nations   – array of shaped nation profiles
//   devolved.meta      – updatedAt, sourceType, enrichedCount, coverageNote
export function buildDevolvedIntelligencePayload(options = {}) {
  const updatedAt = options.updatedAt || new Date().toISOString()
  const sourceCount = Number(options.sourceCount || 1)
  const enrichments = options.enrichments !== undefined
    ? options.enrichments
    : DEFAULT_DEVOLVED_ENRICHMENTS
  const nationEnrich = (enrichments && enrichments.nations) || {}

  const nationMatches = DEVOLVED_NATION_SOURCE.map((row) => ({
    sourceKey: cleanText(row.key) || cleanText(row.title),
    ...resolveEnrichmentRecord(row, nationEnrich),
  }))
  const enrichedCount = nationMatches.filter((match) => hasMeaningfulEnrichment(match.record)).length

  // Derive fresh from the merged source array each call so changes to the
  // maintained source or controlled enrichments are always reflected.
  const nations = DEVOLVED_NATION_SOURCE
    .map((row) => applyEnrichment(row, resolveEnrichmentRecord(row, nationEnrich).record))
    .map(createDevolvedNationProfile)

  // Derived overview: summary paragraph + combined strategic question across nations.
  const landscape = deriveDevolvedOverview(nations)
  const keyStrategicQuestion = nations
    .map((n) => n.keyStrategicQuestion)
    .filter(Boolean)
    .join(' ')

  return {
    // Derived overview summary: why devolved elections matter now.
    overview: {
      ...landscape,
      keyStrategicQuestion,
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
      sourceType:
        enrichedCount > 0
          ? 'maintained-with-enrichment'
          : 'backend-shaped-from-maintained-source',
      coverageNote:
        enrichedCount > 0
          ? `Scotland and Wales intelligence is shaped from maintained source with ${enrichedCount} enriched nation override(s).`
          : 'Scotland and Wales intelligence is currently shaped from maintained devolved-election source profiles.',
    },
  }
}

// ─── Stable UI exports ────────────────────────────────────────────────────────
// Module-load-time derivations used by direct UI imports.
// The Elections screen reads these when it is not using the intelligence API.
export const DEVOLVED_NATIONS = DEVOLVED_NATION_SOURCE.map(createDevolvedNationProfile)

// Derived top-level overview used by the Elections UI.
// This can later be generated from backend-fed nation intelligence without changing the render path.
export const DEVOLVED_OVERVIEW = deriveDevolvedOverview(DEVOLVED_NATIONS)

export default {
  DEVOLVED_OVERVIEW,
  DEVOLVED_NATIONS,
}
