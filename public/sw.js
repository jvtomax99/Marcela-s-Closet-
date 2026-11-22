// Lets the app open without a connection (say, in a fitting room).
// Always tries the network first, so a new version shows up as soon as it is online; on a
// weak signal the saved copy answers after 4 seconds.
// The closet itself is never here: it lives in the device's database.
//
// The app shares its address (jvtomax99.github.io) with other apps, so this worker only
// handles requests inside its own folder and only ever opens or reads its own cache.
const SCOPE = self.registration.scope
const CACHE = `closet-app:${new URL(SCOPE).pathname}`
// How long the internet gets before the saved copy answers.
const NETWORK_WAIT_MS = 4000
const SLOW = 'slow'
const FAILED = 'failed'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return
  // The video guide (guide/) streams from the internet and is never kept in the offline copy:
  // about 9 MB she doesn't need on the phone, and iPhone asks for videos in pieces anyway.
  if (new URL(request.url).pathname.startsWith(`${new URL(SCOPE).pathname}guide/`)) return

  // The built files (assets/) get a new name with every version, so a saved copy is never
  // out of date: it answers at once, and only a file not saved yet goes to the internet.
  if (new URL(request.url).pathname.startsWith(`${new URL(SCOPE).pathname}assets/`)) {
    event.respondWith(savedCopy(request).then((cached) => cached ?? fromNetwork(event, request)))
    return
  }

  const network = fromNetwork(event, request)
  // Keeps the download going (and the copy updating) even after the saved copy has answered.
  event.waitUntil(network.catch(() => undefined))

  event.respondWith(
    (async () => {
      // One bar of signal (a fitting room) can leave a request hanging for a minute: after a
      // few seconds the saved copy answers instead. With no saved copy, it keeps waiting.
      let timer
      const slow = new Promise((resolve) => {
        timer = setTimeout(() => resolve(SLOW), NETWORK_WAIT_MS)
      })
      const first = await Promise.race([network.catch(() => FAILED), slow])
      clearTimeout(timer)
      if (first !== SLOW && first !== FAILED) return first

      const cached = await savedCopy(request)
      if (cached) return cached
      if (first === FAILED) return Response.error()
      return network.catch(() => Response.error())
    })(),
  )
})

/**
 * Fetches from the internet and saves each good answer, so a visit without signal has it.
 * A page is saved only after the built files it names are saved: otherwise a page that
 * arrived late on a weak signal could be saved without its scripts, and the next visit
 * without signal would open blank.
 */
function fromNetwork(event, request) {
  // The page itself skips the browser's short-term copy (GitHub Pages allows 10 minutes), so
  // a new version shows the next time the app opens.
  const fresh =
    request.mode === 'navigate' ? fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(request)
  return fresh.then((response) => {
    if (response.ok) {
      const copy = response.clone()
      const isPage = (response.headers.get('content-type') ?? '').includes('text/html')
      event.waitUntil((isPage ? savePage(request, copy) : save(request, copy)).catch(() => undefined))
    }
    return response
  })
}

async function save(request, response) {
  const cache = await caches.open(CACHE)
  await cache.put(request, response)
}

async function savePage(request, response) {
  const html = await response.clone().text()
  const cache = await caches.open(CACHE)
  const files = [...html.matchAll(/(?:src|href)=["'](\.?\/?assets\/[^"'?#]+)/g)].map((m) => new URL(m[1], SCOPE).href)
  for (const url of files) {
    if (await cache.match(url, { ignoreVary: true })) continue
    const file = await fetch(url)
    if (!file.ok) throw new Error(`Missing ${url}`)
    await cache.put(url, file)
  }
  await cache.put(request, response)
}

async function savedCopy(request) {
  return lookUp(request).catch(() => undefined)
}

async function lookUp(request) {
  const cache = await caches.open(CACHE)
  // ignoreVary: the app's own files are the same whichever way they were requested.
  const cached = await cache.match(request, { ignoreVary: true })
  if (cached) return cached
  // A page load with no copy of its own falls back to the app's folder page (never the address's `/`).
  if (request.mode === 'navigate') return cache.match(SCOPE, { ignoreVary: true })
  return undefined
}
