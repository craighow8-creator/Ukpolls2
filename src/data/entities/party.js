/**
 * Party entity getter — src/data/entities/party.js
 *
 * Derives a structured { summary, breakdown, detail } shape from RAW.parties,
 * RAW.trends, RAW.polls, RAW.demographics, RAW.leaders, and PLEDGES.
 *
 * Data source: data.js (read-only). PLEDGES from pledges.js (read-only).
 * No data fabricated. Fields not present in source data are explicitly null.
 */

import RAW from '../data.js'
import { PLEDGES } from '../pledges.js'

/**
 * getParty(name)
 *
 * @param {string} name — matches RAW.parties[n].name exactly
 * @returns {{ summary, breakdown, detail } | null}
 */
export function getParty(name) {
  const party = RAW.parties.find(p => p.name === name)
  if (!party) return null

  // ── Summary ──────────────────────────────────────────────────────────────
  // Minimum needed to render a home card or pill.
  const summary = {
    name:    party.name,
    abbr:    party.abbr,
    key:     party.key,
    pct:     party.pct,
    change:  party.change,
    seats:   party.seats,
    color:   party.color,
  }

  // ── Breakdown ─────────────────────────────────────────────────────────────
  // Structured data for a party screen view.

  // Trend: extract this party's values from the trends array
  const trend = RAW.trends.map(t => ({
    month: t.month,
    pct:   t[name] ?? null,
  }))

  // Latest polls: each poll that includes this party's key
  const key = party.key
  const polls = RAW.polls
    .filter(p => p[key] != null)
    .map(p => ({
      date:      p.date,
      pollster:  p.pollster,
      pct:       p[key],
    }))

  // Demographic performance: for each segment, find this party's share
  // Keys in demographics use abbreviated keys (ref, lab, con, grn, ld, rb, snp)
  const demoKey = key  // matches the key field on party
  const demographics = {}
  const segments = ['age', 'class', 'education', 'region', 'ethnicity']
  segments.forEach(seg => {
    const segData = RAW.demographics[seg]
    if (!segData) return
    demographics[seg] = {
      headline: segData.headline,
      source:   segData.source,
      groups: segData.groups.map(g => ({
        label: g.label,
        pct:   g[demoKey] ?? null,
        note:  g.note || null,
      })).filter(g => g.pct !== null),
    }
  })

  // Leader for this party (if one exists)
  const leader = RAW.leaders.find(l => l.party === name) || null

  const breakdown = {
    trend,
    polls,
    demographics,
    leader: leader ? {
      name:        leader.name,
      role:        leader.role,
      net:         leader.net,
      approve:     leader.approve,
      disapprove:  leader.disapprove,
    } : null,
  }

  // ── Detail ────────────────────────────────────────────────────────────────
  // Full available data — pledges from manifestos, full leader bio and policies.
  const pledges = PLEDGES[name] || null

  const leaderDetail = leader ? {
    name:        leader.name,
    role:        leader.role,
    x:           leader.x || null,
    bio:         leader.bio || null,
    net:         leader.net,
    approve:     leader.approve,
    disapprove:  leader.disapprove,
    policies: {
      immigration: leader.immigration || null,
      economy:     leader.economy     || null,
      nhs:         leader.nhs         || null,
      climate:     leader.climate     || null,
    },
  } : null

  const detail = {
    pledges,      // { immigration: [], economy: [], nhs: [], climate: [], housing: [], ... } | null
    leaderDetail, // full leader profile | null
    // Fields not present in source data are explicitly absent:
    // donors, membershipCount, foundedYear — not in data.js
  }

  return { summary, breakdown, detail }
}
