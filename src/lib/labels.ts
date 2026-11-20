import type { Category, ColorName, Formality, Occasion, Pattern, Season } from '../types'

export const CATEGORY_LABELS: Record<Category, string> = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  bag: 'Bag',
  accessory: 'Accessory',
}

export const CATEGORY_PLURALS: Record<Category, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  bag: 'Bags',
  accessory: 'Accessories',
}

export const FORMALITY_LABELS: Record<Formality, string> = {
  1: 'Casual',
  2: 'Relaxed',
  3: 'Polished',
  4: 'Dressy',
  5: 'Formal',
}

export const OCCASION_LABELS: Record<Occasion, string> = {
  everyday: 'Everyday',
  work: 'Work',
  date: 'Date',
  party: 'Party',
  event: 'Formal event',
  travel: 'Travel',
  weekend: 'Weekend',
}

/** How each occasion reads inside the sentence "A look for ___". */
export const OCCASION_PHRASES: Record<Occasion, string> = {
  everyday: 'every day',
  work: 'work',
  date: 'a date',
  party: 'a party',
  event: 'a formal event',
  travel: 'travel',
  weekend: 'the weekend',
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
}

export const PATTERN_LABELS: Record<Pattern, string> = {
  solid: 'Solid',
  stripes: 'Stripes',
  dots: 'Dots',
  plaid: 'Plaid',
  floral: 'Floral',
  animal: 'Animal',
  graphic: 'Graphic',
}

export const COLOR_SWATCHES: Record<ColorName, string> = {
  black: '#1b1a19',
  charcoal: '#45433f',
  grey: '#9b9a96',
  white: '#ffffff',
  ivory: '#f4eddd',
  beige: '#dccdb4',
  camel: '#b98e5c',
  brown: '#6a4a33',
  navy: '#1f2c4d',
  denim: '#54749b',
  red: '#b5221f',
  burgundy: '#6d1a2b',
  coral: '#ec7763',
  orange: '#e0802b',
  mustard: '#c99a2b',
  yellow: '#ecd056',
  olive: '#6f7038',
  green: '#3b7a4e',
  teal: '#1e7a7a',
  blue: '#2f64c0',
  lavender: '#b7a6dc',
  purple: '#65388f',
  pink: '#e784ab',
  blush: '#efc5bb',
}

/** Who the app greets. */
export const OWNER_NAME = 'Marce'

/**
 * Sayings from Cali for the greeting, one a day. Real local sayings and nicknames, not song
 * lyrics. Marce can change or add to these.
 */
export const DICHOS: { text: string; source: string }[] = [
  { text: 'Cali es Cali, lo demás es loma.', source: 'Dicho caleño' },
  { text: 'Cali, la sucursal del cielo.', source: 'Así le dicen a Cali' },
  { text: 'Oiga, mire, vea.', source: 'El saludo de Cali' },
  { text: 'Cali, capital mundial de la salsa.', source: 'Cali, Valle del Cauca' },
]

/** The same saying all day, a new one tomorrow. */
export function dichoOfTheDay(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 0)
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return DICHOS[day % DICHOS.length]
}

/** Words on the intro screen (the wardrobe that opens before the app). */
export const INTRO_LABELS = {
  kicker: 'Marce’s',
  title: 'Closet',
  tagline: 'Outfits from the clothes you already own.',
  withSound: 'Open with sound',
  quietly: 'Open quietly',
  skip: 'Skip',
  mute: 'Mute music',
  unmute: 'Play music',
} as const

/** The bar offered when a new version arrives while a form is open. */
export const UPDATE_LABELS = {
  ready: 'A new version of Closet is ready.',
  update: 'Update',
} as const
