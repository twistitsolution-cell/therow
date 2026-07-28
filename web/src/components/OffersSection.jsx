import { Link } from 'react-router-dom'
import { ArrowUpRight, Tag } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { RevealGroup, RevealItem } from './Reveal'
import { offers } from '../data/offers'

/**
 * Image-first offer cards. The photograph fills the tile and the copy sits on a scrim at its
 * foot, so the section reads as three photographs rather than three text boxes.
 */
export default function OffersSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="Special Offers"
          title="Booking direct is worth it"
          subtitle="Rates and inclusions you will not find on the booking platforms."
        />

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <RevealItem key={offer.id} className="h-full">
              <article className="card-hover group relative h-full overflow-hidden rounded-2xl border border-line shadow-soft">
                <img
                  src={offer.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.07]"
                />
                <div className="scrim" />
                <div className="scrim-foot" />

                <div className="relative flex h-full min-h-[26rem] flex-col justify-end p-7">
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-brand text-text-primary shadow-soft">
                    <Tag className="h-3 w-3" strokeWidth={2.5} />
                    {offer.discount}
                  </span>

                  <span className="eyebrow-on-dark mb-2 block">{offer.eyebrow}</span>

                  <h3 className="font-display text-2xl leading-tight text-background-soft drop-shadow-[0_2px_10px_rgba(24,20,16,0.5)]">
                    {offer.title}
                  </h3>

                  <p className="mt-3 text-[13px] leading-relaxed text-background-soft/85 drop-shadow-[0_1px_6px_rgba(24,20,16,0.55)]">
                    {offer.body}
                  </p>

                  <p className="mt-3 text-[11px] text-background-soft/60">{offer.terms}</p>

                  <Link
                    to={`/booking?roomType=${offer.roomSlug}`}
                    className="mt-5 inline-flex items-center gap-1.5 self-start text-[12px] font-semibold uppercase tracking-brand text-brand-onDark transition-colors hover:text-brand"
                  >
                    Book this offer
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
