import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Columns3, Minus } from 'lucide-react'
import Reveal from './Reveal'
import { useSite } from '../context/SiteContext'

const MAX = 3

/**
 * Side-by-side comparison of up to three categories.
 *
 * The amenity rows are the union of everything the selected categories offer, so a blank cell
 * genuinely means "this one does not include it" rather than "we forgot to list it".
 */
export default function RoomComparison({ roomTypes }) {
  const { money, t } = useSite()
  const [selected, setSelected] = useState(() => roomTypes.slice(0, 2).map((rt) => rt.id))

  const chosen = useMemo(
    () => selected.map((id) => roomTypes.find((rt) => rt.id === id)).filter(Boolean),
    [selected, roomTypes],
  )

  // Union of amenities across the chosen categories, in a stable display order.
  const amenityRows = useMemo(() => {
    const seen = new Map()
    for (const rt of chosen) {
      for (const amenity of rt.amenities ?? []) {
        if (!seen.has(amenity.slug)) seen.set(amenity.slug, amenity)
      }
    }
    return [...seen.values()].sort((a, b) => a.displayOrder - b.displayOrder)
  }, [chosen])

  const toggle = (id) =>
    setSelected((current) => {
      if (current.includes(id)) {
        // Never drop below two — a comparison of one is just the room page.
        return current.length <= 2 ? current : current.filter((x) => x !== id)
      }
      return current.length >= MAX ? [...current.slice(1), id] : [...current, id]
    })

  if (roomTypes.length < 2) return null

  return (
    <section className="border-t border-line bg-background-warm py-20 lg:py-24">
      <div className="container-luxe">
        <Reveal>
          <span className="eyebrow mb-4 flex items-center gap-3">
            <Columns3 className="h-3.5 w-3.5" strokeWidth={2.5} />
            Compare
          </span>
          <h2 className="heading-display text-balance text-3xl sm:text-4xl">Put them side by side</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            Choose up to three categories to see exactly what changes between them.
          </p>
        </Reveal>

        <Reveal className="mt-8 flex flex-wrap gap-2">
          {roomTypes.map((rt) => {
            const active = selected.includes(rt.id)
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => toggle(rt.id)}
                aria-pressed={active}
                className={`rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-brand transition-all ${
                  active
                    ? 'bg-brand text-text-primary shadow-soft'
                    : 'border border-line-strong bg-background-soft text-text-secondary hover:border-brand-bronze hover:text-brand-ink'
                }`}
              >
                {rt.name}
              </button>
            )
          })}
        </Reveal>

        <Reveal className="mt-8">
          <div className="overflow-x-auto rounded-2xl border border-line bg-background-soft shadow-soft">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">Room category comparison</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="w-44 px-5 py-4 text-[10px] font-bold uppercase tracking-brand text-text-secondary">
                    Feature
                  </th>
                  {chosen.map((rt) => (
                    <th key={rt.id} scope="col" className="px-5 py-4 align-top">
                      <Link to={`/rooms/${rt.slug}`} className="group block">
                        <span className="img-frame mb-3 block aspect-[16/10] !rounded-xl">
                          <img src={rt.heroImageUrl} alt="" loading="lazy" decoding="async" className="img-zoom" />
                        </span>
                        <span className="block font-display text-lg text-text-primary transition-colors group-hover:text-brand-ink">
                          {rt.name}
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="text-[13px]">
                {[
                  ['Nightly rate', (rt) => <span className="font-semibold text-brand-ink">{money(rt.basePriceEtb)}</span>],
                  ['Size', (rt) => `${rt.sizeSqm} m²`],
                  ['Sleeps', (rt) => `${rt.maxAdults} adults${rt.maxChildren ? ` + ${rt.maxChildren} children` : ''}`],
                  ['Beds', (rt) => rt.bedConfiguration],
                  ['Rooms available', (rt) => rt.totalRooms],
                ].map(([label, render]) => (
                  <tr key={label} className="border-b border-line-soft">
                    <th scope="row" className="px-5 py-3.5 font-medium text-text-secondary">
                      {label}
                    </th>
                    {chosen.map((rt) => (
                      <td key={rt.id} className="px-5 py-3.5 text-text-primary">
                        {render(rt)}
                      </td>
                    ))}
                  </tr>
                ))}

                {amenityRows.map((amenity) => (
                  <tr key={amenity.slug} className="border-b border-line-soft last:border-0">
                    <th scope="row" className="px-5 py-3 font-normal text-text-secondary">
                      {amenity.name}
                    </th>
                    {chosen.map((rt) => {
                      const has = (rt.amenities ?? []).some((a) => a.slug === amenity.slug)
                      return (
                        <td key={rt.id} className="px-5 py-3">
                          {has ? (
                            <>
                              <Check className="h-4 w-4 text-state-success" strokeWidth={2.5} aria-hidden="true" />
                              <span className="sr-only">Included</span>
                            </>
                          ) : (
                            <>
                              <Minus className="h-4 w-4 text-text-muted" strokeWidth={2} aria-hidden="true" />
                              <span className="sr-only">Not included</span>
                            </>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                <tr>
                  <td className="px-5 py-5" />
                  {chosen.map((rt) => (
                    <td key={rt.id} className="px-5 py-5">
                      <Link to={`/booking?roomType=${rt.slug}`} className="btn-gold !px-5 !py-2.5 !text-[11px]">
                        {t('booking.select')}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
