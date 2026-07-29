import { useCallback, useEffect, useState } from 'react'
import { api, apiUnreachableMessage } from '../lib/api'
import { addDays, formatEtb, formatNumber, humanise, toDateInput } from '../lib/format'
import { Alert, EmptyState, PageTitle, Spinner } from '../components/ui'
import { BarChart, HorizontalBars, LineChart, Legend } from '../components/Charts'

// Reports select stays that overlap the range, so a forward window shows pace of business
// (what is already on the books) rather than history.
const PRESETS = [
  { label: 'Last 30 days', back: 30, forward: 0 },
  { label: 'Last 90 days', back: 90, forward: 0 },
  { label: 'Last year', back: 365, forward: 0 },
  { label: 'Next 90 days', back: 0, forward: 90 },
]

export default function Reports() {
  const [range, setRange] = useState(() => ({
    from: toDateInput(addDays(new Date(), -90)),
    to: toDateInput(new Date()),
  }))
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setReports(await api.reports(range.from, range.to))
    } catch (err) {
      setError(err.status === undefined ? apiUnreachableMessage() : err.message)
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    load()
  }, [load])

  const applyPreset = ({ back, forward }) =>
    setRange({
      from: toDateInput(addDays(new Date(), -back)),
      to: toDateInput(addDays(new Date(), forward)),
    })

  const revenueTrend = (reports?.revenueTrend ?? []).map((point) => ({
    label: point.period.slice(5),
    value: point.revenueEtb,
    meta: `${point.bookings} bookings`,
  }))

  const occupancyTrend = (reports?.occupancyTrend ?? []).map((point) => ({
    label: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(point.date)),
    value: point.occupancyRatePercent,
    meta: `${point.roomsSold} of ${point.roomsAvailable} rooms`,
  }))

  const roomTypes = (reports?.roomTypePerformance ?? []).map((entry) => ({
    label: entry.name,
    value: entry.revenueEtb,
    meta: `${entry.bookings} bookings · ${formatNumber(entry.roomNights)} room nights`,
  }))

  const sources = (reports?.sourceMix ?? []).map((entry) => ({
    label: humanise(entry.source),
    value: entry.bookings,
    meta: formatEtb(entry.revenueEtb),
  }))

  const totalRevenue = (reports?.revenueTrend ?? []).reduce((sum, point) => sum + point.revenueEtb, 0)
  const totalBookings = (reports?.revenueTrend ?? []).reduce((sum, point) => sum + point.bookings, 0)
  const averageOccupancy =
    occupancyTrend.length > 0
      ? occupancyTrend.reduce((sum, point) => sum + point.value, 0) / occupancyTrend.length
      : 0

  return (
    <>
      <PageTitle title="Reports" subtitle="Revenue, occupancy and channel performance" />

      <Alert onDismiss={() => setError('')}>{error}</Alert>

      {/* Filters sit in a single row above the charts. */}
      <div className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label htmlFor="from" className="field-label">
            From
          </label>
          <input
            id="from"
            type="date"
            className="field"
            value={range.from}
            onChange={(event) => setRange({ ...range, from: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="to" className="field-label">
            To
          </label>
          <input
            id="to"
            type="date"
            className="field"
            value={range.to}
            onChange={(event) => setRange({ ...range, to: event.target.value })}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pb-0.5">
          {PRESETS.map((preset) => (
            <button key={preset.label} type="button" className="btn-secondary btn-sm" onClick={() => applyPreset(preset)}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner label="Building reports" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Revenue in range', value: formatEtb(totalRevenue) },
              { label: 'Bookings in range', value: formatNumber(totalBookings) },
              { label: 'Average occupancy', value: `${formatNumber(averageOccupancy, 1)}%` },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <span className="text-[11px] uppercase tracking-wider text-text-secondary">{stat.label}</span>
                <p className="mt-2 font-display text-3xl text-text-primary">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <section className="card p-6">
              <header className="mb-5">
                <h2 className="text-[13px] font-medium text-text-primary">Revenue by month</h2>
                <p className="mt-0.5 text-[11px] text-text-secondary">Confirmed, in-house and completed stays</p>
              </header>

              {revenueTrend.length > 0 ? (
                <BarChart data={revenueTrend} label="Revenue" format={(v, axis) => formatEtb(v, { compact: axis })} />
              ) : (
                <EmptyState title="No revenue in this range" message="Widen the dates or check back after the next booking." />
              )}
            </section>

            <section className="card p-6">
              <header className="mb-5">
                <h2 className="text-[13px] font-medium text-text-primary">Daily occupancy</h2>
                <p className="mt-0.5 text-[11px] text-text-secondary">Rooms sold as a share of sellable inventory</p>
              </header>

              {occupancyTrend.length > 0 ? (
                <LineChart
                  data={occupancyTrend}
                  label="Occupancy"
                  maxOverride={100}
                  format={(value) => `${formatNumber(value, 0)}%`}
                />
              ) : (
                <EmptyState title="No occupancy data" message="Occupancy is derived from stays overlapping each day." />
              )}
            </section>

            <section className="card p-6">
              <header className="mb-5">
                <h2 className="text-[13px] font-medium text-text-primary">Revenue by room type</h2>
                <p className="mt-0.5 text-[11px] text-text-secondary">Ranked by revenue in the selected range</p>
              </header>

              {roomTypes.length > 0 ? (
                <HorizontalBars data={roomTypes} format={(value) => formatEtb(value, { compact: true })} />
              ) : (
                <EmptyState title="Nothing to rank yet" message="Room-type performance appears once bookings exist." />
              )}
            </section>

            <section className="card p-6">
              <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[13px] font-medium text-text-primary">Booking source</h2>
                  <p className="mt-0.5 text-[11px] text-text-secondary">Where reservations actually come from</p>
                </div>
                {sources.length > 1 && <Legend items={sources.map((entry) => entry.label)} />}
              </header>

              {sources.length > 0 ? (
                <HorizontalBars data={sources} categorical format={(value) => `${formatNumber(value)} bookings`} />
              ) : (
                <EmptyState title="No channel data" message="Source mix appears once bookings have been taken." />
              )}
            </section>
          </div>
        </>
      )}
    </>
  )
}
