import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Sparkles, X } from 'lucide-react'
import { useSite } from '../context/SiteContext'

/**
 * WhatsApp contact plus the concierge chat placeholder.
 *
 * The chat panel is deliberately not wired to a model yet — it collects nothing and promises
 * nothing. Swapping `ConciergePanel`'s body for a real assistant is the only change needed.
 */
export default function FloatingActions() {
  const { settings } = useSite()
  const [chatOpen, setChatOpen] = useState(false)

  const whatsapp = settings['contact.whatsapp']
  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello, I would like to enquire about a stay at The Row.')}`
    : null

  return (
    <>
      <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 md:bottom-28">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-[min(21rem,calc(100vw-2.5rem))] rounded-2xl border border-line bg-background p-5 shadow-luxury-lg"
              role="dialog"
              aria-label="Concierge"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <Sparkles className="h-4 w-4 text-brand-bronze" strokeWidth={1.75} />
                  Concierge
                </span>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="text-text-secondary transition-colors hover:text-text-primary"
                  aria-label="Close concierge"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm leading-relaxed text-text-secondary">
                Our AI concierge is arriving shortly. In the meantime our front desk answers around the
                clock — on WhatsApp, by phone, or through the contact form.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-gold w-full !py-2.5 !text-[12px]">
                    Message on WhatsApp
                  </a>
                )}
                <a href={`tel:${settings['contact.mobile'] ?? ''}`} className="btn-outline w-full !py-2.5 !text-[12px]">
                  Call {settings['contact.mobile']}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setChatOpen((open) => !open)}
          className="grid h-12 w-12 place-items-center rounded-full border border-line bg-background text-brand-bronze shadow-luxury transition-all hover:scale-105 hover:border-brand-bronze hover:text-brand-ink"
          aria-label="Open concierge"
        >
          <Sparkles className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="group grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.6)] transition-transform hover:scale-105"
            aria-label="Contact us on WhatsApp"
          >
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
          </a>
        )}
      </div>
    </>
  )
}
