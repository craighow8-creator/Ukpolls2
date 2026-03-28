/**
 * Council entity getter — src/data/entities/council.js
 *
 * Derives a structured { summary, breakdown, detail } shape from
 * RAW.elections.localCouncils and RAW.elections.regions[].councilsList.
 *
 * Data source: data.js (read-only).
 *
 * There are two council data sources in data.js:
 *   1. elections.localCouncils — flat array with seats, majority, verdict, etc.
 *   2. elections.regions[].councilsList — minimal {name, control, difficulty, note}
 *
 * getCouncil() merges both. If a council appears only in councilsList (not in
 * localCouncils), the breakdown/detail fields reflect what is actually present.
 * No data is fabricated for fields that do not exist in the source.
 */

import RAW from '../data.js'

/**
 * getCouncil(name)
 *
 * @param {string} name — council name, matched case-insensitively
 * @returns {{ summary, breakdown, detail } | null}
 */
export function getCouncil(name) {
  const nameLower = name.toLowerCase()

  // Primary source: localCouncils (richer data)
  const council = (RAW.elections.localCouncils || []).find(
    c => c.name.toLowerCase() === nameLower
  )

  // Secondary source: councilsList entries across all regions
  let regionEntry = null
  let parentRegion = null
  for (const region of (RAW.elections.regions || [])) {
    const match = (region.councilsList || []).find(
      c => c.name.toLowerCase() === nameLower
    )
    if (match) {
      regionEntry = match
      parentRegion = {
        id:    region.id,
        name:  region.name,
        emoji: region.emoji,
      }
      break
    }
  }

  // Must exist in at least one source
  if (!council && !regionEntry) return null

  // ── Summary ──────────────────────────────────────────────────────────────
  // Derived from whichever source has the most data.
  const summary = {
    name:       name,
    control:    council?.control     ?? regionEntry?.control    ?? null,
    difficulty: council?.difficulty  ?? regionEntry?.difficulty ?? null,
    note:       regionEntry?.note    ?? null,
    region:     council?.region      ?? parentRegion?.name      ?? null,
    type:       council?.type        ?? null,
  }

  // ── Breakdown ─────────────────────────────────────────────────────────────
  // Only fields that actually exist in localCouncils.
  const breakdown = council ? {
    seats:       council.seats,
    majority:    council.majority,
    lastFought:  council.lastFought,
    verdict:     council.verdict,
    watchFor:    council.watchFor,
    parentRegion,
  } : {
    // regionEntry only — less data available
    seats:       null,
    majority:    null,
    lastFought:  null,
    verdict:     null,
    watchFor:    null,
    parentRegion,
  }

  // ── Detail ────────────────────────────────────────────────────────────────
  // Fields not present in data.js — explicitly null, not fabricated.
  const detail = {
    leader:        null,  // not in data.js
    seatsBreakdown: null, // not in data.js — no per-party seat counts
    website:       null,  // not in data.js
    budgetUrl:     null,  // not in data.js
  }

  return { summary, breakdown, detail }
}
