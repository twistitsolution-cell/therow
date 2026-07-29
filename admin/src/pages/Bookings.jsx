import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react'
import { api, apiUnreachableMessage } from '../lib/api'
import { formatDate, formatDateTime, formatEtb, humanise } from '../lib/format'
import { Alert, Badge, EmptyState, Modal, PageTitle, Spinner, TableShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const STATUS_TONE = {
  Pending: 'warning',
  Confirmed: 'good',
  CheckedIn: 'gold',
  CheckedOut: 'neutral',
  Cancelled: 'critical',
  NoShow: 'serious',
}

const PAYMENT_TONE = {
  Unpaid: 'critical',
  PartiallyPaid: 'warning',
  Paid: 'good',
  Refunded: 'neutral',
  Failed: 'critical',
}

const STATUSES = ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'NoShow']
const PAYMENT_STATUSES = ['Unpaid', 'PartiallyPaid', 'Paid', 'Refunded']
const PROVIDERS = ['Telebirr', 'CbeBirr', 'BankTransfer', 'Stripe', 'Cash']

export default function Bookings() {
  const { can } = useAuth()
  const writable = can('bookings.write')

  const [filter, setFilter] = useState({ search: '', status: '', paymentStatus: '', page: 1, pageSize: 20 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setResult(await api.bookings(filter))
    } catch (err) {
      setError(
        err.status === undefined ? apiUnreachableMessage() : err.message,
      )
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const patch = (changes) => setFilter((current) => ({ ...current, ...changes, page: changes.page ?? 1 }))

  const items = result?.items ?? []
  const totalPages = result?.totalPages ?? 0

  return (
    <>
      <PageTitle
        title="Bookings"
        subtitle={result ? `${result.totalCount} reservations` : 'Reservations across every channel'}
      />

      <Alert onDismiss={() => setError('')}>{error}</Alert>

      {/* ---------------- Filters ---------------- */}
      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="search" className="field-label">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              id="search"
              className="field !pl-10"
              placeholder="Reference, name, email or phone"
              value={filter.search}
              onChange={(event) => patch({ search: event.target.value })}
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <label htmlFor="status" className="field-label">
            Status
          </label>
          <select id="status" className="field" value={filter.status} onChange={(e) => patch({ status: e.target.value })}>
            <option value="">All</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanise(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label htmlFor="payment" className="field-label">
            Payment
          </label>
          <select
            id="payment"
            className="field"
            value={filter.paymentStatus}
            onChange={(e) => patch({ paymentStatus: e.target.value })}
          >
            <option value="">All</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanise(status)}
              </option>
            ))}
          </select>
        </div>

        {(filter.search || filter.status || filter.paymentStatus) && (
          <button
            type="button"
            onClick={() => patch({ search: '', status: '', paymentStatus: '' })}
            className="btn-secondary btn-sm mb-0.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* ---------------- Table ---------------- */}
      {loading ? (
        <Spinner label="Loading bookings" />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No bookings match"
            message="Adjust the filters, or wait for the next reservation to arrive from the website."
          />
        </div>
      ) : (
        <>
          <TableShell>
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Reference</th>
                <th className="table-head">Guest</th>
                <th className="table-head">Room type</th>
                <th className="table-head">Check-in</th>
                <th className="table-head">Check-out</th>
                <th className="table-head">Total</th>
                <th className="table-head">Payment</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => setSelected(booking)}
                  className="cursor-pointer border-b border-line-soft last:border-0 hover:bg-background-warm"
                >
                  <td className="table-cell font-medium text-brand-ink">{booking.reference}</td>
                  <td className="table-cell">
                    <span className="block text-text-primary">
                      {booking.guestFirstName} {booking.guestLastName}
                    </span>
                    <span className="block text-[11px] text-text-secondary">{booking.guestPhone || booking.guestEmail}</span>
                  </td>
                  <td className="table-cell">
                    {booking.roomTypeName}
                    {booking.roomNumber && <span className="ml-1.5 text-[11px] text-text-secondary">#{booking.roomNumber}</span>}
                  </td>
                  <td className="table-cell whitespace-nowrap">{formatDate(booking.checkIn)}</td>
                  <td className="table-cell whitespace-nowrap">{formatDate(booking.checkOut)}</td>
                  <td className="table-cell whitespace-nowrap tabular-nums">{formatEtb(booking.totalEtb)}</td>
                  <td className="table-cell">
                    <Badge tone={PAYMENT_TONE[booking.paymentStatus] ?? 'neutral'}>{humanise(booking.paymentStatus)}</Badge>
                  </td>
                  <td className="table-cell">
                    <Badge tone={STATUS_TONE[booking.status] ?? 'neutral'}>{humanise(booking.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-[12px] text-text-secondary">
                Page {result.page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  disabled={result.page <= 1}
                  onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  disabled={result.page >= totalPages}
                  onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <BookingDrawer
          booking={selected}
          writable={writable}
          canTakePayment={can('payments.write')}
          onClose={() => setSelected(null)}
          onChanged={(updated) => {
            setSelected(updated)
            load()
          }}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */

function BookingDrawer({ booking, writable, canTakePayment, onClose, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState([])
  const [payment, setPayment] = useState({ provider: 'Telebirr', amountEtb: '', reference: '', notes: '' })

  const settled = (booking.payments ?? [])
    .filter((entry) => entry.status === 'Paid')
    .reduce((sum, entry) => sum + entry.amountEtb, 0)
  const balance = Math.max(0, booking.totalEtb - settled)

  useEffect(() => {
    setPayment((current) => ({ ...current, amountEtb: balance > 0 ? String(balance) : '' }))
  }, [balance])

  useEffect(() => {
    if (!writable) return
    api.assignableRooms(booking.id).then(setRooms).catch(() => setRooms([]))
  }, [booking.id, writable])

  const run = async (action) => {
    setBusy(true)
    setError('')

    try {
      onChanged(await action())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={booking.reference}
      description={`${booking.guestFirstName} ${booking.guestLastName} · booked ${formatDateTime(booking.createdAt)}`}
      size="lg"
    >
      <Alert onDismiss={() => setError('')}>{error}</Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------- Stay & guest ---------------- */}
        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Stay</h3>
          <dl className="space-y-2.5 text-[13px]">
            {[
              ['Room type', booking.roomTypeName],
              ['Room', booking.roomNumber ? `#${booking.roomNumber}` : 'Not assigned'],
              ['Check-in', formatDate(booking.checkIn)],
              ['Check-out', formatDate(booking.checkOut)],
              ['Nights', booking.nights],
              ['Guests', `${booking.adults} adults${booking.children ? `, ${booking.children} children` : ''}`],
              ['Source', humanise(booking.source)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-text-secondary">{label}</dt>
                <dd className="text-right text-text-secondary">{value}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Guest</h3>
          <dl className="space-y-2.5 text-[13px]">
            {[
              ['Email', booking.guestEmail],
              ['Phone', booking.guestPhone || '—'],
              ['Country', booking.guestCountry || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="shrink-0 text-text-secondary">{label}</dt>
                <dd className="break-all text-right text-text-secondary">{value}</dd>
              </div>
            ))}
          </dl>

          {booking.specialRequests && (
            <>
              <h3 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Special requests
              </h3>
              <p className="rounded-lg border border-line bg-background-warm p-3 text-[13px] leading-relaxed text-text-secondary">
                {booking.specialRequests}
              </p>
            </>
          )}
        </section>

        {/* ---------------- Money & actions ---------------- */}
        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Charges</h3>
          <dl className="space-y-2.5 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">
                {formatEtb(booking.nightlyRateEtb)} × {booking.nights}
              </dt>
              <dd className="tabular-nums text-text-secondary">{formatEtb(booking.subtotalEtb)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">VAT &amp; service</dt>
              <dd className="tabular-nums text-text-secondary">{formatEtb(booking.taxEtb)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-2.5">
              <dt className="text-text-secondary">Total</dt>
              <dd className="font-medium tabular-nums text-text-primary">{formatEtb(booking.totalEtb)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Settled</dt>
              <dd className="tabular-nums text-state-success">{formatEtb(settled)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Balance</dt>
              <dd className={`tabular-nums ${balance > 0 ? 'text-state-warning' : 'text-text-secondary'}`}>
                {formatEtb(balance)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={STATUS_TONE[booking.status] ?? 'neutral'}>{humanise(booking.status)}</Badge>
            <Badge tone={PAYMENT_TONE[booking.paymentStatus] ?? 'neutral'}>{humanise(booking.paymentStatus)}</Badge>
          </div>

          {writable && (
            <>
              <h3 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Change status
              </h3>
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((status) => status !== booking.status).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        api.updateBookingStatus(
                          booking.id,
                          status,
                          status === 'Cancelled' ? 'Cancelled from the admin panel' : null,
                        ),
                      )
                    }
                    className={`btn-sm ${status === 'Cancelled' ? 'btn-danger' : 'btn-secondary'}`}
                  >
                    {humanise(status)}
                  </button>
                ))}
              </div>

              <h3 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Assign room
              </h3>
              {rooms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      disabled={busy || room.id === booking.roomId}
                      onClick={() => run(() => api.assignRoom(booking.id, room.id))}
                      className={`btn-sm ${room.id === booking.roomId ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      #{room.roomNumber}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-text-secondary">
                  No free rooms of this type for these dates.
                </p>
              )}
            </>
          )}

          {canTakePayment && (
            <form
              className="mt-6"
              onSubmit={(event) => {
                event.preventDefault()
                run(() =>
                  api.recordPayment(booking.id, {
                    provider: payment.provider,
                    amountEtb: Number(payment.amountEtb),
                    reference: payment.reference,
                    status: 'Paid',
                    notes: payment.notes,
                  }),
                )
              }}
            >
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Record a payment
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="p-provider" className="field-label">
                    Method
                  </label>
                  <select
                    id="p-provider"
                    className="field"
                    value={payment.provider}
                    onChange={(event) => setPayment({ ...payment, provider: event.target.value })}
                  >
                    {PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {humanise(provider)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="p-amount" className="field-label">
                    Amount (ETB)
                  </label>
                  <input
                    id="p-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    className="field"
                    value={payment.amountEtb}
                    onChange={(event) => setPayment({ ...payment, amountEtb: event.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="p-ref" className="field-label">
                    Transaction reference
                  </label>
                  <input
                    id="p-ref"
                    className="field"
                    placeholder="Telebirr receipt / bank slip number"
                    value={payment.reference}
                    onChange={(event) => setPayment({ ...payment, reference: event.target.value })}
                  />
                </div>
              </div>

              <button type="submit" disabled={busy} className="btn-primary btn-sm mt-3">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Record payment
              </button>
            </form>
          )}

          {(booking.payments ?? []).length > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Payment history
              </h3>
              <ul className="space-y-2">
                {booking.payments.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-background-warm px-3 py-2.5 text-[12px]"
                  >
                    <span>
                      <span className="block text-text-secondary">{humanise(entry.provider)}</span>
                      <span className="block text-text-secondary">
                        {entry.reference || 'No reference'} · {entry.paidAt ? formatDate(entry.paidAt) : 'Pending'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums text-text-primary">{formatEtb(entry.amountEtb)}</span>
                      <Badge tone={PAYMENT_TONE[entry.status] ?? 'neutral'}>{humanise(entry.status)}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </Modal>
  )
}
