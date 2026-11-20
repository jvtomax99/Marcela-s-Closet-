// Lets the app open without a connection (say, in a fitting room).
// Always tries the network first, so a new version shows up as soon as it is online.
// The closet itself is never here: it lives in the device's database.
//
// The app shares its address (jvtomax99.github.io) with other apps, so this worker only
// handles requests inside its own folder and only ever opens, reads or deletes its own cache.
const SCOPE = self.registration.scope
const CACHE = `closet-app:${new URL(SCOPE).pathname}`
// The cache's name before the app moved into a folder. Only this exact name is removed.
const OLD_CACHE = 'closet-app'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      if (CACHE !== OLD_CACHE) await caches.delete(OLD_CACHE)
      await self.clients.claim()
    })(),
  ),
)

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return

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
