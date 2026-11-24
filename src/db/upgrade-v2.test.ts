import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { expect, it } from 'vitest'

// Since wear tracking her phone holds a version-2 closet. The "On me" photos must not lose any of it.
it('opens a version-2 closet with pieces, looks and what she wore intact', async () => {
  const old = new Dexie('closet')
  old.version(1).stores({
    items: 'id, category, createdAt',
    outfits: 'id, &signature, status, createdAt',
  })
  old.version(2).stores({ wears: 'id, date' })
  await old.table('items').put({ id: 'a', name: 'Silk blouse', category: 'top', createdAt: 1 })
  await old.table('outfits').put({ id: 'o', signature: 'a+b', itemIds: ['a', 'b'], status: 'saved', createdAt: 1 })
  await old.table('wears').put({ id: 'w', date: '2026-11-20', itemIds: ['a'], createdAt: 1 })
  old.close()

  const { db } = await import('./index')
  await db.open()
  expect(db.verno).toBe(3)
  expect(await db.items.get('a')).toMatchObject({ name: 'Silk blouse' })
  expect(await db.outfits.get('o')).toMatchObject({ status: 'saved' })
  expect(await db.wears.get('w')).toMatchObject({ date: '2026-11-20' })
  expect(await db.onMe.count()).toBe(0)
})
