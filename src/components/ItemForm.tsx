import { useState, type ChangeEvent, type FormEvent } from 'react'
import { deleteItem, saveItem, unwearPiece, wearPiece } from '../db'
import { toDay, wearStats } from '../engine'
import { newId } from '../lib/id'
import { photoUrl, preparePhoto } from '../lib/image'
import {
  CATEGORY_LABELS,
  FORMALITY_LABELS,
  OCCASION_LABELS,
  PATTERN_LABELS,
  SEASON_LABELS,
} from '../lib/labels'
import {
  CATEGORIES,
  FABRICS,
  OCCASIONS,
  PATTERNS,
  SEASONS,
  type Category,
  type ClothingItem,
  type ColorName,
  type Fabric,
  type Formality,
  type Occasion,
  type Pattern,
  type Season,
  type Wear,
} from '../types'
import { Field, PickMany, PickOne } from './Chips'
import { ColorPicker } from './ColorPicker'
import { Icon } from './Icon'
import { dayLabel } from './WornToast'

const FORMALITIES = [1, 2, 3, 4, 5] as const
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const FABRIC_LABELS = Object.fromEntries(
  FABRICS.map((fabric) => [fabric, capitalize(fabric)]),
) as Record<Fabric, string>

interface ItemFormProps {
  /** Leave empty to add a new piece. */
  item?: ClothingItem
  /** How many saved or hidden looks use this piece. */
  looksUsing?: number
  /** What she logged, for the "worn" line and button. */
  wears?: Wear[]
  onDone: () => void
  onStyle?: (id: string) => void
}

/** "Worn 4 times, last Nov 12", and a one-tap "Wore it today" that can be taken back. */
function WornLine({ itemId, wears }: { itemId: string; wears: Wear[] }) {
  const today = toDay(Date.now())
  const { times, last } = wearStats([itemId], wears, today)
  const wornToday = last === today
  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-b border-line pb-3">
      <p className="text-sm text-muted">
        {last ? `Worn ${times === 1 ? 'once' : `${times} times`}, last ${dayLabel(last, today)}` : 'Not worn yet'}
      </p>
      <button
        type="button"
        aria-pressed={wornToday}
        onClick={() => (wornToday ? unwearPiece(itemId, today) : wearPiece(itemId, today))}
        className={`flex shrink-0 items-center gap-2 py-2 text-eyebrow uppercase transition-colors ${
          wornToday ? 'text-accent' : 'text-ink hover:text-accent'
        }`}
      >
        <Icon name="hanger" className="size-4" />
        {wornToday ? 'Worn today · Undo' : 'Wore it today'}
      </button>
    </div>
  )
}

export function ItemForm({ item, looksUsing = 0, wears = [], onDone, onStyle }: ItemFormProps) {
  const [photo, setPhoto] = useState<Blob | null>(item?.photo ?? null)
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<Category | null>(item?.category ?? null)
  const [colors, setColors] = useState<ColorName[]>(item?.colors ?? [])
  const [pattern, setPattern] = useState<Pattern>(item?.pattern ?? 'solid')
  const [fabric, setFabric] = useState<Fabric | null>(item?.fabric ?? null)
  const [formality, setFormality] = useState<Formality>(item?.formality ?? 2)
  const [seasons, setSeasons] = useState<Season[]>(item?.seasons ?? [])
  const [occasions, setOccasions] = useState<Occasion[]>(item?.occasions ?? [])
  const [tags, setTags] = useState((item?.tags ?? []).join(', '))
  const [favorite, setFavorite] = useState(item?.favorite ?? false)
  const [message, setMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [preparing, setPreparing] = useState(false)

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPreparing(true)
    try {
      setPhoto(await preparePhoto(file))
      setMessage('')
    } catch {
      setMessage("That photo couldn't be opened here. Try a JPEG or PNG.")
    } finally {
      setPreparing(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!photo) return setMessage('Add a photo of this piece.')
    if (!category) return setMessage('Choose a category.')
    if (colors.length === 0) return setMessage('Choose at least one color.')

    await saveItem({
      id: item?.id ?? newId(),
      name: name.trim() || `${capitalize(colors[0])} ${CATEGORY_LABELS[category].toLowerCase()}`,
      category,
      colors,
      pattern,
      fabric,
      formality,
      seasons,
      occasions,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      favorite,
      photo,
      createdAt: item?.createdAt ?? Date.now(),
    })
    onDone()
  }

  const remove = async () => {
    if (!item) return
    if (!confirmingDelete) return setConfirmingDelete(true)
    await deleteItem(item.id)
    onDone()
  }

  return (
    <form onSubmit={submit} noValidate>
      <label className="relative block aspect-[3/4] w-full cursor-pointer overflow-hidden bg-sand">
        {photo ? (
          <img
            src={photoUrl(item?.id ?? 'draft', photo)}
            alt="This piece"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="m-3 flex h-[calc(100%-1.5rem)] flex-col items-center justify-center gap-3 border border-dashed border-muted/40 font-serif text-2xl text-muted italic">
            <Icon name="plus" className="size-7" />
            {preparing ? 'Preparing your photo…' : 'Add a photo'}
          </span>
        )}
        {photo && (
          <span className="absolute right-3 bottom-3 rounded-full bg-mat/90 px-3.5 py-2 text-eyebrow uppercase shadow-print">
            Change
          </span>
        )}
        <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" aria-label="Photo" />
      </label>

      {item && <WornLine itemId={item.id} wears={wears} />}

      <div className="mt-6 flex items-end gap-4">
        <label className="min-w-0 flex-1">
          <span className="text-eyebrow uppercase text-muted">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Silk slip dress"
            className="mt-1 w-full border-b border-line bg-transparent py-2 font-serif text-2xl outline-none placeholder:text-muted/60 focus:border-accent"
          />
        </label>
        <button
          type="button"
          aria-pressed={favorite}
          aria-label="Favorite"
          onClick={() => setFavorite(!favorite)}
          className={`pb-2.5 transition-colors ${favorite ? 'text-accent' : 'text-muted/50 hover:text-muted'}`}
        >
          <Icon name="heart" filled={favorite} className="size-7" />
        </button>
      </div>

      <Field label="Category">
        <PickOne options={CATEGORIES} labels={CATEGORY_LABELS} value={category} onChange={setCategory} />
      </Field>
      <Field label="Colors">
        <ColorPicker values={colors} onChange={setColors} />
      </Field>
      <Field label="Pattern">
        <PickOne options={PATTERNS} labels={PATTERN_LABELS} value={pattern} onChange={setPattern} />
      </Field>
      <Field label="Fabric">
        <PickOne options={FABRICS} labels={FABRIC_LABELS} value={fabric} onChange={setFabric} />
      </Field>
      <Field label="Formality">
        <PickOne options={FORMALITIES} labels={FORMALITY_LABELS} value={formality} onChange={setFormality} />
      </Field>
      <Field label="Seasons (none means all)">
        <PickMany options={SEASONS} labels={SEASON_LABELS} values={seasons} onChange={setSeasons} />
      </Field>
      <Field label="Occasions (none means all)">
        <PickMany options={OCCASIONS} labels={OCCASION_LABELS} values={occasions} onChange={setOccasions} />
      </Field>

      <label className="mt-6 block">
        <span className="text-eyebrow uppercase text-muted">Tags</span>
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="vintage, gift from mom"
          className="mt-1 w-full border-b border-line bg-transparent py-2 text-base outline-none placeholder:text-muted/60 focus:border-accent"
        />
      </label>

      {message && (
        <p role="alert" className="mt-5 text-sm text-accent">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={preparing}
        className="mt-8 w-full rounded-full bg-ink py-4 text-eyebrow text-canvas uppercase shadow-print transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {preparing ? 'Preparing photo…' : item ? 'Save changes' : 'Add to closet'}
      </button>

      {item && (
        <div className="mt-4 flex items-center justify-between gap-4">
          {onStyle && (
            <button
              type="button"
              onClick={() => onStyle(item.id)}
              className="py-3 text-eyebrow uppercase text-accent"
            >
              Style this piece
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            className="py-3 text-right text-eyebrow uppercase text-muted hover:text-accent"
          >
            {!confirmingDelete
              ? 'Delete'
              : looksUsing > 0
                ? `Delete it and ${looksUsing} ${looksUsing === 1 ? 'look' : 'looks'}?`
                : 'Tap again to delete'}
          </button>
        </div>
      )}
    </form>
  )
}
