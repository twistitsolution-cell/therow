import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import BookingWidget from './BookingWidget'

/**
 * Autoplay cadence — the fast end of the 3–4s band.
 *
 * The fade is shortened alongside it. Cadence and fade have to move together: at a 3s tick with
 * a 1s crossfade the frame is only settled for two thirds of its turn, which reads as constant
 * motion rather than a sequence of photographs. At 800ms it settles for 2.2s.
 *
 * Copy is the constraint on going faster still — a twelve-word subtitle needs roughly this long
 * to read.
 */
const SLIDE_MS = 3000
const FADE_MS = 800

/** A drag shorter than this is a tap, not a swipe. */
const SWIPE_THRESHOLD = 50

/**
 * Full-bleed hero slider.
 *
 * The photograph is the point, so it is never washed out. A flat 26% scrim holds the frame down
 * and two directional gradients add density only where the headline and booking bar sit.
 *
 * Every frame stays mounted and cross-fades on opacity. Mount/unmount stacks frames whenever a
 * transition is interrupted or outlives the autoplay tick — at a 4s cadence that happens often.
 */
export default function Hero() {
  const { site } = useSite()
  const slides = site.heroSlides?.length ? site.heroSlides : []
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const touchStartX = useRef(null)
  const count = slides.length

  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 900], [0, 190])
  const contentY = useTransform(scrollY, [0, 700], [0, -70])
  const contentOpacity = useTransform(scrollY, [0, 480], [1, 0])

  const go = useCallback(
    (delta) => {
      if (count === 0) return
      setActive((current) => (current + delta + count) % count)
    },
    [count],
  )

  useEffect(() => {
    if (paused || count < 2) return
    const timer = setInterval(() => go(1), SLIDE_MS)
    return () => clearInterval(timer)
  }, [paused, count, go])

  // Pause while the tab is hidden so a backgrounded page does not race through the whole set.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX
    setPaused(true)
  }

  const onTouchEnd = (event) => {
    const start = touchStartX.current
    touchStartX.current = null
    setPaused(false)
    if (start === null) return
    const delta = start - event.changedTouches[0].clientX
    if (Math.abs(delta) > SWIPE_THRESHOLD) go(delta > 0 ? 1 : -1)
  }

  if (count === 0) return null
  const slide = slides[active]

  return (
    <section
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-text-primary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="The Row Residential Hotel"
    >
      <motion.div style={{ y: imageY }} className="absolute inset-0 -bottom-28">
        {slides.map((s, i) => (
          <div
            key={s.id ?? i}
            className="absolute inset-0 transition-opacity ease-in-out"
            style={{ opacity: i === active ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
            aria-hidden={i !== active}
          >
            {s.videoUrl ? (
              <video
                src={s.videoUrl}
                poster={s.imageUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={s.imageUrl}
                alt=""
                /* The first two are fetched up front so the opening transition never lands on an
                   empty frame; everything past that waits until it is needed. */
                fetchpriority={i === 0 ? 'high' : 'auto'}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                className={`h-full w-full object-cover ${i === active ? 'animate-ken-burns' : ''}`}
              />
            )}
          </div>
        ))}

        <div className="scrim" />
        <div className="scrim-side" />
        <div className="scrim-foot" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container-luxe relative flex h-full flex-col justify-end pb-28 pt-28 sm:justify-center sm:pb-32"
      >
        <div className="max-w-2xl">
          {/* Keyed remount rather than AnimatePresence. `mode="wait"` holds the incoming copy
              until the outgoing exit animation completes, and framer drives that on rAF — which
              is frozen while the tab is hidden, leaving the headline stuck on a stale slide. A
              plain keyed mount swaps the text immediately and animates it in. */}
          <div key={slide.id ?? active}>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {slide.eyebrow && (
                <span className="eyebrow-on-dark mb-5 flex items-center gap-3">
                  <span className="h-px w-10 bg-brand" aria-hidden="true" />
                  {slide.eyebrow}
                </span>
              )}

              <h1 className="font-display text-balance text-[2.7rem] font-normal leading-[1.04] tracking-tight text-background-soft drop-shadow-[0_2px_12px_rgba(24,20,16,0.45)] sm:text-6xl lg:text-[4.9rem]">
                {slide.title}
              </h1>

              {slide.subtitle && (
                <p className="mt-6 max-w-xl text-base leading-relaxed text-background-soft/85 drop-shadow-[0_1px_8px_rgba(24,20,16,0.5)] sm:text-lg">
                  {slide.subtitle}
                </p>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-3">
                {slide.ctaLabel && slide.ctaUrl && (
                  <Link to={slide.ctaUrl} className="btn-gold">
                    {slide.ctaLabel}
                  </Link>
                )}
                <Link to="/rooms" className="btn-outline-on-dark">
                  Rooms &amp; Apartments
                </Link>
              </div>

              {/* Trust cues. Every figure here is verifiable from the property itself. */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-background-soft/80">
                <span>41 rooms &amp; apartments</span>
                <span className="h-3 w-px bg-background-soft/30" aria-hidden="true" />
                <span>5 minutes from Bole airport</span>
                <span className="h-3 w-px bg-background-soft/30" aria-hidden="true" />
                <span>24-hour front desk</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-12 hidden max-w-5xl lg:block">
          <BookingWidget />
        </div>
      </motion.div>

      {count > 1 && (
        <>
          {/* Arrows sit clear of the copy column and of the booking bar. */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute right-[5.5rem] top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-background-soft/35 bg-text-primary/25 text-background-soft backdrop-blur-md transition-all hover:border-background-soft/70 hover:bg-text-primary/45 lg:grid"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-8 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-background-soft/35 bg-text-primary/25 text-background-soft backdrop-blur-md transition-all hover:border-background-soft/70 hover:bg-text-primary/45 lg:grid"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <div
            className="absolute inset-x-0 bottom-7 z-20 flex flex-wrap items-center justify-center gap-2 px-6 lg:inset-x-auto lg:right-12 lg:justify-end"
            role="tablist"
            aria-label="Choose slide"
          >
            {slides.map((s, i) => (
              <button
                key={s.id ?? i}
                type="button"
                role="tab"
                onClick={() => setActive(i)}
                aria-label={s.title ?? `Slide ${i + 1}`}
                aria-selected={i === active}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === active ? 'w-9 bg-brand' : 'w-3.5 bg-background-soft/45 hover:bg-background-soft/80'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <motion.div
        style={{ opacity: contentOpacity }}
        className="pointer-events-none absolute bottom-7 left-12 hidden flex-col items-center gap-2 text-background-soft/70 xl:flex"
      >
        <span className="text-[9px] font-semibold uppercase tracking-luxe">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" strokeWidth={1.75} />
      </motion.div>
    </section>
  )
}
