/* Service worker: makes the app work offline.
 *
 * Strategy:
 *  - Navigations (loading the page): network-first, falling back to the cached
 *    page when offline, so you always get fresh HTML online but the app still
 *    opens with no connection.
 *  - Static assets (hashed JS/CSS/icons): cache-first, since Vite gives them
 *    content-hashed names and they never change once built.
 * User data lives in localStorage and is untouched by this cache.
 */
const CACHE = 'wt-cache-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(req)
          const cache = await caches.open(CACHE)
          cache.put(req, net.clone())
          return net
        } catch {
          const cache = await caches.open(CACHE)
          return (
            (await cache.match(req)) ||
            (await cache.match(self.registration.scope)) ||
            (await cache.match('index.html')) ||
            Response.error()
          )
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const hit = await cache.match(req)
      if (hit) return hit
      try {
        const net = await fetch(req)
        if (net && net.status === 200) cache.put(req, net.clone())
        return net
      } catch {
        return hit || Response.error()
      }
    })(),
  )
})
