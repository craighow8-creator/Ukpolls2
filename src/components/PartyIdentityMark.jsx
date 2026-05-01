import React from 'react'
import { getPartyById, getPartyByName } from '../data/partyRegistry'
import { getPartyIdentity as getConfiguredPartyIdentity } from '../data/partyIdentity'

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
  const configured = getConfiguredPartyIdentity(raw)
  const registry = key ? getPartyById(key) : getPartyByName(raw)
  const resolved = configured || registry
  const isOtherFallback = resolved?.id === 'other' && cleanKey(raw) !== 'other'

  return {
    name: configured?.name || (isOtherFallback ? raw : resolved?.name) || raw || 'Other',
    abbr: abbr || configured?.fallbackInitials || configured?.abbr || (isOtherFallback ? initialsFromName(raw) : resolved?.abbr) || initialsFromName(raw),
    color: color || configured?.color || (isOtherFallback ? '#6b7280' : resolved?.color) || '#6b7280',
    emblemPath: emblemPath || resolved?.emblemPath || null,
    usageNote: configured?.usageNote || 'Shown for identification and editorial context only.',
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
  variant = 'badge',
  style = {},
}) {
  const identity = getPartyIdentity({ party, name, key: partyKey, abbr, color, emblemPath })
  if (variant === 'watermark') {
    if (!identity.emblemPath) return null
    return (
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        <img
          src={identity.emblemPath}
          alt=""
          style={{
            width: '78%',
            height: '78%',
            objectFit: 'contain',
            opacity: 0.08,
            filter: 'grayscale(12%)',
          }}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      </span>
    )
  }

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
