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

function localEmblemPath(value) {
  const path = String(value || '').trim()
  return path.startsWith('/party-emblems/') ? path : null
}

function parseWatermarkPosition(value = '50% 50%') {
  const [x = '50%', y = '50%'] = String(value || '50% 50%').split(/\s+/)
  return { x, y }
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
    emblemPath: localEmblemPath(emblemPath) || localEmblemPath(resolved?.emblemPath),
    usageNote: configured?.usageNote || 'Shown for identification and editorial context only.',
    markType: configured?.markType || 'fallback',
    watermarkOpacity: configured?.watermarkOpacity ?? 0.08,
    watermarkScale: configured?.watermarkScale ?? 0.78,
    watermarkPosition: configured?.watermarkPosition || '50% 50%',
    watermarkFilter: configured?.watermarkFilter || null,
    watermarkBlendMode: configured?.watermarkBlendMode || 'multiply',
    logoCardBackground: configured?.logoCardBackground || null,
    logoCardPadding: configured?.logoCardPadding ?? 0,
    cardBackground: configured?.cardBackground || configured?.color || null,
    cardTextColor: configured?.cardTextColor || '#ffffff',
    heroLogoScale: configured?.heroLogoScale ?? 0.92,
    heroLogoFilter: configured?.heroLogoFilter || null,
    heroLogoBlendMode: configured?.heroLogoBlendMode || 'normal',
    heroLogoLabel: configured?.heroLogoLabel || null,
    heroLogoLabelSize: configured?.heroLogoLabelSize || 16,
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
    const scale = identity.watermarkScale || 0.78
    const size = `${Math.max(48, Math.min(94, scale * 100))}%`
    const { x, y } = parseWatermarkPosition(identity.watermarkPosition)
    return (
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: size,
            height: size,
            transform: 'translate(-50%, -50%)',
            background: identity.color,
            opacity: identity.watermarkOpacity,
            mixBlendMode: identity.watermarkBlendMode,
            filter:
              identity.watermarkFilter ||
              (identity.markType === 'emblem'
                ? 'brightness(0.96) contrast(1.08)'
                : 'brightness(0.98) contrast(1.12)'),
            WebkitMaskImage: `url(${identity.emblemPath})`,
            maskImage: `url(${identity.emblemPath})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
      </span>
    )
  }

  if (variant === 'heroLogo') {
    const isNeutral = cleanKey(identity.name) === 'would not vote' || identity.color === '#6b7280'
    const logoScale = Math.max(0.48, Math.min(1.08, identity.heroLogoScale || 0.92))
    const logoMaxWidth = `${logoScale * 100}%`
    return (
      <span
        aria-hidden="true"
        style={{
          width: '100%',
          minHeight: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: identity.heroLogoLabel ? 3 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: radius ?? 12,
          background: identity.logoCardBackground || 'transparent',
          padding: identity.logoCardPadding,
          boxSizing: 'border-box',
          ...style,
        }}
        title={identity.name}
      >
        {identity.emblemPath ? (
          <>
            <img
              src={identity.emblemPath}
              alt=""
              style={{
                display: 'block',
                maxWidth: logoMaxWidth,
                maxHeight: identity.heroLogoLabel ? size * 0.7 : size,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                filter: identity.heroLogoFilter || 'none',
                mixBlendMode: identity.heroLogoBlendMode,
              }}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
            {identity.heroLogoLabel ? (
              <span
                style={{
                  color: identity.cardTextColor,
                  fontSize: identity.heroLogoLabelSize,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: 0,
                  textAlign: 'center',
                  textShadow: '0 1px 8px rgba(0,0,0,0.18)',
                }}
              >
                {identity.heroLogoLabel}
              </span>
            ) : null}
          </>
        ) : (
          <span
            style={{
              width: size,
              height: size,
              borderRadius: radius ?? Math.round(size * 0.32),
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isNeutral
                ? 'linear-gradient(145deg, rgba(107,114,128,0.12), rgba(107,114,128,0.05))'
                : `linear-gradient(145deg, ${identity.color}24, ${identity.color}0D)`,
              border: `1px solid ${identity.color}${isNeutral ? '32' : '55'}`,
              color: identity.color,
              fontSize: Math.max(12, size * 0.3),
              fontWeight: 900,
              letterSpacing: '0.03em',
              lineHeight: 1,
            }}
          >
            {identity.abbr}
          </span>
        )}
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
