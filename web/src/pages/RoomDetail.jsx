import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, BedDouble, Maximize2, Users } from 'lucide-react'
import Reveal, { RevealGroup, RevealItem } from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import RoomCard from '../components/RoomCard'
import AmenityIcon from '../components/AmenityIcon'
import Lightbox from '../components/Lightbox'
import ImageCarousel from '../components/ImageCarousel'
import BookingWidget from '../components/BookingWidget'
import { useSite } from '../context/SiteContext'

export default function RoomDetail() {
  const { slug } = useParams()
  const { roomTypeBySlug, roomTypes, money, loading } = useSite()
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const roomType = roomTypeBySlug(slug)

  const images = useMemo(() => {
    if (!roomType) return []
    const list = (roomType.images ?? []).map((image) => ({ url: image.url, caption: image.caption || roomType.name }))
    return list.length ? list : [{ url: roomType.heroImageUrl, caption: roomType.name }]
  }, [roomType])

  // Wait for the fetch to settle before deciding a slug is genuinely unknown.
  if (!roomType) {
    return loading ? null : <Navigate to="/rooms" replace />
  }

  const others = roomTypes.filter((rt) => rt.id !== roomType.id).slice(0, 3)

  return (
    <>
      {/* ---------------- Image-first header ---------------- */}
      <section className="bg-background-warm pb-14 pt-28 lg:pb-20">
        <div className="container-luxe">
          <Reveal>
            <Link
              to="/rooms"
              className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-brand text-text-secondary transition-colors hover:text-brand-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All rooms
            </Link>
          </Reveal>

          {/* min-w-0 on the track and the column: a grid item defaults to min-width:auto, so the
              scrolling thumbnail rail below would otherwise stretch the track past the viewport
              instead of scrolling inside it. */}
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-12">
            <Reveal className="min-w-0">
              <ImageCarousel
                images={images}
                aspect="aspect-[16/10]"
                autoPlay
                priority
                onExpand={setLightboxIndex}
              />

              {/* Thumbnail rail — a second way into the gallery for guests who scan rather than click. */}
              {images.length > 1 && (
                <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={image.url}
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className="img-frame group h-20 w-28 shrink-0 !rounded-xl border border-line transition-colors hover:border-brand-bronze"
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={image.url} alt={image.caption} loading="lazy" className="img-zoom" />
                    </button>
                  ))}
                </div>
              )}
            </Reveal>

            <Reveal direction="left" delay={0.08}>
              <span className="eyebrow mb-3 block">Accommodation</span>
              <h1 className="heading-display text-balance text-4xl sm:text-5xl">{roomType.name}</h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4 text-[13px] text-text-secondary">
                <span className="inline-flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-brand-bronze" strokeWidth={1.75} />
                  {roomType.sizeSqm} m²
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-bronze" strokeWidth={1.75} />
                  Up to {roomType.maxAdults} adults
                  {roomType.maxChildren > 0 && ` + ${roomType.maxChildren}`}
                </span>
                <span className="inline-flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-brand-bronze" strokeWidth={1.75} />
                  {roomType.bedConfiguration}
                </span>
              </div>

              <p className="mt-6 text-[15px] leading-[1.85] text-text-secondary">{roomType.shortDescription}</p>

              <div className="mt-7 rounded-2xl border border-line bg-background p-6 shadow-luxury">
                <span className="text-[10px] font-semibold uppercase tracking-brand text-text-secondary">From</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-4xl text-brand-ink">{money(roomType.basePriceEtb)}</span>
                  <span className="text-[12px] text-text-secondary">per night</span>
                </div>
                <p className="mt-2 text-[11px] text-text-secondary">
                  Excludes 15% VAT and 10% service charge, added at checkout.
                </p>

                <div className="my-5 h-px w-full bg-line" />

                <p className="mb-4 text-[11px] font-semibold uppercase tracking-brand text-brand-ink">Check your dates</p>
                <BookingWidget
                  variant="stacked"
                  className="!border-0 !bg-transparent !p-0 !shadow-none !backdrop-blur-none"
                />

                <div className="mt-5 space-y-2 border-t border-line pt-4 text-[12px] text-text-secondary">
                  <p className="flex justify-between">
                    <span>Rooms in this category</span>
                    <span className="text-text-secondary">{roomType.totalRooms}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Check-in / Check-out</span>
                    <span className="text-text-secondary">14:00 / 12:00</span>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Description & amenities ---------------- */}
      <section className="py-16 lg:py-24">
        <div className="container-luxe">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <Reveal>
              <h2 className="eyebrow mb-4 block">The room</h2>
              <p className="text-[16px] leading-[1.9] text-text-secondary">{roomType.description}</p>
            </Reveal>

            <Reveal direction="left" delay={0.08}>
              <h2 className="eyebrow mb-5 block">In this room</h2>
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {(roomType.amenities ?? []).map((amenity) => (
                  <div key={amenity.id} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/12 text-brand-ink">
                      <AmenityIcon name={amenity.icon} className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-text-primary">{amenity.name}</span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-text-secondary">
                        {amenity.description}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Full gallery ---------------- */}
      {images.length > 1 && (
        <section className="border-t border-line bg-background-warm py-16 lg:py-24">
          <div className="container-luxe">
            <SectionHeading eyebrow="Gallery" title={`Inside the ${roomType.name}`} size="sm" align="left" />

            <RevealGroup className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {images.map((image, index) => (
                <RevealItem key={`${image.url}-${index}`}>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="img-frame group block aspect-[4/3] w-full border border-line shadow-soft transition-shadow hover:shadow-luxury"
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image.url} alt={image.caption} loading="lazy" className="img-zoom" />
                  </button>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* ---------------- Other categories ---------------- */}
      {others.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container-luxe">
            <SectionHeading eyebrow="Also consider" title="Other rooms" size="sm" />

            <RevealGroup className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {others.map((other, index) => (
                <RevealItem key={other.id}>
                  <RoomCard roomType={other} index={index} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      <Lightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
    </>
  )
}
