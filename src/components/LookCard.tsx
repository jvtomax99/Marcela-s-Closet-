import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import type { ClothingItem } from '../types'
import { Icon } from './Icon'
import { OutfitCollage } from './OutfitCollage'

interface LookCardProps {
  number: number
  items: ClothingItem[]
  why: string
  saved: boolean
  onToggleSave: () => void
  onHide: () => void
  onWore: () => void
}

/** forwardRef lets the list animate a card out when it is hidden. */
export const LookCard = forwardRef<HTMLElement, LookCardProps>(function LookCard(
  { number, items, why, saved, onToggleSave, onHide, onWore },
  ref,
) {
  return (
    <motion.article
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group md:even:mt-24"
    >
      <OutfitCollage items={items} />
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-4">
        <p className="font-serif text-[3.25rem] leading-[0.8] font-light text-accent italic oldstyle">
          <span className="sr-only">Look </span>
          {String(number).padStart(2, '0')}
        </p>
        <div className="min-w-0">
          <p className="font-serif text-[1.375rem] leading-snug text-balance">{why}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {items.map((item) => item.name).join(' · ')}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6">
            <button
              type="button"
              aria-pressed={saved}
              onClick={onToggleSave}
              className={`flex items-center gap-2 py-2 text-eyebrow uppercase transition-colors ${
                saved ? 'text-accent' : 'text-ink hover:text-accent'
              }`}
            >
              <Icon name="heart" filled={saved} className="size-4" />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onWore}
              className="flex items-center gap-2 py-2 text-eyebrow text-ink uppercase transition-colors hover:text-accent"
            >
              <Icon name="hanger" className="size-4" />
              Wore it
            </button>
            <button
              type="button"
              onClick={onHide}
              className="py-2 text-eyebrow text-muted uppercase transition-colors hover:text-ink"
            >
              Not for me
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
})
