import Dexie, { type Table } from 'dexie'
import { outfitSignature } from '../engine'
import { newId } from '../lib/id'
import type { ClothingItem, Day, Outfit, Wear } from '../types'

/** The closet lives in this browser's own database (IndexedDB), photos included. */
class ClosetDatabase extends Dexie {
  items!: Table<ClothingItem, string>
  outfits!: Table<Outfit, string>
  wears!: Table<Wear, string>

  constructor() {
    super('closet')
    this.version(1).stores({
      items: 'id, category, createdAt',
      outfits: 'id, &signature, status, createdAt',
    })
    // Version 2 only adds what she wore; pieces and looks are untouched.
    this.version(2).stores({
      wears: 'id, date',
    })
  }
}

export const db = new ClosetDatabase()

export const saveItem = (item: ClothingItem) => db.items.put(item)

/**
 * Removes a piece and every look that needed it, so no look points at a missing photo.
 * Days she wore it keep the other pieces; a day left empty goes.
 */
export function deleteItem(id: string) {
  return db.transaction('rw', [db.items, db.outfits, db.wears], async () => {
    await db.outfits.filter((outfit) => outfit.itemIds.includes(id)).delete()
    await removeFromWears(id, db.wears.filter((wear) => wear.itemIds.includes(id)).toArray())
    await db.items.delete(id)
  })
}

async function removeFromWears(id: string, entries: Promise<Wear[]>) {
  for (const wear of await entries) {
    const itemIds = wear.itemIds.filter((other) => other !== id)
    if (itemIds.length === 0) await db.wears.delete(wear.id)
    else await db.wears.update(wear.id, { itemIds })
  }
}

/** Logs a whole look as worn on a day. Returns the entry's id, for undo. */
export async function logWear(itemIds: string[], date: Day, id = newId()): Promise<string> {
  await db.wears.put({ id, date, itemIds, createdAt: Date.now() })
  return id
}

export const moveWear = (id: string, date: Day) => db.wears.update(id, { date })
export const undoWear = (id: string) => db.wears.delete(id)

/** Adds one piece to the day's outfit (pieces logged one by one join the same day). */
export function wearPiece(itemId: string, date: Day) {
  return db.transaction('rw', db.wears, async () => {
    const entries = await db.wears.where('date').equals(date).sortBy('createdAt')
    if (entries.some((wear) => wear.itemIds.includes(itemId))) return
    const latest = entries.at(-1)
    if (latest) await db.wears.update(latest.id, { itemIds: [...latest.itemIds, itemId] })
    else await db.wears.put({ id: newId(), date, itemIds: [itemId], createdAt: Date.now() })
  })
}

/** Takes one piece back out of a day's outfit. */
export function unwearPiece(itemId: string, date: Day) {
  return db.transaction('rw', db.wears, () =>
    removeFromWears(itemId, db.wears.where('date').equals(date).toArray()),
  )
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
