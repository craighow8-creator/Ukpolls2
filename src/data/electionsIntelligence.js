import { buildMayorsIntelligencePayload } from './electionsMayors'
import { buildDevolvedIntelligencePayload } from './electionsDevolved'

// This module defines the Elections intelligence payload contract used by the
// Worker and the Elections UI. It currently shapes maintained/static source
// data, but future backend ingestion can replace or enrich these exports
// without changing the frontend render path.
//
// Each Elections section has its own shaping function, re-exported here so
// the worker has a single import point for all refresh paths:
//
//   Unified (preferred for normal use):
//     POST /api/elections/intelligence-refresh  — rebuilds all sections in one pass,
//     loading any stored Mayors enrichments from D1 before shaping.
//
//   Section-specific (use when only one section changed, or for future live hooks):
//     Mayors   → buildMayorsIntelligencePayload  / POST /api/elections/mayors-refresh
//     Devolved → buildDevolvedIntelligencePayload / POST /api/elections/devolved-refresh
//
//   Enrichment input (currently supported):
//     POST /api/elections/mayors-enrich   — stores mayor field-level overrides in D1
//     POST /api/elections/mayors-external-source — stores external-style mayor source input in D1
//     POST /api/elections/devolved-enrich — stores devolved nation overrides in D1
//     Run an intelligence-refresh afterwards to apply them.

// Re-export so worker.js can import all section builders from one module.
export { buildMayorsIntelligencePayload, buildDevolvedIntelligencePayload }

export function buildElectionsIntelligencePayload(options = {}) {
  const updatedAt = options.updatedAt || new Date().toISOString()
  const mayorsSourceCount = Number(options.mayorsSourceCount || 1)
  const devolvedSourceCount = Number(options.devolvedSourceCount || 1)
  const mayorsEnrichments = options.mayorsEnrichments
  const mayorsExternalSource = options.mayorsExternalSource
  const devolvedEnrichments = options.devolvedEnrichments

  return {
    // Mayors section fully derived by buildMayorsIntelligencePayload.
    // Refresh independently via POST /api/elections/mayors-refresh.
    mayors: buildMayorsIntelligencePayload({
      updatedAt,
      sourceCount: mayorsSourceCount,
      ...(mayorsExternalSource !== undefined ? { externalSource: mayorsExternalSource } : {}),
      ...(mayorsEnrichments !== undefined ? { enrichments: mayorsEnrichments } : {}),
    }),
    // Devolved section fully derived by buildDevolvedIntelligencePayload.
    // Refresh independently via POST /api/elections/devolved-refresh.
    devolved: buildDevolvedIntelligencePayload({
      updatedAt,
      sourceCount: devolvedSourceCount,
      ...(devolvedEnrichments !== undefined ? { enrichments: devolvedEnrichments } : {}),
    }),
  }
}

export const FALLBACK_ELECTIONS_INTELLIGENCE = buildElectionsIntelligencePayload()

export default FALLBACK_ELECTIONS_INTELLIGENCE
