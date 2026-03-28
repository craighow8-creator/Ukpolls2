/**
 * Leader entity getter — src/data/entities/leader.js
 *
 * Derives a structured { summary, breakdown, detail } shape from RAW.leaders
 * and RAW.trends (for their party's polling trend).
 *
 * Data source: data.js (read-only).
 * No data fabricated. Fields not present in source data are explicitly null.
 */

import RAW from '../data.js'

/**
 * getLeader(name)
 *
 * @param {string} name — matches RAW.leaders[n].name exactly
 * @returns {{ summary, breakdown, detail } | null}
 */
export function getLeader(name) {
  const leader = RAW.leaders.find(l => l.name === name)
  if (!leader) return null

  // ── Summary ──────────────────────────────────────────────────────────────
  const summary = {
    name:       leader.name,
    party:      leader.party,
    role:       leader.role,
    color:      leader.color,
    net:        leader.net,
    approve:    leader.approve,
    disapprove: leader.disapprove,
  }

  // ── Breakdown ─────────────────────────────────────────────────────────────

  // All leaders sorted by net approval — for comparison context
  const allApprovals = RAW.leaders
    .map(l => ({ name: l.name, party: l.party, color: l.color, net: l.net }))
    .sort((a, b) => b.net - a.net)

  // Party polling trend (from trends array, using the leader's party name)
  const partyTrend = RAW.trends.map(t => ({
    month: t.month,
    pct:   t[leader.party] ?? null,
  }))

  // Current party polling figure
  const partyPolling = RAW.parties.find(p => p.name === leader.party) || null

  const breakdown = {
    allApprovals,   // [{name, party, color, net}] — all leaders ranked
    partyTrend,     // [{month, pct}] — their party's 12-month polling
    partyPolling: partyPolling ? {
      pct:    partyPolling.pct,
      change: partyPolling.change,
      seats:  partyPolling.seats,
    } : null,
  }

  // ── Detail ────────────────────────────────────────────────────────────────
  const detail = {
    x:    leader.x    || null,
    bio:  leader.bio  || null,
    policies: {
      immigration: leader.immigration || null,
      economy:     leader.economy     || null,
      nhs:         leader.nhs         || null,
      climate:     leader.climate     || null,
    },
    // Not in source data:
    // quotes, recentStatements, mediaAppearances — null
  }

  return { summary, breakdown, detail }
}
