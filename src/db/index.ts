import Dexie, { type Table } from 'dexie'
import { outfitSignature } from '../engine'
import { newId } from '../lib/id'
import type { ClothingItem, Outfit } from '../types'

/** The closet lives in this browser's own database (IndexedDB), photos included. */
class ClosetDatabase extends Dexie {
  items!: Table<ClothingItem, string>
  outfits!: Table<Outfit, string>

  constructor() {
    super('closet')
    this.version(1).stores({
      items: 'id, category, createdAt',
      outfits: 'id, &signature, status, createdAt',
    })
  }
}

export const db = new ClosetDatabase()

export const saveItem = (item: ClothingItem) => db.items.put(item)

/** Removes a piece and every look that needed it, so no look points at a missing photo. */
export function deleteItem(id: string) {
  return db.transaction('rw', db.items, db.outfits, async () => {
    await db.outfits.filter((outfit) => outfit.itemIds.includes(id)).delete()
    await db.items.delete(id)
  })
}

async function recordLook(itemIds: string[], status: Outfit['status'], name: string) {
  const signature = outfitSignature(itemIds)
  const existing = await db.outfits.where('signature').equals(signature).first()
  await db.outfits.put({
    id: existing?.id ?? newId(),
    signature,
    itemIds,
    status,
    name: existing?.name || name,
    rating: existing?.rating ?? 0,
    createdAt: existing?.createdAt ?? Date.now(),
  })
}

export const saveLook = (itemIds: string[], name: string) => recordLook(itemIds, 'saved', name)
export const hideLook = (itemIds: string[]) => recordLook(itemIds, 'hidden', '')

export const removeLook = (id: string) => db.outfits.delete(id)
export const renameLook = (id: string, name: string) => db.outfits.update(id, { name })
export const rateLook = (id: string, rating: number) => db.outfits.update(id, { rating })

export const restoreHiddenLooks = () => db.outfits.where('status').equals('hidden').delete()
