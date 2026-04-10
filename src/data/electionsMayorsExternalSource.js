// External-style mayor source input for the Elections backend intelligence path.
//
// This is not full scraping. It is an adapter-ready, updateable source layer
// that can later be replaced by a live fetch or structured import without
// changing the Mayors frontend contract.
//
// Flow:
//   Layer 1  Maintained source in electionsMayors.js
//   Layer 2b External-source input from this file or D1-stored payload
//   Layer 2  Manual controlled enrichment from electionsMayorsEnrichment.js / D1
//   Layer 3  Derived Mayors payload from buildMayorsIntelligencePayload
//
// External records are intentionally constrained to factual, updateable fields.
// They should not silently replace the broader political reading layer.

export const MAYOR_EXTERNAL_ALLOWED_FIELDS = [
  'holder',
  'electedDate',
  'officeStartDate',
  'website',
  'contactUrl',
  'email',
  'contactNote',
  'note',
  'importance',
]

// Default external-style source input used when no D1-stored external payload
// has been saved yet. Future live hooks can replace or populate the same shape.
export const DEFAULT_MAYOR_EXTERNAL_SOURCE = {
  meta: {
    sourceCount: 1,
    sourceType: 'adapter-ready-maintained-external-source',
    coverageNote:
      'Mayors external-source adapter currently uses a maintained structured input file and can later be replaced by a live feed.',
  },
  regional: [
    {
      name: 'London',
      source: 'official-city-hall-directory',
      fetchedAt: '2026-04-10',
      holder: 'Sadiq Khan',
      website: 'https://www.london.gov.uk/home-page-london-city-hall',
      contactUrl: 'https://www.london.gov.uk/who-we-are/what-mayor-does/contact-city-hall-or-mayor',
      email: 'mayor@london.gov.uk',
      contactNote: 'Official City Hall contact route.',
    },
    {
      name: 'Greater Manchester',
      source: 'greater-manchester-mayor-profile',
      fetchedAt: '2026-04-10',
      holder: 'Andy Burnham',
      website: 'https://www.greatermanchester-ca.gov.uk/the-mayor/',
      contactUrl: 'https://www.greatermanchester-ca.gov.uk/contact/mayor/',
      email: 'andy.burnham@greatermanchester-ca.gov.uk',
    },
  ],
  council: [],
}

export default DEFAULT_MAYOR_EXTERNAL_SOURCE
