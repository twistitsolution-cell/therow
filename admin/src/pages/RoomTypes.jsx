import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, apiUnreachableMessage } from '../lib/api'
import { formatEtb } from '../lib/format'
import { Alert, Badge, ConfirmDialog, EmptyState, Modal, PageTitle, Spinner, TableShell } from '../components/ui'
import ImagePreview from '../components/ImagePreview'
import { useAuth } from '../context/AuthContext'

const BLANK = {
  slug: '',
  name: '',
  shortDescription: '',
  description: '',
  basePriceEtb: 0,
  maxAdults: 2,
  maxChildren: 0,
  sizeSqm: 0,
  bedConfiguration: '',
  heroImageUrl: '',
  displayOrder: 0,
  isActive: true,
  imageUrls: [],
  amenityIds: [],
}

export default function RoomTypes() {
  const { can } = useAuth()
  const writable = can('rooms.write')

  const [roomTypes, setRoomTypes] = useState([])
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [types, amenityList] = await Promise.all([api.roomTypes(), api.amenities()])
      setRoomTypes(types)
      setAmenities(amenityList)
    } catch (err) {
      setError(err.status === undefined ? apiUnreachableMessage() : err.message)
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
      const payload = {
        ...form,
        basePriceEtb: Number(form.basePriceEtb),
        maxAdults: Number(form.maxAdults),
        maxChildren: Number(form.maxChildren),
        sizeSqm: Number(form.sizeSqm),
        displayOrder: Number(form.displayOrder),
      }

      if (form.id) await api.updateRoomType(form.id, payload)
      else await api.createRoomType(payload)

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
      await api.deleteRoomType(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message)
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner label="Loading room types" />

  return (
    <>
      <PageTitle
        title="Room Types"
        subtitle="Sellable categories, their rates and marketing copy"
        actions={
          writable && (
            <button type="button" className="btn-primary" onClick={() => setEditing({ ...BLANK })}>
              <Plus className="h-4 w-4" />
              New room type
            </button>
          )
        }
      />

      <Alert onDismiss={() => setError('')}>{error}</Alert>

      {roomTypes.length === 0 ? (
        <div className="card">
          <EmptyState title="No room types yet" message="Create the first category to start selling rooms." />
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-line">
              <th className="table-head">Category</th>
              <th className="table-head">Rate</th>
              <th className="table-head">Size</th>
              <th className="table-head">Capacity</th>
              <th className="table-head">Rooms</th>
              <th className="table-head">Status</th>
              {writable && <th className="table-head text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((roomType) => (
              <tr key={roomType.id} className="border-b border-line-soft last:border-0 hover:bg-background-warm">
                <td className="table-cell">
                  <span className="flex items-center gap-3">
                    {roomType.heroImageUrl && (
                      <img src={roomType.heroImageUrl} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-text-primary">{roomType.name}</span>
                      <span className="block text-[11px] text-text-secondary">/{roomType.slug}</span>
                    </span>
                  </span>
                </td>
                <td className="table-cell whitespace-nowrap tabular-nums">{formatEtb(roomType.basePriceEtb)}</td>
                <td className="table-cell whitespace-nowrap">{roomType.sizeSqm} m²</td>
                <td className="table-cell whitespace-nowrap">
                  {roomType.maxAdults} adults
                  {roomType.maxChildren > 0 && ` + ${roomType.maxChildren}`}
                </td>
                <td className="table-cell">{roomType.totalRooms}</td>
                <td className="table-cell">
                  <Badge tone={roomType.isActive ? 'good' : 'neutral'}>{roomType.isActive ? 'Active' : 'Hidden'}</Badge>
                </td>
                {writable && (
                  <td className="table-cell text-right">
                    <span className="inline-flex gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${roomType.name}`}
                        onClick={() =>
                          setEditing({
                            ...roomType,
                            imageUrls: (roomType.images ?? []).map((image) => image.url),
                            amenityIds: (roomType.amenities ?? []).map((amenity) => amenity.id),
                          })
                        }
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-warm hover:text-brand-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${roomType.name}`}
                        onClick={() => setDeleting(roomType)}
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
        <RoomTypeForm
          initial={editing}
          amenities={amenities}
          busy={busy}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name}?`}
        message="If this category has rooms or booking history it will be deactivated instead of deleted, so past reservations keep their category name."
        onConfirm={remove}
        onClose={() => setDeleting(null)}
        busy={busy}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */

function RoomTypeForm({ initial, amenities, busy, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const set = (changes) => setForm((current) => ({ ...current, ...changes }))

  const toggleAmenity = (id) =>
    set({
      amenityIds: form.amenityIds.includes(id)
        ? form.amenityIds.filter((existing) => existing !== id)
        : [...form.amenityIds, id],
    })

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={form.id ? `Edit ${form.name}` : 'New room type'}
      description="Rates are stored in ETB. USD prices on the website are derived from the exchange rate in Settings."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="room-type-form" className="btn-primary" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </>
      }
    >
      <form
        id="room-type-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSave(form)
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div>
          <label htmlFor="rt-name" className="field-label">
            Name *
          </label>
          <input id="rt-name" className="field" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
        </div>
        <div>
          <label htmlFor="rt-slug" className="field-label">
            Slug
          </label>
          <input
            id="rt-slug"
            className="field"
            placeholder="Generated from the name if left blank"
            value={form.slug}
            onChange={(e) => set({ slug: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="rt-short" className="field-label">
            Short description
          </label>
          <input
            id="rt-short"
            className="field"
            value={form.shortDescription}
            onChange={(e) => set({ shortDescription: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="rt-desc" className="field-label">
            Full description
          </label>
          <textarea
            id="rt-desc"
            rows={5}
            className="field resize-none"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="rt-price" className="field-label">
            Nightly rate (ETB) *
          </label>
          <input
            id="rt-price"
            type="number"
            min="0"
            step="50"
            className="field"
            value={form.basePriceEtb}
            onChange={(e) => set({ basePriceEtb: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor="rt-size" className="field-label">
            Size (m²)
          </label>
          <input
            id="rt-size"
            type="number"
            min="0"
            className="field"
            value={form.sizeSqm}
            onChange={(e) => set({ sizeSqm: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="rt-adults" className="field-label">
            Max adults
          </label>
          <input
            id="rt-adults"
            type="number"
            min="1"
            className="field"
            value={form.maxAdults}
            onChange={(e) => set({ maxAdults: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="rt-children" className="field-label">
            Max children
          </label>
          <input
            id="rt-children"
            type="number"
            min="0"
            className="field"
            value={form.maxChildren}
            onChange={(e) => set({ maxChildren: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="rt-bed" className="field-label">
            Bed configuration
          </label>
          <input
            id="rt-bed"
            className="field"
            placeholder="1 King bed"
            value={form.bedConfiguration}
            onChange={(e) => set({ bedConfiguration: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="rt-order" className="field-label">
            Display order
          </label>
          <input
            id="rt-order"
            type="number"
            className="field"
            value={form.displayOrder}
            onChange={(e) => set({ displayOrder: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="rt-hero" className="field-label">
            Hero image URL
          </label>
          <input
            id="rt-hero"
            className="field"
            placeholder="/images/rooms/standard-1.jpg"
            value={form.heroImageUrl}
            onChange={(e) => set({ heroImageUrl: e.target.value })}
          />
          <ImagePreview url={form.heroImageUrl} label="Hero preview" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="rt-gallery" className="field-label">
            Gallery images — one URL per line
          </label>
          <textarea
            id="rt-gallery"
            rows={4}
            className="field resize-none font-mono text-[12px]"
            value={form.imageUrls.join('\n')}
            onChange={(e) => set({ imageUrls: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })}
          />
          <p className="mt-1 text-[11px] text-text-secondary">
            Upload files in Media first, then paste their URLs here.
          </p>

          {form.imageUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.imageUrls.map((imageUrl, index) => (
                <ImagePreview key={`${imageUrl}-${index}`} url={imageUrl} label={`Image ${index + 1}`} aspect="aspect-[4/3]" />
              ))}
            </div>
          )}
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="field-label">Amenities</legend>
          <div className="grid max-h-56 gap-1.5 overflow-y-auto rounded-lg border border-line bg-background-warm p-3 sm:grid-cols-2">
            {amenities.map((amenity) => (
              <label key={amenity.id} className="flex cursor-pointer items-center gap-2.5 text-[12px] text-text-secondary">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
                  checked={form.amenityIds.includes(amenity.id)}
                  onChange={() => toggleAmenity(amenity.id)}
                />
                {amenity.name}
                <span className="text-text-secondary">{amenity.category}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary sm:col-span-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
            checked={form.isActive}
            onChange={(e) => set({ isActive: e.target.checked })}
          />
          Visible on the website
        </label>
      </form>
    </Modal>
  )
}
