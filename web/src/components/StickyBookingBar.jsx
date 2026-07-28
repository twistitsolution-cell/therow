import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import BookingWidget from './BookingWidget'

/**
 * Docks the search form to the bottom of the viewport once the hero has scrolled away, so the
 * primary conversion action is never more than one glance off screen. Hidden on /booking, where
 * the page already owns the search.
 */
export default function StickyBookingBar() {
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (location.pathname.startsWith('/booking')) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-line bg-background/95 px-4 py-3 shadow-[0_-8px_28px_-14px_rgba(27,31,35,0.18)] backdrop-blur-2xl md:block"
        >
          <div className="container-luxe">
            <BookingWidget variant="bar" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
