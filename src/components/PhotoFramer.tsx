import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import Cropper, { type Area, type MediaSize } from 'react-easy-crop'
import { PIECE_ASPECT, type CropArea } from '../lib/image'
import { FRAME_LABELS } from '../lib/labels'

interface PhotoFramerProps {
  /** The photo to frame: the full-size original she just picked, or a piece's saved photo. */
  source: Blob
  onDone: (area: CropArea) => void
  onCancel: () => void
  /** The phone couldn't open the photo (say, a HEIC on a Windows PC). */
  onError: () => void
}

const MAX_ZOOM = 5

/**
 * The smallest zoom that still shows the whole photo inside the 3:4 frame. Below 1 the frame
 * reaches past the photo's edges; that part is filled in (`cropPlan`).
 */
export function fitZoom(media: { width: number; height: number }) {
  const ratio = media.width / media.height
  return Math.min(1, ratio / PIECE_ASPECT, PIECE_ASPECT / ratio)
}

/**
 * "Frame it" (Marce, 2026-11-24): full screen over the piece's form. The photo sits behind a
 * 3:4 frame, the shape of every card; she pinches to zoom and drags to move, so a full-length
 * photo can give just the top, or just the pants. One tap on "Use this" keeps the middle.
 */
export function PhotoFramer({ source, onDone, onCancel, onError }: PhotoFramerProps) {
  const url = useMemo(() => URL.createObjectURL(source), [source])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(1)
  const area = useRef<Area | null>(null)
  // "Use this" waits until the photo is showing and the frame has a place on it.
  const [ready, setReady] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panel.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // The form's sheet listens for Escape too: only the framer closes.
      event.stopImmediatePropagation()
      onCancel()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancel])

  return createPortal(
    <motion.div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={FRAME_LABELS.title}
      tabIndex={-1}
      // Tells the update check a form is open, so it asks instead of reloading.
      data-sheet=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      // No page zoom from a pinch beside the photo: only the photo zooms.
      className="deck fixed inset-0 z-[70] flex touch-none flex-col outline-none"
    >
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 text-center">
        <h2 className="font-serif text-[1.75rem] italic">{FRAME_LABELS.title}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-on-deck/70">{FRAME_LABELS.hint}</p>
      </div>

      <div className="relative mx-4 min-h-0 flex-1">
        <Cropper
          image={url}
          crop={crop}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={MAX_ZOOM}
          aspect={PIECE_ASPECT}
          objectFit="contain"
          // Held inside the photo, except when zoomed out to see all of it.
          restrictPosition={zoom >= 1}
          showGrid={false}
          zoomSpeed={0.5}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => {
            area.current = pixels
            setReady(true)
          }}
          onMediaLoaded={(media: MediaSize) => setMinZoom(fitZoom({ width: media.naturalWidth, height: media.naturalHeight }))}
          style={{
            containerStyle: { background: 'transparent' },
            cropAreaStyle: { border: '2px solid var(--on-deck)', borderRadius: '6px', color: 'var(--frame-dim)' },
          }}
          mediaProps={{ alt: '', onError }}
        />
      </div>

      <div className="px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <label className="mx-auto flex max-w-sm items-center gap-3 text-eyebrow text-on-deck/70 uppercase">
          {FRAME_LABELS.zoom}
          <input
            type="range"
            min={minZoom}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
        </label>
        <div className="mx-auto mt-4 flex max-w-sm gap-3">
          <button type="button" onClick={onCancel} className="key flex-1 rounded-full py-3.5 text-eyebrow uppercase">
            {FRAME_LABELS.cancel}
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => area.current && onDone(area.current)}
            className="key-ink flex-[2] rounded-full py-3.5 text-eyebrow uppercase disabled:opacity-50"
          >
            {FRAME_LABELS.done}
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  )
}
