import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import { useSite } from '../context/SiteContext'

/**
 * Google Maps embed.
 *
 * Prefers a **place query** over raw coordinates. Google resolves the query to the actual business
 * listing, so the pin carries the hotel's name, photos and reviews rather than an anonymous
 * marker — and it stays correct if the listing is ever moved or corrected. Coordinates are the
 * fallback, used only once someone sets `contact.map_lat` / `contact.map_lng` in Settings.
 *
 * Both forms use the keyless `maps.google.com/maps?...&output=embed` endpoint, so there is no
 * Maps API key to provision or bill.
 */
export default function LocationMap({ height = 'h-[420px] lg:h-[520px]', showActions = true, className = '' }) {
  const { settings } = useSite()

  const query = (settings['contact.map_query'] ?? '').trim()
  const lat = (settings['contact.map_lat'] ?? '').trim()
  const lng = (settings['contact.map_lng'] ?? '').trim()
  const address = settings['contact.address'] ?? ''

  // Precedence: place query → coordinates → plain address.
  //
  // The query wins because Google resolves it to the business listing, so the pin carries the
  // hotel's name and photos instead of an anonymous marker. Coordinates are the escape hatch for
  // if the listing ever resolves to the wrong place — clear the query and they take over.
  const mapParam = query || (lat !== '' && lng !== '' ? `${lat},${lng}` : address)

  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapParam)}&z=16&output=embed`
  const viewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapParam)}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapParam)}`

  return (
    <div className={className}>
      <div className={`relative w-full overflow-hidden ${height}`}>
        <iframe
          title={`${settings['site.name'] ?? 'The Row Residential Hotel'} on Google Maps`}
          src={embedSrc}
          className="h-full w-full"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      {showActions && (
        <div className="border-t border-line bg-background-warm">
          <div className="container-luxe flex flex-wrap items-center justify-between gap-4 py-5">
            <p className="flex items-start gap-3 text-[13px] text-text-secondary">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-bronze" strokeWidth={1.75} />
              {address}
            </p>

            <div className="flex flex-wrap gap-2">
              <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn-gold !px-5 !py-2.5 !text-[11px]">
                <Navigation className="h-3.5 w-3.5" strokeWidth={2} />
                Get directions
              </a>
              <a href={viewUrl} target="_blank" rel="noreferrer" className="btn-outline !px-5 !py-2.5 !text-[11px]">
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
