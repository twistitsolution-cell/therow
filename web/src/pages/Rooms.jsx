import { useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import RoomCard from '../components/RoomCard'
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal'
import RoomComparison from '../components/RoomComparison'
import { useSite } from '../context/SiteContext'

const SORTS = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'size-desc', label: 'Largest first' },
]

export default function Rooms() {
  const { roomTypes, money, currency, etbPerUsd } = useSite()

  const [guests, setGuests] = useState(0) // 0 = any party size
  const [maxPrice, setMaxPrice] = useState(0) // 0 = no ceiling
  const [sort, setSort] = useState('recommended')

  const priceCeiling = useMemo(
    () => Math.max(...roomTypes.map((rt) => rt.basePriceEtb), 0),
    [roomTypes],
  )

  const visible = useMemo(() => {
    const filtered = roomTypes.filter((rt) => {
      if (guests > 0 && rt.maxAdults + rt.maxChildren < guests) return false
      if (maxPrice > 0 && rt.basePriceEtb > maxPrice) return false
      return true
    })

    const sorted = [...filtered]
    if (sort === 'price-asc') sorted.sort((a, b) => a.basePriceEtb - b.basePriceEtb)
    else if (sort === 'price-desc') sorted.sort((a, b) => b.basePriceEtb - a.basePriceEtb)
    else if (sort === 'size-desc') sorted.sort((a, b) => b.sizeSqm - a.sizeSqm)
    else sorted.sort((a, b) => a.displayOrder - b.displayOrder)

    return sorted
  }, [roomTypes, guests, maxPrice, sort])

  const resetFilters = () => {
    setGuests(0)
    setMaxPrice(0)
    setSort('recommended')
  }

  const filtersActive = guests > 0 || maxPrice > 0 || sort !== 'recommended'

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
          {/* ---------------- Filter bar ---------------- */}
          <Reveal>
            <div className="glass rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-end gap-5">
                <span className="flex items-center gap-2 text-[11px] uppercase tracking-brand text-brand-ink">
                  <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                  Refine
                </span>

                <div className="min-w-[140px]">
                  <label htmlFor="filter-guests" className="field-label">
                    Guests
                  </label>
                  <select
                    id="filter-guests"
                    className="field"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  >
                    <option value={0}>Any</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}+ guests
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[210px] flex-1 sm:max-w-xs">
                  <label htmlFor="filter-price" className="field-label">
                    Max nightly rate — {maxPrice > 0 ? money(maxPrice) : 'any'}
                  </label>
                  <input
                    id="filter-price"
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

                <div className="min-w-[170px]">
                  <label htmlFor="filter-sort" className="field-label">
                    Sort by
                  </label>
                  <select id="filter-sort" className="field" value={sort} onChange={(e) => setSort(e.target.value)}>
                    {SORTS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {filtersActive && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="pb-2.5 text-[11px] uppercase tracking-brand text-text-secondary transition-colors hover:text-brand-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          <p className="mt-6 text-[12px] uppercase tracking-brand text-text-secondary">
            Showing {visible.length} of {roomTypes.length} categories
            {currency === 'USD' && ` · converted at ${etbPerUsd} ETB / USD`}
          </p>

          {/* ---------------- Results ---------------- */}
          {visible.length > 0 ? (
            <RevealGroup className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((roomType, index) => (
                <RevealItem key={roomType.id}>
                  <RoomCard roomType={roomType} index={index} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="mt-16 rounded-2xl border border-line bg-background-warm py-20 text-center">
              <p className="font-display text-2xl text-text-primary">Nothing matches those filters</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-text-secondary">
                Try widening the party size or raising the rate ceiling — or call the front desk and we will find
                something.
              </p>
              <button type="button" onClick={resetFilters} className="btn-outline mt-7">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      <RoomComparison roomTypes={roomTypes} />
    </>
  )
}
