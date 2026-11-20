import { describe, expect, it } from 'vitest'
import { mainColor, nearestColor } from './photoColor'

/** A test photo: one color around the edges (the bed), another in the middle (the piece). */
function photo(edge: number[], middle: number[], size = 100) {
  const pixels = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inside = x > size * 0.2 && x < size * 0.8 && y > size * 0.15 && y < size * 0.85
      pixels.set([...(inside ? middle : edge), 255], (y * size + x) * 4)
    }
  }
  return pixels
}

describe('color from a photo', () => {
  it('matches a pixel to the nearest closet color', () => {
    expect(nearestColor(236, 119, 99)).toBe('coral')
    expect(nearestColor(30, 44, 78)).toBe('navy')
    expect(nearestColor(250, 250, 250)).toBe('white')
    expect(nearestColor(185, 142, 92)).toBe('camel')
  })

  it('reads the piece in the middle, not the background', () => {
    expect(mainColor(photo([250, 250, 250], [31, 44, 77]), 100, 100)).toBe('navy')
    expect(mainColor(photo([110, 75, 50], [236, 120, 100]), 100, 100)).toBe('coral')
  })

  it('handles a slightly shaded piece', () => {
    expect(mainColor(photo([240, 240, 235], [80, 110, 150]), 100, 100)).toBe('denim')
  })

  it('ignores see-through pixels', () => {
    const pixels = new Uint8ClampedArray(10 * 10 * 4)
    expect(mainColor(pixels, 10, 10)).toBeNull()
  })
})
