// Maintained raw parliamentary by-election source data.
// This file is the hand-edited source of truth until a live scraper/API is added.
// Future automation should either replace these arrays or append new raw rows here
// before they are passed through the shaping pipeline in scripts/utils/shape-byelections.mjs.
// Keep these rows factual and contest-level. Derived fields such as significance scoring,
// source counts, biggest swing flags, and normalized colors are handled by the shaping layer.

export const RAW_BY_ELECTIONS = {
  source: 'Official UK Parliament / House of Commons Library',
  meta: {
    scope: 'Westminster by-elections since the 2024 general election',
    reviewedAt: '2026-04-30',
    sourceType: 'Official UK Parliament / House of Commons Library',
    note: 'Only verified UK parliamentary by-elections are included. Local council by-elections should be tracked separately.',
  },
  // As of this maintained archive update there are no confirmed upcoming Westminster by-elections.
  // Leave this empty rather than seeding speculative vacancies. Future live data can populate it.
  upcoming: [],
  recent: [
    {
      id: 'gorton-and-denton-2026-02-26',
      name: 'Gorton and Denton',
      date: '2026-02-26',
      type: 'Parliamentary',
      previous: 'Labour',
      winner: 'Green',
      gainLoss: 'GAIN',
      majority: 892,
      swing: 27,
      turnout: 38.4,
      region: 'Greater Manchester',
      summary: 'The Greens gained the seat after overturning a substantial Labour majority.',
      significance: 'A notable Green parliamentary breakthrough outside their usual southern base.',
      watchFor: 'Whether Labour can steady its urban left flank against Green advances.',
      tags: ['urban left surge', 'upset'],
    },
    {
      id: 'runcorn-and-helsby-2025-05-01',
      name: 'Runcorn and Helsby',
      date: '2025-05-01',
      type: 'Parliamentary',
      previous: 'Labour',
      winner: 'Reform UK',
      gainLoss: 'GAIN',
      majority: 6,
      majority2024: 14696,
      swing: 21.7,
      turnout: 46.2,
      region: 'North West England',
      summary: 'Reform overturned a large Labour majority by six votes.',
      significance: 'Largest swing in a UK by-election since the Second World War.',
      watchFor: 'A warning sign for Labour in older Red Wall seats under pressure.',
      tags: ['bellwether', 'government pressure'],
    },
  ],
}

export default RAW_BY_ELECTIONS
