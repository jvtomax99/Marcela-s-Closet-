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
      className="group rounded-card bg-surface p-3 shadow-card md:even:mt-20"
    >
      <div className="overflow-hidden rounded-2xl">
        <OutfitCollage items={items} />
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 px-1.5">
        <p className="text-accent">
          <span className="block text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Track</span>
          <span className="block font-serif text-[3.25rem] leading-[0.85] italic oldstyle">
            {String(number).padStart(2, '0')}
          </span>
        </p>
        <div className="min-w-0">
          <p className="font-serif text-[1.375rem] leading-snug text-balance">{why}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {items.map((item) => item.name).join(' · ')}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 px-0.5 pb-0.5">
        <button
          type="button"
          aria-pressed={saved}
          onClick={onToggleSave}
          className={`flex h-11 items-center gap-1.5 rounded-full border pr-4 pl-3 text-button font-medium transition-colors active:scale-[0.97] ${
            saved ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-ink hover:border-muted'
          }`}
        >
          <Icon name="heart" filled={saved} className="size-[1.375rem]" />
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onWore}
          className="flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface pr-4 pl-3 text-button font-medium text-ink transition-colors hover:border-muted active:scale-[0.97]"
        >
          <Icon name="hanger" className="size-[1.375rem]" />
          Wore it
        </button>
        <button
          type="button"
          onClick={onHide}
          className="flex h-11 items-center rounded-full px-3 text-button font-medium text-muted transition-colors hover:text-ink"
        >
          Not for me
        </button>
      </div>
    </motion.article>
  )
})
