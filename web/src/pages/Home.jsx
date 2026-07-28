import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Plane, Quote, Star } from 'lucide-react'
import Hero from '../components/Hero'
import SectionHeading from '../components/SectionHeading'
import RoomCard from '../components/RoomCard'
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal'
import AmenityIcon from '../components/AmenityIcon'
import BookingWidget from '../components/BookingWidget'
import OffersSection from '../components/OffersSection'
import FaqSection from '../components/FaqSection'
import { useSite } from '../context/SiteContext'

const STATS = [
  { value: '41', label: 'Rooms & Apartments' },
  { value: '5', label: 'Minutes from the airport' },
  { value: '24/7', label: 'Front desk & security' },
  { value: '5', label: 'Room categories' },
]

export default function Home() {
  const { roomTypes, site, block, settings, isOffline } = useSite()
  const intro = block('home.intro')
  const featured = roomTypes.slice(0, 3)

  return (
    <>
      <Hero />

      {isOffline && (
        <div className="border-b border-brand/45 bg-brand/12 px-4 py-2.5 text-center text-[11px] uppercase tracking-brand text-brand-ink">
          Showing saved content — live availability is temporarily unavailable
        </div>
      )}

      {/* Booking widget for viewports where the hero could not carry it. */}
      <section className="relative z-10 -mt-16 lg:hidden">
        <div className="container-luxe">
          <BookingWidget />
        </div>
      </section>

      {/* ---------------- Introduction ---------------- */}
      <section className="relative bg-background py-24 lg:py-32">
        <div className="container-luxe">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal direction="right">
              <span className="eyebrow mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-brand" aria-hidden="true" />
                {intro?.subtitle ?? 'Welcome'}
              </span>

              <h2 className="heading-display text-balance text-4xl sm:text-5xl lg:text-[3.4rem]">
                {intro?.title ?? 'Reliable. Luxurious. Trustworthy.'}
              </h2>

              <p className="mt-7 text-[15px] leading-[1.85] text-text-secondary">{intro?.body}</p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link to="/about" className="btn-outline">
                  Our story
                </Link>
                <Link to="/rooms" className="inline-flex items-center gap-2 px-2 text-[12px] font-medium uppercase tracking-brand text-text-secondary transition-colors hover:text-brand-ink">
                  Browse rooms
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            <Reveal direction="left" delay={0.1}>
              <div className="relative">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={intro?.imageUrl ?? '/images/feature/reception.webp'}
                    alt="The Row reception"
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-[1.5s] hover:scale-105"
                  />
                </div>

                {/* Offset accent image, clipped away below lg so it never crowds the layout. */}
                <div className="absolute -bottom-10 -left-10 hidden w-52 overflow-hidden rounded-2xl border-4 border-background-soft shadow-luxury lg:block">
                  <img
                    src="/images/feature/facade.webp"
                    alt="The Row building in Bole"
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover"
                  />
                </div>

                {/* Only allowed to overhang its column from xl up — at 1024 the column already
                    reaches the container edge and a negative offset pushes the page sideways. */}
                <div className="absolute right-3 top-8 hidden rounded-xl border border-brand/45 bg-background/90 px-5 py-4 backdrop-blur-xl sm:block xl:-right-4">
                  <span className="block font-display text-3xl text-brand-ink">41</span>
                  <span className="mt-1.5 block text-[10px] uppercase tracking-brand text-text-secondary">
                    Rooms &amp; apartments
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Stats band ---------------- */}
      <section className="border-y border-line bg-background-mist">
        <div className="container-luxe">
          <RevealGroup className="grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
            {STATS.map((stat) => (
              <RevealItem key={stat.label} className="px-4 py-10 text-center lg:py-14">
                <span className="block font-display text-4xl text-brand-ink lg:text-5xl">{stat.value}</span>
                <span className="mt-2 block text-[10px] uppercase tracking-brand text-text-secondary">
                  {stat.label}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Featured rooms ---------------- */}
      <section className="py-24 lg:py-32">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Accommodation"
            title="Rooms & Apartments"
            subtitle="Five categories, from a quiet Standard Room for a single night to a one-bedroom Apartment with its own kitchen for a season."
          />

          <RevealGroup className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((roomType, index) => (
              <RevealItem key={roomType.id}>
                <RoomCard roomType={roomType} index={index} />
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-12 text-center">
            <Link to="/rooms" className="btn-outline">
              View all {roomTypes.length} categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <OffersSection />

      {/* ---------------- Image band ----------------
          A full-bleed photograph between two light sections. This is where the page gets its
          visual relief: the eye rests on an image rather than on another beige panel. */}
      <section
        className="parallax-fixed relative py-28 lg:py-40"
        style={{ backgroundImage: "url('/images/feature/bathroom.webp')" }}
      >
        <div className="scrim" />
        <div className="scrim-header" />

        <div className="container-luxe relative text-center">
          <Reveal>
            <Quote className="mx-auto h-9 w-9 text-brand" strokeWidth={1} />
            <p className="mx-auto mt-7 max-w-3xl font-display text-2xl font-normal leading-[1.5] text-background-soft drop-shadow-[0_2px_12px_rgba(24,20,16,0.5)] sm:text-3xl lg:text-[2.5rem]">
              “Our stylish and iconic rooms come in a variety of layouts to suit the needs of our guests.”
            </p>
            <div className="mx-auto mt-8 h-px w-24 bg-brand" />
            <p className="eyebrow-on-dark mt-6">The Row Residential Hotel</p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Experiences ---------------- */}
      <section className="bg-background py-24 lg:py-32">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="The Experience"
            title="Everything the house keeps"
            subtitle="Dining, wellness, business and transport — all of it under one roof in Bole."
          />

          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(site.featuredAmenities ?? []).map((amenity) => (
              <RevealItem key={amenity.id}>
                <article className="group card-hover relative h-full overflow-hidden rounded-2xl border border-line bg-background-warm p-7">
                  {amenity.imageUrl && (
                    <>
                      <img
                        src={amenity.imageUrl}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover opacity-[0.12] transition-all duration-700 group-hover:scale-110 group-hover:opacity-25"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-text-primary/60 via-text-primary/15 to-transparent" />
                    </>
                  )}

                  <div className="relative">
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-brand/45 text-brand-ink transition-colors group-hover:border-brand-bronze group-hover:bg-brand/12">
                      <AmenityIcon name={amenity.icon} className="h-5 w-5" />
                    </span>

                    <h3 className="mt-5 font-display text-xl text-text-primary">{amenity.name}</h3>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-text-secondary">{amenity.description}</p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-12 text-center">
            <Link to="/services" className="btn-outline">
              All services &amp; amenities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <section className="border-y border-line bg-background-warm py-24 lg:py-32">
        <div className="container-luxe">
          <SectionHeading eyebrow="Guest Reviews" title="What our guests say" />

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {(site.testimonials ?? []).map((testimonial) => (
              <RevealItem key={testimonial.id} className="h-full">
                <figure className="flex h-full flex-col rounded-2xl border border-line bg-background p-7">
                  <span className="mb-4 flex gap-1" aria-label={`${testimonial.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < testimonial.rating ? 'fill-brand text-brand-bronze' : 'text-line-strong'
                        }`}
                      />
                    ))}
                  </span>

                  <blockquote className="flex-1 text-[14px] leading-[1.8] text-text-secondary">
                    “{testimonial.quote}”
                  </blockquote>

                  <figcaption className="mt-6 border-t border-line pt-4">
                    <span className="block text-sm font-medium text-text-primary">{testimonial.guestName}</span>
                    <span className="mt-0.5 block text-[11px] uppercase tracking-brand text-brand-ink">
                      {testimonial.country}
                    </span>
                  </figcaption>
                </figure>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <FaqSection />

      {/* ---------------- Location & closing CTA ---------------- */}
      <section className="py-24 lg:py-32">
        <div className="container-luxe">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal direction="right">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src="/images/feature/facade.webp"
                  alt="The Row on its street in Bole, Addis Ababa"
                  loading="lazy"
                  className="aspect-[16/11] w-full object-cover"
                />
              </div>
            </Reveal>

            <Reveal direction="left" delay={0.1}>
              <span className="eyebrow mb-4 block">Location</span>
              <h2 className="heading-display text-balance text-4xl sm:text-5xl">
                Bole, opposite Millennium Hall
              </h2>

              <ul className="mt-8 space-y-5">
                <li className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand/45 text-brand-ink">
                    <Plane className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block text-sm text-text-primary">Five minutes from Bole International</span>
                    <span className="mt-1 block text-[13px] text-text-secondary">
                      Airport transfers arranged on request, at any hour.
                    </span>
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand/45 text-brand-ink">
                    <MapPin className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block text-sm text-text-primary">{settings['contact.address']}</span>
                    <span className="mt-1 block text-[13px] text-text-secondary">
                      Walking distance to Millennium Hall, embassies and Bole Road.
                    </span>
                  </span>
                </li>
              </ul>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/booking" className="btn-gold">
                  Book your stay
                </Link>
                <Link to="/contact" className="btn-outline">
                  Find us
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
