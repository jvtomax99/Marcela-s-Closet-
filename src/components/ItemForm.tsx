import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { deleteItem, saveItem, unwearPiece, wearPiece } from '../db'
import { toDay, wearStats } from '../engine'
import { newId } from '../lib/id'
import { photoUrl, preparePhoto, type CropArea } from '../lib/image'
import { colorFromPhoto as readPhotoColor } from '../lib/photoColor'
import {
  capitalize,
  CATEGORY_LABELS,
  FRAME_LABELS,
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
  type OnMePhoto,
  type Season,
  type Wear,
} from '../types'
import { Field, PickMany, PickOne } from './Chips'
import { ColorPicker } from './ColorPicker'
import { Icon } from './Icon'
import { OnYouButton } from './OnYou'
import { PhotoFramer } from './PhotoFramer'
import { dayLabel } from './WornToast'

const FORMALITIES = [1, 2, 3, 4, 5] as const
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
  /** New pieces only: saves, then starts a fresh form for the next photo. */
  onAddAnother?: () => void
  /** The full-size photo the last piece was framed from, offered as "Same photo, next piece". */
  samePhoto?: Blob | null
  /** Hands up each photo she picks, so the next piece can be framed from it too. */
  onOriginal?: (photo: Blob) => void
  onStyle?: (id: string) => void
  /** Called with the piece's id once it is saved (adding a piece from a photo of her tags it). */
  onSaved?: (id: string) => void
  /** Photos of her wearing this piece, newest first. */
  onYou?: OnMePhoto[]
  /** Every piece by id, to name the pieces in those photos. */
  byId?: Map<string, ClothingItem>
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
        <Icon name="hanger" className="size-5" />
        {wornToday ? 'Worn today · Undo' : 'Wore it today'}
      </button>
    </div>
  )
}

export function ItemForm({
  item,
  looksUsing = 0,
  wears = [],
  onDone,
  onAddAnother,
  samePhoto,
  onOriginal,
  onStyle,
  onSaved,
  onYou = [],
  byId,
}: ItemFormProps) {
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
  /** The photo in the framer right now: a new pick, the same photo again, or this piece's own. */
  const [framing, setFraming] = useState<Blob | null>(null)
  /** The full-size photo picked in this form, so "Frame" can still zoom back out. Not saved. */
  const [original, setOriginal] = useState<Blob | null>(null)
  /** A ref, not state: two framings must never be cut at once (the older one could win). */
  const preparingNow = useRef(false)
  /** True while the colors are the app's guess from the photo, not her choice. */
  const [colorFromPhoto, setColorFromPhoto] = useState(false)
  /** Set the moment she taps a color herself; a photo guess never overrides that. */
  const pickedColors = useRef(Boolean(item))
  const [saving, setSaving] = useState(false)
  const savingNow = useRef(false)
  const autoName = category && colors[0] ? `${capitalize(colors[0])} ${CATEGORY_LABELS[category].toLowerCase()}` : null

  const pickPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Lets her pick the same photo again later (the browser skips a change to the same file).
    event.target.value = ''
    if (!file) return
    // Becomes this form's original only once she taps "Use this" (Cancel keeps the old photo).
    setFraming(file)
  }

  const cannotOpen = () => {
    setFraming(null)
    setMessage("That photo couldn't be opened here. Try a JPEG or PNG.")
  }

  /** She tapped "Use this": cut the framed part from the photo, then read its color. */
  const useFramed = async (area: CropArea) => {
    const source = framing
    setFraming(null)
    if (!source || preparingNow.current) return
    preparingNow.current = true
    setPreparing(true)
    try {
      const prepared = await preparePhoto(source, area)
      setPhoto(prepared)
      // A photo she picked (not this piece's saved copy): "Frame" goes back to it, and the
      // next piece may be framed from it too.
      if (source !== photo) {
        setOriginal(source)
        onOriginal?.(source)
      }
      setMessage('')
      // Guess the main color, unless she already chose colors herself.
      if (!pickedColors.current) {
        const guess = await readPhotoColor(prepared).catch(() => null)
        if (guess && !pickedColors.current) {
          setColors([guess])
          setColorFromPhoto(true)
        }
      }
    } catch {
      setMessage("That photo couldn't be opened here. Try a JPEG or PNG.")
    } finally {
      preparingNow.current = false
      setPreparing(false)
    }
  }

  const submit = async (event: FormEvent, another = false) => {
    event.preventDefault()
    if (!photo) return setMessage('Add a photo of this piece.')
    if (!category) return setMessage('Choose a category.')
    if (colors.length === 0) return setMessage('Choose at least one color.')
    // A ref, not state: a fast double tap must see the first tap at once.
    if (savingNow.current) return
    savingNow.current = true
    setSaving(true)

    const id = item?.id ?? newId()
    await saveItem({
      id,
      name: name.trim() || autoName || CATEGORY_LABELS[category],
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
    onSaved?.(id)
    if (another && onAddAnother) onAddAnother()
    else onDone()
  }

  const remove = async () => {
    if (!item) return
    if (!confirmingDelete) return setConfirmingDelete(true)
    await deleteItem(item.id)
    onDone()
  }

  return (
    <form onSubmit={submit} noValidate>
      {framing && (
        <PhotoFramer source={framing} onDone={useFramed} onCancel={() => setFraming(null)} onError={cannotOpen} />
      )}
      <div className="relative">
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
              {preparing ? FRAME_LABELS.preparing : 'Add a photo'}
            </span>
          )}
          {photo && (
            <span className="absolute right-3 bottom-3 rounded-full bg-canvas/90 px-3.5 py-2 text-eyebrow text-ink uppercase shadow-print">
              Change
            </span>
          )}
          <input
          type="file"
          accept="image/*"
          onChange={pickPhoto}
          disabled={preparing}
          className="sr-only"
          aria-label="Photo"
        />
        </label>
        {photo && (
          // Outside the label, so it doesn't open the photo picker. Re-frames the photo: the
          // original she picked in this form if there is one, otherwise the saved copy.
          <button
            type="button"
            disabled={preparing}
            onClick={() => setFraming(original ?? photo)}
            className="absolute bottom-3 left-3 rounded-full bg-canvas/90 px-3.5 py-2 text-eyebrow text-ink uppercase shadow-print"
          >
            {FRAME_LABELS.reframe}
          </button>
        )}
      </div>
      {!photo && samePhoto && (
        <div className="mt-3 text-center">
          <button
            type="button"
            disabled={preparing}
            onClick={() => setFraming(samePhoto)}
            className="key w-full rounded-full py-3.5 text-eyebrow uppercase disabled:opacity-50"
          >
            {FRAME_LABELS.samePhoto}
          </button>
          <p className="mt-2 text-sm text-muted">{FRAME_LABELS.samePhotoHint}</p>
        </div>
      )}

      {item && <WornLine itemId={item.id} wears={wears} />}
      {item && byId && onYou.length > 0 && <OnYouButton photos={onYou} byId={byId} className="mt-4" />}

      <Field label="Category">
        <PickOne options={CATEGORIES} labels={CATEGORY_LABELS} value={category} onChange={setCategory} />
      </Field>
      <Field label="Colors">
        <ColorPicker
          values={colors}
          onChange={(next) => {
            setColors(next)
            setColorFromPhoto(false)
            pickedColors.current = true
          }}
        />
        {colorFromPhoto && (
          <p className="mt-2.5 text-sm text-muted">Picked from your photo. Tap another color if it's off.</p>
        )}
      </Field>

      <div className="mt-6 flex items-end gap-4">
        <label className="min-w-0 flex-1">
          <span className="text-eyebrow uppercase text-muted">Name (optional)</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={autoName ?? 'Silk slip dress'}
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


      <details className="group/more mt-8 border-t border-line pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-eyebrow uppercase text-ink [&::-webkit-details-marker]:hidden">
          More details (optional)
          <Icon name="plus" className="size-4 transition-transform group-open/more:rotate-45" />
        </summary>
        <p className="mt-1 text-sm text-muted">Pattern, dressiness, seasons and occasions sharpen the suggestions.</p>
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
      </details>

      {message && (
        <p role="alert" className="mt-5 text-sm text-accent">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={preparing || saving}
        className="key-ink mt-8 w-full rounded-full py-4 text-eyebrow uppercase disabled:opacity-50"
      >
        {preparing ? 'Preparing photo…' : item ? 'Save changes' : 'Add to closet'}
      </button>

      {!item && onAddAnother && (
        <button
          type="button"
          disabled={preparing || saving}
          onClick={(event) => submit(event, true)}
          className="key mt-3 w-full rounded-full py-3.5 text-eyebrow uppercase disabled:opacity-50"
        >
          Add and take another
        </button>
      )}

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
