import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** The small line above the title, e.g. "17 pieces". */
  kicker: ReactNode
  /** The big serif title; wrap a word in <em> to set it in the accent italic. */
  title: ReactNode
  /** A short magazine-style introduction beside the title. */
  intro?: ReactNode
}

export function PageHeader({ kicker, title, intro }: PageHeaderProps) {
  return (
    <div className="grid gap-6 pt-9 pb-10 sm:pt-14 sm:pb-14 md:grid-cols-[1fr_minmax(0,18rem)] md:items-end md:gap-12">
      <div>
        <p className="flex items-center gap-3 text-eyebrow text-muted uppercase">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          {kicker}
        </p>
        <h1 className="mt-5 font-serif text-display font-light [&_em]:font-normal [&_em]:text-accent">{title}</h1>
      </div>
      {intro && (
        <p className="max-w-sm font-serif text-xl leading-snug text-muted italic md:pb-2 md:text-right">{intro}</p>
      )}
    </div>
  )
}
