import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { humanise } from '../lib/format'
import { Alert, Badge, ConfirmDialog, EmptyState, Modal, PageTitle, Spinner, TableShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const STATUSES = ['Available', 'Occupied', 'Maintenance', 'OutOfService']

const STATUS_TONE = {
  Available: 'good',
  Occupied: 'gold',
  Maintenance: 'warning',
  OutOfService: 'critical',
}

export default function Rooms() {
  const { can } = useAuth()
  const writable = can('rooms.write')

  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [filter, setFilter] = useState({ roomTypeId: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [roomList, types] = await Promise.all([api.rooms(filter), api.roomTypes()])
      setRooms(roomList)
      setRoomTypes(types)
    } catch (err) {
      setError(err.status === undefined ? 'Cannot reach the API.' : err.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const summary = useMemo(() => {
    const counts = { Available: 0, Occupied: 0, Maintenance: 0, OutOfService: 0 }
    rooms.forEach((room) => {
      counts[room.status] = (counts[room.status] ?? 0) + 1
    })
    return counts
  }, [rooms])

  const save = async (form) => {
    setBusy(true)
    setError('')

    try {
      const payload = { ...form, roomTypeId: Number(form.roomTypeId), floor: Number(form.floor) }
      if (form.id) await api.updateRoom(form.id, payload)
      else await api.createRoom(payload)

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
      await api.deleteRoom(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message)
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle
        title="Rooms"
        subtitle={`${rooms.length} physical rooms — the unit availability is calculated from`}
        actions={
          writable && (
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                setEditing({
                  roomNumber: '',
                  roomTypeId: roomTypes[0]?.id ?? '',
                  floor: 1,
                  status: 'Available',
                  notes: '',
                  isActive: true,
                })
              }
            >
              <Plus className="h-4 w-4" />
              New room
            </button>
          )
        }
      />

      <Alert onDismiss={() => setError('')}>{error}</Alert>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {STATUSES.map((status) => (
          <div key={status} className="card px-4 py-3">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary">{humanise(status)}</span>
            <p className="mt-1 font-display text-2xl text-text-primary">{summary[status] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[180px]">
          <label htmlFor="f-type" className="field-label">
            Room type
          </label>
          <select
            id="f-type"
            className="field"
            value={filter.roomTypeId}
            onChange={(event) => setFilter({ ...filter, roomTypeId: event.target.value })}
          >
            <option value="">All types</option>
            {roomTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label htmlFor="f-status" className="field-label">
            Status
          </label>
          <select
            id="f-status"
            className="field"
            value={filter.status}
            onChange={(event) => setFilter({ ...filter, status: event.target.value })}
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanise(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading rooms" />
      ) : rooms.length === 0 ? (
        <div className="card">
          <EmptyState title="No rooms match" message="Clear the filters or add the first room." />
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-line">
              <th className="table-head">Room</th>
              <th className="table-head">Type</th>
              <th className="table-head">Floor</th>
              <th className="table-head">Status</th>
              <th className="table-head">Notes</th>
              {writable && <th className="table-head text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-line-soft last:border-0 hover:bg-background-warm">
                <td className="table-cell font-medium text-text-primary">#{room.roomNumber}</td>
                <td className="table-cell">{room.roomTypeName}</td>
                <td className="table-cell">{room.floor}</td>
                <td className="table-cell">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={STATUS_TONE[room.status] ?? 'neutral'}>{humanise(room.status)}</Badge>
                    {!room.isActive && <Badge tone="neutral">Retired</Badge>}
                  </span>
                </td>
                <td className="table-cell max-w-xs truncate text-text-secondary">{room.notes || '—'}</td>
                {writable && (
                  <td className="table-cell text-right">
                    <span className="inline-flex gap-1">
                      <button
                        type="button"
                        aria-label={`Edit room ${room.roomNumber}`}
                        onClick={() => setEditing({ ...room })}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-warm hover:text-brand-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete room ${room.roomNumber}`}
                        onClick={() => setDeleting(room)}
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
          title={editing.id ? `Room ${editing.roomNumber}` : 'New room'}
          size="sm"
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" form="room-form" className="btn-primary" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </>
          }
        >
          <form
            id="room-form"
            onSubmit={(event) => {
              event.preventDefault()
              save(editing)
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="r-number" className="field-label">
                Room number *
              </label>
              <input
                id="r-number"
                className="field"
                value={editing.roomNumber}
                onChange={(e) => setEditing({ ...editing, roomNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="r-floor" className="field-label">
                Floor
              </label>
              <input
                id="r-floor"
                type="number"
                min="0"
                className="field"
                value={editing.floor}
                onChange={(e) => setEditing({ ...editing, floor: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="r-type" className="field-label">
                Room type *
              </label>
              <select
                id="r-type"
                className="field"
                value={editing.roomTypeId}
                onChange={(e) => setEditing({ ...editing, roomTypeId: e.target.value })}
                required
              >
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="r-status" className="field-label">
                Status
              </label>
              <select
                id="r-status"
                className="field"
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanise(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="r-notes" className="field-label">
                Notes
              </label>
              <textarea
                id="r-notes"
                rows={3}
                className="field resize-none"
                placeholder="Housekeeping or maintenance notes"
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              />
              In service — counts toward sellable inventory
            </label>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete room ${deleting?.roomNumber}?`}
        message="Rooms with booking history are retired instead of deleted, so past reservations keep their room number."
        onConfirm={remove}
        onClose={() => setDeleting(null)}
        busy={busy}
      />
    </>
  )
}
