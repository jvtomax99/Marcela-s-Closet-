import type { Day, Garment, Wear } from '../types'

/** A piece worn this recently (in days, 0 = today) is pushed down. */
export const RECENT_DAYS = 3
/** The same look worn this recently is pushed far down. */
export const REPEAT_LOOK_DAYS = 14
/** A piece not worn for this long is "forgotten" and gently brought back. */
export const FORGOTTEN_DAYS = 30

/** What the app knows about what she wore, relative to one day. */
export interface WearHistory {
  /** Item id → days since it was last worn. */
  lastWorn: Map<string, number>
  /** Each logged day: how long ago, and every piece worn that day. */
  days: { date: Day; daysAgo: number; ids: Set<string> }[]
  /**
   * Days since she started logging, or null if she never has. A backdated entry counts from when
   * it was logged, so picking last year by mistake doesn't make every piece "forgotten" at once.
   */
  loggingFor: number | null
}

const pad = (n: number) => String(n).padStart(2, '0')

/** A moment as a day on this phone (local time, so a late-evening log lands on the right day). */
export function toDay(ms: number): Day {
  const date = new Date(ms)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const dayNumber = (day: Day) => {
  const [y, m, d] = day.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

/** Whole days from `from` to `to` (positive when `from` is earlier). */
export const daysBetween = (from: Day, to: Day) => Math.round(dayNumber(to) - dayNumber(from))

export function buildWearHistory(wears: Wear[], today: Day): WearHistory {
  const byDay = new Map<Day, Set<string>>()
  for (const wear of wears) {
    if (wear.date > today) continue
    const ids = byDay.get(wear.date) ?? new Set<string>()
    for (const id of wear.itemIds) ids.add(id)
    byDay.set(wear.date, ids)
  }

  const lastWorn = new Map<string, number>()
  const days: WearHistory['days'] = []
  let loggingFor: number | null = null
  for (const wear of wears) {
    if (wear.date > today) continue
    const logged = toDay(wear.createdAt)
    const since = daysBetween(logged > wear.date ? logged : wear.date, today)
    if (loggingFor === null || since > loggingFor) loggingFor = since
  }
  for (const [date, ids] of byDay) {
    const daysAgo = daysBetween(date, today)
    days.push({ date, daysAgo, ids })
    for (const id of ids) {
      const known = lastWorn.get(id)
      if (known === undefined || daysAgo < known) lastWorn.set(id, daysAgo)
    }
  }
  days.sort((a, b) => a.daysAgo - b.daysAgo)
  return { lastWorn, days, loggingFor }
}

/**
 * Days since a piece was last worn, counting a never-worn piece from when it could first have
 * been logged (it was added, or logging started, whichever is later). Null with no logs at all.
 */
export function daysUnworn(item: Garment, history: WearHistory, today: Day): number | null {
  if (history.loggingFor === null) return null
  const worn = history.lastWorn.get(item.id)
  if (worn !== undefined) return Math.min(worn, history.loggingFor)
  const added = item.createdAt === undefined ? Infinity : daysBetween(toDay(item.createdAt), today)
  return Math.min(history.loggingFor, added)
}

function isForgotten(item: Garment, history: WearHistory, today: Day): boolean {
  const unworn = daysUnworn(item, history, today)
  return unworn !== null && unworn >= FORGOTTEN_DAYS
}

/** The pieces she hasn't worn in a month or more. Empty until she has logged something. */
export function forgottenPieces<T extends Garment>(items: T[], wears: Wear[], today: Day): T[] {
  const history = buildWearHistory(wears, today)
  return items.filter((item) => isForgotten(item, history, today))
}

/** How many logged days include every one of these pieces, and the last such day. */
export function wearStats(itemIds: string[], wears: Wear[], today: Day) {
  const { days } = buildWearHistory(wears, today)
  const matching = days.filter((day) => itemIds.every((id) => day.ids.has(id)))
  return { times: matching.length, last: matching[0]?.date ?? null }
}

/** "6 weeks", "10 days", "3 months": for the "why it works" line. */
export function spanOfDays(days: number): string {
  if (days < 14) return `${days} days`
  if (days < 60) return `${Math.round(days / 7)} weeks`
  return `${Math.round(days / 30)} months`
}
