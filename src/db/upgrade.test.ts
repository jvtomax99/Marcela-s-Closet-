import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { expect, it } from 'vitest'

// Her phone already holds a version-1 closet. Opening it with today's code must keep everything.
it('opens a version-1 closet with every piece and look intact', async () => {
  const old = new Dexie('closet')
  old.version(1).stores({
    items: 'id, category, createdAt',
    outfits: 'id, &signature, status, createdAt',
  })
  await old.table('items').put({ id: 'a', name: 'Silk blouse', category: 'top', createdAt: 1 })
  await old.table('outfits').put({ id: 'o', signature: 'a+b', itemIds: ['a', 'b'], status: 'saved', createdAt: 1 })
  old.close()

  const { db } = await import('./index')
  expect(db.isOpen()).toBe(false)
  await db.open()
  expect(db.verno).toBe(2)
  expect(await db.items.get('a')).toMatchObject({ name: 'Silk blouse' })
  expect(await db.outfits.get('o')).toMatchObject({ status: 'saved' })
  expect(await db.wears.count()).toBe(0)
})
