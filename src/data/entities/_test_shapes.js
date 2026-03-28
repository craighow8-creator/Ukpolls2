/**
 * Entity layer smoke test — run with Node (ESM not available in raw Node,
 * so this is structured for manual inspection / CI with a bundler).
 *
 * This file documents expected shapes and validates against data.js.
 * It is NOT imported by the app — it exists only for developer verification.
 *
 * Usage: import in a test runner or run via Vite's test setup.
 */

// ── Expected shapes ──────────────────────────────────────────────────────────

export const EXPECTED_SHAPES = {

  party: {
    summary: {
      required: ['name', 'abbr', 'key', 'pct', 'change', 'seats', 'color'],
      nullable: [],
    },
    breakdown: {
      required: ['trend', 'polls', 'demographics', 'leader'],
      nullable: ['leader'],
    },
    detail: {
      required: ['pledges', 'leaderDetail'],
      nullable: ['pledges', 'leaderDetail'],
    },
  },

  leader: {
    summary: {
      required: ['name', 'party', 'role', 'color', 'net', 'approve', 'disapprove'],
      nullable: [],
    },
    breakdown: {
      required: ['allApprovals', 'partyTrend', 'partyPolling'],
      nullable: ['partyPolling'],
    },
    detail: {
      required: ['x', 'bio', 'policies'],
      nullable: ['x', 'bio'],
    },
  },

  council: {
    summary: {
      required: ['name', 'control', 'difficulty', 'note', 'region', 'type'],
      nullable: ['control', 'difficulty', 'note', 'region', 'type'],
    },
    breakdown: {
      required: ['seats', 'majority', 'lastFought', 'verdict', 'watchFor', 'parentRegion'],
      nullable: ['seats', 'majority', 'lastFought', 'verdict', 'watchFor', 'parentRegion'],
    },
    detail: {
      required: ['leader', 'seatsBreakdown', 'website', 'budgetUrl'],
      nullable: ['leader', 'seatsBreakdown', 'website', 'budgetUrl'],
    },
  },

  demographic: {
    summary: {
      required: ['key', 'headline', 'source'],
      nullable: ['source'],
    },
    breakdown: {
      required: ['groups'],
      nullable: [],
    },
    detail: {
      required: ['trend', 'regionalBreakdown'],
      nullable: ['trend', 'regionalBreakdown'],
    },
  },

  byelection: {
    summary: {
      required: ['id', 'name', 'dateLabel', 'status', 'defending', 'defColor'],
      nullable: ['winner', 'winnerColor', 'gainLoss', 'verdict', 'verdictColor', 'region'],
    },
    breakdown: {
      required: ['result2024', 'result', 'majority', 'turnout', 'swing'],
      nullable: ['result2024', 'result', 'majority', 'turnout', 'swing', 'odds', 'oddsDate'],
    },
    detail: {
      required: ['trigger', 'context', 'watchFor', 'significance'],
      nullable: ['trigger', 'context', 'watchFor', 'significance', 'swingNeeded', 'tags'],
    },
  },

  region: {
    summary: {
      required: ['id', 'name', 'emoji', 'accentColor', 'difficulty'],
      nullable: ['councils', 'seats', 'type'],
    },
    breakdown: {
      required: ['story', 'watchFor', 'parties', 'councils'],
      nullable: ['story', 'watchFor', 'parties'],
    },
    detail: {
      required: ['historicalResults', 'projectedSeats', 'swingRequired'],
      nullable: ['historicalResults', 'projectedSeats', 'swingRequired'],
    },
  },
}

// ── Known valid entity IDs (from data.js) ────────────────────────────────────
export const KNOWN_ENTITIES = {
  parties:      ['Reform UK', 'Labour', 'Conservative', 'Green', 'Lib Dem', 'SNP', 'Plaid Cymru', 'Restore Britain'],
  leaders:      ['Zack Polanski', 'Ed Davey', 'Kemi Badenoch', 'Keir Starmer', 'Nigel Farage', 'John Swinney', 'Rhun ap Iorwerth'],
  councils:     ['Essex', 'Lancashire', 'Nottinghamshire', 'Warwickshire', 'Kent', 'Hampshire', 'Sheffield', 'Birmingham'],
  demographics: ['age', 'class', 'education', 'region', 'ethnicity', 'nonVoters'],
  byelections:  ['horsham', 'runcorn', 'gorton', 'kingswood', 'henley'],
  regions:      ['london', 'metro', 'southeast', 'east', 'midlands', 'northwest', 'southwest', 'northeast'],
}

// ── Verify nulls are honest ───────────────────────────────────────────────────
// Council detail should be all null — data doesn't exist in data.js
export const KNOWN_NULL_FIELDS = {
  'council.detail.leader':          true,
  'council.detail.seatsBreakdown':  true,
  'council.detail.website':         true,
  'council.detail.budgetUrl':       true,
  'demographic.detail.trend':       true,
  'leader.detail.bio':              false, // bio DOES exist for some leaders
}
