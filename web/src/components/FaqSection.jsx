import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import SectionHeading from './SectionHeading'
import Reveal from './Reveal'
import { faqs } from '../data/faqs'

/**
 * Accordion FAQ. Single-open by design — a wall of expanded answers defeats the purpose, and
 * keeping one open keeps the section a predictable height as guests scan it.
 */
export default function FaqSection() {
  const [open, setOpen] = useState(0)

  return (
    // Sits on the base tone: testimonials directly above use `background-warm`, and two
    // adjacent sections sharing a tone read as one long block.
    <section className="border-b border-line bg-background py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="Good to know"
          title="Frequently asked"
          subtitle="The questions reservations answers most often. Anything else — call, and someone will pick up."
        />

        <Reveal className="mx-auto mt-14 max-w-3xl">
          <ul className="divide-y divide-line border-y border-line">
            {faqs.map((faq, index) => {
              const isOpen = open === index
              return (
                <li key={faq.q}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                      className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-brand-ink"
                    >
                      <span
                        className={`font-display text-lg leading-snug transition-colors sm:text-xl ${
                          isOpen ? 'text-brand-ink' : 'text-text-primary'
                        }`}
                      >
                        {faq.q}
                      </span>

                      <span
                        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors ${
                          isOpen ? 'border-brand bg-brand text-text-primary' : 'border-line-strong text-text-secondary'
                        }`}
                        aria-hidden="true"
                      >
                        {isOpen ? <Minus className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-12 text-[15px] leading-[1.85] text-text-secondary">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
