import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EmptyState } from '../components/EmptyState'
import { OutfitCollage } from '../components/OutfitCollage'
import { PageHeader } from '../components/PageHeader'
import { PieceCard } from '../components/PieceCard'
import { StarRating } from '../components/StarRating'
import { dayLabel, useWornLog } from '../components/WornToast'
import { rateLook, removeLook, renameLook, restoreHiddenLooks } from '../db'
import { toDay, wearStats } from '../engine'
import { goTo } from '../lib/useRoute'
import type { ClothingItem, Outfit, Wear } from '../types'

const SAVED_ON = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' })

interface SavedLookProps {
  look: Outfit
  items: ClothingItem[]
  wears: Wear[]
  onWore: () => void
}

function SavedLook({ look, items, wears, onWore }: SavedLookProps) {
  const [name, setName] = useState(look.name)
  const today = toDay(Date.now())
  const worn = wearStats(look.itemIds, wears, today)

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
        {worn.last && (
          <>
            {' · '}Worn {worn.times === 1 ? 'once' : `${worn.times} times`}, last {dayLabel(worn.last, today)}
          </>
        )}
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
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onWore}
            className="py-2 text-eyebrow text-ink uppercase transition-colors hover:text-accent"
          >
            Wore it
          </button>
          <button
            type="button"
            onClick={() => removeLook(look.id)}
            className="py-2 text-eyebrow text-muted uppercase transition-colors hover:text-accent"
          >
            Remove
          </button>
        </div>
      </div>
    </motion.article>
  )
}

interface LookbookViewProps {
  items: ClothingItem[]
  outfits: Outfit[]
  wears: Wear[]
  /** Opens Looks built around a favorite piece. */
  onStyle: (id: string) => void
}

type Tab = 'looks' | 'pieces'

export function LookbookView({ items, outfits, wears, onStyle }: LookbookViewProps) {
  const { logLook, toast } = useWornLog()
  const [tab, setTab] = useState<Tab>('looks')
  const favorites = items.filter((item) => item.favorite)
  const byId = new Map(items.map((item) => [item.id, item]))
  const saved = outfits
    .filter((outfit) => outfit.status === 'saved')
    .sort((a, b) => b.createdAt - a.createdAt)
  const hiddenCount = outfits.length - saved.length

  return (
    <>
      <PageHeader
        kicker={`${saved.length} saved ${saved.length === 1 ? 'look' : 'looks'} · ${favorites.length} favorite ${
          favorites.length === 1 ? 'piece' : 'pieces'
        }`}
        title={
          <>
            The <em>lookbook</em>
          </>
        }
        intro="The looks and pieces you love. Rate your looks, and the suggestions learn your taste."
      />

      <div className="-mx-4 mb-10 flex gap-7 border-b border-line px-4 sm:mx-0 sm:px-0">
        {(
          [
            ['looks', 'Looks', saved.length],
            ['pieces', 'Pieces', favorites.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b py-3.5 text-eyebrow uppercase transition-colors ${
              tab === value ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
            <sup className="ml-1 font-serif text-[0.8125rem] tracking-normal normal-case italic">{count}</sup>
          </button>
        ))}
      </div>

      {tab === 'pieces' ? (
        favorites.length === 0 ? (
          <EmptyState
            title="No favorite pieces yet"
            action={
              <button
                type="button"
                onClick={() => goTo('closet')}
                className="rounded-full bg-ink px-6 py-3.5 text-eyebrow text-canvas uppercase shadow-print"
              >
                Go to the closet
              </button>
            }
          >
            Tap the heart on any piece in your closet to keep it here. Favorites show up more in your looks.
          </EmptyState>
        ) : (
          <>
            <p className="-mt-4 mb-8 max-w-md text-sm leading-relaxed text-muted">
              Tap a piece to see looks built around it.
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-12">
              {favorites.map((item, index) => (
                <PieceCard key={item.id} item={item} index={index} onOpen={() => onStyle(item.id)} />
              ))}
            </div>
          </>
        )
      ) : saved.length === 0 ? (
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
                wears={wears}
                onWore={() => logLook(look.itemIds)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {toast}

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
