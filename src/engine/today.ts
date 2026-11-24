import type { Day, FitNote, Garment, Outfit, Season, Suggestion, Wear } from '../types'
import { suggestOutfits } from './suggest'

/** How many of the best looks take turns as Today's look: one a day, a week's worth. */
export const TODAY_CHOICES = 7

/**
 * How far down the list today's pick may slip (after a hide or a new piece shifts the
 * scores) and still stay today's pick.
 */
const KEEP_WITHIN = 40

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

/** What the app remembers about Today's look, on the phone (not in the closet database). */
export interface TodayMemory {
  day: Day
  /** The look shown today, so it stays put all day whatever else changes. */
  pick: string | null
  /** Looks she passed on today with "Another". */
  skipped: string[]
  /** The last day's pick, so tomorrow doesn't open on the same look. */
  previous: string | null
}

/** The best looks for today's season (any season if none fits), scored as of this morning. */
function candidates(
  closet: Garment[],
  history: Outfit[],
  wears: Wear[],
  today: Day,
  limit: number,
  onMe: FitNote[],
): Suggestion[] {
  // What she wore before today: logging today doesn't reshuffle anything.
  const worn = { wears: wears.filter((wear) => wear.date < today), today }
  const looks = suggestOutfits(closet, { season: seasonOf(today) }, history, limit, worn, onMe)
  return looks.length > 0 ? looks : suggestOutfits(closet, {}, history, limit, worn, onMe)
}

/**
 * The looks that take turns as Today's look, in today's order. The best few rotate by day,
 * so the pick changes tomorrow even if nothing else does.
 */
export function todaysLooks(
  closet: Garment[],
  history: Outfit[],
  wears: Wear[],
  today: Day,
  onMe: FitNote[] = [],
): Suggestion[] {
  return inTurn(candidates(closet, history, wears, today, TODAY_CHOICES, onMe), today)
}

/** The first few looks, starting from a different one each day. */
function inTurn(looks: Suggestion[], today: Day): Suggestion[] {
  const best = looks.slice(0, TODAY_CHOICES)
  if (best.length === 0) return []
  const start = dayNumber(today) % best.length
  return [...best.slice(start), ...best.slice(0, start)]
}

/**
 * Today's look. Keeps the look already shown today unless it can no longer be made (a piece
 * gone, the look hidden). Otherwise takes the next look in today's turn that she hasn't
 * passed on today and that wasn't the last day's pick. Returns what to remember.
 */
export function todaysPick(
  closet: Garment[],
  history: Outfit[],
  wears: Wear[],
  today: Day,
  memory: TodayMemory | null,
  onMe: FitNote[] = [],
): { look: Suggestion | undefined; memory: TodayMemory; choices: number } {
  const fresh: TodayMemory =
    memory?.day === today
      ? memory
      : { day: today, pick: null, skipped: [], previous: memory?.pick ?? memory?.previous ?? null }

  // One run of the engine: the best few take turns, the longer list lets today's pick stay.
  // (The engine picks greedily, so the first few of a long list are the same as a short one.)
  const pool = candidates(closet, history, wears, today, KEEP_WITHIN, onMe)
  const turn = inTurn(pool, today)
  if (turn.length === 0) return { look: undefined, memory: fresh, choices: 0 }

  if (fresh.pick) {
    const kept = pool.find((look) => look.signature === fresh.pick)
    if (kept) return { look: kept, memory: fresh, choices: turn.length }
  }

  const open = (skipped: string[]) =>
    turn.find((look) => !skipped.includes(look.signature) && look.signature !== fresh.previous) ??
    turn.find((look) => !skipped.includes(look.signature))
  let skipped = fresh.skipped
  let look = open(skipped)
  if (!look) {
    // She passed on every one: start the round again.
    skipped = []
    look = open(skipped)!
  }
  return { look, memory: { ...fresh, pick: look.signature, skipped }, choices: turn.length }
}

/** "Another": passes on today's pick, so the next one in the turn shows. */
export function passOn(memory: TodayMemory): TodayMemory {
  if (!memory.pick) return memory
  return { ...memory, pick: null, skipped: [...memory.skipped, memory.pick] }
}
