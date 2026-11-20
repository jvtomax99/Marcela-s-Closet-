import { useState, type ChangeEvent } from 'react'
import { exportCloset, importCloset } from '../db/backup'

function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** The closet lives only on this device, so it needs a way out (and back in). */
export function BackupControls() {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const backUp = async () => {
    setBusy(true)
    try {
      const file = await exportCloset()
      // On iPhone this opens the share sheet, where "Save to Files" keeps a copy.
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Closet backup' })
          setStatus('Backup ready.')
          return
        } catch (error) {
          if ((error as Error).name === 'AbortError') return setStatus('')
        }
      }
      download(file)
      setStatus('Backup downloaded.')
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
    <section className="mt-24 border-t border-line pt-8 text-sm text-muted">
      <p className="font-serif text-xl text-ink italic">Keep it safe</p>
      <p className="mt-1.5 max-w-md leading-relaxed">
        Your closet lives only on this device. Save a backup now and then, to move it or keep it.
      </p>
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
