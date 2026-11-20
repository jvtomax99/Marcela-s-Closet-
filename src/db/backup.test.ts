import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ClothingItem } from '../types'
import { exportCloset, importCloset } from './backup'
import { db, logWear, saveItem, saveLook } from './index'

const photoBytes = new Uint8Array(70_000).map((_, i) => (i * 31) % 256)

const piece = (id: string): ClothingItem => ({
  id,
  name: `Piece ${id}`,
  category: 'top',
  colors: ['navy', 'white'],
  pattern: 'stripes',
  formality: 2,
  seasons: ['spring'],
  occasions: ['weekend'],
  favorite: true,
  photo: new Blob([photoBytes], { type: 'image/jpeg' }),
  fabric: 'cotton',
  tags: ['vintage'],
  createdAt: 123,
})

beforeEach(async () => {
  await db.items.clear()
  await db.outfits.clear()
  await db.wears.clear()
})

describe('backup', () => {
  it('restores pieces, photos and looks exactly', async () => {
    await saveItem(piece('a'))
    await saveItem(piece('b'))
    await saveLook(['a', 'b'], 'Weekend')
    const file = await exportCloset()

    await db.items.clear()
    await db.outfits.clear()
    expect(await importCloset(file)).toEqual({ items: 2, outfits: 1, wears: 0 })

    const restored = await db.items.get('a')
    expect({ ...restored, photo: undefined }).toEqual({ ...piece('a'), photo: undefined })
    expect(restored?.photo.type).toBe('image/jpeg')
    expect(new Uint8Array(await restored!.photo.arrayBuffer())).toEqual(photoBytes)
    expect((await db.outfits.toArray())[0].name).toBe('Weekend')
  })

  it('merges into an existing closet without duplicating looks', async () => {
    await saveItem(piece('a'))
    await saveItem(piece('b'))
    await saveLook(['a', 'b'], 'Weekend')
    const file = await exportCloset()

    await db.outfits.clear()
    await saveLook(['b', 'a'], 'Saved again here')
    await saveItem(piece('c'))
    await importCloset(file)

    expect(await db.items.count()).toBe(3)
    expect(await db.outfits.count()).toBe(1)
  })

  it('carries what she wore', async () => {
    await saveItem(piece('a'))
    await logWear(['a'], '2026-11-19')
    const file = await exportCloset()
    await db.wears.clear()
    expect((await importCloset(file)).wears).toBe(1)
    expect((await db.wears.toArray())[0]).toMatchObject({ date: '2026-11-19', itemIds: ['a'] })
  })

  it('still restores a backup made before wear tracking', async () => {
    await saveItem(piece('a'))
    const file = await exportCloset()
    const old = JSON.parse(await file.text())
    delete old.wears
    await db.items.clear()
    expect(await importCloset(new Blob([JSON.stringify(old)]))).toEqual({ items: 1, outfits: 0, wears: 0 })
    expect(await db.items.count()).toBe(1)
  })

  it('rejects a file that is not a closet backup', async () => {
    await expect(importCloset(new Blob(['{"hello":1}']))).rejects.toThrow('not-a-backup')
    await expect(importCloset(new Blob(['not json']))).rejects.toThrow('not-a-backup')
  })
})
