import type { ClothingItem, Outfit, Wear } from '../types'
import { db } from './index'

/** Everything in the closet, photos included, as one file that can be saved anywhere. */
interface BackupFile {
  app: 'closet'
  version: 1
  exportedAt: number
  items: (Omit<ClothingItem, 'photo'> & { photo: { type: string; base64: string } })[]
  outfits: Outfit[]
  /** Added with wear tracking. Older files have none, and older app versions ignore it. */
  wears?: Wear[]
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function fromBase64(base64: string, type: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

export async function exportCloset(): Promise<File> {
  const [items, outfits, wears] = await Promise.all([
    db.items.toArray(),
    db.outfits.toArray(),
    db.wears.toArray(),
  ])
  const backup: BackupFile = {
    app: 'closet',
    version: 1,
    exportedAt: Date.now(),
    items: await Promise.all(
      items.map(async (item) => ({
        ...item,
        photo: { type: item.photo.type, base64: await toBase64(item.photo) },
      })),
    ),
    outfits,
    wears,
  }
  const date = new Date().toISOString().slice(0, 10)
  return new File([JSON.stringify(backup)], `closet-backup-${date}.json`, { type: 'application/json' })
}

function isBackup(value: unknown): value is BackupFile {
  const data = value as BackupFile
  return data?.app === 'closet' && Array.isArray(data.items) && Array.isArray(data.outfits)
}

/**
 * Adds a backup's pieces and looks to this closet. Nothing already here is removed;
 * a piece or look that exists in both is replaced by the backup's version.
 */
export async function importCloset(file: Blob): Promise<{ items: number; outfits: number; wears: number }> {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('not-a-backup')
  }
  if (!isBackup(data)) throw new Error('not-a-backup')
  const backup = data

  const items: ClothingItem[] = backup.items.map((item) => ({
    ...item,
    photo: fromBase64(item.photo.base64, item.photo.type),
  }))

  const wears = Array.isArray(backup.wears) ? backup.wears : []

  await db.transaction('rw', [db.items, db.outfits, db.wears], async () => {
    await db.items.bulkPut(items)
    for (const outfit of backup.outfits) {
      // The same look may already exist here under another id; keep one copy.
      const existing = await db.outfits.where('signature').equals(outfit.signature).first()
      await db.outfits.put({ ...outfit, id: existing?.id ?? outfit.id })
    }
    await db.wears.bulkPut(wears)
  })
  return { items: items.length, outfits: backup.outfits.length, wears: wears.length }
}
