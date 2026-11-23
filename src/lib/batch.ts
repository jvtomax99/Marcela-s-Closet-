import type { Category, ClothingItem, ColorName } from '../types'
import { autoName } from './labels'

/** At most this many photos in one round, so an older iPhone doesn't run out of memory. */
export const MAX_BATCH = 20

/** What a quick add leaves at its default; she can change any of it later. */
export const QUICK_DEFAULTS: Readonly<
  Pick<ClothingItem, 'pattern' | 'fabric' | 'formality' | 'favorite'>
> = { pattern: 'solid', fabric: null, formality: 2, favorite: false }

/** One photo in the "Add several" tray. */
export interface Draft {
  key: string
  /** 'reading' until the photo is shrunk and its color read. */
  status: 'reading' | 'ready' | 'failed'
  photo: Blob | null
  color: ColorName | null
  category: Category | null
}

/** Photos that will be saved: read, with a color. */
export const savable = (drafts: Draft[]) => drafts.filter((draft) => draft.status === 'ready')

/** How many savable photos still need a type. */
export const missingTypes = (drafts: Draft[]) => savable(drafts).filter((draft) => !draft.category).length

/** The type every card shares, or null when they differ or some have none. */
export function sharedType(drafts: Draft[]): Category | null {
  const ready = savable(drafts)
  const first = ready[0]?.category ?? null
  return first && ready.every((draft) => draft.category === first) ? first : null
}

/**
 * The pieces to save, in the order she picked them. Closet shows the newest first, so the
 * first photo gets the latest time and stays first.
 */
export function toPieces(drafts: Draft[], now: number): ClothingItem[] {
  return savable(drafts).flatMap((draft, index) => {
    if (!draft.photo || !draft.color || !draft.category) return []
    return [
      {
        ...QUICK_DEFAULTS,
        seasons: [],
        occasions: [],
        tags: [],
        // The card's own id, so the closet reuses the photo link the tray already made.
        id: draft.key,
        name: autoName(draft.category, draft.color),
        category: draft.category,
        colors: [draft.color],
        photo: draft.photo,
        createdAt: now - index,
      },
    ]
  })
}
