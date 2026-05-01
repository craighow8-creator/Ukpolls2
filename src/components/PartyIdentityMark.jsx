import React from 'react'
import { getPartyById, getPartyByName } from '../data/partyRegistry'

const EXTRA_IDENTITIES = {
  'would not vote': {
    name: 'Would not vote',
    abbr: 'WNV',
    color: '#6b7280',
  },
  'snp / plaid': {
    name: 'SNP / Plaid',
    abbr: 'S/P',
    color: '#5f7f2f',
  },
  'no idea': {
    name: 'No idea',
    abbr: '?',
    color: '#6b7280',
  },
}

function cleanKey(value = '') {
  return String(value || '').trim().toLowerCase()
}

function initialsFromName(value = '') {
  const text = String(value || '').trim()
  if (!text) return '?'
  if (/liberal democrats/i.test(text)) return 'LD'
  if (/would not vote/i.test(text)) return 'WNV'
  return text
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

export function getPartyIdentity({ party, name, key, abbr, color, emblemPath } = {}) {
  const raw = party || name || key || ''
  const extra = EXTRA_IDENTITIES[cleanKey(raw)]
  const registry = key ? getPartyById(key) : getPartyByName(raw)
  const resolved = extra || registry
  const isOtherFallback = resolved?.id === 'other' && cleanKey(raw) !== 'other'

  return {
    name: extra?.name || (isOtherFallback ? raw : resolved?.name) || raw || 'Other',
    abbr: abbr || extra?.abbr || (isOtherFallback ? initialsFromName(raw) : resolved?.abbr) || initialsFromName(raw),
    color: color || extra?.color || (isOtherFallback ? '#6b7280' : resolved?.color) || '#6b7280',
    emblemPath: emblemPath || resolved?.emblemPath || null,
  }
}

export default function PartyIdentityMark({
  party,
  name,
  partyKey,
  abbr,
  color,
  emblemPath,
  size = 34,
  radius,
  style = {},
}) {
  const identity = getPartyIdentity({ party, name, key: partyKey, abbr, color, emblemPath })
  const r = radius ?? Math.round(size * 0.32)
  const isNeutral = cleanKey(identity.name) === 'would not vote' || identity.color === '#6b7280'

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        background: isNeutral
          ? 'linear-gradient(145deg, rgba(107,114,128,0.12), rgba(107,114,128,0.05))'
          : `linear-gradient(145deg, ${identity.color}24, ${identity.color}0D)`,
        border: `${Math.max(1, Math.round(size / 22))}px solid ${identity.color}${isNeutral ? '32' : '55'}`,
        boxShadow: isNeutral
          ? 'inset 0 1px 0 rgba(255,255,255,0.34)'
          : `inset 0 1px 0 rgba(255,255,255,0.42), 0 6px 14px ${identity.color}18`,
        color: identity.color,
        fontSize: Math.max(10, size * 0.3),
        fontWeight: 900,
        letterSpacing: '0.03em',
        lineHeight: 1,
        opacity: isNeutral ? 0.82 : 1,
        ...style,
      }}
      title={identity.name}
    >
      {identity.emblemPath ? (
        <img
          src={identity.emblemPath}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        identity.abbr
      )}
    </span>
  )
}
