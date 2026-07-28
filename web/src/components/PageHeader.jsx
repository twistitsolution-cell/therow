import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

/**
 * Compact hero for interior pages. Same principle as the main hero: the photograph stays clearly
 * visible under a light-handed dark scrim, and the type sits on top of it in cream.
 */
export default function PageHeader({ eyebrow, title, subtitle, image, breadcrumbs = [] }) {
  return (
    <section className="relative flex h-[56vh] min-h-[400px] items-end overflow-hidden bg-text-primary">
      <div className="absolute inset-0">
        <img
          src={image}
          alt=""
          fetchpriority="high"
          decoding="async"
          className="h-full w-full animate-ken-burns object-cover"
        />
        <div className="scrim" />
        <div className="scrim-header" />
      </div>

      <div className="container-luxe relative pb-14 pt-32">
        <motion.nav
          aria-label="Breadcrumb"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-brand text-background-soft/75"
        >
          <Link to="/" className="transition-colors hover:text-brand-onDark">
            Home
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3" />
              {crumb.to ? (
                <Link to={crumb.to} className="transition-colors hover:text-brand-onDark">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-brand-onDark">{crumb.label}</span>
              )}
            </span>
          ))}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {eyebrow && <span className="eyebrow-on-dark mb-3 block">{eyebrow}</span>}

          <h1 className="font-display text-balance text-4xl font-normal leading-[1.08] tracking-tight text-background-soft drop-shadow-[0_2px_12px_rgba(24,20,16,0.45)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-background-soft/85 drop-shadow-[0_1px_8px_rgba(24,20,16,0.5)]">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
