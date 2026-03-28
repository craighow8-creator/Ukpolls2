/**
 * Demographic entity getter — src/data/entities/demographic.js
 *
 * Derives a structured { summary, breakdown, detail } shape from
 * RAW.demographics segments: age, class, education, region, ethnicity, nonVoters.
 *
 * Data source: data.js (read-only).
 * No data fabricated. Fields not present in source data are explicitly null.
 */

import RAW from '../data.js'

// Party key → display name mapping (matches data.js abbreviated keys)
const KEY_NAMES = {
  ref: 'Reform UK',
  lab: 'Labour',
  con: 'Conservative',
  grn: 'Green',
  ld:  'Lib Dem',
  rb:  'Restore Britain',
  snp: 'SNP',
}

// Party key → color mapping (matches data.js)
const KEY_COLORS = {
  ref: '#12B7D4',
  lab: '#E4003B',
  con: '#0087DC',
  grn: '#02A95B',
  ld:  '#FAA61A',
  rb:  '#1a4a9e',
  snp: '#C4922A',
}

// Party keys present in the demographics data
const PARTY_KEYS = ['ref', 'grn', 'lab', 'con', 'ld']

/**
 * Derive the leading party within a group row.
 * Returns { key, name, color, pct } for the highest-polling party.
 */
function leadingParty(group) {
  let best = null
  PARTY_KEYS.forEach(k => {
    if (group[k] != null && (!best || group[k] > best.pct)) {
      best = { key: k, name: KEY_NAMES[k], color: KEY_COLORS[k], pct: group[k] }
    }
  })
  return best
}

/**
 * getDemographic(segmentKey)
 *
 * @param {string} segmentKey — one of: 'age' | 'class' | 'education' | 'region' | 'ethnicity' | 'nonVoters'
 * @returns {{ summary, breakdown, detail } | null}
 */
export function getDemographic(segmentKey) {
  const seg = RAW.demographics[segmentKey]
  if (!seg) return null

  // nonVoters has a different shape — handle separately
  if (segmentKey === 'nonVoters') {
    const groups = seg.groups || []
    const top = groups.reduce((a, b) => (a.pct > b.pct ? a : b), groups[0] || {})

    const summary = {
      key:      'nonVoters',
      headline: seg.headline,
      source:   seg.source || null,
      topLabel: top.label  || null,
      topPct:   top.pct    || null,
      topColor: top.color  || null,
    }

    const breakdown = {
      groups: groups.map(g => ({
        label: g.label,
        pct:   g.pct,
        color: g.color,
      })),
    }

    const detail = {
      insight: seg.insight || null,
      // Trend over time — not in data.js
      trend:   null,
    }

    return { summary, breakdown, detail }
  }

  // Standard segments: age, class, education, region, ethnicity
  const groups = seg.groups || []

  // Find which party leads most groups in this segment
  const leaderCounts = {}
  groups.forEach(g => {
    const lp = leadingParty(g)
    if (lp) leaderCounts[lp.key] = (leaderCounts[lp.key] || 0) + 1
  })
  const dominantKey = Object.entries(leaderCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const summary = {
    key:          segmentKey,
    headline:     seg.headline,
    source:       seg.source     || null,
    insight:      seg.insight    || null,
    dominantParty: dominantKey ? {
      key:   dominantKey,
      name:  KEY_NAMES[dominantKey],
      color: KEY_COLORS[dominantKey],
    } : null,
    groupCount:   groups.length,
  }

  const breakdown = {
    groups: groups.map(g => {
      const allParties = PARTY_KEYS
        .filter(k => g[k] != null)
        .map(k => ({ key: k, name: KEY_NAMES[k], color: KEY_COLORS[k], pct: g[k] }))
        .sort((a, b) => b.pct - a.pct)

      return {
        label:      g.label,
        note:       g.note       || null,
        leading:    leadingParty(g),
        allParties,
      }
    }),
  }

  const detail = {
    // Trend data over time per segment — not in data.js
    trend: null,
    // Regional breakdown of each sub-group — not in data.js
    regionalBreakdown: null,
  }

  return { summary, breakdown, detail }
}
