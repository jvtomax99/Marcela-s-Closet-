import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemPhoto } from '../components/ItemPhoto'
import { LookCard } from '../components/LookCard'
import { Sheet } from '../components/Sheet'
import { useWornLog } from '../components/WornToast'
import { hideLook, removeLook, saveLook } from '../db'
import { suggestOutfits, toDay } from '../engine'
import { dichoOfTheDay, FORMALITY_LABELS, OCCASION_PHRASES, OWNER_NAME, SEASON_LABELS } from '../lib/labels'
import { goTo } from '../lib/useRoute'
import {
  OCCASIONS,
  SEASONS,
  type ClothingItem,
  type Formality,
  type Occasion,
  type Outfit,
  type Season,
  type SuggestionFilters,
  type Wear,
} from '../types'

const PAGE_SIZE = 12
const FORMALITIES: Formality[] = [1, 2, 3, 4, 5]

interface LooksViewProps {
  items: ClothingItem[]
  outfits: Outfit[]
  wears: Wear[]
  filters: SuggestionFilters
  onFilters: (filters: SuggestionFilters) => void
}

interface SentenceSelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

/** A dropdown that reads as a word in a sentence. On iPhone it opens the native picker. */
function SentenceSelect({ label, value, options, onChange }: SentenceSelectProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="max-w-full appearance-none border-b border-dashed border-accent/60 bg-transparent font-serif font-normal text-accent italic outline-none transition-colors [field-sizing:content] hover:border-solid hover:border-accent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/** What is still needed before any outfit can exist, or null if the closet is ready. */
function missingPieces(items: ClothingItem[]): string | null {
  const has = (category: ClothingItem['category']) => items.some((item) => item.category === category)
  const missing: string[] = []
  if (!has('dress')) {
    if (!has('top')) missing.push('a top')
    if (!has('bottom')) missing.push('a bottom')
  }
  if (!has('shoes')) missing.push('a pair of shoes')
  if (missing.length === 0) return null
  return missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} and ${missing.at(-1)}`
}

export function LooksView({ items, outfits, wears, filters, onFilters }: LooksViewProps) {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [picking, setPicking] = useState(false)
  const closePicker = useCallback(() => setPicking(false), [])

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const anchor = filters.anchorId ? byId.get(filters.anchorId) : undefined
  // A deleted piece can't be built around, so it simply drops out of the filters.
  const active = useMemo(
    () => (anchor || !filters.anchorId ? filters : { ...filters, anchorId: undefined }),
    [anchor, filters],
  )
  const { logLook, toast, pendingId } = useWornLog()
  const today = toDay(Date.now())
  // While the "Worn" bar shows, the list stays still: no card jumps under her finger, and Undo
  // is next to the look she just logged. It re-sorts when the bar closes.
  const settled = useMemo(() => wears.filter((wear) => wear.id !== pendingId), [wears, pendingId])
  const looks = useMemo(
    () => suggestOutfits(items, active, outfits, limit, { wears: settled, today }),
    [items, active, outfits, limit, settled, today],
  )

  const update = (change: SuggestionFilters) => {
    setLimit(PAGE_SIZE)
    onFilters({ ...active, ...change })
  }

  const savedBySignature = new Map(
    outfits.filter((outfit) => outfit.status === 'saved').map((outfit) => [outfit.signature, outfit]),
  )
  const savedCount = savedBySignature.size
  const missing = missingPieces(items)
  const filtered = Boolean(active.occasion || active.season || active.formality || active.anchorId)

  const dicho = dichoOfTheDay()

  return (
    <>
      <div className="pt-8 pb-10 sm:pt-12 sm:pb-14">
        <p className="font-script text-[3.25rem] leading-none text-accent sm:text-[4rem]">Hola, {OWNER_NAME}</p>
        <figure className="mt-2">
          <blockquote className="font-serif text-[1.3125rem] leading-snug italic">“{dicho.text}”</blockquote>
          <figcaption className="mt-2 flex items-center gap-2.5 text-eyebrow text-muted uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-muted" />
            {dicho.source}
          </figcaption>
        </figure>
        <h1 className="mt-9 max-w-4xl font-serif text-headline font-light">
          A look for{' '}
          <SentenceSelect
            label="Occasion"
            value={active.occasion ?? ''}
            onChange={(value) => update({ occasion: (value || undefined) as Occasion | undefined })}
            options={[
              { value: '', label: 'any occasion' },
              ...OCCASIONS.map((occasion) => ({ value: occasion, label: OCCASION_PHRASES[occasion] })),
            ]}
          />{' '}
          in{' '}
          <SentenceSelect
            label="Season"
            value={active.season ?? ''}
            onChange={(value) => update({ season: (value || undefined) as Season | undefined })}
            options={[
              { value: '', label: 'any season' },
              ...SEASONS.map((season) => ({ value: season, label: SEASON_LABELS[season].toLowerCase() })),
            ]}
          />
          ,{' '}
          <SentenceSelect
            label="Formality"
            value={active.formality ? String(active.formality) : ''}
            onChange={(value) => update({ formality: value ? (Number(value) as Formality) : undefined })}
            options={[
              { value: '', label: 'any dress code' },
              ...FORMALITIES.map((level) => ({
                value: String(level),
                label: FORMALITY_LABELS[level].toLowerCase(),
              })),
            ]}
          />
        </h1>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          {anchor ? (
            <div className="flex items-center gap-3">
              <span className="block h-16 w-12 shrink-0 -rotate-2 bg-mat p-1 shadow-print">
                <ItemPhoto item={anchor} />
              </span>
              <span className="min-w-0">
                <span className="block text-eyebrow uppercase text-muted">Built around</span>
                <span className="mt-1 block truncate font-serif text-lg leading-tight">{anchor.name}</span>
              </span>
              <button
                type="button"
                onClick={() => update({ anchorId: undefined })}
                className="py-2 text-eyebrow uppercase text-muted hover:text-ink"
              >
                Clear
              </button>
            </div>
          ) : (
            items.length > 0 && (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="flex items-center gap-2 py-2 text-eyebrow text-ink uppercase hover:text-accent"
              >
                Build around a piece
                <Icon name="arrow" className="size-4" />
              </button>
            )
          )}
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setLimit(PAGE_SIZE)
                onFilters({})
              }}
              className="py-2 text-eyebrow uppercase text-muted hover:text-ink"
            >
              Start over
            </button>
          )}
        </div>
      </div>

      {missing ? (
        <EmptyState
          title="Almost ready to style"
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
          Add {missing} to your closet, and the first looks will appear here.
        </EmptyState>
      ) : looks.length === 0 ? (
        <EmptyState title="Nothing fits that brief">
          {filtered
            ? 'No combination in your closet matches all of this. Try loosening a filter.'
            : "The pieces in your closet don't pair up yet under the styling rules. Adding a neutral piece usually opens things up."}
        </EmptyState>
      ) : (
        <>
          <p className="mx-auto mb-5 flex max-w-5xl items-center gap-2.5 rounded-full bg-glass px-4 py-2.5 text-[0.8125rem] font-medium shadow-card backdrop-blur-xl sm:w-fit sm:pr-6">
            <span aria-hidden="true" className="flex h-3.5 items-end gap-0.5">
              {[0.6, 1, 0.75, 0.9].map((height, index) => (
                <span
                  key={index}
                  className="eq-bar w-[3px] rounded-full bg-accent"
                  style={{ height: `${height * 100}%`, animationDelay: `${index * 0.17}s` }}
                />
              ))}
            </span>
            Now playing · {filtered ? 'your picks' : "today's looks"}
            <span className="ml-auto pl-4 text-xs text-muted">
              {looks.length} {looks.length === 1 ? 'track' : 'tracks'}
            </span>
          </p>
          <div className="mx-auto grid max-w-5xl gap-y-10 md:grid-cols-2 md:gap-x-10 md:gap-y-14">
            <AnimatePresence mode="popLayout" initial={false}>
              {looks.map((look, index) => {
                const saved = savedBySignature.get(look.signature)
                const itemIds = look.items.map((item) => item.id)
                return (
                  <LookCard
                    key={look.signature}
                    number={index + 1}
                    items={look.items.flatMap((item) => byId.get(item.id) ?? [])}
                    why={look.why}
                    saved={Boolean(saved)}
                    onToggleSave={() =>
                      saved ? removeLook(saved.id) : saveLook(itemIds, `Look Nº ${savedCount + 1}`)
                    }
                    onHide={() => hideLook(itemIds)}
                    onWore={() => logLook(itemIds)}
                  />
                )
              })}
            </AnimatePresence>
          </div>
          {looks.length === limit && (
            <div className="mt-14 text-center">
              <button
                type="button"
                onClick={() => setLimit(limit + PAGE_SIZE)}
                className="rounded-full border border-ink px-7 py-3.5 text-eyebrow uppercase transition-colors hover:bg-ink hover:text-canvas"
              >
                More looks
              </button>
            </div>
          )}
        </>
      )}

      {toast}

      <Sheet open={picking} onClose={closePicker} title="Build around…">
        <div className="grid grid-cols-3 gap-2.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.name}
              onClick={() => {
                update({ anchorId: item.id })
                closePicker()
              }}
              className="group block aspect-[3/4] overflow-hidden bg-sand"
            >
              <ItemPhoto item={item} className="transition-transform duration-500 group-hover:scale-105" />
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
