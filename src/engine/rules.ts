import type { Garment, Occasion, Pattern, Season, SuggestionFilters } from '../types'
import { colorsClash } from './color'

/** Patterns that compete for attention. Stripes and dots are quiet enough to mix. */
const BOLD_PATTERNS: ReadonlySet<Pattern> = new Set<Pattern>(['plaid', 'floral', 'animal', 'graphic'])

export const isBold = (pattern: Pattern) => BOLD_PATTERNS.has(pattern)

/** The values every item shares. An item with an empty list accepts anything. */
export function sharedValues<T>(lists: T[][]): T[] | 'any' {
  const specific = lists.filter((list) => list.length > 0)
  if (specific.length === 0) return 'any'
  return specific.reduce((shared, list) => shared.filter((value) => list.includes(value)))
}

const overlaps = <T,>(shared: T[] | 'any') => shared === 'any' || shared.length > 0
const includes = <T,>(shared: T[] | 'any', value: T) => shared === 'any' || shared.includes(value)

export const sharedSeasons = (items: Garment[]): Season[] | 'any' =>
  sharedValues(items.map((item) => item.seasons))

export const sharedOccasions = (items: Garment[]): Occasion[] | 'any' =>
  sharedValues(items.map((item) => item.occasions))

/** Could these two pieces ever be worn together? Used to rule out combinations quickly. */
export function pairCompatible(a: Garment, b: Garment): boolean {
  if (Math.abs(a.formality - b.formality) > 1) return false
  if (isBold(a.pattern) && isBold(b.pattern)) return false
  if (colorsClash(a.colors[0], b.colors[0])) return false
  return overlaps(sharedSeasons([a, b])) && overlaps(sharedOccasions([a, b]))
}

/** The hard rules: an outfit that fails any of these is never shown. */
export function outfitAllowed(items: Garment[]): boolean {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (!pairCompatible(items[i], items[j])) return false
    }
  }
  return overlaps(sharedSeasons(items)) && overlaps(sharedOccasions(items))
}

/** Does a single piece fit the chosen filters? */
export function itemMatchesFilters(item: Garment, filters: SuggestionFilters): boolean {
  if (filters.formality && Math.abs(item.formality - filters.formality) > 1) return false
  if (filters.season && item.seasons.length > 0 && !item.seasons.includes(filters.season)) return false
  if (filters.occasion && item.occasions.length > 0 && !item.occasions.includes(filters.occasion)) return false
  return true
}

/** Does the outfit as a whole fit the chosen season and occasion? */
export function outfitMatchesFilters(items: Garment[], filters: SuggestionFilters): boolean {
  if (filters.season && !includes(sharedSeasons(items), filters.season)) return false
  if (filters.occasion && !includes(sharedOccasions(items), filters.occasion)) return false
  return true
}
