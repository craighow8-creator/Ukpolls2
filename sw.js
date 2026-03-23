/* Politiscope Service Worker v17 */
const CACHE  = 'politiscope-v17'
const STATIC = ['./', './index.html']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC.map(u => new Request(u, { cache:'reload' }))))
      .catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = e.request.url

  // Pass through — don't cache API/font requests
  if (
    url.includes('throbbing-base') ||
    url.includes('fonts.gstatic') ||
    url.includes('fonts.googleapis') ||
    url.includes('youtube.com') ||
    url.includes('parliament.uk') ||
    url.includes('anthropic.com')
  ) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })))
    return
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached

      return fetch(e.request).then(response => {
        // FIX: clone BEFORE doing anything else — original goes to cache, clone returned
        if (response && response.ok && response.status < 400) {
          const toCache = response.clone()
          caches.open(CACHE).then(c => c.put(e.request, toCache))
        }
        return response
      }).catch(() => {
        // Offline fallback — serve index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html')
        }
        return new Response('', { status: 503 })
      })
    })
  )
})
