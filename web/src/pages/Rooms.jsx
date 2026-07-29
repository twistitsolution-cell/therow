import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Loader2, SlidersHorizontal, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import RoomCard from '../components/RoomCard'
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal'
import RoomComparison from '../components/RoomComparison'
import { api } from '../lib/api'
import { addDays, nightsBetween, toDateInput } from '../lib/format'
import { useSite } from '../context/SiteContext'

/** Long enough that dragging the rate slider does not fire a request per pixel. */
const DEBOUNCE_MS = 350

const today = () => toDateInput(new Date())

export default function Rooms() {
  const { roomTypes, money, currency, etbPerUsd } = useSite()

  const [checkIn, setCheckIn] = useState(() => toDateInput(addDays(new Date(), 1)))
  const [checkOut, setCheckOut] = useState(() => toDateInput(addDays(new Date(), 3)))
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)

  const [maxPrice, setMaxPrice] = useState(0) // 0 = no ceiling
  const [typeFilter, setTypeFilter] = useState('all')

  const [availability, setAvailability] = useState(null) // null until the first query resolves
  const [loading, setLoading] = useState(true)
  const [apiDown, setApiDown] = useState(false)

  const nights = nightsBetween(checkIn, checkOut)

  // Check-out must always trail check-in; nudge it rather than showing a validation error.
  const handleCheckIn = (value) => {
    setCheckIn(value)
    if (value >= checkOut) setCheckOut(toDateInput(addDays(value, 1)))
  }

  const priceCeiling = useMemo(
    () => Math.max(...roomTypes.map((rt) => rt.basePriceEtb), 0),
    [roomTypes],
  )

  // ---------------------------------------------------------------------------
  // Availability is queried automatically whenever the stay changes — there is no
  // "check availability" button. The abort ref cancels the in-flight request so a
  // fast sequence of edits cannot land out of order and show a stale result.
  // ---------------------------------------------------------------------------
  const abortRef = useRef(null)

  const load = useCallback(async () => {
    if (nights <= 0) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const data = await api.availability({ checkIn, checkOut, adults, children }, controller.signal)
      setAvailability(data)
      setApiDown(false)
    } catch (error) {
      if (error.name === 'AbortError') return
      // Without live data, fall back to showing the catalogue rather than an empty page.
      setAvailability(null)
      setApiDown(true)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [checkIn, checkOut, adults, children, nights])

  useEffect(() => {
    const timer = setTimeout(load, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [load])

  useEffect(() => () => abortRef.current?.abort(), [])

  // ---------------------------------------------------------------------------
  // Join the live availability onto the catalogue. The API returns inventory and
  // pricing; roomTypes carries the imagery, copy and amenities.
  // ---------------------------------------------------------------------------
  const rooms = useMemo(() => {
    const byId = new Map((availability ?? []).map((a) => [a.roomTypeId, a]))

    return roomTypes
      .map((rt) => ({ roomType: rt, live: byId.get(rt.id) ?? null }))
      .filter(({ roomType, live }) => {
        if (maxPrice > 0 && roomType.basePriceEtb > maxPrice) return false
        if (typeFilter !== 'all' && roomType.slug !== typeFilter) return false

        // With live data, only genuinely bookable rooms are shown.
        if (live) return live.availableRooms > 0 && live.fitsParty

        // Without it, fall back to static capacity so the page is never empty.
        return roomType.maxAdults + roomType.maxChildren >= adults + children
      })
      .sort((a, b) => a.roomType.displayOrder - b.roomType.displayOrder)
  }, [roomTypes, availability, maxPrice, typeFilter, adults, children])

  // How many were excluded purely because they are booked out for these dates.
  const soldOut = useMemo(() => {
    if (!availability) return 0
    return availability.filter((a) => a.fitsParty && a.availableRooms === 0).length
  }, [availability])

  const filtersActive = maxPrice > 0 || typeFilter !== 'all'
  const resetFilters = () => {
    setMaxPrice(0)
    setTypeFilter('all')
  }

  return (
    <>
      <PageHeader
        eyebrow="Accommodation"
        title="Rooms & Apartments"
        subtitle="Five categories across eight floors — from a quiet Standard Room to a one-bedroom Apartment with its own fitted kitchen."
        image="/images/rooms/junior-suite-1.webp"
        breadcrumbs={[{ label: 'Rooms' }]}
      />

      <section className="py-16 lg:py-24">
        <div className="container-luxe">
          {/* ---------------- Stay + filters. Every control re-queries on change. ---------------- */}
          <Reveal>
            <div className="glass rounded-2xl p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
                <div>
                  <label htmlFor="r-checkin" className="field-label">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" strokeWidth={2} />
                      Check-in
                    </span>
                  </label>
                  <input
                    id="r-checkin"
                    type="date"
                    className="field"
                    value={checkIn}
                    min={today()}
                    onChange={(e) => handleCheckIn(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="r-checkout" className="field-label">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" strokeWidth={2} />
                      Check-out
                    </span>
                  </label>
                  <input
                    id="r-checkout"
                    type="date"
                    className="field"
                    value={checkOut}
                    min={toDateInput(addDays(checkIn, 1))}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="r-adults" className="field-label">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3 w-3" strokeWidth={2} />
                      Adults
                    </span>
                  </label>
                  <select id="r-adults" className="field" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="r-children" className="field-label">
                    Children
                  </label>
                  <select
                    id="r-children"
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

                <div className="flex items-end">
                  <span className="pb-2.5 text-[11px] font-semibold uppercase tracking-brand text-text-secondary">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-5 border-t border-line pt-5">
                <span className="flex items-center gap-2 pb-2.5 text-[11px] font-semibold uppercase tracking-brand text-brand-ink">
                  <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                  Refine
                </span>

                <div className="min-w-[170px]">
                  <label htmlFor="r-type" className="field-label">
                    Room type
                  </label>
                  <select id="r-type" className="field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="all">All types</option>
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.slug}>
                        {rt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[210px] flex-1 sm:max-w-xs">
                  <label htmlFor="r-price" className="field-label">
                    Max nightly rate — {maxPrice > 0 ? money(maxPrice) : 'any'}
                  </label>
                  <input
                    id="r-price"
                    type="range"
                    min={0}
                    max={priceCeiling}
                    step={500}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand-bronze"
                  />
                  <div className="mt-1.5 flex justify-between text-[10px] text-text-secondary">
                    <span>Any</span>
                    <span>{money(priceCeiling)}</span>
                  </div>
                </div>

                {filtersActive && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="pb-2.5 text-[11px] font-semibold uppercase tracking-brand text-text-secondary transition-colors hover:text-brand-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {/* ---------------- Result summary ---------------- */}
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold uppercase tracking-brand text-text-secondary">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-brand-ink">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking availability
              </span>
            ) : (
              <>
                <span className="text-brand-ink">
                  {rooms.length} {rooms.length === 1 ? 'category' : 'categories'} available
                </span>
                {soldOut > 0 && <span>· {soldOut} booked out for these dates</span>}
                {currency === 'USD' && <span>· at {etbPerUsd} ETB / USD</span>}
              </>
            )}
          </p>

          {apiDown && (
            <p className="mt-3 rounded-xl border border-brand/45 bg-brand/12 px-4 py-3 text-[12px] text-brand-ink">
              Live availability is unreachable, so every category is listed. Call reservations to confirm a specific
              date before travelling.
            </p>
          )}

          {/* ---------------- Results ---------------- */}
          {rooms.length > 0 ? (
            <RevealGroup className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map(({ roomType, live }, index) => (
                <RevealItem key={roomType.id}>
                  <RoomCard
                    roomType={roomType}
                    index={index}
                    availability={live}
                    stay={{ checkIn, checkOut, adults, children }}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="mt-16 rounded-2xl border border-line bg-background-warm py-20 text-center">
              <p className="font-display text-2xl text-text-primary">
                {loading ? 'Checking those dates…' : 'Nothing free for those dates'}
              </p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-text-secondary">
                Try shifting the dates by a night, reducing the party size, or raising the rate ceiling — or call the
                front desk and we will find something.
              </p>
              {filtersActive && (
                <button type="button" onClick={resetFilters} className="btn-outline mt-7">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <RoomComparison roomTypes={roomTypes} />
    </>
  )
}
