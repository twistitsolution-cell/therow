import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionHeading from '../components/SectionHeading'
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal'
import AmenityIcon from '../components/AmenityIcon'
import { useSite } from '../context/SiteContext'

/** Category order and copy for the tab strip. `All` is synthesised. */
const CATEGORIES = [
  { key: 'All', label: 'Everything' },
  { key: 'Dining', label: 'Dining' },
  { key: 'Hotel', label: 'Hotel Services' },
  { key: 'Business', label: 'Business' },
  { key: 'Transport', label: 'Transport' },
  { key: 'Room', label: 'In-Room' },
]

const HIGHLIGHTS = [
  {
    title: 'La Nouvelle Restaurant',
    body: 'International cuisine served all day, with Ethiopian classics prepared to order. Breakfast runs early for guests catching morning flights, and the kitchen stays reachable through room service long after it closes to the floor.',
    image: '/images/feature/restaurant.webp',
    tags: ['All-day dining', 'Boulangerie', 'Room service'],
  },
  {
    title: 'Meetings & Events',
    body: 'A configurable meeting hall for conferences, training days and private functions, with printing, scanning and secretarial support arranged through the front desk. Catering comes from the same kitchen as the restaurant.',
    image: '/images/feature/meeting.webp',
    tags: ['Meeting hall', 'Business services', 'Catering'],
  },
]

export default function Services() {
  const { site } = useSite()
  const [category, setCategory] = useState('All')

  // The site payload only carries featured amenities; fall back gracefully if a category is empty.
  const amenities = site.featuredAmenities ?? []

  const visible = useMemo(
    () => (category === 'All' ? amenities : amenities.filter((a) => a.category === category)),
    [amenities, category],
  )

  const availableCategories = useMemo(() => {
    const present = new Set(amenities.map((a) => a.category))
    return CATEGORIES.filter((c) => c.key === 'All' || present.has(c.key))
  }, [amenities])

  return (
    <>
      <PageHeader
        eyebrow="The Experience"
        title="Services & Amenities"
        subtitle="Dining, business and transport — everything the house keeps, a step from Millennium Hall."
        image="/images/apartment/salon-2.webp"
        breadcrumbs={[{ label: 'Experiences' }]}
      />

      {/* ---------------- Highlights ---------------- */}
      <section className="py-24 lg:py-32">
        <div className="container-luxe space-y-20 lg:space-y-28">
          {HIGHLIGHTS.map((highlight, index) => {
            const flipped = index % 2 === 1
            return (
              <div
                key={highlight.title}
                className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${flipped ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                <Reveal direction={flipped ? 'left' : 'right'}>
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src={highlight.image}
                      alt={highlight.title}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-[1.5s] hover:scale-105"
                    />
                  </div>
                </Reveal>

                <Reveal direction={flipped ? 'right' : 'left'} delay={0.1}>
                  <span className="eyebrow mb-4 block">0{index + 1}</span>
                  <h2 className="heading-display text-balance text-3xl sm:text-4xl lg:text-[2.75rem]">
                    {highlight.title}
                  </h2>
                  <p className="mt-6 text-[15px] leading-[1.85] text-text-secondary">{highlight.body}</p>

                  <div className="mt-7 flex flex-wrap gap-2">
                    {highlight.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-brand/45 px-4 py-1.5 text-[11px] uppercase tracking-brand text-brand-ink"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Reveal>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------------- Full amenity grid ---------------- */}
      <section className="border-t border-line bg-background-warm py-24 lg:py-32">
        <div className="container-luxe">
          <SectionHeading eyebrow="At a glance" title="Every amenity" />

          <Reveal className="mt-12 flex flex-wrap justify-center gap-2">
            {availableCategories.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setCategory(entry.key)}
                aria-pressed={category === entry.key}
                className={`rounded-full px-5 py-2.5 text-[11px] font-medium uppercase tracking-brand transition-all ${
                  category === entry.key
                    ? 'bg-brand text-text-primary'
                    : 'border border-line-strong text-text-secondary hover:border-brand-bronze hover:text-brand-ink'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </Reveal>

          <RevealGroup key={category} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((amenity) => (
              <RevealItem key={amenity.id}>
                <article className="card-hover h-full rounded-2xl border border-line bg-background p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-brand/45 text-brand-ink">
                    <AmenityIcon name={amenity.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg text-text-primary">{amenity.name}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{amenity.description}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          {visible.length === 0 && (
            <p className="mt-14 text-center text-sm text-text-secondary">
              Nothing listed under this category yet — call the front desk and ask.
            </p>
          )}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section
        className="parallax-fixed relative py-28"
        style={{ backgroundImage: "url('/images/feature/lounge.webp')" }}
      >
        <div className="scrim" />
        <div className="scrim-header" />
        <div className="container-luxe relative text-center">
          <Reveal>
            <h2 className="font-display text-balance text-4xl font-normal leading-[1.08] tracking-tight text-background-soft drop-shadow-[0_2px_12px_rgba(24,20,16,0.5)] sm:text-5xl">Ready when you are</h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-background-soft/85 drop-shadow-[0_1px_8px_rgba(24,20,16,0.5)]">
              Check live availability across all five categories, or speak to the front desk directly.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/booking" className="btn-gold">
                Check availability
              </Link>
              <Link to="/contact" className="btn-outline-on-dark">
                Contact us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
