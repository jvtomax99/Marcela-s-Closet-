import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Route } from '../lib/useRoute'
import { Icon, type IconName } from './Icon'
import { GuideButton, GuideSheet } from './GuideButton'
import { MusicPlayer, RadioTicker } from './MusicPlayer'

const LINKS: { route: Route; label: string; icon: IconName }[] = [
  { route: 'closet', label: 'Closet', icon: 'hanger' },
  { route: 'looks', label: 'Looks', icon: 'looks' },
  { route: 'lookbook', label: 'Lookbook', icon: 'vinyl' },
]

const EDITION = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

/** A magazine masthead at the top; on phones, the links move to a bar under the thumb. */
export function Navigation({ route }: { route: Route }) {
  const [guide, setGuide] = useState(false)
  const openGuide = () => setGuide(true)
  return (
    <>
      <GuideSheet open={guide} onClose={() => setGuide(false)} />
      <header className="relative mx-auto max-w-6xl px-4 sm:px-8">
        {/* The music: a record top right on phones (Jose, 2026-11-23). */}
        <MusicPlayer className="absolute top-3 right-4 sm:right-8 md:hidden" />
        {/* The video guide: top left on phones, opposite the music. */}
        <GuideButton onOpen={openGuide} className="absolute top-3 left-4 sm:left-8 md:hidden" />
        <div className="grid grid-cols-1 items-center gap-1 pt-5 pb-4 text-center md:grid-cols-[1fr_auto_1fr] md:pt-7 md:pb-5">
          <p className="hidden text-eyebrow text-muted uppercase md:block md:text-left">The {EDITION} edit</p>
          <a href="#/closet" className="font-serif text-[2rem] leading-none tracking-tight italic md:text-[2.5rem]">
            Closet
          </a>
          <nav aria-label="Main" className="hidden justify-end gap-8 md:flex">
            {LINKS.map((link) => {
              const active = link.route === route
              return (
                <a
                  key={link.route}
                  href={`#/${link.route}`}
                  aria-current={active ? 'page' : undefined}
                  className={`relative py-2 text-eyebrow uppercase transition-colors ${
                    active ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-top"
                      className="absolute inset-x-0 -bottom-0.5 h-px bg-accent"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                </a>
              )
            })}
            <GuideButton onOpen={openGuide} className="-my-2" />
            <MusicPlayer className="relative -my-2" />
          </nav>
        </div>
      </header>
      <RadioTicker />

      {/* Phone: a floating capsule under the thumb, with a pill behind the current page (after Interpreter Hub). */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 flex justify-center md:hidden"
      >
        {/* The deck: dark in both modes, the current page lit by a hibiscus light (Jose, 2026-11-23). */}
        <div className="deck flex gap-1 rounded-full p-1.5 shadow-deck">
          {LINKS.map((link) => {
            const active = link.route === route
            return (
              <a
                key={link.route}
                href={`#/${link.route}`}
                aria-current={active ? 'page' : undefined}
                className={`relative flex w-[5.75rem] flex-col items-center gap-0.5 rounded-full pt-2 pb-2.5 text-[0.6875rem] font-medium transition-colors ${
                  active ? 'text-on-deck' : 'text-on-deck/65'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-bottom"
                    className="absolute inset-x-0 bottom-1 mx-auto h-[3px] w-6 rounded-full bg-accent shadow-glow"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon name={link.icon} className="relative size-7" />
                <span className="relative">{link.label}</span>
              </a>
            )
          })}
        </div>
      </nav>
    </>
  )
}
