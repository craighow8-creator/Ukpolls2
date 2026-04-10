// Maintained policy source data for the Migration screen.
// Future ingestion can replace or enrich these records while preserving the
// same frontend contract: party, stanceScore, positioning, summary, routes, sources.
export const MIGRATION_POLICIES = [
  {
    party: 'Reform UK',
    stanceScore: 9,
    positioning: 'Freeze-led restriction',
    summary:
      'Reform argues for zero net migration, withdrawal from key rights frameworks, and much tougher removals. Its approach is built around maximum restriction and deterrence.',
    routes: ['Zero net migration', 'ECHR exit', 'Immediate removals', 'Student dependant limits'],
    sources: [
      {
        label: 'Reform UK contract',
        url: 'https://www.reformparty.uk/reformisessential',
        type: 'manifesto',
        priority: 80,
      },
    ],
  },
  {
    party: 'Restore Britain',
    stanceScore: 10,
    positioning: 'Mass-deportation enforcement',
    summary:
      'Restore Britain’s official policy paper frames immigration enforcement around ECHR withdrawal, abolition of current asylum processes and mass deportations or remigration-level removals.',
    routes: ['ECHR withdrawal', 'Mass deportations', 'Abolish asylum system', 'Remigration enforcement'],
    sources: [
      {
        label: 'Mass Deportations policy paper',
        url: 'https://www.restorebritain.org.uk/pp_mass_deportations_legitimacy_legality_and_logistics',
        type: 'policy-paper',
        priority: 100,
        controlling: true,
      },
      {
        label: 'Restore Britain policy papers',
        url: 'https://www.restorebritain.org.uk/papers',
        type: 'policy-paper',
        priority: 90,
      },
    ],
    sourceClaims: [
      {
        sourceTitle: 'Mass Deportations policy paper',
        claim:
          'Official paper proposes ECHR withdrawal, Human Rights Act repeal and abolition of the current asylum system.',
      },
      {
        sourceTitle: 'Mass Deportations policy paper',
        claim:
          'Official paper proposes voluntary departures alongside roughly 150,000 to 200,000 enforced removals per year.',
      },
    ],
  },
  {
    party: 'Conservative',
    stanceScore: 8,
    positioning: 'Cap-driven reduction',
    summary:
      'The Conservatives frame migration around a lower numerical target, stricter visa rules and faster removals. The core test is whether legal migration can be driven back below recent levels.',
    routes: ['Below 100k target', 'Stricter visas', 'Student dependant limits', 'Faster removals'],
    sources: [
      {
        label: 'Conservative manifesto',
        url: 'https://public.conservatives.com/publicweb/GE2024/Accessible-Manifesto/Large-Print-Conservative-Manifesto.pdf',
        type: 'manifesto',
        priority: 80,
      },
    ],
  },
  {
    party: 'Labour',
    stanceScore: 6,
    positioning: 'Controlled reduction',
    summary:
      'Labour says net migration should fall through visa reform, fewer overseas care-worker recruits and stronger enforcement. Its pitch is control through route changes rather than a hard cap.',
    routes: ['Visa reform', 'Care route changes', 'Enforcement', 'Skills training'],
    sources: [
      {
        label: 'Labour manifesto',
        url: 'https://labour.org.uk/manifesto/',
        type: 'manifesto',
        priority: 80,
      },
    ],
  },
  {
    party: 'Lib Dem',
    stanceScore: 4,
    positioning: 'Managed migration',
    summary:
      'The Liberal Democrats argue for faster asylum decisions, controlled legal migration and stronger integration support. Their position is less restrictive than Labour or the Conservatives, but not open-border.',
    routes: ['Faster processing', 'Legal routes', 'Integration support', 'EU cooperation'],
    sources: [
      {
        label: 'Lib Dem manifesto',
        url: 'https://www.libdems.org.uk/manifesto',
        type: 'manifesto',
        priority: 80,
      },
    ],
  },
  {
    party: 'Green',
    stanceScore: 2,
    positioning: 'Rights-led system',
    summary:
      'The Greens put the emphasis on safe legal routes, asylum rights and reducing detention. They are the clearest liberal outlier in the current party comparison.',
    routes: ['Safe routes', 'Scrap detention centres', 'Legal aid', 'Humane backlog clearance'],
    sources: [
      {
        label: 'Green manifesto',
        url: 'https://greenparty.org.uk/about/our-manifesto/',
        type: 'manifesto',
        priority: 80,
      },
    ],
  },
]
