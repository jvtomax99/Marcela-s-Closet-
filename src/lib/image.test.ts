import { describe, expect, it } from 'vitest'
import { cropPlan } from './image'

const PHONE = { width: 3024, height: 4032 }

describe('framing a photo', () => {
  it('keeps the whole photo when nothing is framed, shrunk to 1200 px', () => {
    const plan = cropPlan({ x: 0, y: 0, ...PHONE }, PHONE)
    expect([plan.width, plan.height]).toEqual([900, 1200])
    expect(plan.source).toEqual({ x: 0, y: 0, ...PHONE })
    expect(plan.target).toEqual({ x: 0, y: 0, width: 900, height: 1200 })
  })

  it('cuts the top half of a full-length photo from the original, still sharp', () => {
    const plan = cropPlan({ x: 0, y: 0, width: 1512, height: 2016 }, PHONE)
    // Cut from the 12-megapixel original: 900 x 1200, not a blown-up 450 x 600 corner.
    expect([plan.width, plan.height]).toEqual([900, 1200])
    expect(plan.source).toEqual({ x: 0, y: 0, width: 1512, height: 2016 })
  })

  it('never makes a small framed part bigger than it is', () => {
    const plan = cropPlan({ x: 100, y: 200, width: 300, height: 400 }, PHONE)
    expect([plan.width, plan.height]).toEqual([300, 400])
    expect(plan.target).toEqual({ x: 0, y: 0, width: 300, height: 400 })
  })

  it('zoomed out past the edges: draws the photo inside the frame, the rest is fill', () => {
    // A wide photo framed whole in a 3:4 frame: the frame reaches above and below it.
    const wide = { width: 1200, height: 800 }
    const plan = cropPlan({ x: 0, y: -400, width: 1200, height: 1600 }, wide)
    expect([plan.width, plan.height]).toEqual([900, 1200])
    expect(plan.source).toEqual({ x: 0, y: 0, width: 1200, height: 800 })
    expect(plan.target).toEqual({ x: 0, y: 300, width: 900, height: 600 })
  })

  it('a frame dragged off the photo draws nothing but fill', () => {
    const plan = cropPlan({ x: 4000, y: 0, width: 300, height: 400 }, PHONE)
    expect(plan.source).toBeNull()
    expect(plan.target).toBeNull()
  })
})
