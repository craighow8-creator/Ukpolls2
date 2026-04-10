// Mayor enrichment data — field-level overrides for maintained mayor records.
//
// ─── Three-layer architecture ─────────────────────────────────────────────────
//
//   Layer 1 — Maintained source (electionsMayors.js)
//     REGIONAL_MAYOR_SOURCE / COUNCIL_MAYOR_SOURCE
//     Full structured records. Edit here for stable, long-lived facts.
//     Fields: name, holder, party, color, status, category, electedDate,
//             officeStartDate, website, contactUrl, email, contactNote,
//             politicalWeight, importance, nationalProfile, mixedRegion,
//             newMayoralty, breakthroughType, note, mattersNow, context
//
//   Layer 2 — Enrichment overrides (this file / D1-stored)
//     Sparse field overrides keyed by mayor name / area.
//     Only include fields that have changed from the maintained source.
//     Maintained source values are the fallback for any un-enriched field.
//     Manual enrichments intentionally sit above the external-source adapter
//     layer, so a human correction can override a structured external feed.
//     Enrichable fields: any field from Layer 1, plus a per-record updatedAt
//     for provenance (stripped from the shaped output, used only for tracking).
//
//   Layer 3 — Derived intelligence (buildMayorsIntelligencePayload)
//     Party counts, landscape summary, political signals.
//     Computed from the merged Layer 1 + Layer 2 output. Never edit directly.
//
// ─── Live-enrichment plug-in point ───────────────────────────────────────────
//
//   This file is the default enrichment source (used at build time / fallback).
//   To feed live enrichments without a full source edit:
//     1. Prepare a { regional: {...}, council: {...} } payload.
//     2. POST it to /api/elections/mayors-enrich — stored in D1.
//     3. Run npm run elections:intelligence:refresh:local (or :remote).
//     The worker's refresh path loads D1-stored enrichments first and falls
//     back to DEFAULT_MAYOR_ENRICHMENTS here only when nothing is stored.
//
//   When a broader live-source hook is ready (e.g. a structured feed of
//   election results), populate the enrichment payload from that feed and
//   POST it before calling the refresh — without changing the UI contract.

// Regional enrichments — keyed by REGIONAL_MAYOR_SOURCE[].name exactly.
// Add an entry only for fields that differ from the maintained source record.
const REGIONAL_ENRICHMENTS = {
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
}

// Council enrichments — keyed by COUNCIL_MAYOR_SOURCE[].area exactly.
const COUNCIL_ENRICHMENTS = {
  // ── Example structure ──────────────────────────────────────────────────────
  // 'Bedford': {
  //   holder: 'Updated Holder Name',
  //   party: 'Labour',
  //   color: '#E4003B',
  //   updatedAt: '2026-04-10',
  // },
}

export const DEFAULT_MAYOR_ENRICHMENTS = {
  regional: REGIONAL_ENRICHMENTS,
  council: COUNCIL_ENRICHMENTS,
}
