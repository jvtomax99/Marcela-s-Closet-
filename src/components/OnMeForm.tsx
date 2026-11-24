import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { deleteOnMe, logWear, saveOnMe } from '../db'
import { toDay } from '../engine'
import { newId } from '../lib/id'
import { photoUrl, preparePhoto, type CropArea } from '../lib/image'
import { CATEGORY_PLURALS, ON_ME_LABELS } from '../lib/labels'
import { CATEGORIES, type ClothingItem, type FitVerdict, type OnMePhoto, type Wear } from '../types'
import { Field } from './Chips'
import { Icon } from './Icon'
import { ItemForm } from './ItemForm'
import { ItemPhoto } from './ItemPhoto'
import { PhotoFramer } from './PhotoFramer'

interface OnMeFormProps {
  /** Leave empty to add a new photo. */
  photo?: OnMePhoto
  items: ClothingItem[]
  wears: Wear[]
  onDone: () => void
  /**
   * Adding a missing piece from this photo: the piece form shows in place of this one. Held by
   * the sheet's owner, so closing the sheet then goes back to the photo instead of losing it.
   */
  addingPiece: boolean
  onAddingPiece: (adding: boolean) => void
}

/** Pieces that make a look's base: "The combination" is only about these together. */
const BASE: readonly string[] = ['top', 'bottom', 'dress']

/** A chip that can be switched on and off. */
function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3.5 py-2 text-sm transition-colors ${
        on ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface/60 text-ink hover:border-muted'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * A photo of her wearing a look: frame it, tap the closet pieces she has on, and say whether
 * it fits her. A piece she never added is framed out of the same photo. Saving it never logs
 * "Wore it" unless she switches on "I'm wearing it today".
 */
export function OnMeForm({ photo: existing, items, wears, onDone, addingPiece, onAddingPiece }: OnMeFormProps) {
  /** A new photo's id from the start, so its picture is never mixed up with another draft's. */
  const [id] = useState(() => existing?.id ?? newId())
  const [photo, setPhoto] = useState<Blob | null>(existing?.photo ?? null)
  /** The full-size photo she picked, so a missing piece is framed from it sharp. Not saved. */
  const [original, setOriginal] = useState<Blob | null>(null)
  const [framing, setFraming] = useState<Blob | null>(null)
  const [preparing, setPreparing] = useState(false)
  const preparingNow = useRef(false)
  const [itemIds, setItemIds] = useState<string[]>(existing?.itemIds ?? [])
  const [verdict, setVerdict] = useState<FitVerdict | null>(existing?.verdict ?? null)
  const [offItemIds, setOffItemIds] = useState<string[]>(existing?.offItemIds ?? [])
  const [offCombo, setOffCombo] = useState(existing?.offCombo ?? false)
  const [wearingToday, setWearingToday] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const savingNow = useRef(false)
  const [saving, setSaving] = useState(false)

  const pickPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) setFraming(file)
  }

  const useFramed = async (area: CropArea) => {
    const source = framing
    setFraming(null)
    if (!source || preparingNow.current) return
    preparingNow.current = true
    setPreparing(true)
    try {
      setPhoto(await preparePhoto(source, area))
      if (source !== photo) setOriginal(source)
      setMessage('')
    } catch {
      setMessage(ON_ME_LABELS.cannotOpen)
    } finally {
      preparingNow.current = false
      setPreparing(false)
    }
  }

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((other) => other !== id) : [...list, id])

  const togglePiece = (id: string) => {
    setItemIds(toggle(itemIds, id))
    // A piece she untags can't be the one that's off.
    if (itemIds.includes(id)) setOffItemIds(offItemIds.filter((other) => other !== id))
  }

  const tagged = items.filter((item) => itemIds.includes(item.id))
  // "The combination" means the base pieces together: a top and a bottom, say. Shoes or a bag
  // don't change how a look sits, so with fewer than two base pieces there's no combination.
  const canBeCombo = tagged.filter((item) => BASE.includes(item.category)).length >= 2
  const offPieces = offItemIds.filter((other) => itemIds.includes(other))
  const combo = canBeCombo && offCombo

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!photo) return setMessage(ON_ME_LABELS.needPhoto)
    if (itemIds.length === 0) return setMessage(ON_ME_LABELS.needPiece)
    const off = verdict === 'off'
    if (off && offPieces.length === 0 && !combo) return setMessage(ON_ME_LABELS.needWhatsOff)
    if (savingNow.current) return
    savingNow.current = true
    setSaving(true)
    const judgment = { verdict, offItemIds: off ? offPieces : [], offCombo: off && combo }
    const changed =
      !existing ||
      existing.verdict !== judgment.verdict ||
      existing.offCombo !== judgment.offCombo ||
      [...existing.offItemIds].sort().join() !== [...judgment.offItemIds].sort().join()
    try {
      await saveOnMe({
        id,
        photo,
        itemIds,
        ...judgment,
        createdAt: existing?.createdAt ?? Date.now(),
        // A verdict given or changed now is her newest word on these pieces.
        judgedAt: changed ? Date.now() : existing?.judgedAt,
      })
      if (wearingToday) await logWear(itemIds, toDay(Date.now()))
      onDone()
    } catch {
      setMessage(ON_ME_LABELS.cannotSave)
    } finally {
      savingNow.current = false
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!existing) return
    if (!confirmingDelete) return setConfirmingDelete(true)
    await deleteOnMe(existing.id)
    onDone()
  }

  if (addingPiece) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onAddingPiece(false)}
          className="mb-3 flex items-center gap-2 py-2 text-eyebrow uppercase text-muted hover:text-ink"
        >
          <Icon name="arrow" className="size-4 rotate-180" />
          {ON_ME_LABELS.backToPhoto}
        </button>
        <ItemForm
          wears={wears}
          samePhoto={original ?? photo}
          onDone={() => onAddingPiece(false)}
          onSaved={(id) => setItemIds((current) => (current.includes(id) ? current : [...current, id]))}
        />
      </div>
    )
  }

  const shelves = CATEGORIES.map((category) => ({
    category,
    pieces: items.filter((item) => item.category === category),
  })).filter((shelf) => shelf.pieces.length > 0)

  return (
    <form onSubmit={submit} noValidate>
      {framing && (
        <PhotoFramer
          source={framing}
          onDone={useFramed}
          onCancel={() => setFraming(null)}
          onError={() => {
            setFraming(null)
            setMessage(ON_ME_LABELS.cannotOpen)
          }}
        />
      )}

      <div className="relative">
        <label className="relative block aspect-[3/4] w-full cursor-pointer overflow-hidden bg-sand">
          {photo ? (
            <img src={photoUrl(`onme-${id}`, photo)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="m-3 flex h-[calc(100%-1.5rem)] flex-col items-center justify-center gap-3 border border-dashed border-muted/40 px-6 text-center font-serif text-2xl text-muted italic">
              <Icon name="plus" className="size-7" />
              {preparing ? '…' : ON_ME_LABELS.pickPhoto}
              <span className="font-sans text-sm not-italic">{ON_ME_LABELS.pickHint}</span>
            </span>
          )}
          {photo && (
            <span className="absolute right-3 bottom-3 rounded-full bg-canvas/90 px-3.5 py-2 text-eyebrow text-ink uppercase shadow-print">
              {ON_ME_LABELS.change}
            </span>
          )}
          <input type="file" accept="image/*" onChange={pickPhoto} disabled={preparing} className="sr-only" aria-label={ON_ME_LABELS.photo} />
        </label>
      </div>

      <Field label={ON_ME_LABELS.wearingTitle}>
        <p className="-mt-1 mb-3 text-sm text-muted">{ON_ME_LABELS.wearingHint}</p>
        {shelves.map((shelf) => (
          <div key={shelf.category} className="mb-4">
            <p className="mb-2 text-[0.625rem] tracking-[0.16em] text-muted uppercase">{CATEGORY_PLURALS[shelf.category]}</p>
            <div className="grid grid-cols-4 gap-2">
              {shelf.pieces.map((item) => {
                const on = itemIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={item.name}
                    onClick={() => togglePiece(item.id)}
                    className={`relative block aspect-[3/4] overflow-hidden bg-sand transition-shadow ${
                      on ? 'ring-3 ring-accent ring-offset-2 ring-offset-canvas' : ''
                    }`}
                  >
                    <ItemPhoto item={item} />
                    {on && (
                      <span className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-accent text-canvas">
                        <Icon name="check" className="size-3.5" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={!photo || preparing}
          onClick={() => onAddingPiece(true)}
          className="key mt-1 w-full rounded-full py-3.5 text-eyebrow uppercase disabled:opacity-50"
        >
          {ON_ME_LABELS.notInCloset}
        </button>
      </Field>

      <Field label={ON_ME_LABELS.verdictTitle}>
        <div className="flex flex-wrap gap-2">
          <Toggle on={verdict === 'fits'} onClick={() => setVerdict(verdict === 'fits' ? null : 'fits')}>
            {ON_ME_LABELS.fits}
          </Toggle>
          <Toggle on={verdict === 'off'} onClick={() => setVerdict(verdict === 'off' ? null : 'off')}>
            {ON_ME_LABELS.off}
          </Toggle>
        </div>
        {verdict === 'off' && (
          <div className="mt-4">
            <p className="mb-2.5 text-eyebrow uppercase text-muted">{ON_ME_LABELS.whatsOff}</p>
            <div className="flex flex-wrap gap-2">
              {tagged.map((item) => (
                <Toggle key={item.id} on={offItemIds.includes(item.id)} onClick={() => setOffItemIds(toggle(offItemIds, item.id))}>
                  {item.name}
                </Toggle>
              ))}
              {canBeCombo && (
                <Toggle on={offCombo} onClick={() => setOffCombo(!offCombo)}>
                  {ON_ME_LABELS.combination}
                </Toggle>
              )}
            </div>
            <p className="mt-2.5 text-sm text-muted">{ON_ME_LABELS.whatsOffHint}</p>
          </div>
        )}
      </Field>

      {!existing && (
        <label className="mt-6 flex cursor-pointer items-start gap-3 border-t border-line pt-5">
          <input
            type="checkbox"
            checked={wearingToday}
            onChange={(event) => setWearingToday(event.target.checked)}
            className="mt-1 size-5 accent-[var(--accent)]"
          />
          <span>
            <span className="block text-eyebrow uppercase">{ON_ME_LABELS.wearingToday}</span>
            <span className="mt-1 block text-sm text-muted">{ON_ME_LABELS.wearingTodayHint}</span>
          </span>
        </label>
      )}

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
        {existing ? ON_ME_LABELS.saveChanges : ON_ME_LABELS.save}
      </button>

      {existing && (
        <div className="mt-4 text-right">
          <button type="button" onClick={remove} className="py-3 text-eyebrow uppercase text-muted hover:text-accent">
            {confirmingDelete ? ON_ME_LABELS.confirmDelete : ON_ME_LABELS.delete}
          </button>
        </div>
      )}
    </form>
  )
}
