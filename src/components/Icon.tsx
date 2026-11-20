/** Thin line icons, drawn to match the serif type. */
const PATHS = {
  hanger: (
    <>
      <path d="M10 6.2a2 2 0 1 1 2.7 1.9c-.4.2-.7.5-.7 1V10" />
      <path d="M12 10 3.6 16.1a1 1 0 0 0 .6 1.9h15.6a1 1 0 0 0 .6-1.9L12 10Z" />
    </>
  ),
  looks: (
    <>
      <rect x="3.5" y="5" width="9" height="12.5" rx="0.5" transform="rotate(-7 8 11.25)" />
      <rect x="11" y="6.5" width="9" height="12.5" rx="0.5" transform="rotate(6 15.5 12.75)" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.6C10 5.1 7 4.6 3.5 5.1v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5v-13c-3.5-.5-6.5 0-8.5 1.5Z" />
      <path d="M12 6.6v13" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  heart: (
    <path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z" />
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
}

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  className?: string
  /** Fill the shape (used for a chosen heart). */
  filled?: boolean
}

export function Icon({ name, className = 'size-5', filled = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}
