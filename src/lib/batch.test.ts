import { describe, expect, it } from 'vitest'
import { missingTypes, sharedType, toPieces, type Draft } from './batch'
import { autoName } from './labels'

const photo = new Blob(['x'], { type: 'image/jpeg' })
const draft = (over: Partial<Draft> = {}): Draft => ({
  key: Math.random().toString(),
  status: 'ready',
  photo,
  color: 'navy',
  category: null,
  ...over,
})

describe('Add several', () => {
  it('names a piece from its color and type, like a single add', () => {
    expect(autoName('top', 'navy')).toBe('Navy top')
    expect(autoName('shoes', 'black')).toBe('Black shoes')
  })

  it('counts only readable photos that still need a type', () => {
    const drafts = [
      draft({ category: 'top' }),
      draft(),
      draft(),
      draft({ status: 'reading', photo: null, color: null }),
      draft({ status: 'failed', photo: null, color: null }),
    ]
    expect(missingTypes(drafts)).toBe(2)
  })

  it('shows the shared type only when every readable photo has it', () => {
    expect(sharedType([draft({ category: 'top' }), draft({ category: 'top' })])).toBe('top')
    expect(sharedType([draft({ category: 'top' }), draft({ category: 'bottom' })])).toBeNull()
    expect(sharedType([draft({ category: 'top' }), draft()])).toBeNull()
    expect(sharedType([draft({ category: 'top' }), draft({ status: 'failed', photo: null })])).toBe('top')
  })

  it('makes pieces in picked order with quick-add defaults, skipping unreadable photos', () => {
    let n = 0
    const pieces = toPieces(
      [
        draft({ category: 'top', color: 'white' }),
        draft({ status: 'failed', photo: null, color: null, category: 'bag' }),
        draft({ category: 'bottom', color: 'black' }),
      ],
      1000,
      () => `id-${++n}`,
    )
    expect(pieces.map((piece) => piece.name)).toEqual(['White top', 'Black bottom'])
    expect(pieces.map((piece) => piece.id)).toEqual(['id-1', 'id-2'])
    // Newest first in the closet, so the first photo gets the later time.
    expect(pieces[0].createdAt).toBeGreaterThan(pieces[1].createdAt)
    expect(pieces[0]).toMatchObject({ pattern: 'solid', formality: 2, seasons: [], favorite: false, colors: ['white'] })
  })
})
