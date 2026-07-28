import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Phone, X } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { LANGUAGES } from '../i18n'

// `navKey` is the compact label used in the desktop header; `key` is the full label used in the
// mobile drawer, where there is room for it.
const LINKS = [
  { to: '/', key: 'nav.home' },
  { to: '/about', key: 'nav.about' },
  { to: '/rooms', key: 'nav.rooms', navKey: 'nav.roomsShort' },
  { to: '/services', key: 'nav.services' },
  { to: '/gallery', key: 'nav.gallery' },
  { to: '/contact', key: 'nav.contact' },
]

export default function Navbar() {
  const { t, currency, setCurrency, language, setLanguage, settings } = useSite()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  // The bar stays white throughout — it only gains a border and shadow once the page moves.
  const lifted = scrolled || menuOpen

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          lifted ? 'border-b border-line bg-background/95 shadow-soft backdrop-blur-xl' : 'bg-background/75 backdrop-blur-md'
        }`}
      >
        <div className="container-luxe">
          <div className={`flex items-center justify-between transition-all duration-500 ${lifted ? 'h-[70px]' : 'h-[86px]'}`}>
            <Link to="/" className="group flex items-center gap-3" aria-label="The Row Residential Hotel — home">
              <img
                src="/images/brand/logo.webp"
                alt=""
                className="h-11 w-11 rounded-full object-cover ring-1 ring-brand/50 transition-transform duration-500 group-hover:scale-105"
              />
              <span className="hidden whitespace-nowrap leading-none sm:block">
                <span className="block font-display text-xl tracking-brand text-text-primary">THE ROW</span>
                <span className="mt-1 block text-[9px] uppercase tracking-luxe text-brand-ink">Residential Hotel</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `relative whitespace-nowrap px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors xl:px-4 xl:text-[12px] xl:tracking-brand ${
                      isActive ? 'text-brand-ink' : 'text-text-secondary hover:text-text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {t(link.navKey ?? link.key)}
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-brand xl:inset-x-4"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center rounded-full border border-line-strong p-0.5 lg:flex">
                {['ETB', 'USD'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrency(code)}
                    aria-pressed={currency === code}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide transition-colors xl:px-3 xl:text-[11px] ${
                      currency === code ? 'bg-brand text-text-primary' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>

              <div className="hidden items-center rounded-full border border-line-strong p-0.5 lg:flex">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    aria-pressed={language === lang.code}
                    title={lang.label}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide transition-colors xl:px-3 xl:text-[11px] ${
                      language === lang.code ? 'bg-brand text-text-primary' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {lang.short}
                  </button>
                ))}
              </div>

              <a
                href={`tel:${settings['contact.mobile'] ?? ''}`}
                className="hidden items-center gap-2 text-[12px] font-medium tracking-wide text-text-secondary transition-colors hover:text-brand-ink md:flex lg:hidden xl:flex"
              >
                <Phone className="h-4 w-4" strokeWidth={1.75} />
                {settings['contact.mobile']}
              </a>

              <Link to="/booking" className="btn-gold hidden whitespace-nowrap !px-5 !py-2.5 sm:inline-flex xl:!px-6">
                {t('nav.book')}
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-text-primary transition-colors hover:border-brand-bronze hover:text-brand-ink lg:hidden"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-background lg:hidden"
          >
            <div className="container-luxe flex h-full flex-col pb-10 pt-28">
              <nav className="flex flex-col" aria-label="Mobile">
                {LINKS.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.05, duration: 0.4 }}
                  >
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        `block border-b border-line py-4 font-display text-3xl transition-colors ${
                          isActive ? 'text-brand-ink' : 'text-text-primary hover:text-brand-ink'
                        }`
                      }
                    >
                      {t(link.key)}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-full border border-line-strong p-0.5">
                  {['ETB', 'USD'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                        currency === code ? 'bg-brand text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>

                <div className="flex items-center rounded-full border border-line-strong p-0.5">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                        language === lang.code ? 'bg-brand text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {lang.short}
                    </button>
                  ))}
                </div>
              </div>

              <Link to="/booking" className="btn-gold mt-auto w-full">
                {t('nav.book')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
