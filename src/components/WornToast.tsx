import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { logWear, moveWear, undoWear } from '../db'
import { toDay } from '../engine'
import type { Day } from '../types'

const SHOWN_FOR_MS = 8000
const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/** "today", "yesterday" or "Nov 12". */
export function dayLabel(day: Day, today: Day = toDay(Date.now())): string {
  if (day === today) return 'today'
  const [y, m, d] = day.split('-').map(Number)
  if (toDay(new Date(y, m - 1, d + 1).getTime()) === today) return 'yesterday'
  return SHORT_DATE.format(new Date(y, m - 1, d))
}

interface Logged {
  id: string
  date: Day
}

/**
 * Logs a look as worn today, then shows a small bar to change the day or undo.
 * Each page that has "Wore it" buttons renders `toast` once.
 */
export function useWornLog() {
  const [logged, setLogged] = useState<Logged | null>(null)
  const [touched, setTouched] = useState(0)

  useEffect(() => {
    if (!logged) return
    const timer = setTimeout(() => setLogged(null), SHOWN_FOR_MS)
    return () => clearTimeout(timer)
  }, [logged, touched])

  const logLook = useCallback(async (itemIds: string[]) => {
    const date = toDay(Date.now())
    setLogged({ id: await logWear(itemIds, date), date })
  }, [])

  const today = toDay(Date.now())
  const toast = (
    <AnimatePresence>
      {logged && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 37 }}
          className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-40 mx-auto flex max-w-md items-center gap-4 rounded bg-ink px-5 py-3 text-canvas shadow-print md:bottom-8"
        >
          <span className="min-w-0 flex-1 text-sm">
            Worn{' '}
            <label className="relative inline-block cursor-pointer border-b border-dashed border-canvas/60 font-serif text-base italic">
              {dayLabel(logged.date, today)}
              <input
                type="date"
                aria-label="Day worn"
                value={logged.date}
                max={today}
                onFocus={() => setTouched((n) => n + 1)}
                onChange={(event) => {
                  const date = event.target.value
                  if (!date || date > today) return
                  moveWear(logged.id, date)
                  setLogged({ ...logged, date })
                  setTouched((n) => n + 1)
                }}
                className="absolute inset-0 opacity-0"
              />
            </label>
          </span>
          <button
            type="button"
            onClick={() => {
              undoWear(logged.id)
              setLogged(null)
            }}
            className="py-1 text-eyebrow uppercase text-canvas/80 hover:text-canvas"
          >
            Undo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return { logLook, toast }
}
