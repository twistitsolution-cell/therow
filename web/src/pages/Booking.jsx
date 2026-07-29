import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  Loader2,
  Phone,
  Search,
  Smartphone,
  Users,
  Wallet,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import { useSite } from '../context/SiteContext'
import { api } from '../lib/api'
import { addDays, formatLongDate, nightsBetween, toDateInput } from '../lib/format'
import { netlifyForms, isApiUnreachable } from '../lib/netlifyForms'

const STEPS = [
  { id: 1, label: 'Dates' },
  { id: 2, label: 'Room' },
  { id: 3, label: 'Details' },
  { id: 4, label: 'Confirmed' },
]

const PAYMENT_METHODS = [
  { key: 'Telebirr', label: 'Telebirr', icon: Smartphone, note: 'Mobile money — pay from your phone' },
  { key: 'CbeBirr', label: 'CBE Birr', icon: Building2, note: 'Commercial Bank of Ethiopia' },
  { key: 'Stripe', label: 'Card', icon: CreditCard, note: 'Visa / Mastercard, international' },
  { key: 'Cash', label: 'Pay at hotel', icon: Wallet, note: 'Settle on arrival at the front desk' },
]

const today = () => toDateInput(new Date())

export default function Booking() {
  const { money, settings, isOffline } = useSite()
  const [params, setParams] = useSearchParams()

  const [checkIn, setCheckIn] = useState(() => params.get('checkIn') || toDateInput(addDays(new Date(), 1)))
  const [checkOut, setCheckOut] = useState(() => params.get('checkOut') || toDateInput(addDays(new Date(), 3)))
  const [adults, setAdults] = useState(() => Number(params.get('adults')) || 2)
  const [children, setChildren] = useState(() => Number(params.get('children')) || 0)

  const [step, setStep] = useState(1)
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const [guest, setGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    requests: '',
    payment: 'Telebirr',
  })
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  // True when there is no API behind this deploy: the flow becomes an enquiry, not a booking.
  const [enquiryMode, setEnquiryMode] = useState(false)
  const [roomPreference, setRoomPreference] = useState('')

  const nights = nightsBetween(checkIn, checkOut)

  const search = useCallback(async () => {
    setSearching(true)
    setError('')
    setSelected(null)

    try {
      const results = await api.availability({ checkIn, checkOut, adults, children })
      setOptions(results ?? [])

      // Arriving from a room card or an offer with ?roomType=<slug>: preselect that category if it
      // is genuinely bookable, so the guest is not asked to choose something they already chose.
      const wanted = params.get('roomType')
      const match = wanted
        ? (results ?? []).find((o) => o.slug === wanted && o.availableRooms > 0 && o.fitsParty)
        : null

      setSelected(match ?? null)
      setStep(match ? 3 : 2)
    } catch (err) {
      setOptions([])

      if (isApiUnreachable(err)) {
        // Take the details anyway and send them through as an enquiry — far better than
        // telling the guest to phone and losing them.
        setEnquiryMode(true)
        setStep(3)
        setError('')
      } else {
        setError(err.message)
      }
    } finally {
      setSearching(false)
    }
  }, [checkIn, checkOut, adults, children, isOffline, params])

  // Auto-run the search when the page is opened from the quick-search widget.
  useEffect(() => {
    if ((params.get('checkIn') && params.get('checkOut')) || params.get('roomType')) search()
    // Intentionally runs once on mount: later searches are explicit user actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCheckIn = (value) => {
    setCheckIn(value)
    if (value >= checkOut) setCheckOut(toDateInput(addDays(value, 1)))
  }

  const submitSearch = (event) => {
    event.preventDefault()
    setParams({ checkIn, checkOut, adults: String(adults), children: String(children) }, { replace: true })
    search()
  }

  const confirmBooking = async (event) => {
    event.preventDefault()
    if (!selected && !enquiryMode) return

    setSubmitting(true)
    setError('')

    if (enquiryMode) {
      try {
        await netlifyForms.bookingEnquiry({
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          country: guest.country,
          roomTypeName: roomPreference || 'No preference',
          checkIn,
          checkOut,
          nights,
          adults,
          children,
          payment: guest.payment,
          requests: guest.requests,
        })
        setConfirmation({ isEnquiry: true, guestFirstName: guest.firstName, checkIn, checkOut, adults, children })
        setStep(4)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (err) {
        setError(err.message)
      } finally {
        setSubmitting(false)
      }
      return
    }

    try {
      const booking = await api.createBooking({
        roomTypeId: selected.roomTypeId,
        guestFirstName: guest.firstName,
        guestLastName: guest.lastName,
        guestEmail: guest.email,
        guestPhone: guest.phone,
        guestCountry: guest.country,
        checkIn,
        checkOut,
        adults,
        children,
        specialRequests: guest.requests,
        displayCurrency: 'ETB',
        paymentProvider: guest.payment,
      })

      setConfirmation(booking)
      setStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message ?? 'We could not complete that booking. Please try again or call reservations.')
    } finally {
      setSubmitting(false)
    }
  }

  const summary = useMemo(() => {
    if (!selected) return null
    return {
      name: selected.name,
      nights: selected.nights,
      nightly: selected.nightlyRateEtb,
      subtotal: selected.subtotalEtb,
      tax: selected.taxEtb,
      total: selected.totalEtb,
    }
  }, [selected])

  return (
    <>
      <PageHeader
        eyebrow="Reservations"
        title="Book your stay"
        subtitle="Live availability across all forty-one rooms and apartments."
        image="/images/rooms/standard-1.webp"
        breadcrumbs={[{ label: 'Booking' }]}
      />

      <section className="py-16 lg:py-24">
        <div className="container-luxe">
          {/* ---------------- Stepper ---------------- */}
          <Reveal className="mb-12">
            <ol className="flex flex-wrap items-center gap-y-3">
              {STEPS.map((entry, index) => {
                const done = step > entry.id
                const active = step === entry.id
                return (
                  <li key={entry.id} className="flex items-center">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[12px] font-semibold transition-colors ${
                        done
                          ? 'border-brand-bronze bg-brand text-text-primary'
                          : active
                            ? 'border-brand-bronze text-brand-ink'
                            : 'border-line-strong text-text-secondary'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : entry.id}
                    </span>
                    <span
                      className={`ml-3 text-[11px] uppercase tracking-brand ${
                        active ? 'text-brand-ink' : done ? 'text-text-secondary' : 'text-text-secondary'
                      }`}
                    >
                      {entry.label}
                    </span>
                    {index < STEPS.length - 1 && (
                      <span
                        className={`mx-4 hidden h-px w-10 sm:block lg:w-20 ${done ? 'bg-brand' : 'bg-line'}`}
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </Reveal>

          {error && (
            <div className="mb-8 flex items-start gap-3 rounded-xl border border-state-danger/40 bg-state-danger-soft px-5 py-4 text-sm text-state-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <a href={`tel:${settings['contact.mobile']}`} className="shrink-0 underline underline-offset-4">
                {settings['contact.mobile']}
              </a>
            </div>
          )}

          <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-14">
            <div>
              <AnimatePresence mode="wait">
                {/* ============ Step 1 & 2: search + results ============ */}
                {step <= 2 && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35 }}
                  >
                    <form onSubmit={submitSearch} className="glass rounded-2xl p-6">
                      <h2 className="eyebrow mb-5">Your stay</h2>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label htmlFor="b-checkin" className="field-label">
                            Check-in
                          </label>
                          <input
                            id="b-checkin"
                            type="date"
                            className="field"
                            value={checkIn}
                            min={today()}
                            onChange={(e) => handleCheckIn(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="b-checkout" className="field-label">
                            Check-out
                          </label>
                          <input
                            id="b-checkout"
                            type="date"
                            className="field"
                            value={checkOut}
                            min={toDateInput(addDays(checkIn, 1))}
                            onChange={(e) => setCheckOut(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="b-adults" className="field-label">
                            Adults
                          </label>
                          <select
                            id="b-adults"
                            className="field"
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
                          <label htmlFor="b-children" className="field-label">
                            Children
                          </label>
                          <select
                            id="b-children"
                            className="field"
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
                      </div>

                      <button type="submit" disabled={searching} className="btn-gold mt-6 w-full sm:w-auto">
                        {searching ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking…
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            Check availability
                          </>
                        )}
                      </button>
                    </form>

                    {step === 2 && (
                      <div className="mt-10">
                        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                          <h2 className="font-display text-2xl text-text-primary">
                            {nights} {nights === 1 ? 'night' : 'nights'} · {formatLongDate(checkIn)} —{' '}
                            {formatLongDate(checkOut)}
                          </h2>
                          <span className="text-[11px] uppercase tracking-brand text-text-secondary">
                            {options.filter((o) => o.availableRooms > 0 && o.fitsParty).length} available
                          </span>
                        </div>

                        <div className="space-y-4">
                          {options.map((option) => {
                            const unavailable = option.availableRooms <= 0
                            const tooSmall = !option.fitsParty
                            const disabled = unavailable || tooSmall
                            const isSelected = selected?.roomTypeId === option.roomTypeId

                            return (
                              <article
                                key={option.roomTypeId}
                                className={`overflow-hidden rounded-2xl border transition-all ${
                                  isSelected
                                    ? 'border-brand-bronze bg-brand/12'
                                    : disabled
                                      ? 'border-line bg-background-warm opacity-55'
                                      : 'border-line bg-background-warm hover:border-brand-bronze'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row">
                                  <img
                                    src={option.heroImageUrl}
                                    alt={option.name}
                                    loading="lazy"
                                    className="h-44 w-full object-cover sm:h-auto sm:w-56"
                                  />

                                  <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                                    <div className="min-w-0">
                                      <h3 className="font-display text-xl text-text-primary">{option.name}</h3>

                                      <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-secondary">
                                        <span className="inline-flex items-center gap-1.5">
                                          <Users className="h-3.5 w-3.5 text-brand-bronze" />
                                          Up to {option.maxAdults} adults
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                          <BedDouble className="h-3.5 w-3.5 text-brand-bronze" />
                                          {option.availableRooms} of {option.totalRooms} free
                                        </span>
                                      </p>

                                      {tooSmall && (
                                        <p className="mt-2 text-[12px] text-brand-ink">
                                          Too small for {adults + children} guests — try two rooms or a larger category.
                                        </p>
                                      )}
                                      {unavailable && !tooSmall && (
                                        <p className="mt-2 text-[12px] text-brand-ink">
                                          Fully booked for these dates.
                                        </p>
                                      )}
                                    </div>

                                    <div className="shrink-0 text-left sm:text-right">
                                      <span className="block font-display text-2xl text-brand-ink">
                                        {money(option.totalEtb)}
                                      </span>
                                      <span className="mt-0.5 block text-[11px] text-text-secondary">
                                        {money(option.nightlyRateEtb)} × {option.nights} nights, incl. tax
                                      </span>

                                      <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                          setSelected(option)
                                          setStep(3)
                                        }}
                                        className={`mt-3 w-full sm:w-auto ${isSelected ? 'btn-outline' : 'btn-gold'} !px-6 !py-2.5`}
                                      >
                                        {isSelected ? 'Selected' : 'Select'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            )
                          })}

                          {options.length === 0 && !searching && !error && (
                            <div className="rounded-2xl border border-line bg-background-warm py-16 text-center">
                              <p className="font-display text-2xl text-text-primary">No rooms for those dates</p>
                              <p className="mx-auto mt-3 max-w-sm text-sm text-text-secondary">
                                Try shifting your dates, or call reservations — we hold inventory back for direct guests.
                              </p>
                              <a href={`tel:${settings['contact.mobile']}`} className="btn-outline mt-7">
                                <Phone className="h-4 w-4" />
                                {settings['contact.mobile']}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ============ Step 3: guest details ============ */}
                {step === 3 && (selected || enquiryMode) && (
                  <motion.form
                    key="details"
                    onSubmit={confirmBooking}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35 }}
                    className="glass rounded-2xl p-6 sm:p-8"
                  >
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-brand text-text-secondary transition-colors hover:text-brand-ink"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change room
                    </button>

                    <h2 className="font-display text-2xl text-text-primary">Guest details</h2>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="g-first" className="field-label">
                          First name *
                        </label>
                        <input
                          id="g-first"
                          className="field"
                          value={guest.firstName}
                          onChange={(e) => setGuest({ ...guest, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="g-last" className="field-label">
                          Last name *
                        </label>
                        <input
                          id="g-last"
                          className="field"
                          value={guest.lastName}
                          onChange={(e) => setGuest({ ...guest, lastName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="g-email" className="field-label">
                          Email *
                        </label>
                        <input
                          id="g-email"
                          type="email"
                          className="field"
                          value={guest.email}
                          onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="g-phone" className="field-label">
                          Phone *
                        </label>
                        <input
                          id="g-phone"
                          type="tel"
                          className="field"
                          placeholder="+251…"
                          value={guest.phone}
                          onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="g-country" className="field-label">
                          Country
                        </label>
                        <input
                          id="g-country"
                          className="field"
                          value={guest.country}
                          onChange={(e) => setGuest({ ...guest, country: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="g-requests" className="field-label">
                          Special requests
                        </label>
                        <textarea
                          id="g-requests"
                          rows={3}
                          className="field resize-none"
                          placeholder="Late arrival, high floor, airport pickup…"
                          value={guest.requests}
                          onChange={(e) => setGuest({ ...guest, requests: e.target.value })}
                        />
                      </div>
                    </div>

                    <h3 className="mt-9 font-display text-xl text-text-primary">Payment method</h3>
                    <p className="mt-1 text-[12px] text-text-secondary">
                      Your reservation is held immediately. Payment is collected separately by our reservations team.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon
                        const active = guest.payment === method.key
                        return (
                          <button
                            key={method.key}
                            type="button"
                            onClick={() => setGuest({ ...guest, payment: method.key })}
                            aria-pressed={active}
                            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                              active
                                ? 'border-brand-bronze bg-brand/12'
                                : 'border-line hover:border-line-strong'
                            }`}
                          >
                            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? 'text-brand-ink' : 'text-text-secondary'}`} strokeWidth={1.5} />
                            <span>
                              <span className={`block text-sm ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
                                {method.label}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-text-secondary">{method.note}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <button type="submit" disabled={submitting} className="btn-gold mt-8 w-full">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Confirming…
                        </>
                      ) : (
                        enquiryMode ? 'Send enquiry' : `Confirm booking · ${money(selected.totalEtb)}`
                      )}
                    </button>
                  </motion.form>
                )}

                {/* ============ Step 4: confirmation ============ */}
                {step === 4 && confirmation && (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="glass rounded-2xl p-8 text-center sm:p-12"
                  >
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-brand-bronze/55 bg-brand/12 text-brand-ink">
                      <Check className="h-8 w-8" strokeWidth={1.5} />
                    </span>

                    <h2 className="heading-display mt-7 text-3xl sm:text-4xl">
                      {confirmation.isEnquiry ? 'Enquiry received' : 'Your room is held'}
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-text-secondary">
                      {confirmation.isEnquiry
                        ? `Thank you, ${confirmation.guestFirstName}. Reservations will confirm availability and rates for these dates by email, usually within a few hours. Nothing is charged yet.`
                        : `Thank you, ${confirmation.guestFirstName}. Our reservations team will confirm payment with you shortly. Keep your reference safe.`}
                    </p>

                    {!confirmation.isEnquiry && (
                      <div className="mx-auto mt-8 inline-block rounded-xl border border-brand/45 bg-background/92 px-8 py-5">
                        <span className="block text-[10px] uppercase tracking-brand text-text-secondary">
                          Confirmation reference
                        </span>
                        <span className="mt-1.5 block font-display text-3xl tracking-brand text-brand-ink">
                          {confirmation.reference}
                        </span>
                      </div>
                    )}

                    <dl className="mx-auto mt-9 max-w-sm space-y-3 border-t border-line pt-7 text-left text-[13px]">
                      {[
                        ...(confirmation.isEnquiry ? [] : [['Room', confirmation.roomTypeName]]),
                        ['Check-in', formatLongDate(confirmation.checkIn)],
                        ['Check-out', formatLongDate(confirmation.checkOut)],
                        ['Guests', `${confirmation.adults} adults${confirmation.children ? `, ${confirmation.children} children` : ''}`],
                        ...(confirmation.isEnquiry ? [] : [['Total', money(confirmation.totalEtb)]]),
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <dt className="text-text-secondary">{label}</dt>
                          <dd className="text-right text-text-primary">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-9 flex flex-wrap justify-center gap-3">
                      <Link to="/" className="btn-outline">
                        Back to home
                      </Link>
                      <a href={`tel:${settings['contact.mobile']}`} className="btn-gold">
                        <Phone className="h-4 w-4" />
                        Call reservations
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ---------------- Summary rail ---------------- */}
            {step < 4 && (
              <aside>
                <div className="glass-strong sticky top-28 rounded-2xl p-7">
                  <h2 className="eyebrow mb-5">Your stay</h2>

                  <div className="space-y-3 text-[13px]">
                    <p className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-text-secondary">
                        <CalendarDays className="h-3.5 w-3.5 text-brand-bronze" />
                        Dates
                      </span>
                      <span className="text-right text-text-primary">
                        {formatLongDate(checkIn)}
                        <br />
                        {formatLongDate(checkOut)}
                      </span>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span className="text-text-secondary">Nights</span>
                      <span className="text-text-primary">{nights}</span>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-text-secondary">
                        <Users className="h-3.5 w-3.5 text-brand-bronze" />
                        Guests
                      </span>
                      <span className="text-text-primary">
                        {adults} adults{children > 0 && `, ${children} children`}
                      </span>
                    </p>
                  </div>

                  {summary ? (
                    <>
                      <div className="my-6 hairline" />
                      <p className="mb-4 font-display text-xl text-text-primary">{summary.name}</p>

                      <div className="space-y-2.5 text-[13px]">
                        <p className="flex justify-between">
                          <span className="text-text-secondary">
                            {money(summary.nightly)} × {summary.nights}
                          </span>
                          <span className="text-text-primary">{money(summary.subtotal)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-text-secondary">VAT &amp; service (25%)</span>
                          <span className="text-text-primary">{money(summary.tax)}</span>
                        </p>
                      </div>

                      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
                        <span className="text-[11px] uppercase tracking-brand text-text-secondary">Total</span>
                        <span className="font-display text-2xl text-brand-ink">{money(summary.total)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-6 border-t border-line pt-6 text-[13px] leading-relaxed text-text-secondary">
                      Choose a room to see your total, including VAT and service charge.
                    </p>
                  )}

                  <div className="mt-7 rounded-xl border border-line bg-background p-4 text-[12px] leading-relaxed text-text-secondary">
                    <span className="mb-1.5 block text-[10px] uppercase tracking-brand text-brand-ink">
                      Need a hand?
                    </span>
                    Reservations answer around the clock on{' '}
                    <a href={`tel:${settings['contact.mobile']}`} className="text-brand-ink underline underline-offset-4">
                      {settings['contact.mobile']}
                    </a>
                    .
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
