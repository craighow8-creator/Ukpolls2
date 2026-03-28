const BASE = '/Ukpolls2/portraits'

export const PORTRAITS = {
  'Rupert Lowe':      `${BASE}/rupert-lowe.jpg`,
  'Ed Davey':         `${BASE}/ed-davey.jpg`,
  'Zack Polanski':    `${BASE}/zack-polanski.jpg`,
  'Kemi Badenoch':    `${BASE}/kemi-badenoch.jpg`,
  'Nigel Farage':     `${BASE}/nigel-farage.jpg`,
  'Keir Starmer':     `${BASE}/keir-starmer.jpg`,
  'John Swinney':     `${BASE}/john-swinney.jpg`,
  'Rhun ap Iorwerth': `${BASE}/rhun-ap-iorwerth.jpg`,
}

export function getInitials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function PortraitAvatar({ name, color, size = 54, radius }) {
  const r = radius ?? Math.round(size * 0.28)
  const src = PORTRAITS[name]
  return (
    <div style={{ width:size, height:size, borderRadius:r, background:color, overflow:'hidden', flexShrink:0, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
      {src && <img src={src} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e => { e.currentTarget.style.display = 'none' }}/>}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.33, fontWeight:900, color:'#fff', zIndex:-1 }}>
        {getInitials(name)}
      </div>
    </div>
  )
}
