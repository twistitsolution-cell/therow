import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, Mail, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { Alert, Badge, ConfirmDialog, EmptyState, Modal, PageTitle, Spinner, TableShell } from '../components/ui'
import ImagePreview from '../components/ImagePreview'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { key: 'slides', label: 'Hero slides' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'blocks', label: 'Page copy' },
  { key: 'messages', label: 'Enquiries' },
]

const BLANK_SLIDE = {
  eyebrow: '',
  title: '',
  subtitle: '',
  imageUrl: '',
  videoUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  sortOrder: 0,
  isActive: true,
}

const BLANK_TESTIMONIAL = {
  guestName: '',
  country: '',
  quote: '',
  rating: 5,
  avatarUrl: '',
  isPublished: true,
  displayOrder: 0,
}

export default function Content() {
  const { can } = useAuth()
  const writable = can('content.write')

  const [tab, setTab] = useState('slides')
  const [data, setData] = useState({ slides: [], testimonials: [], blocks: [], messages: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [slides, testimonials, blocks, messages] = await Promise.all([
        api.heroSlides(),
        api.testimonials(),
        api.blocks(),
        api.messages().catch(() => []),
      ])
      setData({ slides, testimonials, blocks, messages })
    } catch (err) {
      setError(err.status === undefined ? 'Cannot reach the API.' : err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (operation, successMessage) => {
    setBusy(true)
    setError('')

    try {
      await operation()
      setEditing(null)
      setDeleting(null)
      if (successMessage) setNotice(successMessage)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner label="Loading content" />

  const unread = data.messages.filter((message) => !message.isRead).length

  return (
    <>
      <PageTitle title="Content" subtitle="Everything the website reads from the database" />

      <Alert onDismiss={() => setError('')}>{error}</Alert>
      <Alert tone="good" onDismiss={() => setNotice('')}>
        {notice}
      </Alert>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            aria-pressed={tab === entry.key}
            className={`rounded-lg px-4 py-2 text-[13px] transition-colors ${
              tab === entry.key
                ? 'bg-brand/12 font-medium text-brand-ink'
                : 'text-text-secondary hover:bg-background-warm hover:text-text-primary'
            }`}
          >
            {entry.label}
            {entry.key === 'messages' && unread > 0 && (
              <span className="ml-2 rounded-full bg-state-warning-soft px-1.5 py-0.5 text-[10px] text-state-warning">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ---------------- Hero slides ---------------- */}
      {tab === 'slides' && (
        <>
          {writable && (
            <button type="button" className="btn-primary mb-4" onClick={() => setEditing({ kind: 'slide', ...BLANK_SLIDE })}>
              <Plus className="h-4 w-4" />
              New slide
            </button>
          )}

          {data.slides.length === 0 ? (
            <div className="card">
              <EmptyState title="No slides" message="The homepage hero needs at least one slide." />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.slides.map((slide) => (
                <article key={slide.id} className="card overflow-hidden">
                  {slide.imageUrl && <img src={slide.imageUrl} alt="" className="h-36 w-full object-cover" />}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wider text-brand-ink">{slide.eyebrow}</span>
                        <h3 className="mt-1 font-display text-lg text-text-primary">{slide.title}</h3>
                      </span>
                      <Badge tone={slide.isActive ? 'good' : 'neutral'}>{slide.isActive ? 'Live' : 'Hidden'}</Badge>
                    </div>

                    <p className="mt-2 line-clamp-2 text-[12px] text-text-secondary">{slide.subtitle}</p>

                    {writable && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => setEditing({ kind: 'slide', ...slide })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => setDeleting({ kind: 'slide', ...slide })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- Testimonials ---------------- */}
      {tab === 'testimonials' && (
        <>
          {writable && (
            <button
              type="button"
              className="btn-primary mb-4"
              onClick={() => setEditing({ kind: 'testimonial', ...BLANK_TESTIMONIAL })}
            >
              <Plus className="h-4 w-4" />
              New testimonial
            </button>
          )}

          {data.testimonials.length === 0 ? (
            <div className="card">
              <EmptyState title="No testimonials" message="Add verified guest reviews to build trust on the homepage." />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.testimonials.map((testimonial) => (
                <article key={testimonial.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-[13px] text-text-primary">{testimonial.guestName}</span>
                      <span className="block text-[11px] text-text-secondary">{testimonial.country}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`h-3 w-3 ${
                              index < testimonial.rating ? 'fill-brand text-brand-ink' : 'text-text-primary/20'
                            }`}
                          />
                        ))}
                      </span>
                      <Badge tone={testimonial.isPublished ? 'good' : 'neutral'}>
                        {testimonial.isPublished ? 'Live' : 'Draft'}
                      </Badge>
                    </span>
                  </div>

                  <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">“{testimonial.quote}”</p>

                  {writable && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setEditing({ kind: 'testimonial', ...testimonial })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => setDeleting({ kind: 'testimonial', ...testimonial })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- Page copy ---------------- */}
      {tab === 'blocks' && (
        <div className="space-y-4">
          {data.blocks.map((block) => (
            <article key={block.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[12px] text-brand-ink">
                  {block.pageKey}.{block.sectionKey}
                </span>
                {writable && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setEditing({ kind: 'block', ...block })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
              </div>

              <h3 className="mt-2 font-display text-xl text-text-primary">{block.title}</h3>
              {block.subtitle && <p className="mt-0.5 text-[12px] text-text-secondary">{block.subtitle}</p>}
              <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-text-secondary">{block.body}</p>
            </article>
          ))}

          {data.blocks.length === 0 && (
            <div className="card">
              <EmptyState title="No page copy" message="Seeded content blocks appear here once the database is seeded." />
            </div>
          )}
        </div>
      )}

      {/* ---------------- Enquiries ---------------- */}
      {tab === 'messages' && (
        <>
          {data.messages.length === 0 ? (
            <div className="card">
              <EmptyState icon={Mail} title="No enquiries" message="Contact-form submissions land here." />
            </div>
          ) : (
            <TableShell>
              <thead>
                <tr className="border-b border-line">
                  <th className="table-head">Received</th>
                  <th className="table-head">From</th>
                  <th className="table-head">Subject</th>
                  <th className="table-head">Message</th>
                  {writable && <th className="table-head text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.messages.map((message) => (
                  <tr
                    key={message.id}
                    className={`border-b border-line-soft last:border-0 ${message.isRead ? '' : 'bg-brand/12'}`}
                  >
                    <td className="table-cell whitespace-nowrap">{formatDateTime(message.createdAt)}</td>
                    <td className="table-cell">
                      <span className="block text-text-primary">{message.name}</span>
                      <span className="block text-[11px] text-text-secondary">{message.email}</span>
                    </td>
                    <td className="table-cell">{message.subject || '—'}</td>
                    <td className="table-cell max-w-md">
                      <span className="line-clamp-2">{message.message}</span>
                    </td>
                    {writable && (
                      <td className="table-cell text-right">
                        <span className="inline-flex gap-1">
                          {!message.isRead && (
                            <button
                              type="button"
                              aria-label="Mark as read"
                              onClick={() => act(() => api.markMessageRead(message.id))}
                              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-warm hover:text-state-success"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label="Delete message"
                            onClick={() => setDeleting({ kind: 'message', ...message })}
                            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-warm hover:text-state-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </>
      )}

      {editing && <ContentForm entry={editing} busy={busy} onClose={() => setEditing(null)} onSave={act} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this item?"
        message="This cannot be undone."
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          act(() => {
            if (deleting.kind === 'slide') return api.deleteHeroSlide(deleting.id)
            if (deleting.kind === 'testimonial') return api.deleteTestimonial(deleting.id)
            return api.deleteMessage(deleting.id)
          }, 'Deleted.')
        }
      />
    </>
  )
}

/* ------------------------------------------------------------------ */

function ContentForm({ entry, busy, onClose, onSave }) {
  const [form, setForm] = useState(entry)
  const set = (changes) => setForm((current) => ({ ...current, ...changes }))

  const submit = (event) => {
    event.preventDefault()

    if (form.kind === 'slide') {
      const payload = { ...form, sortOrder: Number(form.sortOrder) }
      onSave(() => (form.id ? api.updateHeroSlide(form.id, payload) : api.createHeroSlide(payload)), 'Slide saved.')
    } else if (form.kind === 'testimonial') {
      const payload = { ...form, rating: Number(form.rating), displayOrder: Number(form.displayOrder) }
      onSave(
        () => (form.id ? api.updateTestimonial(form.id, payload) : api.createTestimonial(payload)),
        'Testimonial saved.',
      )
    } else {
      onSave(() => api.saveBlock({ ...form, sortOrder: Number(form.sortOrder) }), 'Copy saved.')
    }
  }

  const titles = { slide: 'Hero slide', testimonial: 'Testimonial', block: 'Page copy' }

  return (
    <Modal
      open
      onClose={onClose}
      title={form.id ? `Edit ${titles[form.kind].toLowerCase()}` : `New ${titles[form.kind].toLowerCase()}`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="content-form" className="btn-primary" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </>
      }
    >
      <form id="content-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {form.kind === 'slide' && (
          <>
            <div>
              <label htmlFor="s-eyebrow" className="field-label">
                Eyebrow
              </label>
              <input id="s-eyebrow" className="field" value={form.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} />
            </div>
            <div>
              <label htmlFor="s-order" className="field-label">
                Sort order
              </label>
              <input
                id="s-order"
                type="number"
                className="field"
                value={form.sortOrder}
                onChange={(e) => set({ sortOrder: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-title" className="field-label">
                Title *
              </label>
              <input id="s-title" className="field" value={form.title} onChange={(e) => set({ title: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-subtitle" className="field-label">
                Subtitle
              </label>
              <textarea
                id="s-subtitle"
                rows={3}
                className="field resize-none"
                value={form.subtitle}
                onChange={(e) => set({ subtitle: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="s-image" className="field-label">
                Image URL
              </label>
              <input id="s-image" className="field" value={form.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} />
              <ImagePreview url={form.imageUrl} label="Slide preview" />
            </div>
            <div>
              <label htmlFor="s-video" className="field-label">
                Video URL (optional)
              </label>
              <input id="s-video" className="field" value={form.videoUrl} onChange={(e) => set({ videoUrl: e.target.value })} />
            </div>
            <div>
              <label htmlFor="s-cta" className="field-label">
                Button label
              </label>
              <input id="s-cta" className="field" value={form.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} />
            </div>
            <div>
              <label htmlFor="s-ctaurl" className="field-label">
                Button link
              </label>
              <input id="s-ctaurl" className="field" value={form.ctaUrl} onChange={(e) => set({ ctaUrl: e.target.value })} />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
                checked={form.isActive}
                onChange={(e) => set({ isActive: e.target.checked })}
              />
              Show this slide
            </label>
          </>
        )}

        {form.kind === 'testimonial' && (
          <>
            <div>
              <label htmlFor="t-name" className="field-label">
                Guest name *
              </label>
              <input
                id="t-name"
                className="field"
                value={form.guestName}
                onChange={(e) => set({ guestName: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="t-country" className="field-label">
                Country
              </label>
              <input id="t-country" className="field" value={form.country} onChange={(e) => set({ country: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="t-quote" className="field-label">
                Quote *
              </label>
              <textarea
                id="t-quote"
                rows={4}
                className="field resize-none"
                value={form.quote}
                onChange={(e) => set({ quote: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="t-rating" className="field-label">
                Rating
              </label>
              <select id="t-rating" className="field" value={form.rating} onChange={(e) => set({ rating: e.target.value })}>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} stars
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="t-order" className="field-label">
                Display order
              </label>
              <input
                id="t-order"
                type="number"
                className="field"
                value={form.displayOrder}
                onChange={(e) => set({ displayOrder: e.target.value })}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
                checked={form.isPublished}
                onChange={(e) => set({ isPublished: e.target.checked })}
              />
              Published on the website
            </label>
          </>
        )}

        {form.kind === 'block' && (
          <>
            <div>
              <label htmlFor="b-page" className="field-label">
                Page key
              </label>
              <input id="b-page" className="field font-mono text-[12px]" value={form.pageKey} disabled />
            </div>
            <div>
              <label htmlFor="b-section" className="field-label">
                Section key
              </label>
              <input id="b-section" className="field font-mono text-[12px]" value={form.sectionKey} disabled />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="b-title" className="field-label">
                Title
              </label>
              <input id="b-title" className="field" value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="b-subtitle" className="field-label">
                Subtitle
              </label>
              <input id="b-subtitle" className="field" value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="b-body" className="field-label">
                Body
              </label>
              <textarea
                id="b-body"
                rows={7}
                className="field resize-none"
                value={form.body}
                onChange={(e) => set({ body: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="b-image" className="field-label">
                Image URL
              </label>
              <input id="b-image" className="field" value={form.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} />
              <ImagePreview url={form.imageUrl} label="Image preview" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="b-meta" className="field-label">
                Metadata (JSON)
              </label>
              <textarea
                id="b-meta"
                rows={3}
                className="field resize-none font-mono text-[12px]"
                value={form.metadataJson}
                onChange={(e) => set({ metadataJson: e.target.value })}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}
