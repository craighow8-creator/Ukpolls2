import { PARTY_LIST } from './partyRegistry'

const USAGE_NOTE = 'Shown for identification and editorial context only.'
const REVIEWED_AT = '05-05-2026'

const EMBLEM_OVERRIDES = {
  reform: {
    emblemPath: '/party-emblems/reform-uk.png',
    emblemSourceUrl: 'https://www.reformparty.uk/',
    sourceType: 'official-party-website',
    reviewedAt: REVIEWED_AT,
    markType: 'wordmark',
    cardBackground: '#0099B8',
    cardTextColor: '#ffffff',
    heroLogoScale: 0.9,
    heroLogoFilter: null,
    heroLogoBlendMode: 'normal',
    logoCardBackground: null,
    logoCardPadding: 0,
  },
  labour: {
    emblemPath: '/party-emblems/labour.svg',
    emblemSourceUrl: 'https://labour.org.uk/',
    sourceType: 'official-party-website',
    reviewedAt: REVIEWED_AT,
    markType: 'wordmark',
    cardBackground: '#C8102E',
    cardTextColor: '#ffffff',
    heroLogoScale: 0.96,
    heroLogoFilter: 'brightness(0) invert(1)',
    heroLogoBlendMode: 'normal',
    logoCardPadding: 0,
  },
  con: {
    emblemPath: '/party-emblems/conservative.svg',
    emblemSourceUrl: 'https://www.conservatives.com/',
    sourceType: 'official-party-website',
    reviewedAt: REVIEWED_AT,
    markType: 'combination',
    cardBackground: '#0057A8',
    cardTextColor: '#ffffff',
    heroLogoScale: 0.68,
    heroLogoFilter: 'brightness(0) invert(1)',
    heroLogoBlendMode: 'normal',
    heroLogoLabel: 'Conservatives',
    heroLogoLabelSize: 17,
    logoCardPadding: 0,
  },
  green: {
    emblemPath: '/party-emblems/green-party-stacked.png',
    emblemSourceUrl: 'https://greenparty.org.uk/',
    sourceType: 'official-party-website',
    reviewedAt: REVIEWED_AT,
    markType: 'wordmark',
    cardBackground: '#0B7A2A',
    cardTextColor: '#ffffff',
    heroLogoScale: 0.86,
    heroLogoFilter: null,
    heroLogoBlendMode: 'normal',
    logoCardBackground: null,
    logoCardPadding: 0,
  },
  ld: {
    emblemPath: '/party-emblems/lib-dem.png',
    emblemSourceUrl: 'https://www.libdems.org.uk/brand',
    sourceType: 'official-party-brand-page',
    reviewedAt: REVIEWED_AT,
    markType: 'wordmark',
    cardBackground: '#F4A900',
    cardTextColor: '#ffffff',
    heroLogoScale: 0.98,
    heroLogoFilter: 'brightness(0) invert(1)',
    heroLogoBlendMode: 'normal',
    logoCardPadding: 0,
  },
  rb: {
    emblemPath: '/party-emblems/restore-britain-transparent.png',
    emblemSourceUrl: 'https://www.restorebritain.org.uk/',
    sourceType: 'official-party-website',
    reviewedAt: REVIEWED_AT,
    markType: 'wordmark',
    cardBackground: '#071C3A',
    cardTextColor: '#ffffff',
    heroLogoScale: 1,
    heroLogoFilter: 'brightness(0) invert(1)',
    heroLogoBlendMode: 'screen',
    logoCardPadding: 0,
  },
  snp: {
    emblemPath: '/party-emblems/snp.svg',
    emblemSourceUrl: 'https://www.snp.org/',
    sourceType: 'official-party-website',
    reviewedAt: REVIEWED_AT,
    markType: 'emblem',
    cardBackground: '#C4922A',
    cardTextColor: '#ffffff',
    heroLogoScale: 0.88,
    heroLogoFilter: null,
    heroLogoBlendMode: 'normal',
    logoCardPadding: 0,
  },
  plaid: {
    emblemPath: '/party-emblems/plaid-cymru.svg',
    emblemSourceUrl: 'https://www.partyof.wales/',
    sourceType: 'official-party-website',
    reviewedAt: REVIEWED_AT,
    markType: 'wordmark',
    cardBackground: '#3F8428',
    cardTextColor: '#ffffff',
    heroLogoScale: 0.92,
    heroLogoFilter: 'brightness(0) invert(1)',
    heroLogoBlendMode: 'normal',
    logoCardPadding: 0,
  },
}

const EXTRA_IDENTITIES = [
  {
    id: 'would-not-vote',
    key: 'would-not-vote',
    name: 'Would not vote',
    aliases: ['would not vote'],
    abbr: 'WNV',
    color: '#6b7280',
    emblemPath: null,
    emblemSourceUrl: null,
    sourceType: null,
    reviewedAt: null,
    usageNote: USAGE_NOTE,
    fallbackInitials: 'WNV',
    markType: 'fallback',
  },
  {
    id: 'snp-plaid',
    key: 'snp-plaid',
    name: 'SNP / Plaid',
    aliases: ['snp / plaid', 'snp plaid'],
    abbr: 'S/P',
    color: '#5f7f2f',
    emblemPath: null,
    emblemSourceUrl: null,
    sourceType: null,
    reviewedAt: null,
    usageNote: USAGE_NOTE,
    fallbackInitials: 'S/P',
    markType: 'fallback',
  },
  {
    id: 'no-idea',
    key: 'no-idea',
    name: 'No idea',
    aliases: ['no idea'],
    abbr: '?',
    color: '#6b7280',
    emblemPath: null,
    emblemSourceUrl: null,
    sourceType: null,
    reviewedAt: null,
    usageNote: USAGE_NOTE,
    fallbackInitials: '?',
    markType: 'fallback',
  },
]

export const PARTY_IDENTITIES = [
  ...PARTY_LIST.filter((party) => party.id !== 'other').map((party) => {
    const emblemOverride = EMBLEM_OVERRIDES[party.id] || {}
    return {
      id: party.id,
      key: party.id,
      name: party.name,
      aliases: party.aliases || [],
      abbr: party.abbr,
      color: party.color,
      emblemPath: null,
      emblemSourceUrl: null,
      sourceType: null,
      reviewedAt: null,
      usageNote: USAGE_NOTE,
      fallbackInitials: party.abbr,
      markType: 'fallback',
      logoCardBackground: null,
      logoCardPadding: 0,
      cardBackground: party.color,
      cardTextColor: '#ffffff',
      heroLogoScale: 0.92,
      heroLogoFilter: null,
      heroLogoBlendMode: 'normal',
      heroLogoLabel: null,
      heroLogoLabelSize: 16,
      ...emblemOverride,
    }
  }),
  ...EXTRA_IDENTITIES,
]

function cleanKey(value = '') {
  return String(value || '').trim().toLowerCase()
}

export function getPartyIdentity(value = '') {
  const key = cleanKey(value)
  return (
    PARTY_IDENTITIES.find((identity) =>
      cleanKey(identity.id) === key ||
      cleanKey(identity.key) === key ||
      cleanKey(identity.name) === key ||
      (identity.aliases || []).some((alias) => cleanKey(alias) === key),
    ) || null
  )
}

export function getPartyIdentityUsageNote() {
  return USAGE_NOTE
}
