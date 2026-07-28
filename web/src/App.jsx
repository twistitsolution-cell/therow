import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import StickyBookingBar from './components/StickyBookingBar'
import FloatingActions from './components/FloatingActions'
import Home from './pages/Home'

// Home ships in the main bundle because it is the landing page; the rest load on demand.
const About = lazy(() => import('./pages/About'))
const Rooms = lazy(() => import('./pages/Rooms'))
const RoomDetail = lazy(() => import('./pages/RoomDetail'))
const Booking = lazy(() => import('./pages/Booking'))
const Services = lazy(() => import('./pages/Services'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function RouteFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-gold-500/25 border-t-gold-500" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:slug" element={<RoomDetail />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <StickyBookingBar />
      <FloatingActions />
    </div>
  )
}
