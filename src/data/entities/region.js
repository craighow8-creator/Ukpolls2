/**
 * Region entity getter — src/data/entities/region.js
 *
 * Derives a structured { summary, breakdown, detail } shape from
 * RAW.elections.regions and their associated councilsList entries.
 *
 * Data source: data.js (read-only).
 * No data fabricated. Fields not present in source data are explicitly null.
 */

import RAW from '../data.js'

/**
 * getRegion(id)
 *
 * @param {string} id — matches elections.regions[n].id
 * @returns {{ summary, breakdown, detail } | null}
 */
export function getRegion(id) {
  const region = (RAW.elections.regions || []).find(r => r.id === id)
  if (!region) return null

  // ── Summary ──────────────────────────────────────────────────────────────
  const summary = {
    id:          region.id,
    name:        region.name,
    emoji:       region.emoji,
    accentColor: region.accentColor,
    councils:    region.councils    ?? null,
    seats:       region.seats       ?? null,
    type:        region.type        || null,
    difficulty:  region.difficulty  || null,
  }

  // ── Breakdown ─────────────────────────────────────────────────────────────

  // Enrich each council entry from localCouncils where possible
  const localCouncils = RAW.elections.localCouncils || []
  const councils = (region.councilsList || []).map(c => {
    const full = localCouncils.find(
      lc => lc.name.toLowerCase() === c.name.toLowerCase()
    )
    return {
      name:       c.name,
      control:    c.control    || full?.control    || null,
      difficulty: c.difficulty || full?.difficulty || null,
      note:       c.note       || null,
      // From localCouncils if matched:
      seats:      full?.seats      ?? null,
      majority:   full?.majority   ?? null,
      verdict:    full?.verdict    || null,
      watchFor:   full?.watchFor   || null,
    }
  })

  const breakdown = {
    story:    region.story    || null,
    watchFor: region.watchFor || null,
    parties:  region.parties  || null,  // array of party abbrs expected to be competitive
    councils,
  }

  // ── Detail ────────────────────────────────────────────────────────────────
  const detail = {
    // Not in data.js for regions:
    historicalResults:  null,
    projectedSeats:     null,
    swingRequired:      null,
  }

  return { summary, breakdown, detail }
}
