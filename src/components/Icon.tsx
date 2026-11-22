import type { ReactNode } from 'react'

/**
 * The app's icons, in two kinds.
 * Stickers (Jose asked for icons with more presence, 2026-11-21): chunky filled shapes in the
 * palette with a dark outline and a small white shine, flat so the clothing photos stay the star.
 * Lines: the small helper marks (plus, close, arrow), drawn with a firm stroke.
 */

const LINE = 'var(--icon-line)'
const SHINE = { stroke: '#fff', strokeOpacity: 0.6, strokeLinecap: 'round' as const, fill: 'none' }

const HEART = 'M12 20s-8-4.6-8-10.4A4.5 4.5 0 0 1 12 6.9a4.5 4.5 0 0 1 8 2.7C20 15.4 12 20 12 20Z'

const STICKERS: Record<'hanger' | 'looks' | 'vinyl', ReactNode> = {
  /** Closet: a mango hanger with a little hibiscus bow. */
  hanger: (
    <>
      <path d="M10.2 6.4a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v1" fill="none" stroke={LINE} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M12 10.1 3.4 16a1.3 1.3 0 0 0 .7 2.4h15.8a1.3 1.3 0 0 0 .7-2.4Z" fill="var(--mango)" stroke={LINE} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M5.6 16.6 10.6 13" strokeWidth={1.1} {...SHINE} />
      <path d="M12 10.6 9.4 9.2v2.8Zm0 0 2.6-1.4v2.8Z" fill="var(--accent)" stroke={LINE} strokeWidth={1} strokeLinejoin="round" />
    </>
  ),
  /** Looks: two photo prints, palm and hibiscus. */
  looks: (
    <>
      <g transform="rotate(-9 7.8 11.4)">
        <rect x="3" y="5" width="9.6" height="12.6" rx=".8" fill="var(--mat)" stroke={LINE} strokeWidth={1.5} />
        <rect x="4.4" y="6.4" width="6.8" height="7.6" fill="var(--palm)" />
      </g>
      <g transform="rotate(7 15.6 12.6)">
        <rect x="10.8" y="6.3" width="9.6" height="12.6" rx=".8" fill="var(--mat)" stroke={LINE} strokeWidth={1.5} />
        <rect x="12.2" y="7.7" width="6.8" height="7.6" fill="var(--accent)" />
        <path d="M13.2 9.4l1.6-1" strokeWidth={1} {...SHINE} />
      </g>
    </>
  ),
  /** Lookbook: a record with a hibiscus label (her looks as a playlist). */
  vinyl: (
    <>
      <circle cx="12" cy="12" r="9.2" fill="var(--vinyl)" stroke={LINE} strokeWidth={1.5} />
      <circle cx="12" cy="12" r="6.9" fill="none" stroke="#fff" strokeOpacity={0.2} strokeWidth={0.7} />
      <circle cx="12" cy="12" r="5.3" fill="none" stroke="#fff" strokeOpacity={0.2} strokeWidth={0.7} />
      <circle cx="12" cy="12" r="3.4" fill="var(--accent)" />
      <circle cx="12" cy="12" r=".9" fill="var(--mat)" />
      <path d="M6.6 8.4a7 7 0 0 1 2.6-2.6" strokeWidth={1.2} {...SHINE} />
    </>
  ),
}

const LINES: Record<'plus' | 'close' | 'arrow' | 'play', ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  play: <path d="M8.5 5.5v13l10-6.5z" strokeLinejoin="round" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
}

export type IconName = keyof typeof STICKERS | keyof typeof LINES | 'heart'

interface IconProps {
  name: IconName
  className?: string
  /** For the heart: filled hibiscus when chosen (saved, favorite), white when not. */
  filled?: boolean
}

export function Icon({ name, className = 'size-5', filled = false }: IconProps) {
  if (name in LINES) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        {LINES[name as keyof typeof LINES]}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {name === 'heart' ? (
        <>
          <path d={HEART} fill={filled ? 'var(--accent)' : 'var(--mat)'} stroke={LINE} strokeWidth={1.5} strokeLinejoin="round" />
          <path
            d="M7 9.2a2 2 0 0 1 1.6-1.5"
            strokeWidth={1.3}
            {...SHINE}
            {...(filled ? { strokeOpacity: 0.7 } : { stroke: 'var(--accent)', strokeOpacity: 0.5 })}
          />
        </>
      ) : (
        STICKERS[name as keyof typeof STICKERS]
      )}
    </svg>
  )
}
