// Devolved enrichment data — controlled field-level overrides for the
// maintained Scotland and Wales source records in electionsDevolved.js.
//
// Architecture:
//   Layer 1 — Maintained source
//     DEVOLVED_NATION_SOURCE in electionsDevolved.js
//   Layer 2 — Controlled enrichment
//     Sparse overrides keyed by nation key/title, either here or from D1
//   Layer 3 — Derived payload
//     buildDevolvedIntelligencePayload merges Layer 1 + 2, then derives
//     overview/meta for the frontend contract.
//
// Future live hook:
//   A later backend source can populate a { nations: {...} } enrichment payload
//   and POST it to /api/elections/devolved-enrich before running a refresh.

// Nation enrichments — keyed by DEVOLVED_NATION_SOURCE[].key exactly by
// default, but the shaper also accepts lower-case and slugified variants.
const DEVOLVED_NATION_ENRICHMENTS = {
  // Example:
  // scotland: {
  //   politicalPicture: 'Labour have narrowed the contest, but the SNP remain ahead.',
  //   updatedAt: '2026-04-10',
  // },
}

export const DEFAULT_DEVOLVED_ENRICHMENTS = {
  nations: DEVOLVED_NATION_ENRICHMENTS,
}

export default DEFAULT_DEVOLVED_ENRICHMENTS
