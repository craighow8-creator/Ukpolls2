/* Politiscope Service Worker v18 */

const CACHE = 'politiscope-v18'

// Derive app base from where sw.js is served, so GitHub Pages subpaths work.
// Example: /Ukpolls2/sw.js -> APP_BASE = /Ukpolls2/
const SW_PATH = new URL(self.location.href).pathname
const APP_BASE = SW_PATH.endsWith('/sw.js')
  ? SW_PATH.slice(0, -'sw.js'.length)
  : '/'

const INDEX_URL = `${APP_BASE}index.html`
const STATIC_URLS = [APP_BASE, INDEX_URL]

function isBypassRequest(url) {
  return (
    url.includes('throbbing-base') ||
    url.includes('fonts.gstatic') ||
    url.includes('fonts.googleapis') ||
    url.includes('youtube.com') ||
    url.includes('parliament.uk') ||
    url.includes('anthropic.com')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      for (const url of STATIC_URLS) {
        try {
          await cache.add(new Request(url, { cache: 'reload' }))
        } catch (err) {
          console.warn('[sw] failed to precache', url, err)
        }
      }
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Never try to handle non-GET requests in the SW cache layer
  if (request.method !== 'GET') {
    return
  }

  // Pass through selected external/API requests
  if (isBypassRequest(url.href)) {
    event.respondWith(
      fetch(request).catch(() => new Response('', { status: 503 }))
    )
    return
  }

  // Navigation requests: network first, cached index fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request)
        } catch {
          const cachedIndex = await caches.match(INDEX_URL)
          if (cachedIndex) return cachedIndex
          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        }
      })()
    )
    return
  }

  // Same-origin static assets: cache first, then network
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached

        try {
          const response = await fetch(request)

          if (response && response.ok && response.type !== 'opaque') {
            const cache = await caches.open(CACHE)
            cache.put(request, response.clone()).catch(() => {})
          }

          return response
        } catch {
          return new Response('', { status: 503 })
        }
      })()
    )
    return
  }

  // Everything else: simple network pass-through
  event.respondWith(
    fetch(request).catch(() => new Response('', { status: 503 }))
  )
})