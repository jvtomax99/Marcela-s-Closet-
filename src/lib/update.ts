// Keeps the installed app up to date without reinstalling it. An iPhone keeps a home-screen
// app paused in memory, so coming back to it shows the old version until it is restarted;
// the app checks for a newer version itself and reloads.

/** The built app's main script (e.g. `index-CsWb2a1Q.js`); a new version has a new name. */
export function entryScript(html: string): string | null {
  for (const tag of html.match(/<script\b[^>]*>/g) ?? []) {
    if (!/type=["']module["']/.test(tag)) continue
    const src = tag.match(/src=["']([^"']+)["']/)?.[1]
    const name = src?.match(/assets\/([^/?#]+\.js)/)?.[1]
    if (name) return name
  }
  return null
}

/** True only when both versions are known and they differ. */
export function isNewVersion(current: string | null, latest: string | null): boolean {
  return current !== null && latest !== null && current !== latest
}

/** How often to look for a new version while the app stays open. */
export const UPDATE_CHECK_MS = 30 * 60 * 1000

/** Remembers which version a reload already went for, so it never reloads in a loop. */
export const UPDATE_TRIED_KEY = 'closet-update-tried'
