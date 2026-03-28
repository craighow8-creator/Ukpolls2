/**
 * By-election entity getter — src/data/entities/byelection.js
 *
 * Derives a structured { summary, breakdown, detail } shape from
 * RAW.byElections.upcoming and RAW.byElections.recent.
 *
 * Data source: data.js (read-only).
 * No data fabricated. Fields not present in source data are explicitly null.
 */

import RAW from '../data.js'

/**
 * getByElection(id)
 *
 * @param {string} id — matches byElections.upcoming[n].id or recent[n].id
 * @returns {{ summary, breakdown, detail } | null}
 */
export function getByElection(id) {
  const all = [
    ...(RAW.byElections.upcoming || []),
    ...(RAW.byElections.recent   || []),
  ]
  const be = all.find(b => b.id === id)
  if (!be) return null

  const isResult   = !!be.result  // has actual result data
  const isUpcoming = be.status === 'upcoming'

  // ── Summary ──────────────────────────────────────────────────────────────
  const summary = {
    id:         be.id,
    name:       be.name,
    dateLabel:  be.dateLabel,
    status:     be.status         || (isResult ? 'result' : 'upcoming'),
    defending:  be.defending,
    defColor:   be.defColor,
    region:     be.region         || null,
    verdict:    be.verdict        || null,
    verdictColor: be.verdictColor || null,
    // Result fields — null for upcoming
    winner:     be.winner         || null,
    winnerColor: be.winnerColor   || null,
    gainLoss:   be.gainLoss       || null,
  }

  // ── Breakdown ─────────────────────────────────────────────────────────────
  const breakdown = {
    // 2024 general election result in this seat
    result2024:  be.result2024   || null,
    // By-election result (if held)
    result:      be.result       || null,
    majority:    be.majority     ?? null,
    turnout:     be.turnout      ?? null,
    swing:       be.swing        || null,
    majority2024: be.majority2024 ?? null,
    leaveVote:   be.leaveVote    ?? null,
    // Betting odds if available
    odds:        be.odds         || null,
    oddsDate:    be.oddsDate     || null,
  }

  // ── Detail ────────────────────────────────────────────────────────────────
  const detail = {
    trigger:      be.trigger      || null,
    context:      be.context      || null,
    watchFor:     be.watchFor     || null,
    significance: be.significance || null,
    swingNeeded:  be.swingNeeded  ?? null,
    swingParty:   be.swingParty   || null,
    swingFrom:    be.swingFrom    || null,
    tags:         be.tags         || null,
    tagColors:    be.tagColors    || null,
  }

  return { summary, breakdown, detail }
}
