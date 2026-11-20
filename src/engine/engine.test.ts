import { describe, expect, it } from 'vitest'
import type { Garment, Outfit, Wear } from '../types'
import { colorsClash, harmonyOf } from './color'
import { outfitAllowed } from './rules'
import { forgottenPieces, wearStats, outfitSignature, suggestOutfits, toDay } from './index'
import { daysBetween } from './wear'

let nextId = 0

function piece(overrides: Partial<Garment> & Pick<Garment, 'category'>): Garment {
  nextId += 1
  return {
    id: `item-${nextId}`,
    name: `${overrides.category} ${nextId}`,
    colors: ['black'],
    pattern: 'solid',
    formality: 3,
    seasons: [],
    occasions: [],
    favorite: false,
    ...overrides,
  }
}

function hiddenLook(items: Garment[]): Outfit {
  const itemIds = items.map((item) => item.id)
  return { id: 'h', signature: outfitSignature(itemIds), itemIds, status: 'hidden', name: '', rating: 0, createdAt: 0 }
}

function savedLook(items: Garment[], rating: number): Outfit {
  return { ...hiddenLook(items), status: 'saved', rating }
}

const categories = (items: Garment[]) => items.map((item) => item.category)

describe('color harmony', () => {
  it('lets neutrals pair with anything', () => {
    expect(colorsClash('black', 'coral')).toBe(false)
    expect(colorsClash('navy', 'mustard')).toBe(false)
  })

  it('recognizes color-wheel relationships', () => {
    expect(harmonyOf('coral', 'orange')).toBe('monochrome')
    expect(harmonyOf('red', 'mustard')).toBe('analogous')
    expect(harmonyOf('red', 'teal')).toBe('complementary')
  })

  it('treats the wheel as a circle', () => {
    expect(harmonyOf('blush', 'red')).toBe('monochrome')
  })

  it('flags colors no rule connects', () => {
    expect(colorsClash('red', 'lavender')).toBe(true)
  })
})

describe('what counts as an outfit', () => {
  it('builds top + bottom + shoes', () => {
    const closet = [piece({ category: 'top' }), piece({ category: 'bottom' }), piece({ category: 'shoes' })]
    const [look] = suggestOutfits(closet)
    expect(categories(look.items).sort()).toEqual(['bottom', 'shoes', 'top'])
  })

  it('builds dress + shoes', () => {
    const closet = [piece({ category: 'dress' }), piece({ category: 'shoes' })]
    const [look] = suggestOutfits(closet)
    expect(categories(look.items).sort()).toEqual(['dress', 'shoes'])
  })

  it('returns nothing without shoes', () => {
    expect(suggestOutfits([piece({ category: 'dress' })])).toEqual([])
  })

  it('returns nothing for a top alone', () => {
    expect(suggestOutfits([piece({ category: 'top' }), piece({ category: 'shoes' })])).toEqual([])
  })

  it('never wears a dress with a top and bottom', () => {
    const closet = [
      piece({ category: 'dress' }), piece({ category: 'top' }),
      piece({ category: 'bottom' }), piece({ category: 'shoes' }),
    ]
    for (const look of suggestOutfits(closet)) {
      const kinds = categories(look.items)
      expect(kinds.includes('dress') && kinds.includes('top')).toBe(false)
    }
  })

  it('only ever uses pieces from the closet', () => {
    const closet = [
      piece({ category: 'top' }), piece({ category: 'bottom' }), piece({ category: 'shoes' }),
      piece({ category: 'bag' }), piece({ category: 'accessory' }), piece({ category: 'outerwear' }),
    ]
    for (const look of suggestOutfits(closet)) {
      for (const item of look.items) expect(closet).toContain(item)
    }
  })
})

describe('hard rules', () => {
  it('rejects more than one bold pattern', () => {
    const closet = [
      piece({ category: 'top', pattern: 'floral' }),
      piece({ category: 'bottom', pattern: 'plaid' }),
      piece({ category: 'shoes' }),
    ]
    expect(suggestOutfits(closet)).toEqual([])
  })

  it('allows one bold pattern', () => {
    const closet = [
      piece({ category: 'top', pattern: 'floral' }),
      piece({ category: 'bottom' }),
      piece({ category: 'shoes' }),
    ]
    expect(suggestOutfits(closet)).toHaveLength(1)
  })

  it('rejects formality more than one level apart', () => {
    const closet = [
      piece({ category: 'top', formality: 1 }),
      piece({ category: 'bottom', formality: 3 }),
      piece({ category: 'shoes', formality: 2 }),
    ]
    expect(suggestOutfits(closet)).toEqual([])
  })

  it('rejects pieces with no season in common', () => {
    const closet = [
      piece({ category: 'dress', seasons: ['summer'] }),
      piece({ category: 'shoes', seasons: ['winter'] }),
    ]
    expect(suggestOutfits(closet)).toEqual([])
  })

  it('rejects a group that overlaps in pairs but not all together', () => {
    const items = [
      piece({ category: 'top', seasons: ['spring', 'summer'] }),
      piece({ category: 'bottom', seasons: ['summer', 'fall'] }),
      piece({ category: 'shoes', seasons: ['fall', 'spring'] }),
    ]
    expect(outfitAllowed(items)).toBe(false)
  })

  it('rejects clashing main colors', () => {
    const closet = [
      piece({ category: 'top', colors: ['red'] }),
      piece({ category: 'bottom', colors: ['lavender'] }),
      piece({ category: 'shoes' }),
    ]
    expect(suggestOutfits(closet)).toEqual([])
  })

  it('never exceeds the hard rules once optional pieces are added', () => {
    const closet = [
      piece({ category: 'dress', pattern: 'floral', formality: 4 }),
      piece({ category: 'shoes', formality: 4 }),
      piece({ category: 'bag', pattern: 'animal', formality: 4 }),
      piece({ category: 'accessory', formality: 1 }),
    ]
    const [look] = suggestOutfits(closet)
    expect(categories(look.items).sort()).toEqual(['dress', 'shoes'])
  })
})

describe('filters', () => {
  const work = piece({ category: 'dress', occasions: ['work'], seasons: ['fall'], formality: 3 })
  const party = piece({ category: 'dress', occasions: ['party'], seasons: ['summer'], formality: 4 })
  const shoes = piece({ category: 'shoes', formality: 3 })

  it('filters by occasion', () => {
    const looks = suggestOutfits([work, party, shoes], { occasion: 'work' })
    expect(looks).toHaveLength(1)
    expect(looks[0].items).toContain(work)
  })

  it('filters by season', () => {
    const looks = suggestOutfits([work, party, shoes], { season: 'summer' })
    expect(looks).toHaveLength(1)
    expect(looks[0].items).toContain(party)
  })

  it('filters by formality within one level', () => {
    expect(suggestOutfits([work, party, shoes], { formality: 2 }).map((look) => look.items[0])).toEqual([work])
  })

  it('treats an empty season list as any season', () => {
    expect(suggestOutfits([work, shoes], { season: 'fall' })).toHaveLength(1)
  })
})

describe('build around this item', () => {
  const top = piece({ category: 'top' })
  const otherTop = piece({ category: 'top' })
  const bottom = piece({ category: 'bottom' })
  const shoes = piece({ category: 'shoes' })
  const bag = piece({ category: 'bag' })

  it('keeps a core piece in every look', () => {
    const looks = suggestOutfits([top, otherTop, bottom, shoes], { anchorId: top.id })
    expect(looks.length).toBeGreaterThan(0)
    for (const look of looks) expect(look.items).toContain(top)
  })

  it('keeps an optional piece in every look', () => {
    const looks = suggestOutfits([top, bottom, shoes, bag], { anchorId: bag.id })
    expect(looks.length).toBeGreaterThan(0)
    for (const look of looks) expect(look.items).toContain(bag)
  })

  it('keeps the chosen piece even if it is outside the formality filter', () => {
    const dressy = piece({ category: 'dress', formality: 5 })
    const heels = piece({ category: 'shoes', formality: 4 })
    const looks = suggestOutfits([dressy, heels], { anchorId: dressy.id, formality: 3 })
    expect(looks[0].items).toContain(dressy)
  })

  it('returns nothing if the chosen piece no longer exists', () => {
    expect(suggestOutfits([top, bottom, shoes], { anchorId: 'gone' })).toEqual([])
  })
})

describe('optional layers', () => {
  it('adds a coat to a winter look', () => {
    const closet = [
      piece({ category: 'dress' }), piece({ category: 'shoes' }), piece({ category: 'outerwear' }),
    ]
    const [look] = suggestOutfits(closet, { season: 'winter' })
    expect(categories(look.items)).toContain('outerwear')
  })

  it('adds a bag even when it sits one formality level away', () => {
    const closet = [
      piece({ category: 'dress', formality: 3 }),
      piece({ category: 'shoes', formality: 3 }),
      piece({ category: 'bag', formality: 2 }),
    ]
    const [look] = suggestOutfits(closet)
    expect(categories(look.items)).toContain('bag')
  })

  it('leaves the coat at home in summer', () => {
    const closet = [
      piece({ category: 'dress' }), piece({ category: 'shoes' }), piece({ category: 'outerwear' }),
    ]
    const [look] = suggestOutfits(closet, { season: 'summer' })
    expect(categories(look.items)).not.toContain('outerwear')
  })
})

describe('learning from me', () => {
  const dress = piece({ category: 'dress' })
  const flats = piece({ category: 'shoes' })
  const heels = piece({ category: 'shoes' })

  it('never shows a hidden look again', () => {
    const looks = suggestOutfits([dress, flats, heels], {}, [hiddenLook([dress, flats])])
    expect(looks).toHaveLength(1)
    expect(looks[0].items).toContain(heels)
  })

  it('ranks favorites higher', () => {
    const favorite = piece({ category: 'shoes', favorite: true })
    const [first] = suggestOutfits([dress, flats, favorite])
    expect(first.items).toContain(favorite)
  })

  it('ranks highly rated pieces higher', () => {
    const [first] = suggestOutfits([dress, flats, heels], {}, [savedLook([dress, heels], 5)])
    expect(first.items).toContain(heels)
  })

  it('ranks pieces from low-rated looks lower', () => {
    const [first] = suggestOutfits([dress, flats, heels], {}, [savedLook([dress, flats], 1)])
    expect(first.items).toContain(heels)
  })

  it('ranks pairs from hidden looks lower', () => {
    const blazer = piece({ category: 'top' })
    const skirt = piece({ category: 'bottom' })
    const trousers = piece({ category: 'bottom' })
    const looks = suggestOutfits([blazer, skirt, trousers, flats], {}, [hiddenLook([blazer, skirt])])
    expect(looks[0].items).toContain(trousers)
  })
})

describe('results', () => {
  it('is deterministic', () => {
    const closet = [
      piece({ category: 'top', colors: ['coral'] }), piece({ category: 'top', colors: ['white'] }),
      piece({ category: 'bottom', colors: ['denim'] }), piece({ category: 'bottom', colors: ['navy'] }),
      piece({ category: 'shoes' }), piece({ category: 'shoes', colors: ['camel'] }),
    ]
    expect(suggestOutfits(closet)).toEqual(suggestOutfits(closet))
  })

  it('explains every look', () => {
    const closet = [
      piece({ category: 'top', colors: ['coral'] }),
      piece({ category: 'bottom', colors: ['navy'] }),
      piece({ category: 'shoes', colors: ['navy'] }),
    ]
    const [look] = suggestOutfits(closet)
    expect(look.why).toBe('Navy lets the coral take the lead. Every piece sits at the same level of dressiness.')
  })

  it('spreads results across different pieces', () => {
    const tops = [piece({ category: 'top', favorite: true }), piece({ category: 'top' })]
    const bottoms = [piece({ category: 'bottom' }), piece({ category: 'bottom' })]
    const shoes = [piece({ category: 'shoes' }), piece({ category: 'shoes' })]
    const looks = suggestOutfits([...tops, ...bottoms, ...shoes], {}, [], 2)
    const firstIds = new Set(looks[0].items.map((item) => item.id))
    expect(looks[1].items.every((item) => firstIds.has(item.id))).toBe(false)
    expect(looks[1].items.filter((item) => firstIds.has(item.id)).length).toBeLessThan(2)
  })

  it('respects the limit', () => {
    const closet = [
      ...Array.from({ length: 5 }, () => piece({ category: 'top' })),
      ...Array.from({ length: 5 }, () => piece({ category: 'bottom' })),
      piece({ category: 'shoes' }),
    ]
    expect(suggestOutfits(closet, {}, [], 4)).toHaveLength(4)
  })

  it('stays fast with a large closet', () => {
    const closet = [
      ...Array.from({ length: 80 }, () => piece({ category: 'top' })),
      ...Array.from({ length: 50 }, () => piece({ category: 'bottom' })),
      ...Array.from({ length: 30 }, () => piece({ category: 'shoes' })),
      ...Array.from({ length: 20 }, () => piece({ category: 'accessory' })),
    ]
    const start = performance.now()
    suggestOutfits(closet)
    expect(performance.now() - start).toBeLessThan(1000)
  })
})

describe('what she wore', () => {
  const TODAY = '2026-11-20'
  let wearId = 0
  const wore = (date: string, items: Garment[]): Wear => {
    wearId += 1
    return { id: `w-${wearId}`, date, itemIds: items.map((item) => item.id), createdAt: 0 }
  }
  const at = (wears: Wear[]) => ({ wears, today: TODAY })
  /** A piece added long before logging started. */
  const old = (overrides: Partial<Garment> & Pick<Garment, 'category'>) =>
    piece({ createdAt: new Date(2025, 0, 1).getTime(), ...overrides })

  const dress = old({ category: 'dress' })
  const flats = old({ category: 'shoes' })
  const heels = old({ category: 'shoes' })

  it('counts days across months', () => {
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2)
    expect(toDay(new Date(2026, 10, 20, 23, 30).getTime())).toBe('2026-11-20')
  })

  it('changes nothing until she has logged something', () => {
    const closet = [dress, flats, heels]
    expect(suggestOutfits(closet, {}, [], 12, at([]))).toEqual(suggestOutfits(closet))
  })

  it('pushes down a piece worn yesterday', () => {
    const favoriteHeels = old({ category: 'shoes', favorite: true })
    const closet = [dress, flats, favoriteHeels]
    expect(suggestOutfits(closet)[0].items).toContain(favoriteHeels)
    const [first] = suggestOutfits(closet, {}, [], 12, at([wore('2026-11-19', [favoriteHeels])]))
    expect(first.items).toContain(flats)
  })

  it('pushes down a piece worn yesterday even if it is a favorite in a strong pairing', () => {
    const coral = old({ category: 'top', colors: ['coral'], favorite: true })
    const white = old({ category: 'top', colors: ['white'] })
    const denim = old({ category: 'bottom', colors: ['denim'] })
    const [first] = suggestOutfits([coral, white, denim, flats], {}, [], 12, at([wore('2026-11-19', [coral])]))
    expect(first.items).toContain(white)
  })

  it('forgets a piece worn more than three days ago, for this rule', () => {
    const favoriteHeels = old({ category: 'shoes', favorite: true })
    const [first] = suggestOutfits([dress, flats, favoriteHeels], {}, [], 12, at([
      wore('2026-11-10', [favoriteHeels]),
      wore('2026-11-10', [flats]),
    ]))
    expect(first.items).toContain(favoriteHeels)
  })

  it('pushes the same look far down for two weeks, even with a different bag', () => {
    const top = old({ category: 'top', favorite: true })
    const skirt = old({ category: 'bottom', favorite: true })
    const trousers = old({ category: 'bottom' })
    const bag = old({ category: 'bag' })
    const closet = [top, skirt, trousers, flats, bag]
    const wears = [wore('2026-11-12', [top, skirt, flats])]
    const [first] = suggestOutfits(closet, {}, [], 12, at(wears))
    expect(first.items).toContain(trousers)
    // Three weeks later it is fair game again.
    const later = suggestOutfits(closet, {}, [], 12, { wears, today: '2026-12-03' })
    expect(later[0].items).toContain(skirt)
  })

  it('treats pieces logged one by one on a day as that day\'s outfit', () => {
    const top = old({ category: 'top' })
    const skirt = old({ category: 'bottom' })
    const wears = [wore('2026-11-18', [top]), wore('2026-11-18', [skirt, flats])]
    expect(wearStats([top.id, skirt.id, flats.id], wears, TODAY)).toEqual({ times: 1, last: '2026-11-18' })
  })

  it('brings back a forgotten piece and says so', () => {
    const coat = old({ category: 'outerwear', name: 'Camel coat', seasons: ['winter'] })
    const top = old({ category: 'top', seasons: ['winter'] })
    const skirt = old({ category: 'bottom', seasons: ['winter'] })
    const boots = old({ category: 'shoes', seasons: ['winter'] })
    const wears = [wore('2026-10-01', [top]), wore('2026-11-15', [skirt, boots])]
    const [look] = suggestOutfits([coat, top, skirt, boots], {}, [], 12, at(wears))
    expect(look.items).toContain(coat)
    expect(look.why.startsWith('Brings back your camel coat, not worn in 7 weeks.')).toBe(true)
  })

  it('does not call a new piece forgotten', () => {
    const fresh = piece({ category: 'top', createdAt: new Date(2026, 10, 10).getTime() })
    const wears = [wore('2026-09-01', [flats])]
    expect(forgottenPieces([fresh, dress, flats], wears, TODAY)).toEqual([dress, flats])
  })

  it('still builds around a piece worn yesterday', () => {
    const wears = [wore('2026-11-19', [heels])]
    const looks = suggestOutfits([dress, flats, heels], { anchorId: heels.id }, [], 12, at(wears))
    expect(looks).toHaveLength(1)
    expect(looks[0].items).toContain(heels)
    expect(looks[0].why).not.toContain('Brings back')
  })

  it('ignores entries dated after today', () => {
    expect(forgottenPieces([dress], [wore('2026-12-25', [dress])], TODAY)).toEqual([])
  })
})
