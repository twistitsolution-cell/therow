import { Link } from 'react-router-dom'
import { Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { useSite } from '../context/SiteContext'

export default function Footer() {
  const { settings, roomTypes, t } = useSite()
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-line bg-background-warm">
      <div className="hairline" />

      <div className="container-luxe py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src="/images/brand/logo.webp"
                alt=""
                className="h-12 w-12 rounded-full object-cover ring-1 ring-brand/50"
              />
              <span className="leading-none">
                <span className="block font-display text-xl tracking-brand text-text-primary">THE ROW</span>
                <span className="mt-1 block text-[9px] uppercase tracking-luxe text-brand-ink">Residential Hotel</span>
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-relaxed text-text-secondary">
              {settings['site.tagline']}. Forty-one rooms, suites and serviced apartments in Bole — five
              minutes from Bole International Airport.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {settings['social.instagram'] && (
                <a
                  href={settings['social.instagram']}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-text-secondary transition-colors hover:border-brand-bronze hover:text-brand-ink"
                >
                  <Instagram className="h-4 w-4" strokeWidth={1.75} />
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Explore">
            <h3 className="eyebrow mb-5">Explore</h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: '/', key: 'nav.home' },
                { to: '/about', key: 'nav.about' },
                { to: '/rooms', key: 'nav.rooms' },
                { to: '/services', key: 'nav.services' },
                { to: '/gallery', key: 'nav.gallery' },
                { to: '/contact', key: 'nav.contact' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-text-secondary transition-colors hover:text-brand-ink">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Accommodation">
            <h3 className="eyebrow mb-5">Stay</h3>
            <ul className="space-y-3 text-sm">
              {roomTypes.map((roomType) => (
                <li key={roomType.id}>
                  <Link to={`/rooms/${roomType.slug}`} className="text-text-secondary transition-colors hover:text-brand-ink">
                    {roomType.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="eyebrow mb-5">Contact</h3>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-bronze" strokeWidth={1.75} />
                <span>{settings['contact.address']}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-bronze" strokeWidth={1.75} />
                <span className="flex flex-col">
                  <a href={`tel:${settings['contact.phone']}`} className="transition-colors hover:text-brand-ink">
                    {settings['contact.phone']}
                  </a>
                  <a href={`tel:${settings['contact.mobile']}`} className="transition-colors hover:text-brand-ink">
                    {settings['contact.mobile']}
                  </a>
                  <a href={`tel:${settings['contact.mobile_alt']}`} className="transition-colors hover:text-brand-ink">
                    {settings['contact.mobile_alt']}
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-bronze" strokeWidth={1.75} />
                <a href={`mailto:${settings['contact.email']}`} className="break-all transition-colors hover:text-brand-ink">
                  {settings['contact.email']}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-bronze" strokeWidth={1.75} />
                <span>
                  Check-in {settings['booking.check_in_time']} · Check-out {settings['booking.check_out_time']}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-luxe flex flex-col items-center justify-between gap-3 py-6 text-[11px] text-text-secondary sm:flex-row">
          <p>© {year} The Row Residential Hotel. All rights reserved.</p>

          <p className="flex items-center gap-2 order-first sm:order-none">
            <span className="font-semibold uppercase tracking-brand">Reliable</span>
            <span className="h-1 w-1 rounded-full bg-brand" />
            <span className="font-semibold uppercase tracking-brand">Luxurious</span>
            <span className="h-1 w-1 rounded-full bg-brand" />
            <span className="font-semibold uppercase tracking-brand">Trustworthy</span>
          </p>

          {/* Build credit. Plain text rather than a link because no Twist IT Solution URL has
              been supplied — add an <a> here once there is one to point at. */}
          <p>
            Powered by <span className="font-semibold text-brand-ink">Twist IT Solution</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
