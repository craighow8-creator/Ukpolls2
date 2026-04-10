export const PARTY_REGISTRY = {
  reform: {
    id: 'reform',
    name: 'Reform UK',
    abbr: 'REF',
    color: '#12B7D4',
    themeKey: 'reform',
    aliases: ['reform uk', 'reform'],
  },
  labour: {
    id: 'labour',
    name: 'Labour',
    abbr: 'LAB',
    color: '#C8102E',
    themeKey: 'labour',
    aliases: ['labour', 'lab'],
  },
  con: {
    id: 'con',
    name: 'Conservative',
    abbr: 'CON',
    color: '#0087DC',
    themeKey: 'con',
    aliases: ['conservative', 'con'],
  },
  green: {
    id: 'green',
    name: 'Green',
    abbr: 'GRN',
    color: '#02A95B',
    themeKey: 'green',
    aliases: ['green', 'green party'],
  },
  ld: {
    id: 'ld',
    name: 'Lib Dem',
    abbr: 'LD',
    color: '#FAA61A',
    themeKey: 'ld',
    aliases: ['lib dem', 'liberal democrat', 'liberal democrats', 'ld'],
  },
  rb: {
    id: 'rb',
    name: 'Restore Britain',
    abbr: 'RB',
    color: '#7C3AED',
    themeKey: 'rb',
    aliases: ['restore britain', 'rb'],
  },
  snp: {
    id: 'snp',
    name: 'SNP',
    abbr: 'SNP',
    color: '#C4922A',
    themeKey: 'base',
    aliases: ['snp', 'scottish national party'],
  },
  plaid: {
    id: 'plaid',
    name: 'Plaid Cymru',
    abbr: 'PC',
    color: '#3F8428',
    themeKey: 'base',
    aliases: ['plaid cymru', 'plaid', 'pc'],
  },
  other: {
    id: 'other',
    name: 'Other',
    abbr: 'OTH',
    color: '#6b7280',
    themeKey: 'base',
    aliases: ['other'],
  },
}

export const PARTY_LIST = Object.values(PARTY_REGISTRY)

export function getPartyById(id) {
  return PARTY_REGISTRY[id] || PARTY_REGISTRY.other
}

export function getPartyByName(name = '') {
  const n = String(name || '').trim().toLowerCase()
  return (
    PARTY_LIST.find(
      (p) => p.name.toLowerCase() === n || p.aliases.some((a) => a === n)
    ) || PARTY_REGISTRY.other
  )
}

export function getPartyColor(value) {
  if (!value) return PARTY_REGISTRY.other.color
  if (PARTY_REGISTRY[value]) return PARTY_REGISTRY[value].color
  return getPartyByName(value).color
}

export function getPartyAbbr(value) {
  if (!value) return PARTY_REGISTRY.other.abbr
  if (PARTY_REGISTRY[value]) return PARTY_REGISTRY[value].abbr
  return getPartyByName(value).abbr
}
