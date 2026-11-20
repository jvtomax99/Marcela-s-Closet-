import type { Category, Day, Garment, Outfit, Suggestion, SuggestionFilters, Wear } from '../types'
import { CORE_CATEGORIES, itemMatchesFilters, outfitAllowed, outfitMatchesFilters, pairCompatible } from './rules'
import { buildTaste, outfitSignature, scoreOutfit, whyItWorks, type Taste, type WearContext } from './score'
import { buildWearHistory } from './wear'

/** How many of the best outfits get optional layers added. Keeps big closets fast. */
const MAX_FINISHED = 300
const MAX_ACCESSORIES = 2
/** A finishing piece may cost a few points: a look with a bag beats a slightly tidier one without. */
const FINISHING_TOLERANCE = 5
/** Score taken off for each repeated piece, so the results show variety. */
const REPEAT_PENALTY = 5

export { CORE_CATEGORIES }

interface Candidate {
  items: Garment[]
  score: number
}

const byId = (a: Garment, b: Garment) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
const signatureOf = (items: Garment[]) => outfitSignature(items.map((item) => item.id))

/** Every valid base: (top + bottom) or dress, plus shoes. */
function coreOutfits(pool: Garment[]): Garment[][] {
  const inCategory = (category: Category) =>
    pool.filter((item) => item.category === category).sort(byId)

  const bases: Garment[][] = inCategory('dress').map((dress) => [dress])
  const bottoms = inCategory('bottom')
  for (const top of inCategory('top')) {
    for (const bottom of bottoms) {
      if (pairCompatible(top, bottom)) bases.push([top, bottom])
    }
  }

  const shoes = inCategory('shoes')
  return bases.flatMap((base) =>
    shoes.filter((pair) => base.every((item) => pairCompatible(item, pair))).map((pair) => [...base, pair]),
  )
}

/** Outerwear belongs on cold-weather looks unless it was asked for by name. */
function wantsOuterwear(items: Garment[], filters: SuggestionFilters): boolean {
  if (filters.season) return filters.season === 'fall' || filters.season === 'winter'
  return items.every(
    (item) => item.seasons.length === 0 || item.seasons.includes('fall') || item.seasons.includes('winter'),
  )
}

/** Adds the single best compatible piece, unless every option costs too much. */
function addBest(
  items: Garment[],
  options: Garment[],
  taste: Taste,
  filters: SuggestionFilters,
  wear?: WearContext,
): Garment[] {
  const current = scoreOutfit(items, taste, wear).score
  let best: { items: Garment[]; score: number } | null = null

  for (const option of options) {
    if (items.includes(option)) continue
    const next = [...items, option]
    if (!outfitAllowed(next) || !outfitMatchesFilters(next, filters)) continue
    const score = scoreOutfit(next, taste, wear).score
    if (score >= current - FINISHING_TOLERANCE && (!best || score > best.score)) {
      best = { items: next, score }
    }
  }
  return best ? best.items : items
}

function finish(
  core: Garment[],
  pool: Garment[],
  taste: Taste,
  filters: SuggestionFilters,
  wear?: WearContext,
): Garment[] {
  const optional = (category: Category) => pool.filter((item) => item.category === category).sort(byId)
  let items = core

  if (wantsOuterwear(items, filters)) items = addBest(items, optional('outerwear'), taste, filters, wear)
  items = addBest(items, optional('bag'), taste, filters, wear)
  for (let i = 0; i < MAX_ACCESSORIES; i++) {
    items = addBest(items, optional('accessory'), taste, filters, wear)
  }
  return items
}

/** Picks the best outfits while avoiding the same pieces over and over. */
function pickVaried(candidates: Candidate[], limit: number): Candidate[] {
  const remaining = [...candidates]
  const uses = new Map<string, number>()
  const picked: Candidate[] = []

  while (picked.length < limit && remaining.length > 0) {
    let bestIndex = 0
    let bestValue = -Infinity
    remaining.forEach((candidate, index) => {
      const repeats = candidate.items.reduce((sum, item) => sum + (uses.get(item.id) ?? 0), 0)
      const value = candidate.score - repeats * REPEAT_PENALTY
      if (value > bestValue) {
        bestValue = value
        bestIndex = index
      }
    })
    const [chosen] = remaining.splice(bestIndex, 1)
    picked.push(chosen)
    for (const item of chosen.items) uses.set(item.id, (uses.get(item.id) ?? 0) + 1)
  }
  return picked
}

/**
 * The suggestion engine. Same closet + same filters = same answer, so results stay explainable.
 * It only ever combines the items it is given.
 * `worn` is what she logged and today's date: recent pieces and looks drop, forgotten ones rise.
 */
export function suggestOutfits(
  closet: Garment[],
  filters: SuggestionFilters = {},
  history: Outfit[] = [],
  limit = 12,
  worn?: { wears: Wear[]; today: Day },
): Suggestion[] {
  const anchor = filters.anchorId ? closet.find((item) => item.id === filters.anchorId) : undefined
  if (filters.anchorId && !anchor) return []

  // The chosen piece stays in even if it falls outside a filter: it was asked for by name.
  const pool = closet.filter((item) => item === anchor || itemMatchesFilters(item, filters))
  const taste = buildTaste(history)
  const wear: WearContext | undefined = worn && {
    history: buildWearHistory(worn.wears, worn.today),
    today: worn.today,
    exemptId: anchor?.id,
  }
  const hidden = new Set(history.filter((look) => look.status === 'hidden').map((look) => look.signature))

  const anchorIsOptional = anchor !== undefined && !CORE_CATEGORIES.includes(anchor.category)

  const cores = coreOutfits(pool)
    .filter((items) => !anchor || anchorIsOptional || items.includes(anchor))
    .map((items) => (anchor && anchorIsOptional ? [...items, anchor] : items))
    .filter((items) => outfitAllowed(items) && outfitMatchesFilters(items, filters))
    .map((items) => ({ items, score: scoreOutfit(items, taste, wear).score }))
    .sort((a, b) => b.score - a.score || signatureOf(a.items).localeCompare(signatureOf(b.items)))
    .slice(0, MAX_FINISHED)

  const seen = new Set<string>()
  const finished: Candidate[] = []
  for (const core of cores) {
    const items = finish(core.items, pool, taste, filters, wear)
    const signature = signatureOf(items)
    if (seen.has(signature) || hidden.has(signature)) continue
    seen.add(signature)
    finished.push({ items, score: scoreOutfit(items, taste, wear).score })
  }

  return pickVaried(finished, limit).map(({ items, score }) => ({
    signature: signatureOf(items),
    items,
    score,
    why: whyItWorks(scoreOutfit(items, taste, wear)),
  }))
}
