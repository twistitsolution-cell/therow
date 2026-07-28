import { Link } from 'react-router-dom'
import { ArrowUpRight, BedDouble, Maximize2, Users } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import AmenityIcon from './AmenityIcon'
import ImageCarousel from './ImageCarousel'

/**
 * Image-first room tile. The card is not a single anchor — the carousel inside it has its own
 * buttons — so the heading and the CTA carry the link instead.
 */
export default function RoomCard({ roomType, index = 0 }) {
  const { money, t } = useSite()

  const images = (roomType.images ?? []).length
    ? roomType.images.map((image) => ({ url: image.url, caption: image.caption || roomType.name }))
    : [{ url: roomType.heroImageUrl, caption: roomType.name }]

  const topAmenities = (roomType.amenities ?? []).slice(0, 4)

  return (
    <article className="group card-hover flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-background shadow-soft">
      <div className="relative">
        <ImageCarousel images={images} aspect="aspect-[4/3]" rounded="rounded-none" priority={index < 3} />

        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-background/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-brand text-brand-ink shadow-soft">
          {roomType.totalRooms > 0 ? `${roomType.totalRooms} rooms` : 'Enquire'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-2xl leading-tight text-text-primary">
            <Link
              to={`/rooms/${roomType.slug}`}
              className="transition-colors after:absolute hover:text-brand-ink focus-visible:outline-none focus-visible:underline"
            >
              {roomType.name}
            </Link>
          </h3>

          <span className="shrink-0 text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-brand text-text-secondary">
              {t('booking.from')}
            </span>
            <span className="block font-display text-xl text-brand-ink">{money(roomType.basePriceEtb)}</span>
          </span>
        </div>

        <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5 text-brand-bronze" strokeWidth={1.75} />
            {roomType.sizeSqm} {t('common.sqm')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-brand-bronze" strokeWidth={1.75} />
            {roomType.maxAdults + roomType.maxChildren} guests
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 text-brand-bronze" strokeWidth={1.75} />
            {roomType.bedConfiguration}
          </span>
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">{roomType.shortDescription}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-soft pt-4">
          {topAmenities.map((amenity) => (
            <span key={amenity.id} className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary" title={amenity.name}>
              <AmenityIcon name={amenity.icon} className="h-3.5 w-3.5 text-brand-bronze" />
              {amenity.name}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Link
            to={`/rooms/${roomType.slug}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-brand text-brand-ink transition-colors hover:text-brand-ink"
          >
            {t('common.viewDetails')}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          <Link to={`/booking?roomType=${roomType.slug}`} className="btn-gold !px-5 !py-2.5 !text-[11px]">
            {t('booking.select')}
          </Link>
        </div>
      </div>
    </article>
  )
}
