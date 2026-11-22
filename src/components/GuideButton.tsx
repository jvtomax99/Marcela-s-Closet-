import { useCallback, useEffect, useRef, useState } from 'react'
import { GUIDE_LABELS } from '../lib/labels'
import { APP_VOLUME, setMusicVolume } from '../lib/music'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

/** The narrated guides in `public/guide/` (made with `tools/guide-video/`), Spanish first. */
const GUIDES = {
  es: { label: GUIDE_LABELS.spanish, video: './guide/guia-es.mp4', poster: './guide/poster-es.webp' },
  en: { label: GUIDE_LABELS.english, video: './guide/guide-en.mp4', poster: './guide/poster-en.webp' },
} as const
type Language = keyof typeof GUIDES

/** The round play button in the masthead. The sheet it opens lives once, in `GuideSheet`. */
export function GuideButton({ onOpen, className = '' }: { onOpen: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={GUIDE_LABELS.open}
      className={`grid h-11 w-11 place-items-center rounded-full bg-surface/80 text-ink shadow-print ${className}`}
      onClick={onOpen}
    >
      <Icon name="play" className="h-5 w-5 translate-x-px" />
    </button>
  )
}

/** Whether the phone says it has a connection, kept current while the sheet is open. */
function useOnline(active: boolean) {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    if (!active) return
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [active])
  return online
}

/**
 * The "How it works" sheet: the video and the Español / English switch. Rendered once (not
 * inside a part of the masthead that hides when the phone turns). The video streams from the
 * site (the offline copy skips it); without signal the sheet says so. The app's music fades
 * out while the guide plays and comes back after.
 */
export function GuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [language, setLanguage] = useState<Language>('es')
  const [failed, setFailed] = useState(false)
  const online = useOnline(open)
  const video = useRef<HTMLVideoElement>(null)
  // Only gives the music back if the guide was the one that quieted it.
  const quieted = useRef(false)

  const quietMusic = () => {
    quieted.current = true
    setMusicVolume(0, 0.6)
  }
  const restoreMusic = useCallback(() => {
    if (!quieted.current) return
    quieted.current = false
    setMusicVolume(APP_VOLUME, 0.8)
  }, [])

  useEffect(() => {
    if (open) setFailed(false)
    else restoreMusic()
  }, [open, restoreMusic])
  useEffect(() => () => restoreMusic(), [restoreMusic])

  const close = () => {
    video.current?.pause()
    restoreMusic()
    onClose()
  }

  const guide = GUIDES[language]
  const offline = failed || !online

  return (
    <Sheet open={open} onClose={close} title={GUIDE_LABELS.title}>
      <div role="group" aria-label={GUIDE_LABELS.language} className="mx-auto mb-4 flex w-fit rounded-full bg-sand p-1">
        {(Object.keys(GUIDES) as Language[]).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={language === option}
            onClick={() => {
              restoreMusic()
              setFailed(false)
              setLanguage(option)
            }}
            className={`rounded-full px-5 py-2 text-button font-medium transition-colors ${
              language === option ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {GUIDES[option].label}
          </button>
        ))}
      </div>
      {offline ? (
        <p role="status" className="mx-auto max-w-sm py-16 text-center font-serif text-title text-balance">
          {GUIDE_LABELS.offline}
        </p>
      ) : (
        <video
          key={language}
          ref={video}
          src={guide.video}
          poster={guide.poster}
          controls
          playsInline
          preload="metadata"
          onPlay={quietMusic}
          onPause={restoreMusic}
          onEnded={restoreMusic}
          onError={() => {
            restoreMusic()
            setFailed(true)
          }}
          className="mx-auto block h-[min(68dvh,42rem)] w-auto max-w-full rounded-2xl bg-sand shadow-print"
        />
      )}
    </Sheet>
  )
}
