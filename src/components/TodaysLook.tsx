import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { removeLook, saveLook } from '../db'
import { todaysLooks } from '../engine'
import { TODAY_LABELS } from '../lib/labels'
import type { ClothingItem, Day, Outfit, Suggestion, Wear } from '../types'
import { Icon } from './Icon'
import { OutfitCollage } from './OutfitCollage'

/** Remembers how many times she tapped "Another" today, so reopening the app doesn't undo it. */
const SKIPS_KEY = 'marcelas-closet:today'

const LONG_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

interface Skips {
  day: Day
  skipped: number
}

function readSkips(): Skips | null {
  try {
    const value = JSON.parse(localStorage.getItem(SKIPS_KEY) ?? 'null') as Skips | null
    return value && typeof value.day === 'string' && Number.isInteger(value.skipped) ? value : null
  } catch {
    return null
  }
}

function writeSkips(skips: Skips) {
  try {
    localStorage.setItem(SKIPS_KEY, JSON.stringify(skips))
  } catch {
    // Storage blocked: "Another" still works until the app is closed.
  }
}

/**
 * Today's pick and the "Another" button behind it. The pick stays put all day, skips last
 * until midnight, and the list wraps around after the last look.
 */
export function useTodaysPick(items: ClothingItem[], outfits: Outfit[], wears: Wear[], today: Day) {
  const looks = useMemo(() => todaysLooks(items, outfits, wears, today), [items, outfits, wears, today])
  const [skips, setSkips] = useState<Skips | null>(readSkips)
  const skipped = skips?.day === today ? skips.skipped : 0
  const look: Suggestion | undefined = looks.length > 0 ? looks[skipped % looks.length] : undefined

  const another = () => {
    const next = { day: today, skipped: skipped + 1 }
    writeSkips(next)
    setSkips(next)
  }
  return { look, another, choices: looks.length }
}

interface TodaysLookProps {
  look: Suggestion
  /** Pieces she logged as worn today (any way): then the card shows those instead. */
  wearing: ClothingItem[]
  byId: Map<string, ClothingItem>
  saved: Outfit | undefined
  savedCount: number
  choices: number
  today: Day
  onAnother: () => void
  onWore: (itemIds: string[]) => void
}

/** One look, big, at the top of Looks: the stylist's pick for today. */
export function TodaysLook({ look, wearing, byId, saved, savedCount, choices, today, onAnother, onWore }: TodaysLookProps) {
  const [y, m, d] = today.split('-').map(Number)
  const date = LONG_DAY.format(new Date(y, m - 1, d))
  const isWearing = wearing.length > 0
  const pieces = isWearing ? wearing : look.items.flatMap((item) => byId.get(item.id) ?? [])
  const itemIds = look.items.map((item) => item.id)

  return (
    <section aria-label={TODAY_LABELS.kicker} className="mx-auto mt-9 max-w-5xl sm:mt-12">
      <motion.article
        key={isWearing ? 'wearing' : look.signature}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-5 rounded-card bg-surface p-3 shadow-card md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-10 md:p-4"
      >
        <div className="overflow-hidden rounded-2xl">
          <OutfitCollage items={pieces} />
        </div>
        <div className="px-1.5 pb-1.5 md:pr-6">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-eyebrow text-accent uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-accent" />
            <span>{isWearing ? TODAY_LABELS.wearing : TODAY_LABELS.kicker} ·</span>
            <span className="whitespace-nowrap">{date}</span>
          </p>
          {!isWearing && <h2 className="mt-4 font-serif text-title text-balance">{look.why}</h2>}
          <p className={isWearing ? 'mt-4 font-serif text-title text-balance' : 'mt-3 text-sm leading-relaxed text-muted'}>
            {pieces.map((item) => item.name).join(' · ')}
          </p>
          {!isWearing && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onWore(itemIds)}
                className="flex h-11 items-center gap-1.5 rounded-full bg-ink pr-5 pl-4 text-button font-medium text-canvas shadow-print transition-transform active:scale-[0.97]"
              >
                <Icon name="hanger" className="size-[1.375rem]" />
                {TODAY_LABELS.woreIt}
              </button>
              {choices > 1 && (
                <button
                  type="button"
                  onClick={onAnother}
                  className="flex h-11 items-center gap-1.5 rounded-full border border-ink pr-5 pl-4 text-button font-medium text-ink transition-colors hover:bg-ink hover:text-canvas active:scale-[0.97]"
                >
                  {TODAY_LABELS.another}
                  <Icon name="arrow" className="size-4" />
                </button>
              )}
              <button
                type="button"
                aria-pressed={Boolean(saved)}
                onClick={() => (saved ? removeLook(saved.id) : saveLook(itemIds, `Look Nº ${savedCount + 1}`))}
                className={`flex h-11 items-center gap-1.5 rounded-full border pr-4 pl-3 text-button font-medium transition-colors active:scale-[0.97] ${
                  saved ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-ink hover:border-muted'
                }`}
              >
                <Icon name="heart" filled={Boolean(saved)} className="size-[1.375rem]" />
                {saved ? TODAY_LABELS.saved : TODAY_LABELS.save}
              </button>
            </div>
          )}
        </div>
      </motion.article>
    </section>
  )
}
