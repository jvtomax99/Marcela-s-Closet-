import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EmptyState } from '../components/EmptyState'
import { OutfitCollage } from '../components/OutfitCollage'
import { PageHeader } from '../components/PageHeader'
import { StarRating } from '../components/StarRating'
import { rateLook, removeLook, renameLook, restoreHiddenLooks } from '../db'
import { goTo } from '../lib/useRoute'
import type { ClothingItem, Outfit } from '../types'

const SAVED_ON = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' })

function SavedLook({ look, items }: { look: Outfit; items: ClothingItem[] }) {
  const [name, setName] = useState(look.name)

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <OutfitCollage items={items} />
      <p className="mt-5 text-[0.625rem] tracking-[0.18em] text-muted uppercase">
        Saved {SAVED_ON.format(look.createdAt)}
      </p>
      <input
        aria-label="Look name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => renameLook(look.id, name.trim() || look.name)}
        className="mt-1 w-full border-b border-transparent bg-transparent py-1 font-serif text-[1.75rem] leading-tight italic outline-none transition-colors hover:border-line focus:border-accent"
      />
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{items.map((item) => item.name).join(' · ')}</p>
      <div className="mt-2 flex items-center justify-between">
        <StarRating value={look.rating} onChange={(rating) => rateLook(look.id, rating)} />
        <button
          type="button"
          onClick={() => removeLook(look.id)}
          className="py-2 text-eyebrow text-muted uppercase transition-colors hover:text-accent"
        >
          Remove
        </button>
      </div>
    </motion.article>
  )
}

interface LookbookViewProps {
  items: ClothingItem[]
  outfits: Outfit[]
}

export function LookbookView({ items, outfits }: LookbookViewProps) {
  const byId = new Map(items.map((item) => [item.id, item]))
  const saved = outfits
    .filter((outfit) => outfit.status === 'saved')
    .sort((a, b) => b.createdAt - a.createdAt)
  const hiddenCount = outfits.length - saved.length

  return (
    <>
      <PageHeader
        kicker={`${saved.length} saved ${saved.length === 1 ? 'look' : 'looks'}`}
        title={
          <>
            The <em>lookbook</em>
          </>
        }
        intro="The looks you love. Rate them, and the suggestions learn your taste."
      />

      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          action={
            <button
              type="button"
              onClick={() => goTo('looks')}
              className="rounded-full bg-ink px-6 py-3.5 text-eyebrow text-canvas uppercase shadow-print"
            >
              See your looks
            </button>
          }
        >
          Save the looks you love and rate them here. Your ratings shape what gets suggested next.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {saved.map((look) => (
              <SavedLook
                key={look.id}
                look={look}
                items={look.itemIds.flatMap((id) => byId.get(id) ?? [])}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {hiddenCount > 0 && (
        <p className="mt-20 border-t border-line pt-6 text-sm text-muted">
          {hiddenCount} hidden {hiddenCount === 1 ? 'look' : 'looks'}.{' '}
          <button type="button" onClick={restoreHiddenLooks} className="text-ink underline underline-offset-4">
            Bring them back
          </button>
        </p>
      )}
    </>
  )
}
