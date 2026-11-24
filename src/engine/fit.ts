import type { Category, FitNote, Garment } from '../types'
import { outfitSignature } from './score'

/**
 * What her "On me" photos taught the engine. A look's base is its top and bottom, or its
 * dress: shoes, layers and extras don't change how a look sits on her.
 */
export interface FitMemory {
  /** Pieces whose newest judged photo says "Not on me" about them. */
  offPieces: Set<string>
  /** Bases whose newest judged photo says "Fits me". */
  goodBases: Set<string>
  /** Bases whose newest judged photo says "Not on me: the combination". */
  offBases: Set<string>
}

const BASE_CATEGORIES: readonly Category[] = ['top', 'bottom', 'dress']

/** The signature of a look's base (top and bottom, or dress), or null when it has none. */
export function baseSignature(items: Pick<Garment, 'id' | 'category'>[]): string | null {
  const base = items.filter((item) => BASE_CATEGORIES.includes(item.category)).map((item) => item.id)
  return base.length > 0 ? outfitSignature(base) : null
}

export const emptyFit = (): FitMemory => ({ offPieces: new Set(), goodBases: new Set(), offBases: new Set() })

/**
 * Reads her photos, newest verdict first (when she last gave or changed it): for each piece and
 * each base, the newest photo with a verdict decides, so a piece that didn't fit last year and fits now counts as fitting.
 * Photos with no verdict yet teach nothing.
 */
export function buildFit(notes: FitNote[], closet: Pick<Garment, 'id' | 'category'>[]): FitMemory {
  const memory = emptyFit()
  const byId = new Map(closet.map((item) => [item.id, item]))
  const decidedPieces = new Set<string>()
  const decidedBases = new Set<string>()

  const when = (note: FitNote) => note.judgedAt ?? note.createdAt
  // A "Not on me" that names nothing says nothing, so it doesn't decide anything either.
  const says = (note: FitNote) =>
    note.verdict === 'fits' || (note.verdict === 'off' && (note.offItemIds.length > 0 || note.offCombo))
  const judged = notes.filter(says).sort((a, b) => when(b) - when(a))
  for (const note of judged) {
    for (const id of note.itemIds) {
      if (decidedPieces.has(id)) continue
      decidedPieces.add(id)
      if (note.verdict === 'off' && note.offItemIds.includes(id)) memory.offPieces.add(id)
    }
    const pieces = note.itemIds.flatMap((id) => byId.get(id) ?? [])
    const base = baseSignature(pieces)
    if (!base || decidedBases.has(base)) continue
    decidedBases.add(base)
    if (note.verdict === 'fits') memory.goodBases.add(base)
    // A combination needs two base pieces: a dress alone can't clash with itself.
    else if (note.offCombo && base.includes('+')) memory.offBases.add(base)
  }
  return memory
}
