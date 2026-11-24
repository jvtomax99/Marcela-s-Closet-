import { baseSignature } from '../engine'
import type { ClothingItem, OnMePhoto } from '../types'

/**
 * Her photos by the base they show (top and bottom, or dress), newest first, so a look card
 * can show "On you" when she has a photo wearing the same base.
 */
export function photosByBase(photos: OnMePhoto[], byId: Map<string, ClothingItem>): Map<string, OnMePhoto[]> {
  const map = new Map<string, OnMePhoto[]>()
  for (const photo of [...photos].sort((a, b) => b.createdAt - a.createdAt)) {
    const base = baseSignature(photo.itemIds.flatMap((id) => byId.get(id) ?? []))
    if (!base) continue
    map.set(base, [...(map.get(base) ?? []), photo])
  }
  return map
}

/** The photos that show a look's base, newest first. */
export function photosOfLook(
  items: Pick<ClothingItem, 'id' | 'category'>[],
  byBase: Map<string, OnMePhoto[]>,
): OnMePhoto[] {
  const base = baseSignature(items)
  return base ? (byBase.get(base) ?? []) : []
}
