import { useEffect, useState } from 'react'
import { toDay } from '../engine'
import type { Day } from '../types'

/**
 * Today's date, kept current: an iPhone keeps the home-screen app paused in memory, so it
 * can be opened in the morning still showing last night's page. Checks when she comes back
 * to the app and once a minute.
 */
export function useToday(): Day {
  const [today, setToday] = useState(() => toDay(Date.now()))
  useEffect(() => {
    const check = () => setToday(toDay(Date.now()))
    const timer = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return today
}
