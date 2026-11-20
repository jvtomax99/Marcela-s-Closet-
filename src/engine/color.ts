import type { ColorName } from '../types'

/** Neutrals have no hue: they go with anything. */
const NEUTRALS: ReadonlySet<ColorName> = new Set<ColorName>([
  'black', 'charcoal', 'grey', 'white', 'ivory', 'beige', 'camel', 'brown', 'navy', 'denim',
])

/** Position of each color on the color wheel, in degrees. */
const HUES: Partial<Record<ColorName, number>> = {
  red: 0,
  burgundy: 345,
  coral: 15,
  orange: 30,
  mustard: 45,
  yellow: 55,
  olive: 70,
  green: 130,
  teal: 180,
  blue: 220,
  lavender: 265,
  purple: 285,
  pink: 330,
  blush: 350,
}

export type Harmony = 'monochrome' | 'analogous' | 'triadic' | 'complementary' | 'clash'

export const isNeutral = (color: ColorName) => NEUTRALS.has(color)

/** The shortest way round the color wheel between two colors (0–180). */
export function hueDistance(a: ColorName, b: ColorName): number {
  const diff = Math.abs((HUES[a] ?? 0) - (HUES[b] ?? 0))
  return Math.min(diff, 360 - diff)
}

/** How two non-neutral colors relate on the color wheel. */
export function harmonyOf(a: ColorName, b: ColorName): Harmony {
  const distance = hueDistance(a, b)
  if (distance <= 20) return 'monochrome'
  if (distance <= 60) return 'analogous'
  if (distance >= 150) return 'complementary'
  if (distance >= 105 && distance <= 135) return 'triadic'
  return 'clash'
}

/** Neutrals never clash; two colors clash when no color-wheel rule connects them. */
export const colorsClash = (a: ColorName, b: ColorName) =>
  !isNeutral(a) && !isNeutral(b) && harmonyOf(a, b) === 'clash'
