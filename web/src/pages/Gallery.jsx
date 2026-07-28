import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Expand } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import Lightbox from '../components/Lightbox'
import { galleryImages } from '../data/fallbackSite'

const CATEGORIES = ['All', 'Hotel', 'Rooms', 'Suites', 'Apartments', 'Dining', 'Bathrooms']

export default function Gallery() {
  const [category, setCategory] = useState('All')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const visible = useMemo(
    () => (category === 'All' ? galleryImages : galleryImages.filter((image) => image.category === category)),
    [category],
  )

  return (
    <>
      <PageHeader
        eyebrow="Photography"
        title="Gallery"
        subtitle="The building, the lobby, the rooms and the apartments — as they actually are."
        image="/images/feature/facade.webp"
        breadcrumbs={[{ label: 'Gallery' }]}
      />

      <section className="py-16 lg:py-24">
        <div className="container-luxe">
          <Reveal className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((entry) => {
              const count =
                entry === 'All'
                  ? galleryImages.length
                  : galleryImages.filter((image) => image.category === entry).length

              if (count === 0) return null

              return (
                <button
                  key={entry}
                  type="button"
                  onClick={() => {
                    setCategory(entry)
                    setLightboxIndex(null)
                  }}
                  aria-pressed={category === entry}
                  className={`rounded-full px-5 py-2.5 text-[11px] font-medium uppercase tracking-brand transition-all ${
                    category === entry
                      ? 'bg-brand text-text-primary'
                      : 'border border-line-strong text-text-secondary hover:border-brand-bronze hover:text-brand-ink'
                  }`}
                >
                  {entry}
                  <span className="ml-2 opacity-60">{count}</span>
                </button>
              )
            })}
          </Reveal>

          {/* Masonry via CSS columns: images keep their aspect ratio without a layout library. */}
          <motion.div
            key={category}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4"
          >
            {visible.map((image, index) => (
              <motion.button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setLightboxIndex(index)}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="group relative mb-4 block w-full overflow-hidden rounded-xl border border-line"
                aria-label={`View ${image.caption}`}
              >
                <img
                  src={image.url}
                  alt={image.caption}
                  loading={index < 8 ? 'eager' : 'lazy'}
                  className="w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
                />

                <span className="absolute inset-0 flex items-end justify-between gap-3 bg-gradient-to-t from-text-primary/85 via-text-primary/25 to-transparent p-4 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                  <span className="text-left text-[12px] font-medium text-background-soft">{image.caption}</span>
                  <Expand className="h-4 w-4 shrink-0 text-background-soft" strokeWidth={1.75} />
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      <Lightbox
        images={visible}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  )
}
