import type { CSSProperties } from 'react'
import type { Category, ClothingItem } from '../types'
import { ItemPhoto } from './ItemPhoto'

// The board is measured in units: 100 wide by 125 tall (a 4:5 page).
const BOARD_H = 125
const PAD = 5
// A print is its 3:4 photo plus a thin white border, so it is about 1.31 times as tall as wide.
const PRINT_RATIO = 1.31
// Prints may overlap by up to a quarter of their height, like photos pinned to a board.
const MAX_OVERLAP = 0.25

// Clothes go down the left in the order you wear them; everything else down the right.
const MAIN_ORDER: Category[] = ['dress', 'top', 'bottom']
const SIDE_ORDER: Category[] = ['outerwear', 'accessory', 'bag', 'shoes']

const MAIN_TILT = [-2.2, 1.8, -1.2]
const SIDE_TILT = [2.4, -2, 1.6, -2.6, 2]

interface Placement {
  item: ClothingItem
  x: number
  y: number
  w: number
  tilt: number
  z: number
}

interface Column {
  start: number
  end: number
  /** Which side the first print leans to; later prints alternate. */
  firstRight: boolean
  /** A lone print sits at the bottom (shoes) or in the middle (a dress). */
  lone: 'bottom' | 'middle'
  tilts: number[]
  z: (index: number) => number
}

function placeColumn(items: ClothingItem[], column: Column): Placement[] {
  const n = items.length
  if (n === 0) return []
  const top = PAD
  const bottom = BOARD_H - PAD
  const span = bottom - top
  const width = column.end - column.start
  const w = Math.min(width * (n === 1 ? 1 : 0.9), span / (PRINT_RATIO * (n - (n - 1) * MAX_OVERLAP)))
  const h = w * PRINT_RATIO
  const step = n === 1 ? 0 : (span - h) / (n - 1)

  return items.map((item, index) => {
    const right = column.firstRight !== (index % 2 === 1)
    const y =
      n === 1 ? (column.lone === 'bottom' ? bottom - h : top + (span - h) / 2) : top + index * step
    return {
      item,
      x: right ? column.end - w : column.start,
      y,
      w,
      tilt: column.tilts[index % column.tilts.length],
      z: column.z(index),
    }
  })
}

/** Lays a look out like a stylist's moodboard: each piece a print, pinned at a slight angle. */
export function OutfitCollage({ items }: { items: ClothingItem[] }) {
  const byOrder = (order: Category[]) =>
    order.flatMap((category) => items.filter((item) => item.category === category))
  const main = byOrder(MAIN_ORDER)
  const side = byOrder(SIDE_ORDER)
  // With several extras, the right-hand column takes a little more of the board.
  const split = side.length >= 3 ? 52 : 57

  const placements = [
    ...placeColumn(main, {
      start: 4,
      // A dress on its own is drawn larger and tucks slightly under the right-hand prints.
      end: side.length ? split + (main.length === 1 ? 6 : 1) : 96,
      firstRight: false,
      lone: 'middle',
      tilts: MAIN_TILT,
      // The top sits over the waistband of the bottom.
      z: (index) => 10 - index,
    }),
    ...placeColumn(side, {
      start: main.length ? split : 4,
      end: 96,
      firstRight: true,
      lone: 'bottom',
      tilts: SIDE_TILT,
      z: (index) => 20 + index,
    }),
  ]

  return (
    <div className="grain relative aspect-[4/5] overflow-hidden bg-board shadow-[inset_0_0_90px_rgb(60_45_30/0.07)]">
      {placements.map(({ item, x, y, w, tilt, z }) => (
        <div
          key={item.id}
          style={
            {
              left: `${x}%`,
              top: `${(y / BOARD_H) * 100}%`,
              width: `${w}%`,
              zIndex: z,
              '--tilt': `${tilt}deg`,
            } as CSSProperties
          }
          className="absolute rotate-(--tilt) bg-mat p-[4%] shadow-print transition-transform duration-700 ease-out group-hover:rotate-[calc(var(--tilt)*0.35)]"
        >
          <div className="aspect-[3/4] overflow-hidden bg-mat">
            <ItemPhoto item={item} />
          </div>
        </div>
      ))}
    </div>
  )
}
