import type { Day, Garment, Outfit, Season, Suggestion, Wear } from '../types'
import { suggestOutfits } from './suggest'

/** How many of the best looks take turns as Today's look: one a day, a week's worth. */
export const TODAY_CHOICES = 7

/** Today's season from the month, northern hemisphere (Jose, 2026-11-22). */
export function seasonOf(day: Day): Season {
  const month = Number(day.slice(5, 7))
  if (month === 12 || month <= 2) return 'winter'
  if (month <= 5) return 'spring'
  if (month <= 8) return 'summer'
  return 'fall'
}

/** A running day count for a YYYY-MM-DD day, so the looks can take turns. */
function dayNumber(day: Day): number {
  const [y, m, d] = day.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

/**
 * The looks that take turns as Today's look, in order: the first is today's pick, and
 * "Another" walks down the list. The best looks for today's season (any season if none
 * fits), scored with what she wore before today, so logging today doesn't reshuffle them.
 * They take turns by day, so the pick changes tomorrow even if nothing else does.
 */
export function todaysLooks(closet: Garment[], history: Outfit[], wears: Wear[], today: Day): Suggestion[] {
  const worn = { wears: wears.filter((wear) => wear.date < today), today }
  let looks = suggestOutfits(closet, { season: seasonOf(today) }, history, TODAY_CHOICES, worn)
  if (looks.length === 0) looks = suggestOutfits(closet, {}, history, TODAY_CHOICES, worn)
  if (looks.length === 0) return []
  const start = dayNumber(today) % looks.length
  return [...looks.slice(start), ...looks.slice(0, start)]
}
