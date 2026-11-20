import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  children: ReactNode
  action?: ReactNode
}

/** A line drawing of a hanger on a rail, like a sketch in the margin of a magazine. */
function RailSketch() {
  return (
    <svg
      viewBox="0 0 220 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mx-auto h-24 w-auto text-muted/70"
    >
      <path d="M10 22h200" />
      <path d="M100 22c0-8 14-8 14 0" className="stroke-accent" />
      <path d="M107 22v10L66 64a3 3 0 0 0 2 5.5h78a3 3 0 0 0 2-5.5L107 32" />
      <path d="M150 22c0-6 10-6 10 0v6" opacity=".5" />
      <path d="M155 28 132 46h46l-23-18" opacity=".5" />
      <path d="M44 22c0-6 10-6 10 0v6" opacity=".5" />
      <path d="M49 28 26 46h46L49 28" opacity=".5" />
      <path d="M58 100h104" opacity=".35" strokeDasharray="1 5" />
    </svg>
  )
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md py-14 text-center">
      <RailSketch />
      <p className="mt-6 font-serif text-title italic">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{children}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}
