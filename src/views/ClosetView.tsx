import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { BackupControls } from '../components/BackupControls'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemForm } from '../components/ItemForm'
import { ItemPhoto } from '../components/ItemPhoto'
import { PageHeader } from '../components/PageHeader'
import { Sheet } from '../components/Sheet'
import { FORGOTTEN_DAYS, forgottenPieces, toDay } from '../engine'
import { CATEGORY_LABELS, CATEGORY_PLURALS, COLOR_SWATCHES } from '../lib/labels'
import { CATEGORIES, type Category, type ClothingItem, type Outfit, type Wear } from '../types'

interface ClosetViewProps {
  items: ClothingItem[]
  outfits: Outfit[]
  wears: Wear[]
  onStyle: (id: string) => void
}

type Editing = { kind: 'new' } | { kind: 'existing'; item: ClothingItem } | null

function PieceCard({ item, index, onOpen }: { item: ClothingItem; index: number; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.035, 0.45), ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="group text-left"
    >
      <span className="relative block aspect-[3/4] overflow-hidden bg-sand">
        <ItemPhoto item={item} className="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        {item.favorite && (
          <span
            aria-label="Favorite"
            className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-mat/90 text-accent"
          >
            <Icon name="heart" filled className="size-3.5" />
          </span>
        )}
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
  )
}

type Shelf = Category | 'all' | 'forgotten'

export function ClosetView({ items, outfits, wears, onStyle }: ClosetViewProps) {
  const [category, setCategory] = useState<Shelf>('all')
  const [editing, setEditing] = useState<Editing>(null)
  const close = useCallback(() => setEditing(null), [])

  const present = CATEGORIES.filter((option) => items.some((item) => item.category === option))
  const forgotten = forgottenPieces(items, wears, toDay(Date.now()))
  const shelves: Shelf[] = ['all', ...present, ...(forgotten.length > 0 ? ['forgotten' as const] : [])]
  const active = shelves.includes(category) ? category : 'all'
  const shelf = (option: Shelf) =>
    option === 'all' ? items : option === 'forgotten' ? forgotten : items.filter((item) => item.category === option)
  const visible = shelf(active)

  const addButton = (
    <button
      type="button"
      onClick={() => setEditing({ kind: 'new' })}
      className="flex items-center gap-2.5 rounded-full bg-ink py-3.5 pr-6 pl-5 text-eyebrow text-canvas uppercase shadow-print transition-transform duration-300 hover:-translate-y-0.5"
    >
      <Icon name="plus" className="size-4" />
      Add a piece
    </button>
  )

  return (
    <>
      <PageHeader
        kicker={`${items.length} ${items.length === 1 ? 'piece' : 'pieces'}`}
        title={
          <>
            The <em>closet</em>
          </>
        }
        intro="Everything you own, in one place. Open a piece to edit it, or to build a look around it."
      />

      {items.length === 0 ? (
        <EmptyState title="An empty rail, for now" action={<div className="flex justify-center">{addButton}</div>}>
          Photograph a few pieces you love. With a top, a bottom and a pair of shoes, the first looks appear.
        </EmptyState>
      ) : (
        <>
          <div className="no-scrollbar -mx-4 mb-8 flex gap-7 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
            {shelves.map((option) => {
              const selected = option === active
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategory(option)}
                  className={`-mb-px shrink-0 border-b py-3.5 text-eyebrow uppercase transition-colors ${
                    selected ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {option === 'all' ? 'All' : option === 'forgotten' ? 'Forgotten' : CATEGORY_PLURALS[option]}
                  <sup className="ml-1 font-serif text-[0.8125rem] tracking-normal normal-case italic">
                    {shelf(option).length}
                  </sup>
                </button>
              )
            })}
          </div>

          {active === 'forgotten' && (
            <p className="-mt-3 mb-8 max-w-md text-sm leading-relaxed text-muted">
              Not worn in {FORGOTTEN_DAYS} days or more. Looks now bring these back first.
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-12">
            {visible.map((item, index) => (
              <PieceCard
                key={`${active}-${item.id}`}
                item={item}
                index={index}
                onOpen={() => setEditing({ kind: 'existing', item })}
              />
            ))}
          </div>

          <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-30 md:right-8 md:bottom-8">
            {addButton}
          </div>
        </>
      )}

      <BackupControls />

      <Sheet
        open={editing !== null}
        onClose={close}
        title={editing?.kind === 'existing' ? 'Edit piece' : 'New piece'}
      >
        {editing && (
          <ItemForm
            item={editing.kind === 'existing' ? editing.item : undefined}
            looksUsing={
              editing.kind === 'existing'
                ? outfits.filter((outfit) => outfit.itemIds.includes(editing.item.id)).length
                : 0
            }
            wears={wears}
            onDone={close}
            onStyle={(id) => {
              close()
              onStyle(id)
            }}
          />
        )}
      </Sheet>
    </>
  )
}
