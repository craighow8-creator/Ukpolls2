import { PARTY_LIST } from './partyRegistry'

const USAGE_NOTE = 'Shown for identification and editorial context only.'

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
  },
]

export const PARTY_IDENTITIES = [
  ...PARTY_LIST.filter((party) => party.id !== 'other').map((party) => ({
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
  })),
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
