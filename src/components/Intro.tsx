import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { APP_VOLUME, setMusicVolume, startMusic } from '../lib/music'
import { MusicButton } from './MusicButton'
import { CLIP_START_MS, CLIP_WAIT_MS, INTRO_FILES, INTRO_MAX_MS, introLayout, introMode, introMusicFile } from '../lib/intro'
import { INTRO_LABELS } from '../lib/labels'

type Phase = 'waiting' | 'opening' | 'leaving'

const ease = [0.22, 1, 0.36, 1] as const

const musicFile = () =>
  introMusicFile(document.createElement('audio').canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '')

/**
 * Whole-file downloads, played from memory. Safari asks for videos in pieces, which the
 * offline helper can't keep, so a plain <video src> would be missing with no signal.
 */
async function download(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return response
}

const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))

/**
 * The wardrobe that opens before the app: a still while waiting, then (after a tap) the doors
 * open, with music if she asked for it, and the whole thing fades into the app. It never
 * waits on a slow connection: if the clip isn't ready soon after the tap, it goes straight in.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('waiting')
  const [clipSrc, setClipSrc] = useState<string | null>(null)
  const [clipShowing, setClipShowing] = useState(false)

  const [setup] = useState(() => {
    const layout = introLayout(window.innerWidth, window.innerHeight)
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const mode = introMode({
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      saveData: Boolean(connection?.saveData),
    })
    return { layout, mode }
  })

  const phaseRef = useRef<Phase>('waiting')
  const clipUrl = useRef<Promise<string | null>>(Promise.resolve(null))
  const musicData = useRef<Promise<ArrayBuffer | null>>(Promise.resolve(null))
  const video = useRef<HTMLVideoElement>(null)
  const playing = useRef(false)
  const openButton = useRef<HTMLButtonElement>(null)

  // Start downloading the clip and music as soon as the screen shows, so a tap starts at once.
  useEffect(() => {
    const controller = new AbortController()
    const urls: string[] = []
    if (setup.mode === 'clip') {
      clipUrl.current = download(INTRO_FILES.clip, controller.signal)
        .then((response) => response.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob)
          urls.push(url)
          return url
        })
        .catch(() => null)
    }
    // Not cancelled when the intro closes: the music carries on into the app.
    musicData.current = download(musicFile())
      .then((response) => response.arrayBuffer())
      .catch(() => null)
    return () => {
      controller.abort()
      // Let the fade into the app finish before the clip is released.
      setTimeout(() => urls.forEach((url) => URL.revokeObjectURL(url)), 1000)
    }
  }, [setup])

  const leave = useCallback(() => {
    if (phaseRef.current === 'leaving') return
    phaseRef.current = 'leaving'
    setPhase('leaving')
    // The music keeps looping in the app, softer (Jose, 2026-11-21).
    setMusicVolume(APP_VOLUME, 1.2)
    onDone()
  }, [onDone])

  const open = (withSound: boolean) => {
    if (phaseRef.current !== 'waiting') return
    phaseRef.current = 'opening'
    setPhase('opening')
    if (withSound) startMusic(musicData.current)
    // A safety net: never stay on the intro, whatever the phone does with the clip.
    setTimeout(leave, INTRO_MAX_MS)
    void Promise.race([clipUrl.current, timeout(CLIP_WAIT_MS)]).then((url) => {
      if (phaseRef.current !== 'opening') return
      if (url) setClipSrc(url)
      // No clip (reduced motion, data saver, slow or missing): a short pause, then straight in.
      else setTimeout(leave, withSound ? 1200 : 500)
    })
  }

  // Play the clip once it's on screen. A phone can refuse (Low Power Mode, for example)
  // without any error, so if it hasn't started soon, go straight in.
  useEffect(() => {
    if (!clipSrc) return
    video.current?.play().catch(leave)
    const fallback = setTimeout(() => {
      if (!playing.current) leave()
    }, CLIP_START_MS)
    return () => clearTimeout(fallback)
  }, [clipSrc, leave])

  // Keyboard and screen-reader users start on the main button, not in the app underneath.
  // focusVisible: false keeps the ring hidden until she actually uses a keyboard.
  useEffect(() => openButton.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave])

  // A tap anywhere opens it with sound (browsers only play sound after a tap); a tap while it
  // plays skips ahead.
  const onTap = () => (phaseRef.current === 'waiting' ? open(true) : leave())

  const waiting = phase === 'waiting'
  const print = setup.layout === 'print'

  const scene = (
    <>
      <img src={INTRO_FILES.still} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {clipSrc && (
        <video
          ref={video}
          src={clipSrc}
          muted
          playsInline
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${clipShowing ? 'opacity-100' : 'opacity-0'}`}
          onPlaying={() => {
            playing.current = true
            setClipShowing(true)
          }}
          onEnded={() => setTimeout(leave, 350)}
          onError={leave}
        />
      )}
    </>
  )

  const words = (
    <>
      <p className={`flex items-center gap-3 text-eyebrow text-muted uppercase ${print ? '' : 'justify-center'}`}>
        <span aria-hidden="true" className="h-px w-8 bg-accent" />
        {INTRO_LABELS.kicker}
        {!print && <span aria-hidden="true" className="h-px w-8 bg-accent" />}
      </p>
      <h1 className="mt-4 font-serif text-display font-light italic">{INTRO_LABELS.title}</h1>
      <p
        className={`mt-3 font-serif leading-snug text-balance text-muted italic ${print ? 'max-w-sm text-2xl' : 'mx-auto max-w-[17rem] text-lg'}`}
      >
        {INTRO_LABELS.tagline}
      </p>
    </>
  )

  const buttons = (
    <>
      <button
        ref={openButton}
        type="button"
        className="w-full max-w-xs rounded-full bg-ink py-4 text-eyebrow text-canvas uppercase shadow-print transition-transform duration-300 hover:-translate-y-0.5"
        onClick={(event) => {
          event.stopPropagation()
          open(true)
        }}
      >
        {INTRO_LABELS.withSound}
      </button>
      <button
        type="button"
        className="py-2 text-eyebrow text-ink uppercase hover:text-accent"
        onClick={(event) => {
          event.stopPropagation()
          open(false)
        }}
      >
        {INTRO_LABELS.quietly}
      </button>
    </>
  )

  const fadeWords = {
    initial: { opacity: 0, y: 12 },
    animate: waiting ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 },
    transition: { duration: 0.5, ease },
  }
  const fadeButtons = {
    style: { pointerEvents: waiting ? ('auto' as const) : ('none' as const) },
    initial: { opacity: 0, y: 16 },
    animate: waiting ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
    transition: { duration: 0.5, delay: waiting ? 0.15 : 0, ease },
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${INTRO_LABELS.kicker} ${INTRO_LABELS.title}`}
      className="grain fixed inset-0 z-50 overflow-hidden bg-canvas select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
      onClick={onTap}
    >
      {print ? (
        // Wide screens: the scene as a photo print on the paper board, words beside it.
        <div className="mx-auto grid h-full max-w-6xl grid-cols-[1fr_auto] items-center gap-16 px-8 lg:px-16">
          <div>
            <motion.header {...fadeWords}>{words}</motion.header>
            <motion.div className="mt-12 flex flex-col items-start gap-3" {...fadeButtons}>
              {buttons}
            </motion.div>
          </div>
          <motion.div
            className="relative aspect-[716/1284] h-[min(80dvh,calc((100vw-12rem)*0.9))] bg-mat p-[3.5%] shadow-print"
            initial={{ opacity: 0, y: 16, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: waiting ? -2 : -0.6 }}
            transition={{ duration: 0.7, ease }}
          >
            <div className="relative h-full w-full overflow-hidden">{scene}</div>
          </motion.div>
        </div>
      ) : (
        // Tall screens: the scene full-screen, words over paper-toned washes.
        <>
          {scene}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--canvas)_0%,var(--canvas)_20%,transparent_44%,transparent_62%,var(--canvas)_100%)]"
            animate={{ opacity: waiting ? 0.92 : 0 }}
            transition={{ duration: 0.5, ease }}
          />
          <motion.header
            className="absolute inset-x-0 top-0 px-6 pt-[calc(env(safe-area-inset-top)+3.5rem)] text-center"
            {...fadeWords}
          >
            {words}
          </motion.header>
          <motion.div
            className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)]"
            {...fadeButtons}
          >
            {buttons}
          </motion.div>
        </>
      )}

      {waiting && (
        <button
          type="button"
          className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-4 px-2 py-2 text-eyebrow text-muted uppercase hover:text-accent"
          onClick={(event) => {
            event.stopPropagation()
            leave()
          }}
        >
          {INTRO_LABELS.skip}
        </button>
      )}

      {phase === 'opening' && (
        <MusicButton className="absolute right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)]" />
      )}
    </motion.div>
  )
}
