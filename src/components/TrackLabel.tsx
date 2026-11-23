/** A look's number as a round record label, overlapping the card's top left corner (Jose, 2026-11-23). */
export function TrackLabel({ number }: { number: number }) {
  const padded = String(number).padStart(2, '0')
  return (
    <p
      aria-label={`Track ${padded}`}
      className="absolute -top-3 -left-2 z-30 grid size-16 -rotate-6 place-items-center rounded-full bg-accent text-on-accent shadow-print"
    >
      <span aria-hidden="true" className="absolute inset-1.5 rounded-full border border-on-accent/30" />
      <span aria-hidden="true" className="absolute top-3 text-[0.5rem] font-semibold tracking-[0.24em] uppercase">
        Track
      </span>
      <span aria-hidden="true" className="mt-3 font-serif text-[1.75rem] leading-none italic oldstyle">
        {padded}
      </span>
    </p>
  )
}
