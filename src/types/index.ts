// Every data shape in the app is defined here, once.

export const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'] as const
export type Category = (typeof CATEGORIES)[number]

export const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const
export type Season = (typeof SEASONS)[number]

export const OCCASIONS = ['everyday', 'work', 'date', 'party', 'event', 'travel', 'weekend'] as const
export type Occasion = (typeof OCCASIONS)[number]

export const PATTERNS = ['solid', 'stripes', 'dots', 'plaid', 'floral', 'animal', 'graphic'] as const
export type Pattern = (typeof PATTERNS)[number]

export const FABRICS = ['cotton', 'linen', 'denim', 'wool', 'cashmere', 'silk', 'leather', 'knit', 'synthetic'] as const
export type Fabric = (typeof FABRICS)[number]

export const COLORS = [
  'black', 'charcoal', 'grey', 'white', 'ivory', 'beige', 'camel', 'brown', 'navy', 'denim',
  'red', 'burgundy', 'coral', 'orange', 'mustard', 'yellow', 'olive', 'green', 'teal', 'blue',
  'lavender', 'purple', 'pink', 'blush',
] as const
export type ColorName = (typeof COLORS)[number]

/** 1 = casual … 5 = formal */
export type Formality = 1 | 2 | 3 | 4 | 5

/** The parts of a piece the suggestion engine cares about (no photo, so it stays pure). */
export interface Garment {
  id: string
  name: string
  category: Category
  /** The first color is the main one; the rest are details such as a stripe. */
  colors: ColorName[]
  pattern: Pattern
  formality: Formality
  /** Empty means "works in any season". */
  seasons: Season[]
  /** Empty means "works for any occasion". */
  occasions: Occasion[]
  favorite: boolean
  /** When the piece was added (ms). Lets wear tracking tell a new piece from a forgotten one. */
  createdAt?: number
}

export interface ClothingItem extends Garment {
  photo: Blob
  fabric: Fabric | null
  tags: string[]
  createdAt: number
}

type OutfitStatus = 'saved' | 'hidden'

/** A look I kept (saved) or rejected (hidden). */
export interface Outfit {
  id: string
  /** The sorted item ids, so the same combination is always recognized. */
  signature: string
  itemIds: string[]
  status: OutfitStatus
  name: string
  /** 0 = not rated yet, otherwise 1–5. */
  rating: number
  createdAt: number
}

export interface SuggestionFilters {
  occasion?: Occasion
  season?: Season
  formality?: Formality
  /** "Build around this item." */
  anchorId?: string
}

export interface Suggestion {
  signature: string
  items: Garment[]
  score: number
  why: string
}

/** A day's date on her phone, as YYYY-MM-DD (local time, not UTC). */
export type Day = string

/** One "I wore this" entry. Several entries on the same day add up to that day's outfit. */
export interface Wear {
  id: string
  date: Day
  itemIds: string[]
  createdAt: number
}

/** Her verdict on a photo of herself wearing a look: "Fits me" or "Not on me". */
export type FitVerdict = 'fits' | 'off'

/** What the suggestion engine reads from a photo of her wearing a look (no photo, so it stays pure). */
export interface FitNote {
  /** The closet pieces she has on in the photo. */
  itemIds: string[]
  /** Null until she says how it looks on her. */
  verdict: FitVerdict | null
  /** On "Not on me": the pieces that are off. */
  offItemIds: string[]
  /** On "Not on me": the pieces may be fine, but not together. */
  offCombo: boolean
  createdAt: number
  /** When she last gave or changed the verdict (photos from before this have none: then createdAt). */
  judgedAt?: number
}

/**
 * A photo of her wearing a look (the Lookbook's "On me"). Kept apart from what she wore:
 * an old album photo never counts as "Wore it".
 */
export interface OnMePhoto extends FitNote {
  id: string
  photo: Blob
}
