import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { photoUrl } from '../lib/image'
import { ON_ME_LABELS } from '../lib/labels'
import type { ClothingItem, OnMePhoto } from '../types'
import { Icon } from './Icon'

/** "Fits me", "Not on me" or "No verdict yet", as a small tag. */
export function VerdictTag({ photo }: { photo: OnMePhoto }) {
  const text = photo.verdict === 'fits' ? ON_ME_LABELS.fits : photo.verdict === 'off' ? ON_ME_LABELS.off : ON_ME_LABELS.noVerdict
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[0.625rem] tracking-[0.16em] uppercase ${
        photo.verdict === 'fits' ? 'bg-ink text-canvas' : photo.verdict === 'off' ? 'bg-accent text-canvas' : 'bg-sand text-muted'
      }`}
    >
      {text}
    </span>
  )
}

interface OnMeViewerProps {
  photos: OnMePhoto[]
  byId: Map<string, ClothingItem>
  onClose: () => void
}

/** Her photos of a look, full screen over whatever is open, newest first. */
export function OnMeViewer({ photos, byId, onClose }: OnMeViewerProps) {
  const [index, setIndex] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  const photo = photos[Math.min(index, photos.length - 1)]

  useEffect(() => {
    panel.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // A sheet underneath listens for Escape too: only the viewer closes.
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  if (!photo) return null
  const names = photo.itemIds.flatMap((id) => byId.get(id)?.name ?? [])

  return createPortal(
    <motion.div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={ON_ME_LABELS.onYou}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="deck fixed inset-0 z-[70] flex flex-col outline-none"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <h2 className="font-serif text-[1.75rem] italic">{ON_ME_LABELS.onYou}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={ON_ME_LABELS.close}
          className="grid size-10 place-items-center rounded-full text-on-deck/80 hover:text-on-deck"
        >
          <Icon name="close" className="size-5" />
        </button>
      </div>
      <div className="relative mx-4 flex min-h-0 flex-1 items-center justify-center">
        <img
          src={photoUrl(`onme-${photo.id}`, photo.photo)}
          alt={names.join(', ')}
          onClick={(event) => {
            event.stopPropagation()
            if (photos.length > 1) setIndex((index + 1) % photos.length)
          }}
          className="max-h-full max-w-full rounded-[6px] object-contain shadow-print"
        />
      </div>
      <div className="px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-center">
        <VerdictTag photo={photo} />
        <p className="mx-auto mt-2 max-w-sm text-sm text-on-deck/80">{names.join(' · ')}</p>
        {photos.length > 1 && (
          <p className="mt-1 text-xs text-on-deck/60">
            {index + 1} / {photos.length}
          </p>
        )}
      </div>
    </motion.div>,
    document.body,
  )
}

interface OnYouButtonProps {
  photos: OnMePhoto[]
  byId: Map<string, ClothingItem>
  className?: string
}

/** A small print of her wearing this look, under a look card. Tap to see it big. */
export function OnYouButton({ photos, byId, className = '' }: OnYouButtonProps) {
  const [open, setOpen] = useState(false)
  if (photos.length === 0) return null
  const first = photos[0]
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-3 text-left text-eyebrow uppercase hover:text-accent ${className}`}
      >
        <span className="block h-14 w-[2.625rem] shrink-0 -rotate-3 bg-mat p-1 shadow-print">
          <img src={photoUrl(`onme-${first.id}`, first.photo)} alt="" className="h-full w-full object-cover" />
        </span>
        <span>
          {photos.length === 1 ? ON_ME_LABELS.onYou : ON_ME_LABELS.onYouCount(photos.length)}
          <span className="mt-1 block normal-case tracking-normal">
            <VerdictTag photo={first} />
          </span>
        </span>
      </button>
      {open && <OnMeViewer photos={photos} byId={byId} onClose={() => setOpen(false)} />}
    </>
  )
}
