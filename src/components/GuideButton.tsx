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

/**
 * The round play button in the masthead and the "How it works" sheet behind it. The video
 * streams from the site (the offline copy skips it); without signal the sheet says so.
 * The app's music fades out while the guide plays.
 */
export function GuideButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<Language>('es')
  const [failed, setFailed] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  const quietMusic = () => setMusicVolume(0, 0.6)
  const restoreMusic = useCallback(() => setMusicVolume(APP_VOLUME, 0.8), [])
  const close = useCallback(() => {
    video.current?.pause()
    restoreMusic()
    setOpen(false)
  }, [restoreMusic])

  // The music comes back if the sheet closes while the video plays.
  useEffect(() => () => restoreMusic(), [restoreMusic])

  const guide = GUIDES[language]
  const offline = failed || (typeof navigator !== 'undefined' && navigator.onLine === false)

  return (
    <>
      <button
        type="button"
        aria-label={GUIDE_LABELS.open}
        className={`grid h-11 w-11 place-items-center rounded-full bg-surface/80 text-ink shadow-print ${className}`}
        onClick={() => {
          setFailed(false)
          setOpen(true)
        }}
      >
        <Icon name="play" className="h-5 w-5 translate-x-px" />
      </button>

      <Sheet open={open} onClose={close} title={GUIDE_LABELS.title}>
        <div className="mx-auto mb-4 flex w-fit rounded-full bg-sand p-1">
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
            onError={() => setFailed(true)}
            className="mx-auto block h-[min(68dvh,42rem)] w-auto max-w-full rounded-2xl bg-sand shadow-print"
          />
        )}
      </Sheet>
    </>
  )
}
