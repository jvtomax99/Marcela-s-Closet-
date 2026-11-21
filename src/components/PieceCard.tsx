import { motion } from 'framer-motion'
import { setFavorite } from '../db'
import { CATEGORY_LABELS, COLOR_SWATCHES } from '../lib/labels'
import type { ClothingItem } from '../types'
import { Icon } from './Icon'
import { ItemPhoto } from './ItemPhoto'

interface PieceCardProps {
  item: ClothingItem
  index: number
  onOpen: () => void
}

/** One piece in a grid: tap the photo to open it, tap the heart to keep it as a favorite. */
export function PieceCard({ item, index, onOpen }: PieceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.035, 0.45), ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onOpen} className="block w-full text-left">
        <span className="relative block aspect-[3/4] overflow-hidden bg-sand">
          <ItemPhoto item={item} className="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        </span>
        <span className="mt-3 block truncate font-serif text-xl leading-tight">{item.name}</span>
        <span className="mt-1.5 flex items-center gap-2 text-[0.625rem] tracking-[0.16em] text-muted uppercase">
          {CATEGORY_LABELS[item.category]}
          <span className="flex -space-x-0.5">
            {item.colors.slice(0, 4).map((color) => (
              <span
                key={color}
                title={color}
                style={{ backgroundColor: COLOR_SWATCHES[color] }}
                className="size-2.5 rounded-full ring-1 ring-canvas"
              />
            ))}
          </span>
        </span>
      </motion.button>
      <button
        type="button"
        aria-pressed={item.favorite}
        aria-label={`Favorite: ${item.name}`}
        onClick={() => setFavorite(item.id, !item.favorite)}
        className={`absolute top-1.5 right-1.5 grid size-10 place-items-center rounded-full transition-colors ${
          item.favorite ? 'text-accent' : 'text-ink/55 hover:text-ink'
        }`}
      >
        <span className="grid size-8 place-items-center rounded-full bg-surface/90 shadow-print">
          <Icon name="heart" filled={item.favorite} className="size-5" />
        </span>
      </button>
    </motion.div>
  )
}
