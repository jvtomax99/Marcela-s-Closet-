import { motion } from 'framer-motion'
import type { Route } from '../lib/useRoute'
import { Icon, type IconName } from './Icon'

const LINKS: { route: Route; label: string; icon: IconName }[] = [
  { route: 'closet', label: 'Closet', icon: 'hanger' },
  { route: 'looks', label: 'Looks', icon: 'looks' },
  { route: 'lookbook', label: 'Lookbook', icon: 'book' },
]

const EDITION = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

/** A magazine masthead at the top; on phones, the links move to a bar under the thumb. */
export function Navigation({ route }: { route: Route }) {
  return (
    <>
      <header className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-1 border-b border-line pt-5 pb-3 text-center md:grid-cols-[1fr_auto_1fr] md:pt-7 md:pb-4">
          <p className="hidden text-eyebrow text-muted uppercase md:block md:text-left">The {EDITION} edit</p>
          <a href="#/closet" className="font-serif text-[2rem] leading-none tracking-tight italic md:text-[2.5rem]">
            Closet
          </a>
          <p className="text-[0.625rem] tracking-[0.24em] text-muted uppercase md:hidden">{EDITION}</p>
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
          </nav>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
      >
        <div className="mx-auto flex max-w-md justify-around">
          {LINKS.map((link) => {
            const active = link.route === route
            return (
              <a
                key={link.route}
                href={`#/${link.route}`}
                aria-current={active ? 'page' : undefined}
                className={`relative flex w-24 flex-col items-center gap-1.5 pt-2.5 pb-2 text-[0.625rem] tracking-[0.18em] uppercase transition-colors ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-bottom"
                    className="absolute top-0 h-0.5 w-8 bg-accent"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon name={link.icon} className="size-[1.375rem]" />
                {link.label}
              </a>
            )
          })}
        </div>
      </nav>
    </>
  )
}
