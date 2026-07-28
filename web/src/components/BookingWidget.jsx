import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Search, Users } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { addDays, toDateInput } from '../lib/format'

const today = () => toDateInput(new Date())

/**
 * The quick-search form. It does not query availability itself — it collects the stay and hands
 * off to /booking, which owns the whole reservation flow. One source of truth for the search.
 *
 * Variants:
 *   panel   — standalone card (hero, mobile)
 *   bar     — unwrapped, for the sticky bottom bar
 *   stacked — stays two-up at every width. Required inside narrow columns: the other variants
 *             expand to a five-column row at `lg`, which assumes the full container width and
 *             would otherwise blow a sidebar past the viewport.
 */
export default function BookingWidget({ variant = 'panel', className = '' }) {
  const { t } = useSite()
  const navigate = useNavigate()

  const [checkIn, setCheckIn] = useState(() => toDateInput(addDays(new Date(), 1)))
  const [checkOut, setCheckOut] = useState(() => toDateInput(addDays(new Date(), 3)))
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)

  // Check-out must always trail check-in; nudge it forward rather than showing a validation error.
  const handleCheckIn = (value) => {
    setCheckIn(value)
    if (value >= checkOut) setCheckOut(toDateInput(addDays(value, 1)))
  }

  const submit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams({ checkIn, checkOut, adults: String(adults), children: String(children) })
    navigate(`/booking?${params}`)
  }

  const compact = variant === 'bar'
  const stacked = variant === 'stacked'

  return (
    <form
      onSubmit={submit}
      className={`${compact ? '' : 'rounded-2xl border border-line bg-background/95 p-5 shadow-luxury backdrop-blur-xl sm:p-6'} ${className}`}
      aria-label="Check availability"
    >
      <div className={`grid grid-cols-2 gap-3 ${stacked ? '' : 'lg:grid-cols-[1fr_1fr_auto_auto_auto]'}`}>
        <div>
          <label htmlFor="bw-checkin" className="field-label">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" strokeWidth={2} />
              {t('booking.checkIn')}
            </span>
          </label>
          <input
            id="bw-checkin"
            type="date"
            className="field"
            value={checkIn}
            min={today()}
            onChange={(e) => handleCheckIn(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="bw-checkout" className="field-label">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" strokeWidth={2} />
              {t('booking.checkOut')}
            </span>
          </label>
          <input
            id="bw-checkout"
            type="date"
            className="field"
            value={checkOut}
            min={toDateInput(addDays(checkIn, 1))}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="bw-adults" className="field-label">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3 w-3" strokeWidth={2} />
              {t('booking.adults')}
            </span>
          </label>
          <select
            id="bw-adults"
            className={`field ${stacked ? '' : 'lg:w-[92px]'}`}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bw-children" className="field-label">
            {t('booking.children')}
          </label>
          <select
            id="bw-children"
            className={`field ${stacked ? '' : 'lg:w-[92px]'}`}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className={`col-span-2 flex items-end ${stacked ? '' : 'lg:col-span-1'}`}>
          <button type="submit" className={`btn-gold w-full !px-6 ${stacked ? '' : 'lg:w-auto'}`}>
            <Search className="h-4 w-4" strokeWidth={2} />
            {t('booking.search')}
          </button>
        </div>
      </div>
    </form>
  )
}
