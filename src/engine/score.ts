import type { Day, Garment, Outfit, Pattern } from '../types'
import { harmonyOf, isNeutral, type Harmony } from './color'
import { CORE_CATEGORIES, isBold, sharedOccasions, sharedSeasons } from './rules'
import { daysUnworn, FORGOTTEN_DAYS, RECENT_DAYS, REPEAT_LOOK_DAYS, spanOfDays, type WearHistory } from './wear'
import { capitalize, joinWithAnd } from '../lib/labels'
import { baseSignature, type FitMemory } from './fit'

const BASE_SCORE = 50

export interface Scored {
  score: number
  /** Strongest reason first. Each is a short clause, ready to show to the person. */
  reasons: { weight: number; text: string; lead?: boolean }[]
}

/** What she wore, as the scoring sees it. */
export interface WearContext {
  history: WearHistory
  today: Day
  /** The piece she asked to build around: never pushed down for being worn recently. */
  exemptId?: string
}

/** Points off for a piece worn 0 (today), 1, 2 or 3 days ago. */
const RECENT_PENALTY = [20, 20, 12, 6]
const REPEAT_LOOK_PENALTY = 30

/** What the app has learned from the lookbook. */
export interface Taste {
  /** Signature → rating, for saved looks. */
  ratedLooks: Map<string, number>
  /** Item id → average rating of the saved looks it appears in. */
  itemRatings: Map<string, number>
  /** Two item ids (sorted, joined) → how many hidden looks paired them. */
  hiddenPairs: Map<string, number>
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

export function outfitSignature(itemIds: string[]): string {
  return [...itemIds].sort().join('+')
}

export function buildTaste(outfits: Outfit[]): Taste {
  const ratedLooks = new Map<string, number>()
  const hiddenPairs = new Map<string, number>()
  const ratingLists = new Map<string, number[]>()

  for (const outfit of outfits) {
    if (outfit.status === 'hidden') {
      for (let i = 0; i < outfit.itemIds.length; i++) {
        for (let j = i + 1; j < outfit.itemIds.length; j++) {
          const key = pairKey(outfit.itemIds[i], outfit.itemIds[j])
          hiddenPairs.set(key, (hiddenPairs.get(key) ?? 0) + 1)
        }
      }
    } else if (outfit.rating > 0) {
      ratedLooks.set(outfit.signature, outfit.rating)
      for (const id of outfit.itemIds) {
        ratingLists.set(id, [...(ratingLists.get(id) ?? []), outfit.rating])
      }
    }
  }

  const itemRatings = new Map<string, number>()
  for (const [id, ratings] of ratingLists) {
    itemRatings.set(id, ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
  }
  return { ratedLooks, itemRatings, hiddenPairs }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const HARMONY_LABEL: Record<Exclude<Harmony, 'clash'>, string> = {
  monochrome: 'tonal',
  analogous: 'neighbors on the color wheel',
  triadic: 'evenly spaced on the color wheel',
  complementary: 'opposites on the color wheel',
}

function scoreColor(items: Garment[]): Scored['reasons'] {
  const mains = items.map((item) => item.colors[0])
  const accents = [...new Set(mains.filter((color) => !isNeutral(color)))]
  const neutrals = [...new Set(mains.filter(isNeutral))]
  const reasons: Scored['reasons'] = []

  if (accents.length === 0) {
    reasons.push({ weight: 10, text: `A quiet palette of ${joinWithAnd(neutrals.slice(0, 3))}` })
  } else if (accents.length === 1) {
    const anchor = neutrals[0]
    reasons.push(
      anchor
        ? { weight: 18, text: `${capitalize(anchor)} lets the ${accents[0]} take the lead` }
        : { weight: 12, text: `Head to toe in ${accents[0]}` },
    )
  } else if (accents.length === 2) {
    const harmony = harmonyOf(accents[0], accents[1])
    const points = harmony === 'complementary' ? 16 : harmony === 'triadic' ? 8 : 14
    if (harmony !== 'clash') {
      const label = HARMONY_LABEL[harmony]
      reasons.push({
        weight: points,
        text: harmony === 'monochrome'
          ? `${capitalize(accents[0])} and ${accents[1]} make a soft tonal pairing`
          : `${capitalize(accents[0])} and ${accents[1]} are ${label}`,
      })
    }
  } else {
    // Three or more colors compete with each other, even when each pair is allowed.
    reasons.push({ weight: -10, text: '' })
  }

  // A detail color repeated elsewhere in the look ties it together.
  const echoed = items.some((item) =>
    item.colors.slice(1).some((color) =>
      items.some((other) => other.id !== item.id && other.colors[0] === color),
    ),
  )
  if (echoed) reasons.push({ weight: 4, text: 'The details echo the main colors' })

  return reasons
}

function scorePattern(items: Garment[]): Scored['reasons'] {
  const patterned = items.filter((item) => item.pattern !== 'solid')
  const bold = patterned.find((item) => isBold(item.pattern))
  if (bold) return [{ weight: 6, text: `The ${patternName(bold.pattern)} is the one statement` }]
  if (patterned.length > 2) return [{ weight: -4, text: '' }]
  return []
}

const patternName = (pattern: Pattern) => (pattern === 'graphic' ? 'graphic print' : pattern)

function scoreFormality(items: Garment[]): Scored['reasons'] {
  const sameLevel = items.every((item) => item.formality === items[0].formality)
  return sameLevel
    ? [{ weight: 8, text: 'Every piece sits at the same level of dressiness' }]
    : [{ weight: 3, text: '' }]
}

function scoreOverlap(items: Garment[]): Scored['reasons'] {
  const seasons = sharedSeasons(items)
  const occasions = sharedOccasions(items)
  const seasonCount = seasons === 'any' ? 4 : seasons.length
  const occasionCount = occasions === 'any' ? 3 : occasions.length
  return [{ weight: Math.min(6, seasonCount + occasionCount), text: '' }]
}

function scoreFavorites(items: Garment[]): Scored['reasons'] {
  const favorites = items.filter((item) => item.favorite)
  if (favorites.length === 0) return []
  return [{
    weight: Math.min(12, favorites.length * 4),
    text: favorites.length === 1
      ? `Features your favorite, ${lowerFirst(favorites[0].name)}`
      : 'Built from your favorites',
  }]
}

function scoreTaste(items: Garment[], taste: Taste): Scored['reasons'] {
  const reasons: Scored['reasons'] = []

  const signature = outfitSignature(items.map((item) => item.id))
  const rating = taste.ratedLooks.get(signature)
  if (rating !== undefined) reasons.push({ weight: (rating - 3) * 3, text: '' })

  let itemTaste = 0
  for (const item of items) {
    const average = taste.itemRatings.get(item.id)
    if (average !== undefined) itemTaste += (average - 3) * 2
  }
  itemTaste = clamp(itemTaste, -10, 10)
  if (itemTaste >= 4) reasons.push({ weight: itemTaste, text: 'Uses pieces from looks you rated highly' })
  else if (itemTaste !== 0) reasons.push({ weight: itemTaste, text: '' })

  let hidden = 0
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      hidden += taste.hiddenPairs.get(pairKey(items[i].id, items[j].id)) ?? 0
    }
  }
  if (hidden > 0) reasons.push({ weight: -Math.min(18, hidden * 3), text: '' })

  return reasons
}

function scoreWear(items: Garment[], wear: WearContext | undefined): Scored['reasons'] {
  if (!wear || wear.history.loggingFor === null) return []
  const { history, today, exemptId } = wear
  const reasons: Scored['reasons'] = []

  let recent = 0
  for (const item of items) {
    if (item.id === exemptId) continue
    const daysAgo = history.lastWorn.get(item.id)
    if (daysAgo !== undefined && daysAgo <= RECENT_DAYS) recent += RECENT_PENALTY[daysAgo]
  }
  if (recent > 0) reasons.push({ weight: -recent, text: '' })

  // The same base (a different bag or necklace doesn't make it a new outfit).
  const core = items.filter((item) => CORE_CATEGORIES.includes(item.category))
  const repeated = history.days.some(
    (day) => day.daysAgo <= REPEAT_LOOK_DAYS && core.every((item) => day.ids.has(item.id)),
  )
  if (repeated) reasons.push({ weight: -REPEAT_LOOK_PENALTY, text: '' })

  const forgotten = items
    .map((item) => ({ item, unworn: daysUnworn(item, history, today) ?? 0 }))
    .filter(({ unworn }) => unworn >= FORGOTTEN_DAYS)
    .sort((a, b) => b.unworn - a.unworn || (a.item.id < b.item.id ? -1 : 1))
  if (forgotten.length > 0) {
    const { item, unworn } = forgotten[0]
    reasons.push({
      weight: forgotten.length === 1 ? 6 : 8,
      text: `Brings back your ${lowerFirst(item.name)}, not worn in ${spanOfDays(unworn)}`,
      lead: true,
    })
  }
  return reasons
}

/** Points off for a piece she said is "Not on me", and for a base she said doesn't work together. */
export const OFF_PIECE_PENALTY = 25
export const OFF_COMBO_PENALTY = 25
/** Points for a base she has seen on herself and said "Fits me". */
export const FITS_BONUS = 8

/**
 * Her "On me" verdicts. Strong, never a ban: a piece she marked off can still show up, and
 * the piece she asked to build around is never pushed down.
 */
/** Her "On me" verdicts, as the scoring sees them. */
export interface FitContext {
  memory: FitMemory
  /** The piece she asked to build around: never pushed down for being "Not on me". */
  exemptId?: string
}

function scoreFit(items: Garment[], context: FitContext | undefined): Scored['reasons'] {
  if (!context) return []
  const { memory: fit, exemptId } = context
  const reasons: Scored['reasons'] = []
  const off = items.filter((item) => item.id !== exemptId && fit.offPieces.has(item.id)).length
  if (off > 0) reasons.push({ weight: -off * OFF_PIECE_PENALTY, text: '' })
  const base = baseSignature(items)
  if (base && fit.offBases.has(base)) reasons.push({ weight: -OFF_COMBO_PENALTY, text: '' })
  else if (base && fit.goodBases.has(base)) {
    reasons.push({ weight: FITS_BONUS, text: "You've seen it on you, and it works", lead: true })
  }
  return reasons
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** Scores an outfit that already passed the hard rules. */
export function scoreOutfit(items: Garment[], taste: Taste, wear?: WearContext, fit?: FitContext): Scored {
  const reasons = [
    ...scoreColor(items),
    ...scorePattern(items),
    ...scoreFormality(items),
    ...scoreOverlap(items),
    ...scoreFavorites(items),
    ...scoreTaste(items, taste),
    ...scoreWear(items, wear),
    ...scoreFit(items, fit),
  ]
  const score = reasons.reduce((total, reason) => total + reason.weight, BASE_SCORE)
  return { score, reasons }
}

/** Turns the strongest reasons into the short "why it works" line. */
export function whyItWorks(scored: Scored): string {
  const lines = scored.reasons
    .filter((reason) => reason.text)
    .sort((a, b) => Number(Boolean(b.lead)) - Number(Boolean(a.lead)) || b.weight - a.weight)
    .slice(0, 2)
    .map((reason) => reason.text)
  return lines.length > 0 ? `${lines.join('. ')}.` : 'A clean, easy combination.'
}
