import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import type { ClothingItem, OnMePhoto } from '../types'
import { Icon } from './Icon'
import { OnYouButton } from './OnYou'
import { OutfitCollage } from './OutfitCollage'
import { TrackLabel } from './TrackLabel'

interface LookCardProps {
  number: number
  items: ClothingItem[]
  why: string
  saved: boolean
  onToggleSave: () => void
  onHide: () => void
  onWore: () => void
  /** Photos of her wearing this look's base, newest first. */
  onYou?: OnMePhoto[]
  byId?: Map<string, ClothingItem>
}

/** forwardRef lets the list animate a card out when it is hidden. */
export const LookCard = forwardRef<HTMLElement, LookCardProps>(function LookCard(
  { number, items, why, saved, onToggleSave, onHide, onWore, onYou = [], byId },
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
      className="group relative rounded-card bg-surface p-3 shadow-card md:even:mt-20"
    >
      <TrackLabel number={number} />
      <div className="overflow-hidden rounded-board">
        <OutfitCollage items={items} />
      </div>
      <div className="mt-4 px-1.5">
        <p className="font-serif text-[1.375rem] leading-snug text-balance">{why}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{items.map((item) => item.name).join(' · ')}</p>
        {byId && <OnYouButton photos={onYou} byId={byId} className="mt-3" />}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 px-0.5 pb-0.5">
        <button
          type="button"
          aria-pressed={saved}
          onClick={onToggleSave}
          className="key flex h-11 items-center gap-1.5 rounded-full pr-4 pl-3 text-button font-semibold"
        >
          <Icon name="heart" filled={saved} className="size-[1.375rem]" />
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onWore}
          className="key flex h-11 items-center gap-1.5 rounded-full pr-4 pl-3 text-button font-semibold"
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
