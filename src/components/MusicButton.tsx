import { INTRO_LABELS } from '../lib/labels'
import { toggleMusic, useMusic } from '../lib/music'

/** The round mute / play button for the music. Shows only once the music has started. */
export function MusicButton({ className = '' }: { className?: string }) {
  const music = useMusic()
  if (music === 'off') return null
  return (
    <button
      type="button"
      aria-label={music === 'on' ? INTRO_LABELS.mute : INTRO_LABELS.unmute}
      aria-pressed={music === 'muted'}
      className={`grid h-11 w-11 place-items-center rounded-full bg-surface/80 text-ink shadow-print ${className}`}
      onClick={(event) => {
        event.stopPropagation()
        toggleMusic()
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
  )
}
