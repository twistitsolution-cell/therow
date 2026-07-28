import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BedDouble,
  CalendarCheck,
  DoorOpen,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/** Each entry declares the permission that reveals it, so the sidebar matches the user's role. */
const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view', end: true },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck, permission: 'bookings.view' },
  { to: '/room-types', label: 'Room Types', icon: BedDouble, permission: 'rooms.view' },
  { to: '/rooms', label: 'Rooms', icon: DoorOpen, permission: 'rooms.view' },
  { to: '/amenities', label: 'Amenities', icon: Sparkles, permission: 'rooms.view' },
  { to: '/content', label: 'Content', icon: Images, permission: 'content.view' },
  { to: '/media', label: 'Media', icon: Images, permission: 'media.view' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
  { to: '/users', label: 'Users & Roles', icon: Users, permission: 'users.view' },
  { to: '/settings', label: 'Settings', icon: Settings, permission: 'content.view' },
]

export default function Layout() {
  const { user, signOut, can } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const visible = NAV.filter((entry) => can(entry.permission))
  const current = visible.find((entry) => (entry.end ? location.pathname === entry.to : location.pathname.startsWith(entry.to)))

  return (
    <div className="min-h-screen lg:flex">
      {/* Backdrop for the mobile drawer. */}
      {open && (
        <div className="fixed inset-0 z-30 bg-text-primary/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-background-deep transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-line px-5">
          <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-brand/50" />
          <span className="leading-none">
            <span className="block font-display text-lg tracking-brand text-text-primary">THE ROW</span>
            <span className="mt-1 block text-[8px] uppercase tracking-luxe text-brand-ink">Admin Panel</span>
          </span>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-text-secondary hover:text-text-primary lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin sections">
          <ul className="space-y-1">
            {visible.map((entry) => {
              const Icon = entry.icon
              return (
                <li key={entry.to}>
                  <NavLink
                    to={entry.to}
                    end={entry.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                        isActive
                          ? 'bg-brand/12 font-medium text-brand-ink'
                          : 'text-text-secondary hover:bg-background-warm hover:text-text-primary'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    {entry.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/12 text-[12px] font-semibold text-brand-ink">
              {(user?.fullName ?? '?')
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] text-text-primary">{user?.fullName}</span>
              <span className="block truncate text-[11px] text-text-secondary">{user?.roleName}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-text-secondary transition-colors hover:bg-background-warm hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-background/92 px-5 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-warm hover:text-text-primary lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="text-[13px] font-medium text-text-secondary">{current?.label ?? 'Admin'}</span>

          <Link
            to="/"
            className="ml-auto hidden text-[12px] text-text-secondary transition-colors hover:text-brand-ink sm:block"
          >
            The Row Residential Hotel
          </Link>
        </header>

        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
