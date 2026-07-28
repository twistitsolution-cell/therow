import { useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

/**
 * Full-screen image viewer. Keyboard-driven (arrows and Escape) and it locks page scroll while
 * open, so the gallery does not slide away underneath the overlay.
 */
export default function Lightbox({ images, index, onClose, onNavigate }) {
  const open = index !== null && index >= 0

  const go = useCallback(
    (delta) => {
      if (!open || images.length === 0) return
      onNavigate((index + delta + images.length) % images.length)
    },
    [open, images.length, index, onNavigate],
  )

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, go, onClose])

  const current = open ? images[index] : null

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          /* A dimmed backdrop is correct here — it is a viewer, not a page surface, and the
             photograph needs the contrast. The chrome on top of it stays light. */
          className="fixed inset-0 z-[60] flex items-center justify-center bg-text-primary/92 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption ?? 'Image viewer'}
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-background-soft/90 text-text-primary shadow-soft transition-colors hover:bg-background-soft"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                className="absolute left-3 grid h-12 w-12 place-items-center rounded-full bg-background-soft/90 text-text-primary shadow-soft transition-colors hover:bg-background-soft sm:left-8"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                className="absolute right-3 grid h-12 w-12 place-items-center rounded-full bg-background-soft/90 text-text-primary shadow-soft transition-colors hover:bg-background-soft sm:right-8"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <motion.figure
            key={current.url}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-h-[86vh] w-full max-w-5xl px-14 sm:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.url}
              alt={current.caption ?? ''}
              className="mx-auto max-h-[76vh] w-auto rounded-xl object-contain shadow-luxury-lg"
            />
            <figcaption className="mt-4 flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-brand text-background-warm">
              {current.caption}
              {images.length > 1 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-brand" />
                  {index + 1} / {images.length}
                </>
              )}
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
