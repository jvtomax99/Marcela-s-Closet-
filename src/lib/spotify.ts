// Her own Spotify playlist (Jose, 2026-11-24): Marce wanted Cali music she picks herself, without
// putting songs with copyright in the app. The record in the masthead opens her link; the link
// stays on her device, never in the repo.

/** Where the link is kept. The whole address shares `localStorage`, hence the long name. */
export const SPOTIFY_KEY = 'marcelas-closet:spotify-link'

const KINDS = ['playlist', 'album', 'artist'] as const
const ID = /^[A-Za-z0-9]{10,40}$/

/**
 * Turns whatever she pastes into a clean `https://open.spotify.com/<kind>/<id>` link (or a
 * `https://spotify.link/<id>` short link), or null. Takes a share link (with or without
 * `intl-xx/` and `?si=`), a `spotify:playlist:ID` code, or a share text with the link in it.
 */
export function parseSpotifyLink(text: string): string | null {
  const trimmed = text.trim()
  const code = trimmed.match(/spotify:(playlist|album|artist):([A-Za-z0-9]+)/)
  if (code) return clean(code[1], code[2])

  // Spotify's share sheet sometimes gives a short link; it leads to the same playlist.
  const short = trimmed.match(/(?:^|\s)(?:https:\/\/)?spotify\.link\/([A-Za-z0-9]{6,40})(?=$|[\s?])/i)
  if (short) return `https://spotify.link/${short[1]}`

  const bare = trimmed.match(/(?:^|\s)(open\.spotify\.com\/\S+)/i)?.[1]
  const found = trimmed.match(/https?:\/\/open\.spotify\.com\/\S+/i)?.[0] ?? (bare ? `https://${bare}` : null)
  if (!found) return null
  let url: URL
  try {
    url = new URL(found)
  } catch {
    return null
  }
  if (url.hostname.toLowerCase() !== 'open.spotify.com') return null
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts[0]?.startsWith('intl-')) parts.shift()
  return clean(parts[0], parts[1])
}

function clean(kind: string | undefined, id: string | undefined) {
  if (!kind || !id || !(KINDS as readonly string[]).includes(kind) || !ID.test(id)) return null
  return `https://open.spotify.com/${kind}/${id}`
}

export function readSpotifyLink(): string | null {
  try {
    return parseSpotifyLink(localStorage.getItem(SPOTIFY_KEY) ?? '')
  } catch {
    return null
  }
}

/** Saves the link (or forgets it with null). False if the phone won't keep it (private browsing). */
export function saveSpotifyLink(link: string | null): boolean {
  try {
    if (link) localStorage.setItem(SPOTIFY_KEY, link)
    else localStorage.removeItem(SPOTIFY_KEY)
    return true
  } catch {
    return false
  }
}
