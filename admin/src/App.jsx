import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import { Spinner } from './components/ui'
import { useAuth } from './context/AuthContext'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Bookings = lazy(() => import('./pages/Bookings'))
const RoomTypes = lazy(() => import('./pages/RoomTypes'))
const Rooms = lazy(() => import('./pages/Rooms'))
const Amenities = lazy(() => import('./pages/Amenities'))
const Content = lazy(() => import('./pages/Content'))
const Media = lazy(() => import('./pages/Media'))
const Reports = lazy(() => import('./pages/Reports'))
const UsersPage = lazy(() => import('./pages/Users'))
const SettingsPage = lazy(() => import('./pages/Settings'))

/** Blocks a route when the signed-in role lacks the permission, rather than 404ing. */
function Guard({ permission, children }) {
  const { can } = useAuth()

  if (permission && !can(permission)) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-2xl text-cream-50">Not permitted</p>
        <p className="mt-2 text-[13px] text-cream-100/50">
          Your role does not include access to this section. Ask an administrator if you need it.
        </p>
      </div>
    )
  }

  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Restoring session" />
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Guard permission="dashboard.view"><Dashboard /></Guard>} />
          <Route path="bookings" element={<Guard permission="bookings.view"><Bookings /></Guard>} />
          <Route path="room-types" element={<Guard permission="rooms.view"><RoomTypes /></Guard>} />
          <Route path="rooms" element={<Guard permission="rooms.view"><Rooms /></Guard>} />
          <Route path="amenities" element={<Guard permission="rooms.view"><Amenities /></Guard>} />
          <Route path="content" element={<Guard permission="content.view"><Content /></Guard>} />
          <Route path="media" element={<Guard permission="media.view"><Media /></Guard>} />
          <Route path="reports" element={<Guard permission="reports.view"><Reports /></Guard>} />
          <Route path="users" element={<Guard permission="users.view"><UsersPage /></Guard>} />
          <Route path="settings" element={<Guard permission="content.view"><SettingsPage /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
