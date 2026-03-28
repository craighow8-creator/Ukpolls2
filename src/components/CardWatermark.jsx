const ICONS = {
  poll:         `<path d="M3 3h4v14H3zm7-3h4v17h-4zm7 6h4v11h-4z" stroke-width="1"/>`,
  leader:       `<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" stroke-width="1"/>`,
  election:     `<path d="M18 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2z" stroke-width="1"/><path d="M9 11l3 3L22 4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  swing:        `<path d="M12 22V12m0 0l-4-4m4 4l4-4M2 12a10 10 0 0020 0" stroke-width="1.5" stroke-linecap="round"/>`,
  news:         `<path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke-width="1"/><path d="M7 8h10M7 12h10M7 16h6" stroke-width="1.5" stroke-linecap="round"/>`,
  vote:         `<path d="M9 11l3 3L22 4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-width="1.5" stroke-linecap="round"/>`,
  compare:      `<path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  betting:      `<path d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16l.7.7M3 12h1m16 0h1M4.92 19.08l.7-.7M18.36 4.64l.7-.7" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="4" stroke-width="1.5"/>`,
  migration:    `<path d="M17 8l4 4-4 4M3 12h18M13 4l4 4-4 4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  ai:           `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  demographics: `<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-width="1.5" stroke-linecap="round"/>`,
  parties:      `<rect x="3" y="3" width="7" height="7" rx="1" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke-width="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke-width="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke-width="1.5"/>`,
  trends:       `<path d="M22 7l-8.5 8.5-5-5L2 17" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  byelection:   `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="22" x2="4" y2="15" stroke-width="1.5" stroke-linecap="round"/>`,
}

// FIX #9 — top-right corner, size=70% card height, 8% opacity
export function CardWatermark({ type='poll', color='#000', size=100 }) {
  const path = ICONS[type]||ICONS.poll
  return (
    <div style={{
      position:'absolute',
      top: -size*0.15,        // bleed slightly above card top
      right: -size*0.15,     // bleed slightly off right edge
      width:size, height:size,
      opacity:0.08,
      pointerEvents:'none',
      zIndex:0,
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} xmlns="http://www.w3.org/2000/svg"
        style={{ display:'block' }}
        dangerouslySetInnerHTML={{ __html:path }}
      />
    </div>
  )
}

export default CardWatermark
