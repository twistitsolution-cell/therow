import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  Coins,
  LogIn,
  LogOut,
  Percent,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { api } from '../lib/api'
import { formatEtb, formatNumber, humanise } from '../lib/format'
import { Alert, Badge, EmptyState, PageTitle, Spinner } from '../components/ui'
import { BarChart, HorizontalBars } from '../components/Charts'

function StatCard({ icon: Icon, label, value, meta, tone = 'gold' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">{label}</span>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            tone === 'gold' ? 'bg-brand/12 text-brand-ink' : 'bg-background-deep text-text-secondary'
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>

      <p className="mt-3 font-display text-3xl text-text-primary">{value}</p>
      {meta && <p className="mt-1 text-[12px] text-text-secondary">{meta}</p>}
    </div>
  )
}

const STATUS_TONE = {
  Pending: 'warning',
  Confirmed: 'good',
  CheckedIn: 'gold',
  CheckedOut: 'neutral',
  Cancelled: 'critical',
  NoShow: 'serious',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.dashboard(),
      api.reports().catch(() => null), // Finance-only role may not have reports.view
      api.bookings({ page: 1, pageSize: 6 }).catch(() => null),
    ])
      .then(([dashboard, reportData, bookingData]) => {
        setStats(dashboard)
        setReports(reportData)
        setRecent(bookingData?.items ?? [])
      })
      .catch((err) =>
        setError(
          err.status === undefined
            ? 'Cannot reach the API. Check that TheRow.API is running and the database is available.'
            : err.message,
        ),
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading dashboard" />

  if (error) {
    return (
      <>
        <PageTitle title="Dashboard" />
        <Alert>{error}</Alert>
      </>
    )
  }

  const revenueTrend = (reports?.revenueTrend ?? []).map((point) => ({
    label: point.period.slice(5),
    value: point.revenueEtb,
    meta: `${point.bookings} bookings`,
  }))

  const roomTypeMix = (reports?.roomTypePerformance ?? []).map((entry) => ({
    label: entry.name,
    value: entry.revenueEtb,
    meta: `${entry.bookings} bookings · ${formatNumber(entry.roomNights)} room nights`,
  }))

  return (
    <>
      <PageTitle
        title="Dashboard"
        subtitle="Today across the property"
        actions={
          <Link to="/bookings" className="btn-secondary">
            All bookings
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* ---------------- Today ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Percent}
          label="Occupancy"
          value={`${formatNumber(stats.occupancyRatePercent, 1)}%`}
          meta={`${stats.occupiedRooms} of ${stats.totalRooms} rooms occupied`}
        />
        <StatCard
          icon={Coins}
          label="Revenue this month"
          value={formatEtb(stats.revenueThisMonthEtb)}
          meta={`${formatEtb(stats.revenueTotalEtb)} all time`}
        />
        <StatCard
          icon={CalendarCheck}
          label="Bookings this month"
          value={formatNumber(stats.bookingsThisMonth)}
          meta={`${formatNumber(stats.totalBookings)} all time`}
          tone="muted"
        />
        <StatCard
          icon={TrendingUp}
          label="Average daily rate"
          value={formatEtb(stats.averageDailyRateEtb)}
          meta="Revenue ÷ room nights sold"
          tone="muted"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={LogIn} label="Arrivals today" value={formatNumber(stats.arrivalsToday)} tone="muted" />
        <StatCard icon={LogOut} label="Departures today" value={formatNumber(stats.departuresToday)} tone="muted" />
        <StatCard icon={Users} label="Guests in house" value={formatNumber(stats.inHouseGuests)} tone="muted" />
        <StatCard
          icon={Wallet}
          label="Outstanding balance"
          value={formatEtb(stats.outstandingBalanceEtb)}
          meta={stats.pendingBookings > 0 ? `${stats.pendingBookings} bookings awaiting confirmation` : 'Nothing pending'}
        />
      </div>

      {/* ---------------- Charts ---------------- */}
      <div className="mt-8 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-6">
          <header className="mb-5">
            <h2 className="text-[13px] font-medium text-text-primary">Revenue by month</h2>
            <p className="mt-0.5 text-[11px] text-text-secondary">Confirmed, in-house and completed stays, last 90 days</p>
          </header>

          {revenueTrend.length > 0 ? (
            <BarChart
              data={revenueTrend}
              label="Revenue"
              format={(value, axis) => formatEtb(value, { compact: axis })}
            />
          ) : (
            <EmptyState title="No revenue yet" message="Confirmed bookings will appear here once they are taken." />
          )}
        </section>

        <section className="card p-6">
          <header className="mb-5">
            <h2 className="text-[13px] font-medium text-text-primary">Revenue by room type</h2>
            <p className="mt-0.5 text-[11px] text-text-secondary">Which categories are actually earning</p>
          </header>

          {roomTypeMix.length > 0 ? (
            <HorizontalBars data={roomTypeMix} format={(value) => formatEtb(value, { compact: true })} />
          ) : (
            <EmptyState title="Nothing to compare yet" message="Room-type performance appears after the first bookings." />
          )}
        </section>
      </div>

      {/* ---------------- Recent bookings ---------------- */}
      <section className="card mt-4 overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-[13px] font-medium text-text-primary">Latest bookings</h2>
          <Link to="/bookings" className="text-[12px] text-brand-ink transition-colors hover:text-brand-ink">
            View all
          </Link>
        </header>

        {recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="table-head">Reference</th>
                  <th className="table-head">Guest</th>
                  <th className="table-head">Room type</th>
                  <th className="table-head">Stay</th>
                  <th className="table-head">Total</th>
                  <th className="table-head">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((booking) => (
                  <tr key={booking.id} className="border-b border-line-soft last:border-0 hover:bg-background-warm">
                    <td className="table-cell font-medium text-brand-ink">{booking.reference}</td>
                    <td className="table-cell">
                      <span className="block text-text-primary">
                        {booking.guestFirstName} {booking.guestLastName}
                      </span>
                      <span className="block text-[11px] text-text-secondary">{booking.guestEmail}</span>
                    </td>
                    <td className="table-cell">{booking.roomTypeName}</td>
                    <td className="table-cell whitespace-nowrap">
                      {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                    </td>
                    <td className="table-cell whitespace-nowrap tabular-nums">{formatEtb(booking.totalEtb)}</td>
                    <td className="table-cell">
                      <Badge tone={STATUS_TONE[booking.status] ?? 'neutral'}>{humanise(booking.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={BedDouble}
            title="No bookings yet"
            message="Reservations taken through the website or the front desk will appear here."
          />
        )}
      </section>
    </>
  )
}
