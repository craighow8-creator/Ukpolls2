import React from 'react'

const portraitModules = import.meta.glob('../data/portraits/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
})

function normaliseSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildPortraitMap() {
  const map = {}

  Object.entries(portraitModules).forEach(([path, src]) => {
    const filename = path.split('/').pop() || ''
    const slug = filename.replace(/\.[^.]+$/, '')
    map[slug] = src
  })

  return map
}

const PORTRAIT_BY_SLUG = buildPortraitMap()

export function getInitials(name) {
  return (name || '')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function getPortraitSrc(name) {
  const slug = normaliseSlug(name)
  return PORTRAIT_BY_SLUG[slug] || null
}

export function PortraitAvatar({ name, color, size = 54, radius }) {
  const r = radius ?? Math.round(size * 0.28)
  const src = getPortraitSrc(name)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: color,
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.33,
          fontWeight: 900,
          color: '#fff',
          zIndex: -1,
        }}
      >
        {getInitials(name)}
      </div>
    </div>
  )
}
