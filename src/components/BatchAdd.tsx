import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { saveItems } from '../db'
import { MAX_BATCH, missingTypes, savable, sharedType, toPieces, type Draft } from '../lib/batch'
import { newId } from '../lib/id'
import { photoUrl, preparePhoto } from '../lib/image'
import { autoName, BATCH_LABELS, capitalize, CATEGORY_LABELS, COLOR_SWATCHES } from '../lib/labels'
import { colorFromPhoto } from '../lib/photoColor'
import { CATEGORIES, type Category } from '../types'
import { Field, PickOne } from './Chips'
import { Icon } from './Icon'

/** The photo input for "Add several": a label, so a tap opens her photo library at once. */
export function PhotosInput({
  onFiles,
  className,
  children,
}: {
  onFiles: (files: File[]) => void
  className: string
  children: ReactNode
}) {
  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    // Cleared, so picking the same photos again still counts as a change.
    event.target.value = ''
    if (files.length) onFiles(files)
  }
  return (
    <label className={`cursor-pointer ${className}`}>
      {children}
      <input type="file" accept="image/*" multiple onChange={pick} className="sr-only" />
    </label>
  )
}

/**
 * Several photos at once (Jose, 2026-11-23): each becomes a card with its color read on the
 * phone and a name made from it; she gives each a type (or all at once) and saves them together.
 */
export function BatchAdd({ files, onDone }: { files: File[]; onDone: () => void }) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const queue = useRef(Promise.resolve())
  const alive = useRef(true)
  const count = useRef(0)

  const update = (key: string, change: Partial<Draft>) =>
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...change } : draft)))

  const add = (picked: File[]) => {
    const room = MAX_BATCH - count.current
    const taken = picked.slice(0, Math.max(0, room))
    setMessage(picked.length > taken.length ? BATCH_LABELS.tooMany(MAX_BATCH) : '')
    count.current += taken.length
    const fresh = taken.map((file) => ({ file, key: newId() }))
    setDrafts((current) => [
      ...current,
      ...fresh.map(({ key }): Draft => ({ key, status: 'reading', photo: null, color: null, category: null })),
    ])
    // One photo at a time, so an iPhone never holds twenty full-size photos at once.
    for (const { file, key } of fresh) {
      queue.current = queue.current.then(async () => {
        if (!alive.current) return
        try {
          const photo = await preparePhoto(file)
          const color = await colorFromPhoto(photo).catch(() => null)
          if (alive.current) update(key, color ? { status: 'ready', photo, color } : { status: 'failed' })
        } catch {
          if (alive.current) update(key, { status: 'failed' })
        }
      })
    }
  }

  // The photos she picked from the Closet page.
  const started = useRef(false)
  useEffect(() => {
    alive.current = true
    if (!started.current) {
      started.current = true
      add(files)
    }
    return () => {
      alive.current = false
    }
    // Only the first pick; later ones come through "Add more photos".
  }, [])

  const remove = (key: string) => {
    count.current -= 1
    setDrafts((current) => current.filter((draft) => draft.key !== key))
  }

  const setAll = (category: Category) =>
    setDrafts((current) => current.map((draft) => (draft.status === 'ready' ? { ...draft, category } : draft)))

  const ready = savable(drafts)
  const reading = drafts.some((draft) => draft.status === 'reading')
  const missing = missingTypes(drafts)

  const save = async () => {
    if (missing > 0) return setMessage(BATCH_LABELS.needType(missing))
    if (saving || reading || ready.length === 0) return
    setSaving(true)
    await saveItems(toPieces(drafts, Date.now(), newId))
    onDone()
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-muted">{BATCH_LABELS.intro}</p>

      <Field label={BATCH_LABELS.allAre}>
        <PickOne options={CATEGORIES} labels={CATEGORY_LABELS} value={sharedType(drafts)} onChange={setAll} />
      </Field>

      <ul className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
        {drafts.map((draft, index) => (
          <li key={draft.key}>
            <div className="relative aspect-[3/4] overflow-hidden bg-sand">
              {draft.photo ? (
                <img src={photoUrl(draft.key, draft.photo)} alt="" className="h-full w-full object-cover" />
              ) : (
                <p className="flex h-full items-center justify-center p-3 text-center font-serif text-base text-muted italic">
                  {draft.status === 'failed' ? BATCH_LABELS.unreadable : BATCH_LABELS.reading}
                </p>
              )}
              <button
                type="button"
                onClick={() => remove(draft.key)}
                aria-label={`${BATCH_LABELS.remove} ${index + 1}`}
                className="key absolute top-2 right-2 grid size-11 place-items-center rounded-full"
              >
                <Icon name="close" className="size-4" />
              </button>
            </div>
            {draft.status === 'ready' && draft.color && (
              <>
                <p className="mt-2 flex items-center gap-2 font-serif text-lg leading-tight">
                  <span
                    aria-hidden="true"
                    className="size-3.5 shrink-0 rounded-full border border-line"
                    style={{ background: COLOR_SWATCHES[draft.color] }}
                  />
                  <span className="truncate">
                    {draft.category ? autoName(draft.category, draft.color) : capitalize(draft.color)}
                  </span>
                </p>
                <label className="mt-2 block">
                  <span className="sr-only">
                    {BATCH_LABELS.type} {index + 1}
                  </span>
                  <select
                    value={draft.category ?? ''}
                    onChange={(event) => update(draft.key, { category: event.target.value as Category })}
                    className={`min-h-11 w-full appearance-none rounded-full border px-4 text-sm ${
                      draft.category ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface/60 text-ink'
                    }`}
                  >
                    <option value="" disabled>
                      {BATCH_LABELS.pickType}
                    </option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </li>
        ))}
      </ul>

      {drafts.length < MAX_BATCH && (
        <PhotosInput
          onFiles={add}
          className="mt-7 flex items-center gap-2 py-2 text-eyebrow text-ink uppercase hover:text-accent"
        >
          <Icon name="plus" className="size-4" />
          {BATCH_LABELS.addMore}
        </PhotosInput>
      )}

      <div className="sticky bottom-0 -mx-5 mt-6 bg-canvas/90 px-5 pt-3 pb-1 backdrop-blur-md">
        {/* Next to the button, so she sees it even far down a long list. */}
        {message && (
          <p role="alert" className="mb-3 text-sm text-accent">
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving || reading || ready.length === 0}
          className="key-ink w-full rounded-full py-4 text-eyebrow uppercase disabled:opacity-50"
        >
          {reading ? BATCH_LABELS.reading : BATCH_LABELS.save(ready.length)}
        </button>
      </div>
    </div>
  )
}
