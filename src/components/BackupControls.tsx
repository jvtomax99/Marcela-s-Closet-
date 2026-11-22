import { useState, type ChangeEvent } from 'react'
import { exportCloset, importCloset } from '../db/backup'
import { rememberBackup, useLastBackup } from '../lib/backupReminder'

const BACKUP_DATE = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' })

function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Saves the whole closet as one file: on iPhone the share sheet, where "Save to Files" keeps
 * a copy; elsewhere a download. Remembers the day, for the backup reminder.
 */
export async function backUpCloset(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = await exportCloset()
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Closet backup' })
      rememberBackup()
      return 'shared'
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'cancelled'
    }
  }
  download(file)
  rememberBackup()
  return 'downloaded'
}

/** "Last backup today", "yesterday" or "on November 2". */
export function lastBackupWords(at: number, now: number = Date.now()): string {
  const day = (ms: number) => new Date(ms).toDateString()
  if (day(at) === day(now)) return 'Last backup today'
  if (day(at) === day(now - 24 * 60 * 60 * 1000)) return 'Last backup yesterday'
  return `Last backup on ${BACKUP_DATE.format(at)}`
}

/** The closet lives only on this device, so it needs a way out (and back in). */
export function BackupControls() {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const lastBackup = useLastBackup()

  const backUp = async () => {
    setBusy(true)
    try {
      const result = await backUpCloset()
      setStatus(result === 'shared' ? 'Backup ready.' : result === 'downloaded' ? 'Backup downloaded.' : '')
    } finally {
      setBusy(false)
    }
  }

  const restore = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const { items, outfits, wears } = await importCloset(file)
      const worn = wears > 0 ? ', plus what you wore' : ''
      setStatus(
        `Restored ${items} ${items === 1 ? 'piece' : 'pieces'} and ${outfits} ${outfits === 1 ? 'look' : 'looks'}${worn}.`,
      )
    } catch {
      setStatus("That file isn't a closet backup.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="backup" className="mt-24 scroll-mt-24 border-t border-line pt-8 text-sm text-muted">
      <p className="font-serif text-xl text-ink italic">Keep it safe</p>
      <p className="mt-1.5 max-w-md leading-relaxed">
        Your closet lives only on this device. Save a backup now and then, to move it or keep it.
      </p>
      <p className="mt-1.5 text-ink">{lastBackup ? `${lastBackupWords(lastBackup)}.` : 'No backup from this device yet.'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={backUp}
          disabled={busy}
          className="py-2 text-eyebrow uppercase text-ink hover:text-accent disabled:opacity-50"
        >
          Back up closet
        </button>
        <label className={`py-2 text-eyebrow uppercase text-ink hover:text-accent ${busy ? 'opacity-50' : 'cursor-pointer'}`}>
          Restore a backup
          <input
            type="file"
            accept="application/json,.json"
            onChange={restore}
            disabled={busy}
            className="sr-only"
          />
        </label>
      </div>
      {status && (
        <p role="status" className="mt-2 text-ink">
          {status}
        </p>
      )}
    </section>
  )
}
