import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CLIP_WAIT_MS, introFiles, introMode, introSize } from '../lib/intro'
import { INTRO_LABELS } from '../lib/labels'

type Phase = 'waiting' | 'opening' | 'leaving'

const ease = [0.22, 1, 0.36, 1] as const

/** AAC for Safari, Opus elsewhere. Both are the same 30 s piece. */
function musicFile() {
  const probe = document.createElement('audio')
  return probe.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? 'intro/music.m4a' : 'intro/music.webm'
}

/**
 * Whole-file downloads, played from memory. Safari asks for videos in pieces, which the
 * offline helper can't keep, so a plain <video src> would be missing with no signal.
 */
async function download(url: string, signal: AbortSignal) {
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
  const [music, setMusic] = useState<'off' | 'on' | 'muted'>('off')

  const [setup] = useState(() => {
    const size = introSize(window.innerWidth, window.innerHeight)
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const mode = introMode({
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      saveData: Boolean(connection?.saveData),
    })
    return { size, mode, files: introFiles(size) }
  })

  const phaseRef = useRef<Phase>('waiting')
  const clipUrl = useRef<Promise<string | null>>(Promise.resolve(null))
  const musicData = useRef<Promise<ArrayBuffer | null>>(Promise.resolve(null))
  const audio = useRef<{ context: AudioContext; gain: GainNode } | null>(null)

  // Start downloading the clip and music as soon as the screen shows, so a tap starts at once.
  useEffect(() => {
    const controller = new AbortController()
    const urls: string[] = []
    if (setup.mode === 'clip') {
      clipUrl.current = download(setup.files.clip, controller.signal)
        .then((response) => response.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob)
          urls.push(url)
          return url
        })
        .catch(() => null)
    }
    musicData.current = download(musicFile(), controller.signal)
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
    const sound = audio.current
    if (sound) {
      const now = sound.context.currentTime
      sound.gain.gain.cancelScheduledValues(now)
      sound.gain.gain.setValueAtTime(sound.gain.gain.value, now)
      sound.gain.gain.linearRampToValueAtTime(0, now + 1.2)
      setTimeout(() => void sound.context.close(), 1400)
      audio.current = null
    }
    onDone()
  }, [onDone])

  const startMusic = () => {
    const Context =
      window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) return
    // Made inside the tap, or the phone won't let it play.
    const context = new Context()
    void context.resume()
    const gain = context.createGain()
    gain.gain.value = 0
    gain.connect(context.destination)
    audio.current = { context, gain }
    void musicData.current.then(async (data) => {
      if (!data || audio.current?.context !== context) return
      const buffer = await context.decodeAudioData(data.slice(0))
      if (audio.current?.context !== context) return
      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      source.start()
      gain.gain.linearRampToValueAtTime(0.9, context.currentTime + 0.4)
      setMusic('on')
    })
  }

  const open = (withSound: boolean) => {
    if (phaseRef.current !== 'waiting') return
    phaseRef.current = 'opening'
    setPhase('opening')
    if (withSound) startMusic()
    void Promise.race([clipUrl.current, timeout(CLIP_WAIT_MS)]).then((url) => {
      if (phaseRef.current !== 'opening') return
      if (url) setClipSrc(url)
      // No clip (reduced motion, data saver, slow or missing): a short pause, then straight in.
      else setTimeout(leave, withSound ? 1200 : 500)
    })
  }

  const toggleMute = () => {
    const sound = audio.current
    if (!sound) return
    const muted = music === 'on'
    sound.gain.gain.setTargetAtTime(muted ? 0 : 0.9, sound.context.currentTime, 0.05)
    setMusic(muted ? 'muted' : 'on')
  }

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

  return (
    <motion.div
      role="dialog"
      aria-label={`${INTRO_LABELS.kicker} ${INTRO_LABELS.title}`}
      className="fixed inset-0 z-50 overflow-hidden bg-canvas select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
      onClick={onTap}
    >
      <img src={setup.files.still} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {clipSrc && (
        <video
          src={clipSrc}
          autoPlay
          muted
          playsInline
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${clipShowing ? 'opacity-100' : 'opacity-0'}`}
          onPlaying={() => setClipShowing(true)}
          onEnded={() => setTimeout(leave, 350)}
          onError={leave}
        />
      )}

      {/* Paper-toned washes so the words read on the picture, in light and dark mode. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--canvas)_0%,var(--canvas)_20%,transparent_44%,transparent_62%,var(--canvas)_100%)]"
        animate={{ opacity: phase === 'waiting' ? 0.92 : 0 }}
        transition={{ duration: 0.5, ease }}
      />

      <motion.header
        className="absolute inset-x-0 top-0 px-6 pt-[calc(env(safe-area-inset-top)+3.5rem)] text-center sm:pt-20"
        initial={{ opacity: 0, y: 12 }}
        animate={phase === 'waiting' ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease }}
      >
        <p className="flex items-center justify-center gap-3 text-eyebrow text-muted uppercase">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          {INTRO_LABELS.kicker}
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
        </p>
        <h1 className="mt-4 font-serif text-display font-light italic">{INTRO_LABELS.title}</h1>
        <p className="mx-auto mt-3 max-w-[17rem] font-serif text-lg leading-snug text-balance text-muted italic sm:max-w-xs sm:text-xl">
          {INTRO_LABELS.tagline}
        </p>
      </motion.header>

      <motion.div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] sm:pb-14"
        initial={{ opacity: 0, y: 16 }}
        animate={phase === 'waiting' ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.5, delay: phase === 'waiting' ? 0.15 : 0, ease }}
      >
        <button
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
      </motion.div>

      {phase === 'waiting' && (
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

      {music !== 'off' && phase === 'opening' && (
        <button
          type="button"
          aria-label={music === 'on' ? INTRO_LABELS.mute : INTRO_LABELS.unmute}
          className="absolute right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] grid h-11 w-11 place-items-center rounded-full bg-surface/80 text-ink shadow-print"
          onClick={(event) => {
            event.stopPropagation()
            toggleMute()
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 9h4l5-4v14l-5-4H4z" strokeLinejoin="round" />
            {music === 'on' ? (
              <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
            ) : (
              <path d="m16 9 6 6m0-6-6 6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      )}
    </motion.div>
  )
}
