// Lets the app open without a connection (say, in a fitting room).
// Always tries the network first, so a new version shows up as soon as it is online.
// The closet itself is never here: it lives in the device's database.
//
// The app shares its address (jvtomax99.github.io) with other apps, so this worker only
// handles requests inside its own folder and only ever opens or reads its own cache.
const SCOPE = self.registration.scope
const CACHE = `closet-app:${new URL(SCOPE).pathname}`

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return

  // The page itself skips the browser's short-term copy (GitHub Pages allows 10 minutes), so
  // a new version shows the next time the app opens. Its files have new names per version.
  const fresh =
    request.mode === 'navigate' ? fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(request)

  event.respondWith(
    fresh
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)))
        }
        return response
      })
      .catch(async () => {
        const cache = await caches.open(CACHE)
        // ignoreVary: the app's own files are the same whichever way they were requested.
        const cached = await cache.match(request, { ignoreVary: true })
        if (cached) return cached
        if (request.mode === 'navigate') {
          return (await cache.match(SCOPE, { ignoreVary: true })) ?? Response.error()
        }
        return Response.error()
      }),
  )
})
