// Lets the app open without a connection (say, in a fitting room).
// Always tries the network first, so a new version shows up as soon as it is online.
// The closet itself is never here: it lives in the device's database.
const CACHE = 'closet-app'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)))
        }
        return response
      })
      .catch(async () => {
        // ignoreVary: the app's own files are the same whichever way they were requested.
        const cached = await caches.match(request, { ignoreVary: true })
        if (cached) return cached
        if (request.mode === 'navigate') {
          return (await caches.match('/', { ignoreVary: true })) ?? Response.error()
        }
        return Response.error()
      }),
  )
})
