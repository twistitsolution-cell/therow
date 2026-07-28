import { Link } from 'react-router-dom'
import { BadgeCheck, Gem, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SectionHeading from '../components/SectionHeading'
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal'
import LocationMap from '../components/LocationMap'
import { useSite } from '../context/SiteContext'

const VALUE_ICONS = { Reliable: BadgeCheck, Luxurious: Gem, Trustworthy: ShieldCheck }

const VALUE_COPY = {
  Reliable: 'A front desk that answers at 3am, hot water that never runs out, and a room that is ready when we said it would be.',
  Luxurious: 'Marble, deep mattresses, considered lighting — comfort you notice on the second night as much as the first.',
  Trustworthy: 'Clear pricing, secured premises, and staff who have been here long enough to know your name.',
}

export default function About() {
  const { block } = useSite()

  const story = block('about.story')
  const mission = block('about.mission')
  const vision = block('about.vision')
  const values = block('about.values')

  // Values ship as a JSON list on the block so marketing can reorder them without a deploy.
  let valueItems = ['Reliable', 'Luxurious', 'Trustworthy']
  try {
    const parsed = JSON.parse(values?.metadataJson ?? '{}')
    if (Array.isArray(parsed.items) && parsed.items.length) valueItems = parsed.items
  } catch {
    // Malformed JSON in the CMS should not blank the page — keep the defaults.
  }

  return (
    <>
      <PageHeader
        eyebrow="Since our doors opened"
        title="About The Row"
        subtitle="A residential hotel in Bole, built for guests who arrive with more than a weekend bag."
        image="/images/hero/lobby.webp"
        breadcrumbs={[{ label: 'About' }]}
      />

      {/* ---------------- Story ---------------- */}
      <section className="py-24 lg:py-32">
        <div className="container-luxe">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal direction="right">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={story?.imageUrl ?? '/images/feature/facade.webp'}
                  alt="The Row Residential Hotel building"
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </Reveal>

            <Reveal direction="left" delay={0.1}>
              <span className="eyebrow mb-4 block">{story?.subtitle ?? 'Our story'}</span>
              <h2 className="heading-display text-balance text-4xl sm:text-5xl">{story?.title ?? 'Our story'}</h2>
              <p className="mt-7 text-[15px] leading-[1.85] text-text-secondary">{story?.body}</p>

              <div className="mt-9 grid grid-cols-3 gap-4 border-t border-line pt-8">
                {[
                  { value: '41', label: 'Rooms' },
                  { value: '5', label: 'Categories' },
                  { value: '24/7', label: 'Reception' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <span className="block font-display text-3xl text-brand-ink">{stat.value}</span>
                    <span className="mt-1 block text-[10px] uppercase tracking-brand text-text-secondary">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Mission & vision ---------------- */}
      <section className="border-y border-line bg-background-warm py-24 lg:py-28">
        <div className="container-luxe">
          <RevealGroup className="grid gap-6 lg:grid-cols-2">
            {[mission, vision].filter(Boolean).map((entry) => (
              <RevealItem key={entry.sectionKey}>
                <article className="h-full rounded-2xl border border-line bg-background p-9 lg:p-11">
                  <span className="eyebrow mb-4 block">{entry.sectionKey}</span>
                  <h3 className="heading-display text-3xl">{entry.title}</h3>
                  <p className="mt-5 text-[15px] leading-[1.85] text-text-secondary">{entry.body}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Values ---------------- */}
      <section className="py-24 lg:py-32">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="What we stand for"
            title={values?.title ?? 'Values'}
            subtitle={values?.body}
          />

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
            {valueItems.map((item) => {
              const Icon = VALUE_ICONS[item] ?? BadgeCheck
              return (
                <RevealItem key={item}>
                  <article className="card-hover h-full rounded-2xl border border-line bg-background-warm p-9 text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-brand/45 text-brand-ink">
                      <Icon className="h-6 w-6" strokeWidth={1.25} />
                    </span>
                    <h3 className="mt-6 font-display text-2xl text-text-primary">{item}</h3>
                    <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                      {VALUE_COPY[item] ?? ''}
                    </p>
                  </article>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Where we are ---------------- */}
      <section className="border-t border-line pt-24 lg:pt-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Find us"
            title="Bole, opposite Millennium Hall"
            subtitle="Five minutes from Bole International Airport, with transfers arranged at any hour."
          />
        </div>

        <div className="mt-12">
          <LocationMap height="h-[380px] lg:h-[460px]" />
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section
        className="parallax-fixed relative py-28"
        style={{ backgroundImage: "url('/images/feature/facade-tall.webp')" }}
      >
        <div className="scrim" />
        <div className="scrim-header" />
        <div className="container-luxe relative text-center">
          <Reveal>
            <h2 className="font-display text-balance text-4xl font-normal leading-[1.08] tracking-tight text-background-soft drop-shadow-[0_2px_12px_rgba(24,20,16,0.5)] sm:text-5xl">Stay a night, or a season</h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-background-soft/85 drop-shadow-[0_1px_8px_rgba(24,20,16,0.5)]">
              Rooms for a single night and serviced apartments for the trip that keeps extending.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/booking" className="btn-gold">
                Check availability
              </Link>
              <Link to="/rooms" className="btn-outline-on-dark">
                Browse rooms
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
