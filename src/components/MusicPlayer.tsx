import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MUSIC_LABELS } from '../lib/labels'
import { stopMusic, useMusic } from '../lib/music'
import { parseSpotifyLink, readSpotifyLink, saveSpotifyLink } from '../lib/spotify'

/**
 * The record in the masthead (Jose, 2026-11-23; Spotify 2026-11-24). A tap shows a small card:
 * the first time, a box for her Spotify playlist link; after that, "Listen on Spotify", which
 * opens her playlist in the Spotify app. The record turns only while the intro's piece plays.
 */
export function MusicPlayer({ className = '' }: { className?: string }) {
  const music = useMusic()
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState(readSpotifyLink)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const cardId = useId()
  const inputId = useId()
  const hintId = useId()

  useEffect(() => {
    if (!open) return
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Escape') return
        setOpen(false)
        button.current?.focus()
      } else if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const toggle = () => {
    setOpen((value) => !value)
    setEditing(false)
    setProblem(null)
    setDraft('')
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    const clean = parseSpotifyLink(draft)
    if (!clean) return setProblem(MUSIC_LABELS.notSpotify)
    if (!saveSpotifyLink(clean)) return setProblem(MUSIC_LABELS.notKept)
    setLink(clean)
    setEditing(false)
    setProblem(null)
    setDraft('')
  }

  const asking = editing || !link

  return (
    <div ref={box} className={`z-50 ${className}`}>
      <button
        type="button"
        aria-label={MUSIC_LABELS.open}
        aria-expanded={open}
        aria-controls={cardId}
        ref={button}
        onClick={toggle}
        className="key grid h-11 w-11 place-items-center rounded-full"
      >
        <span aria-hidden="true" className={`record block size-7 ${music === 'on' ? 'spinning' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={cardId}
            role="group"
            aria-label={MUSIC_LABELS.title}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute top-full right-0 mt-2 w-[min(19rem,calc(100vw-2rem))] origin-top-right rounded-card bg-surface p-4 text-left shadow-card"
          >
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={`record size-12 shrink-0 ${music === 'on' ? 'spinning' : ''}`} />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-xl leading-tight italic">{MUSIC_LABELS.title}</p>
                <p className="mt-1 text-sm leading-snug text-muted">{MUSIC_LABELS.intro}</p>
              </div>
            </div>

            {asking ? (
              <form onSubmit={save} noValidate className="mt-4">
                <label htmlFor={inputId} className="text-eyebrow text-muted uppercase">
                  {MUSIC_LABELS.paste}
                </label>
                <input
                  id={inputId}
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    setProblem(null)
                  }}
                  placeholder={MUSIC_LABELS.placeholder}
                  aria-describedby={hintId}
                  aria-invalid={problem ? true : undefined}
                  className="mt-1 w-full border-b border-line bg-transparent py-2 text-base outline-none placeholder:text-muted/60 focus:border-accent"
                />
                <p id={hintId} className={`mt-2 text-sm leading-snug ${problem ? 'text-accent' : 'text-muted'}`} role={problem ? 'alert' : undefined}>
                  {problem ?? MUSIC_LABELS.howTo}
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  {link && (
                    <button type="button" onClick={() => setEditing(false)} className="key rounded-full px-4 py-2.5 text-sm">
                      {MUSIC_LABELS.cancel}
                    </button>
                  )}
                  <button type="submit" className="key-ink rounded-full px-5 py-2.5 text-sm font-semibold">
                    {MUSIC_LABELS.save}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 flex flex-col items-stretch gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    stopMusic()
                    setOpen(false)
                  }}
                  className="key-ink flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l10.5-6.5z" />
                  </svg>
                  {MUSIC_LABELS.listen}
                  <span className="sr-only">{MUSIC_LABELS.newWindow}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true)
                    setDraft('')
                  }}
                  className="self-center py-2 text-sm text-muted underline underline-offset-4 hover:text-ink"
                >
                  {MUSIC_LABELS.change}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
