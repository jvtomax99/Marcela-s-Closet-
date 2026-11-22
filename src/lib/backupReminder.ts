// Reminds her to back up. The closet lives only on this device, and the only copy elsewhere
// is a backup file she saves herself, so the app remembers when she last made one.
import { useSyncExternalStore } from 'react'

/** In localStorage, which the whole address shares with Jose's other apps: hence the long name. */
export const LAST_BACKUP_KEY = 'marcelas-closet:last-backup'

/** A backup older than this, with pieces, looks or wears added since, is due. */
export const BACKUP_DUE_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

/** When something was last added to the closet (ms), or null for an empty closet. */
export function lastAdded(...lists: { createdAt: number }[][]): number | null {
  let latest: number | null = null
  for (const list of lists) {
    for (const entry of list) if (latest === null || entry.createdAt > latest) latest = entry.createdAt
  }
  return latest
}

/**
 * True when a backup is worth nudging for: never backed up on this device (and there is
 * something to back up), or the last one is two weeks old and something was added since.
 * A closet that hasn't changed since its last backup never nags.
 */
export function backupDue(lastBackup: number | null, latestAdded: number | null, now: number): boolean {
  if (latestAdded === null) return false
  if (lastBackup === null) return true
  return latestAdded > lastBackup && now - lastBackup >= BACKUP_DUE_DAYS * DAY_MS
}

const listeners = new Set<() => void>()

function read(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_BACKUP_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

/** Called after a backup file was handed to her (shared or downloaded). */
export function rememberBackup(at: number = Date.now()) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(at))
  } catch {
    // Storage blocked: the reminder just keeps showing.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/** When she last backed up on this device (ms), or null. */
export function useLastBackup(): number | null {
  return useSyncExternalStore(subscribe, read, () => null)
}
