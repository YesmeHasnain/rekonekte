/* Rekonekte service worker — makes the app installable and fast.
   Conservative on purpose: the API and anything that isn't a GET always go to
   the network, so members never see stale data. Static assets are cached. */
const CACHE = 'rekonekte-v1'
const SHELL = ['/img/icon-192.png', '/img/icon-512.png', '/img/logo-mark.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin GETs; never cache the API, auth or CSRF.
  if (request.method !== 'GET' || url.origin !== location.origin) return
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/sanctum') || url.pathname.startsWith('/uploads')) return

  // Page navigations: network-first, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/') .then((r) => r || caches.match('/img/logo-mark.png')))
    )
    return
  }

  // Build assets, images, fonts: cache-first, refresh in the background.
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {}) }
        return res
      }).catch(() => cached)
      return cached || network
    })
  )
})
