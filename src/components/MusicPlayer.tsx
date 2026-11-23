import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MUSIC_LABELS } from '../lib/labels'
import { nextMusic, toggleMusic, useMusic, useSong } from '../lib/music'
import { SONGS, nextSong } from '../lib/playlist'

const titleOf = (song: number | null) => (song === null ? MUSIC_LABELS.station : SONGS[song].title)

/**
 * The record in the masthead (Jose, 2026-11-23): it turns while the music plays, and a tap
 * shows what's playing with play / pause and next. It shows even after "Open quietly", so
 * she can start the music with a tap.
 */
export function MusicPlayer({ className = '' }: { className?: string }) {
  const music = useMusic()
  const song = useSong()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const cardId = useId()

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

  const playing = music === 'on'
  const title = titleOf(song)
  const place =
    song === null
      ? `${MUSIC_LABELS.station} · ${MUSIC_LABELS.songCount(SONGS.length)}`
      : `${playing ? MUSIC_LABELS.nowPlaying : MUSIC_LABELS.station} · ${MUSIC_LABELS.of(song + 1, SONGS.length)}`

  return (
    <div ref={box} className={`z-50 ${className}`}>
      <button
        type="button"
        aria-label={`${MUSIC_LABELS.open}: ${title}`}
        aria-expanded={open}
        aria-controls={cardId}
        ref={button}
        onClick={() => setOpen((value) => !value)}
        className="key grid h-11 w-11 place-items-center rounded-full"
      >
        <span aria-hidden="true" className={`record block size-7 ${playing ? 'spinning' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={cardId}
            role="group"
            aria-label={MUSIC_LABELS.open}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute top-full right-0 mt-2 w-[min(19rem,calc(100vw-2rem))] origin-top-right rounded-card bg-surface p-3 text-left shadow-card"
          >
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={`record size-12 shrink-0 ${playing ? 'spinning' : ''}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[0.625rem] font-semibold tracking-[0.18em] text-accent uppercase">{place}</p>
                <p lang="es" className="mt-1 font-serif text-xl leading-tight text-balance italic">
                  {title}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                aria-label={playing ? MUSIC_LABELS.pause : MUSIC_LABELS.play}
                onClick={toggleMusic}
                className="key-ink grid size-11 place-items-center rounded-full"
              >
                <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="currentColor" aria-hidden="true">
                  {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l10.5-6.5z" />}
                </svg>
              </button>
              <button
                type="button"
                aria-label={MUSIC_LABELS.next}
                onClick={nextMusic}
                className="key grid size-11 place-items-center rounded-full"
              >
                <svg viewBox="0 0 24 24" className="size-[1.125rem]" fill="currentColor" aria-hidden="true">
                  <path d="M6 6v12l8.5-6zM16 6h2v12h-2z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * The dark band under the masthead, like a radio's display: what's playing and what's next,
 * or the station's songs while it's quiet. It slides only while the music plays.
 */
export function RadioTicker() {
  const music = useMusic()
  const song = useSong()
  const playing = music === 'on' && song !== null
  const items = playing
    ? [
        { label: true, text: MUSIC_LABELS.nowPlaying },
        { label: false, text: SONGS[song].title },
        { label: true, text: MUSIC_LABELS.upNext },
        { label: false, text: SONGS[nextSong(song)].title },
      ]
    : [{ label: true, text: MUSIC_LABELS.station }, ...SONGS.map((item) => ({ label: false, text: item.title }))]
  // Two equal halves, each wider than a laptop screen, so the slide loops without a jump.
  const half = [...items, ...items, ...items]

  return (
    <div aria-hidden="true" className="deck overflow-hidden py-2.5 text-[0.625rem] font-semibold tracking-[0.24em] uppercase">
      <div className={`flex w-max ${playing ? 'ticker-run' : ''}`}>
        {[0, 1].map((copy) => (
          <span key={copy} className="flex shrink-0 items-center whitespace-nowrap">
            {half.map((item, index) => (
              <Fragment key={index}>
                <span lang={item.label ? undefined : 'es'} className={`px-3 ${item.label ? 'text-on-deck/60' : ''}`}>
                  {item.text}
                </span>
                <span className="text-mango">{item.label ? '●' : '♪'}</span>
              </Fragment>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
