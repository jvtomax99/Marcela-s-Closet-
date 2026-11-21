import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UPDATE_LABELS } from '../lib/labels'
import { entryScript, isNewVersion, UPDATE_CHECK_MS, UPDATE_TRIED_KEY } from '../lib/update'

function reloadFor(version: string) {
  try {
    sessionStorage.setItem(UPDATE_TRIED_KEY, version)
  } catch {
    // Storage blocked: still reload; the check below can't loop because it only runs on events.
  }
  window.location.reload()
}

/**
 * Looks for a newer version when the app opens, whenever she comes back to it, and every
 * half hour. Found one: reloads at once, unless a form is open (a sheet), in which case it
 * offers an Update button so nothing she typed is lost. Offline it does nothing.
 */
export function UpdateBar() {
  const [ready, setReady] = useState<string | null>(null)

  useEffect(() => {
    if (!import.meta.env.PROD) return
    const current = entryScript(document.head.innerHTML)
    let checking = false

    const check = async () => {
      if (checking || document.visibilityState !== 'visible' || !navigator.onLine) return
      checking = true
      try {
        const response = await fetch('./', { cache: 'no-store' })
        if (!response.ok) return
        const latest = entryScript(await response.text())
        if (!latest || !isNewVersion(current, latest)) return
        let tried: string | null = null
        try {
          tried = sessionStorage.getItem(UPDATE_TRIED_KEY)
        } catch {
          // Storage blocked: treat as not tried.
        }
        if (tried === latest) return
        if (document.querySelector('[data-sheet]')) setReady(latest)
        else reloadFor(latest)
      } catch {
        // No signal or a bad answer: try again next time.
      } finally {
        checking = false
      }
    }

    const onWake = () => void check()
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('online', onWake)
    const timer = setInterval(onWake, UPDATE_CHECK_MS)
    onWake()
    return () => {
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('online', onWake)
      clearInterval(timer)
    }
  }, [])

  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 37 }}
          className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+6.25rem)] z-[60] mx-auto flex max-w-md items-center gap-4 rounded-2xl bg-ink px-5 py-3 text-canvas shadow-print md:bottom-8"
        >
          <span className="min-w-0 flex-1 text-sm">{UPDATE_LABELS.ready}</span>
          <button
            type="button"
            className="py-1 text-eyebrow uppercase text-canvas/80 hover:text-canvas"
            onClick={() => reloadFor(ready)}
          >
            {UPDATE_LABELS.update}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
