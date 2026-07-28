import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/rooms/standard-2.webp" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-background/86" />
      </div>

      <div className="container-luxe relative text-center">
        <span className="eyebrow mb-5 block">Error 404</span>
        <p className="font-display text-7xl text-brand sm:text-8xl">404</p>
        <h1 className="heading-display mt-4 text-balance text-3xl sm:text-4xl">This page has checked out</h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-text-secondary">
          The page you were looking for is not here. Let us take you back to somewhere more comfortable.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-gold">
            Back to home
          </Link>
          <Link to="/rooms" className="btn-outline">
            Browse rooms
          </Link>
        </div>
      </div>
    </section>
  )
}
