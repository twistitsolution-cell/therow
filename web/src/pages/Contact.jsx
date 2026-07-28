import { useState } from 'react'
import { AlertCircle, Check, Clock, Instagram, Loader2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import { useSite } from '../context/SiteContext'
import { api } from '../lib/api'
import LocationMap from '../components/LocationMap'

export default function Contact() {
  const { settings, block } = useSite()
  const intro = block('contact.intro')

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const whatsapp = settings['contact.whatsapp']

  const submit = async (event) => {
    event.preventDefault()
    setStatus('sending')
    setError('')

    try {
      await api.sendContactMessage(form)
      setStatus('sent')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setStatus('error')
      setError(
        err.status === undefined
          ? 'We could not send that just now. Please call or message us on WhatsApp instead.'
          : err.message,
      )
    }
  }

  const details = [
    {
      icon: MapPin,
      label: 'Address',
      lines: [settings['contact.address']],
    },
    {
      icon: Phone,
      label: 'Telephone',
      lines: [settings['contact.phone'], settings['contact.mobile'], settings['contact.mobile_alt']].filter(Boolean),
      href: (value) => `tel:${value}`,
    },
    {
      icon: Mail,
      label: 'Email',
      lines: [settings['contact.email']],
      href: (value) => `mailto:${value}`,
    },
    {
      icon: Clock,
      label: 'Reception',
      lines: [
        'Open 24 hours, every day',
        `Check-in ${settings['booking.check_in_time']} · Check-out ${settings['booking.check_out_time']}`,
      ],
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title={intro?.title ?? 'Contact'}
        subtitle={intro?.body}
        image="/images/feature/facade.webp"
        breadcrumbs={[{ label: 'Contact' }]}
      />

      <section className="py-16 lg:py-24">
        <div className="container-luxe">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
            {/* ---------------- Details ---------------- */}
            <Reveal direction="right">
              <span className="eyebrow mb-4 block">{intro?.subtitle ?? 'Reservations answer around the clock'}</span>
              <h2 className="heading-display text-3xl sm:text-4xl">Find us in Bole</h2>

              <ul className="mt-9 space-y-7">
                {details.map((detail) => {
                  const Icon = detail.icon
                  return (
                    <li key={detail.label} className="flex gap-4">
                      <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-brand/45 text-brand-ink">
                        <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                      </span>
                      <div>
                        <span className="block text-[10px] uppercase tracking-brand text-text-secondary">
                          {detail.label}
                        </span>
                        {detail.lines.map((line) => (
                          <span key={line} className="mt-1 block text-sm text-text-secondary">
                            {detail.href ? (
                              <a href={detail.href(line)} className="transition-colors hover:text-brand-ink">
                                {line}
                              </a>
                            ) : (
                              line
                            )}
                          </span>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-9 flex flex-wrap gap-3">
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-gold"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {settings['social.instagram'] && (
                  <a
                    href={settings['social.instagram']}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                )}
              </div>
            </Reveal>

            {/* ---------------- Form ---------------- */}
            <Reveal direction="left" delay={0.1}>
              <form onSubmit={submit} className="glass rounded-2xl p-7 sm:p-9">
                <h2 className="font-display text-2xl text-text-primary">Send us a message</h2>
                <p className="mt-2 text-[13px] text-text-secondary">
                  We reply to every enquiry, usually within a few hours.
                </p>

                {status === 'sent' && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand/45 bg-brand/12 px-5 py-4 text-sm text-brand-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    Thank you — our team will be in touch shortly.
                  </div>
                )}

                {status === 'error' && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl border border-state-danger/40 bg-state-danger-soft px-5 py-4 text-sm text-state-danger">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="c-name" className="field-label">
                      Name *
                    </label>
                    <input
                      id="c-name"
                      className="field"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="c-email" className="field-label">
                      Email *
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      className="field"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="c-phone" className="field-label">
                      Phone
                    </label>
                    <input
                      id="c-phone"
                      type="tel"
                      className="field"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="c-subject" className="field-label">
                      Subject
                    </label>
                    <input
                      id="c-subject"
                      className="field"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="c-message" className="field-label">
                      Message *
                    </label>
                    <textarea
                      id="c-message"
                      rows={5}
                      className="field resize-none"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={status === 'sending'} className="btn-gold mt-7 w-full sm:w-auto">
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send message'
                  )}
                </button>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Map ---------------- */}
      <section className="border-t border-line">
        <LocationMap />
      </section>

    </>
  )
}
