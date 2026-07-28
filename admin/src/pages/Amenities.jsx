import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Alert, Badge, ConfirmDialog, EmptyState, Modal, PageTitle, Spinner, TableShell } from '../components/ui'
import ImagePreview from '../components/ImagePreview'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['Room', 'Hotel', 'Wellness', 'Dining', 'Business', 'Transport']

const BLANK = {
  slug: '',
  name: '',
  description: '',
  icon: '',
  category: 'Hotel',
  imageUrl: '',
  isFeatured: false,
  displayOrder: 0,
  isActive: true,
}

export default function Amenities() {
  const { can } = useAuth()
  const writable = can('rooms.write')

  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAmenities(await api.amenities())
    } catch (err) {
      setError(err.status === undefined ? 'Cannot reach the API.' : err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (form) => {
    setBusy(true)
    setError('')

    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) }
      if (form.id) await api.updateAmenity(form.id, payload)
      else await api.createAmenity(payload)

      setEditing(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteAmenity(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message)
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner label="Loading amenities" />

  return (
    <>
      <PageTitle
        title="Amenities"
        subtitle="Services and in-room features shown on the website"
        actions={
          writable && (
            <button type="button" className="btn-primary" onClick={() => setEditing({ ...BLANK })}>
              <Plus className="h-4 w-4" />
              New amenity
            </button>
          )
        }
      />

      <Alert onDismiss={() => setError('')}>{error}</Alert>

      {amenities.length === 0 ? (
        <div className="card">
          <EmptyState title="No amenities yet" message="Add the services and features guests should see." />
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-line">
              <th className="table-head">Amenity</th>
              <th className="table-head">Category</th>
              <th className="table-head">Icon key</th>
              <th className="table-head">Order</th>
              <th className="table-head">Flags</th>
              {writable && <th className="table-head text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {amenities.map((amenity) => (
              <tr key={amenity.id} className="border-b border-line-soft last:border-0 hover:bg-background-warm">
                <td className="table-cell">
                  <span className="block text-text-primary">{amenity.name}</span>
                  <span className="block max-w-md truncate text-[11px] text-text-secondary">{amenity.description}</span>
                </td>
                <td className="table-cell">{amenity.category}</td>
                <td className="table-cell font-mono text-[12px] text-text-secondary">{amenity.icon || '—'}</td>
                <td className="table-cell">{amenity.displayOrder}</td>
                <td className="table-cell">
                  <span className="flex flex-wrap gap-1.5">
                    {amenity.isFeatured && (
                      <Badge tone="gold" icon={Star}>
                        Featured
                      </Badge>
                    )}
                  </span>
                </td>
                {writable && (
                  <td className="table-cell text-right">
                    <span className="inline-flex gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${amenity.name}`}
                        onClick={() => setEditing({ ...amenity })}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-warm hover:text-brand-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${amenity.name}`}
                        onClick={() => setDeleting(amenity)}
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

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.id ? `Edit ${editing.name}` : 'New amenity'}
          description="Featured amenities appear in the homepage experience grid."
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" form="amenity-form" className="btn-primary" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </>
          }
        >
          <form
            id="amenity-form"
            onSubmit={(event) => {
              event.preventDefault()
              save(editing)
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="a-name" className="field-label">
                Name *
              </label>
              <input
                id="a-name"
                className="field"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="a-category" className="field-label">
                Category
              </label>
              <select
                id="a-category"
                className="field"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="a-desc" className="field-label">
                Description
              </label>
              <textarea
                id="a-desc"
                rows={3}
                className="field resize-none"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="a-icon" className="field-label">
                Icon key
              </label>
              <input
                id="a-icon"
                className="field font-mono text-[12px]"
                placeholder="wifi, dumbbell, chef-hat…"
                value={editing.icon}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-text-secondary">
                A Lucide icon name. Unknown keys fall back to a star on the website.
              </p>
            </div>
            <div>
              <label htmlFor="a-order" className="field-label">
                Display order
              </label>
              <input
                id="a-order"
                type="number"
                className="field"
                value={editing.displayOrder}
                onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="a-image" className="field-label">
                Image URL
              </label>
              <input
                id="a-image"
                className="field"
                value={editing.imageUrl}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
              />
              <ImagePreview url={editing.imageUrl} label="Image preview" />
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
                checked={editing.isFeatured}
                onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
              />
              Featured on the homepage
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              />
              Active
            </label>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name}?`}
        message="This removes the amenity from every room type that lists it."
        onConfirm={remove}
        onClose={() => setDeleting(null)}
        busy={busy}
      />
    </>
  )
}
