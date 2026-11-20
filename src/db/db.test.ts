import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ClothingItem } from '../types'
import {
  db,
  deleteItem,
  hideLook,
  logWear,
  rateLook,
  restoreHiddenLooks,
  saveItem,
  saveLook,
  unwearPiece,
  wearPiece,
} from './index'

const piece = (id: string): ClothingItem => ({
  id,
  name: id,
  category: 'top',
  colors: ['black'],
  pattern: 'solid',
  formality: 3,
  seasons: [],
  occasions: [],
  favorite: false,
  photo: new Blob(['photo']),
  fabric: null,
  tags: [],
  createdAt: 0,
})

beforeEach(async () => {
  await db.items.clear()
  await db.outfits.clear()
  await db.wears.clear()
})

describe('looks', () => {
  it('treats the same pieces in any order as one look', async () => {
    await saveLook(['a', 'b'], 'First')
    await saveLook(['b', 'a'], 'Second')
    const looks = await db.outfits.toArray()
    expect(looks).toHaveLength(1)
    expect(looks[0].name).toBe('First')
  })

  it('keeps the rating when a look is saved again', async () => {
    await saveLook(['a', 'b'], 'First')
    const [look] = await db.outfits.toArray()
    await rateLook(look.id, 4)
    await saveLook(['a', 'b'], 'First')
    expect((await db.outfits.toArray())[0].rating).toBe(4)
  })

  it('can move a hidden look back to saved', async () => {
    await hideLook(['a', 'b'])
    await saveLook(['a', 'b'], 'Changed my mind')
    expect((await db.outfits.toArray())[0].status).toBe('saved')
  })

  it('restores hidden looks without touching saved ones', async () => {
    await hideLook(['a', 'b'])
    await saveLook(['c', 'd'], 'Keeper')
    await restoreHiddenLooks()
    const looks = await db.outfits.toArray()
    expect(looks.map((look) => look.name)).toEqual(['Keeper'])
  })
})

describe('deleting a piece', () => {
  it('also removes the looks that used it', async () => {
    await saveItem(piece('a'))
    await saveItem(piece('b'))
    await saveLook(['a', 'b'], 'Uses a')
    await saveLook(['b', 'c'], 'Keeps going')
    await deleteItem('a')
    expect(await db.items.count()).toBe(1)
    expect((await db.outfits.toArray()).map((look) => look.name)).toEqual(['Keeps going'])
  })
})

describe('what she wore', () => {
  it('joins pieces logged one by one into the same day', async () => {
    await wearPiece('a', '2026-11-20')
    await wearPiece('b', '2026-11-20')
    await wearPiece('b', '2026-11-20')
    const wears = await db.wears.toArray()
    expect(wears).toHaveLength(1)
    expect(wears[0].itemIds).toEqual(['a', 'b'])
  })

  it('takes a piece back out, and drops a day left empty', async () => {
    await wearPiece('a', '2026-11-20')
    await wearPiece('b', '2026-11-20')
    await unwearPiece('a', '2026-11-20')
    expect((await db.wears.toArray())[0].itemIds).toEqual(['b'])
    await unwearPiece('b', '2026-11-20')
    expect(await db.wears.count()).toBe(0)
  })

  it('keeps the rest of a day when a piece is deleted', async () => {
    await saveItem(piece('a'))
    await saveItem(piece('b'))
    await logWear(['a', 'b'], '2026-11-19')
    await logWear(['a'], '2026-11-18')
    await deleteItem('a')
    const wears = await db.wears.toArray()
    expect(wears).toHaveLength(1)
    expect(wears[0].itemIds).toEqual(['b'])
  })
})
