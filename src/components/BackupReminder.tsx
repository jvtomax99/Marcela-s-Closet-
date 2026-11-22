import { useState } from 'react'
import { backupDue, lastAdded, useLastBackup } from '../lib/backupReminder'
import { BACKUP_LABELS } from '../lib/labels'
import type { ClothingItem, Outfit, Wear } from '../types'
import { backUpCloset, lastBackupWords } from './BackupControls'

interface BackupReminderProps {
  items: ClothingItem[]
  outfits: Outfit[]
  wears: Wear[]
}

/**
 * A note at the top of the Closet page when a backup is due: never made on this device, or
 * two weeks old with something added since. One tap backs up; then the note goes away.
 */
export function BackupReminder({ items, outfits, wears }: BackupReminderProps) {
  const lastBackup = useLastBackup()
  const [busy, setBusy] = useState(false)
  const [unsure, setUnsure] = useState(false)
  if (!backupDue(lastBackup, lastAdded(items, outfits, wears), Date.now())) return null

  const backUp = async () => {
    setBusy(true)
    try {
      setUnsure((await backUpCloset()) === 'unsure')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="note"
      className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-card bg-surface px-5 py-4 text-sm shadow-card"
    >
      <p className="max-w-md leading-relaxed text-muted">
        <span className="font-serif text-lg text-ink italic">
          {lastBackup ? `${lastBackupWords(lastBackup)}.` : BACKUP_LABELS.noteNone}
        </span>{' '}
        {unsure ? BACKUP_LABELS.unsure : lastBackup ? BACKUP_LABELS.noteStaleBody : BACKUP_LABELS.noteNoneBody}
      </p>
      <button
        type="button"
        onClick={backUp}
        disabled={busy}
        className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-eyebrow text-canvas uppercase shadow-print transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50"
      >
        {BACKUP_LABELS.backUpNow}
      </button>
    </div>
  )
}
