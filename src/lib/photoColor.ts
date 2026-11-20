import { COLORS, type ColorName } from '../types'
import { COLOR_SWATCHES } from './labels'

/** sRGB 0-255 → CIELAB, so "nearest color" matches what the eye sees. */
function toLab(r: number, g: number, b: number): [number, number, number] {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]

const SWATCH_LAB = COLORS.map((name) => ({ name, lab: toLab(...hexToRgb(COLOR_SWATCHES[name])) }))

export function nearestColor(r: number, g: number, b: number): ColorName {
  const [l, a, bb] = toLab(r, g, b)
  let best = SWATCH_LAB[0]
  let bestDistance = Infinity
  for (const swatch of SWATCH_LAB) {
    const d = (l - swatch.lab[0]) ** 2 + (a - swatch.lab[1]) ** 2 + (bb - swatch.lab[2]) ** 2
    if (d < bestDistance) {
      bestDistance = d
      best = swatch
    }
  }
  return best.name
}

/**
 * The main color of a piece, from the middle of the photo (where the piece usually is, away from
 * the bed or wall behind it). RGBA pixels, as a canvas gives them. Null if nothing usable.
 */
export function mainColor(pixels: Uint8ClampedArray, width: number, height: number): ColorName | null {
  const votes = new Map<ColorName, number>()
  const step = Math.max(1, Math.floor(Math.min(width, height) / 60))
  for (let y = Math.floor(height * 0.2); y < height * 0.8; y += step) {
    for (let x = Math.floor(width * 0.25); x < width * 0.75; x += step) {
      const i = (y * width + x) * 4
      if (pixels[i + 3] < 128) continue // see-through: a background already removed
      const color = nearestColor(pixels[i], pixels[i + 1], pixels[i + 2])
      votes.set(color, (votes.get(color) ?? 0) + 1)
    }
  }
  let best: ColorName | null = null
  let bestVotes = 0
  for (const [color, count] of votes) {
    if (count > bestVotes) {
      best = color
      bestVotes = count
    }
  }
  return best
}

/** Reads the main color of a photo on the phone itself; nothing is sent anywhere. */
export async function colorFromPhoto(photo: Blob): Promise<ColorName | null> {
  const bitmap = await createImageBitmap(photo)
  const scale = Math.min(1, 160 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return mainColor(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)
}
