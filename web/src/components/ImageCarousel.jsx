import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'

/**
 * Cross-fading image carousel with a slow zoom on the active frame.
 *
 * Every frame stays mounted and only its opacity changes. That is deliberate: an
 * enter/exit approach leaves frames stacked whenever a transition is interrupted or outlives
 * the autoplay tick, and it re-decodes images on every pass. A fixed stack cross-fades cleanly
 * and keeps the next frame decoded and ready.
 *
 * Arrows and dots are real buttons, so this must never be nested inside an anchor — cards using
 * it link from their heading and CTA instead of wrapping the whole tile.
 */
export default function ImageCarousel({
  images,
  aspect = 'aspect-[4/3]',
  rounded = 'rounded-2xl',
  autoPlay = false,
  interval = 5000,
  onExpand,
  showCounter = true,
  priority = false,
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const count = images?.length ?? 0

  const go = useCallback(
    (delta) => {
      if (count === 0) return
      setIndex((current) => (current + delta + count) % count)
    },
    [count],
  )

  useEffect(() => {
    if (!autoPlay || paused || count < 2) return
    const timer = setInterval(() => go(1), interval)
    return () => clearInterval(timer)
  }, [autoPlay, paused, count, interval, go])

  if (count === 0) return null

  return (
    <div
      className={`group/carousel relative overflow-hidden bg-background-warm ${aspect} ${rounded}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((image, i) => (
        <img
          key={image.url}
          src={image.url}
          alt={i === index ? (image.caption ?? '') : ''}
          aria-hidden={i !== index}
          loading={priority && i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          // The slow push-in runs only on the frame in view.
          style={{
            transform: i === index ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 500ms ease-out, transform 6000ms linear',
          }}
        />
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background-soft/90 text-text-primary opacity-0 shadow-soft transition-all duration-300 hover:bg-background-soft focus-visible:opacity-100 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background-soft/90 text-text-primary opacity-0 shadow-soft transition-all duration-300 hover:bg-background-soft focus-visible:opacity-100 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {images.map((image, i) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full shadow-soft transition-all duration-500 ${
                  i === index ? 'w-6 bg-background-soft' : 'w-1.5 bg-background-soft/65 hover:bg-background-soft'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {showCounter && count > 1 && (
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-background-soft/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-text-secondary shadow-soft">
          {index + 1} / {count}
        </span>
      )}

      {onExpand && (
        <button
          type="button"
          onClick={() => onExpand(index)}
          aria-label="View full size"
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background-soft/90 text-text-primary opacity-0 shadow-soft transition-all duration-300 hover:bg-background-soft focus-visible:opacity-100 group-hover/carousel:opacity-100"
        >
          <Expand className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
