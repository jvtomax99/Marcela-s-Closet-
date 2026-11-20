import { useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { Intro } from './components/Intro'
import { Navigation } from './components/Navigation'
import { db } from './db'
import { shouldShowIntro } from './lib/intro'
import { goTo, useRoute } from './lib/useRoute'
import type { SuggestionFilters } from './types'
import { ClosetView } from './views/ClosetView'
import { LookbookView } from './views/LookbookView'
import { LooksView } from './views/LooksView'

export function App() {
  const route = useRoute()
  const items = useLiveQuery(() => db.items.orderBy('createdAt').reverse().toArray())
  const outfits = useLiveQuery(() => db.outfits.toArray())
  const [filters, setFilters] = useState<SuggestionFilters>({})
  // The wardrobe intro plays over the app on every launch; the closet loads underneath meanwhile.
  const [intro, setIntro] = useState(() => shouldShowIntro(window.location.search))

  const styleAround = (anchorId: string) => {
    setFilters({ anchorId })
    goTo('looks')
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
        <Navigation route={route} />
        {items && outfits && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={route}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="mx-auto max-w-6xl px-4 pb-36 sm:px-8 md:pb-20"
            >
              {route === 'closet' && <ClosetView items={items} outfits={outfits} onStyle={styleAround} />}
              {route === 'looks' && (
                <LooksView items={items} outfits={outfits} filters={filters} onFilters={setFilters} />
              )}
              {route === 'lookbook' && <LookbookView items={items} outfits={outfits} />}
            </motion.main>
          </AnimatePresence>
        )}
      </div>
      <AnimatePresence>{intro && <Intro key="intro" onDone={() => setIntro(false)} />}</AnimatePresence>
    </MotionConfig>
  )
}
