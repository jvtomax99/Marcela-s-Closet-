import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/** Slides up from the bottom on a phone and floats in the center on a laptop. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panel.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div key="sheet" className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-[#16120e]/45 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            // Tells the update check a form is open, so it asks instead of reloading.
            data-sheet=""
            tabIndex={-1}
            className="grain relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] bg-canvas shadow-2xl outline-none md:max-w-xl md:rounded-[1.75rem]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="sticky top-0 z-10 bg-canvas/90 px-5 backdrop-blur-md">
              <div aria-hidden="true" className="mx-auto h-1 w-10 translate-y-2 rounded-full bg-line md:hidden" />
              <div className="flex items-center justify-between py-4">
                <h2 className="font-serif text-[1.75rem] italic">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
                >
                  <Icon name="close" className="size-5" />
                </button>
              </div>
            </div>
            <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
