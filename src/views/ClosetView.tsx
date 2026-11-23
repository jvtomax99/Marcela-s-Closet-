import { useCallback, useState } from 'react'
import { BackupControls } from '../components/BackupControls'
import { BatchAdd, PhotosInput } from '../components/BatchAdd'
import { BackupReminder } from '../components/BackupReminder'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemForm } from '../components/ItemForm'
import { PieceCard } from '../components/PieceCard'
import { PageHeader } from '../components/PageHeader'
import { Sheet } from '../components/Sheet'
import { FORGOTTEN_DAYS, forgottenPieces, toDay } from '../engine'
import { BATCH_LABELS, CATEGORY_PLURALS } from '../lib/labels'
import { CATEGORIES, type Category, type ClothingItem, type Outfit, type Wear } from '../types'

interface ClosetViewProps {
  items: ClothingItem[]
  outfits: Outfit[]
  wears: Wear[]
  onStyle: (id: string) => void
}

/** `added` counts pieces saved with "Add and take another" in a row. */
type Editing =
  | { kind: 'new'; added: number }
  | { kind: 'existing'; item: ClothingItem }
  | { kind: 'batch'; files: File[] }
  | null

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
      onClick={() => setEditing({ kind: 'new', added: 0 })}
      className="key-ink flex items-center gap-2.5 rounded-full py-3.5 pr-6 pl-5 text-eyebrow uppercase"
    >
      <Icon name="plus" className="size-4" />
      Add a piece
    </button>
  )

  // "Add several" (Jose, 2026-11-23): opens her photo library to pick many at once.
  const severalButton = (
    <PhotosInput
      onFiles={(files) => setEditing({ kind: 'batch', files })}
      className="key flex min-h-11 items-center gap-2.5 rounded-full py-3.5 pr-5 pl-4 text-eyebrow uppercase"
    >
      <Icon name="plus" className="size-4" />
      {BATCH_LABELS.button}
    </PhotosInput>
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
        <EmptyState title="An empty rail, for now" action={<div className="flex flex-wrap items-center justify-center gap-3">{addButton}{severalButton}</div>}>
          Photograph a few pieces you love. With a top, a bottom and a pair of shoes, the first looks appear.
        </EmptyState>
      ) : (
        <>
          {/* Up here, not floating, so it never covers her photos. */}
          <div className="-mt-2 mb-8 flex">{severalButton}</div>

          <BackupReminder items={items} outfits={outfits} wears={wears} />

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
                  <sup className="ml-1 font-serif text-button tracking-normal normal-case italic">
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

          <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+6.25rem)] z-30 md:right-8 md:bottom-8">
            {addButton}
          </div>
        </>
      )}

      <BackupControls />

      <Sheet
        open={editing !== null}
        onClose={close}
        title={
          editing?.kind === 'existing'
            ? 'Edit piece'
            : editing?.kind === 'batch'
              ? BATCH_LABELS.title
            : editing && editing.added > 0
              ? `Next piece · ${editing.added} added`
              : 'New piece'
        }
      >
        {editing?.kind === 'batch' && <BatchAdd files={editing.files} onDone={close} />}
        {editing && editing.kind !== 'batch' && (
          <ItemForm
            key={editing.kind === 'new' ? `new-${editing.added}` : editing.item.id}
            item={editing.kind === 'existing' ? editing.item : undefined}
            looksUsing={
              editing.kind === 'existing'
                ? outfits.filter((outfit) => outfit.itemIds.includes(editing.item.id)).length
                : 0
            }
            wears={wears}
            onDone={close}
            onAddAnother={() => {
              setEditing((current) => ({ kind: 'new', added: current?.kind === 'new' ? current.added + 1 : 1 }))
              document.querySelector('[role="dialog"]')?.scrollTo({ top: 0 })
            }}
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
