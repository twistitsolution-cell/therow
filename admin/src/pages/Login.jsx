import { useState } from 'react'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (err) {
      setError(
        err.status === undefined
          ? 'Cannot reach the API. Check that TheRow.API is running on port 5080.'
          : err.message,
      )
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on small screens where it would just push the form down. */}
      <div className="relative hidden lg:block">
        <img src="/login-cover.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-text-primary/88 via-text-primary/45 to-text-primary/15" />

        <div className="relative flex h-full flex-col justify-end p-12">
          <span className="text-[11px] uppercase tracking-luxe text-brand-ink">Bole, Addis Ababa</span>
          <p className="mt-4 font-display text-4xl leading-tight text-text-primary">
            The Row Residential
            <br />
            Hotel &amp; Apartment
          </p>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-text-secondary">
            Reservations, inventory, content and reporting for forty-one rooms and apartments.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-9 flex items-center gap-3">
            <img src="/logo.jpg" alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-brand/50" />
            <span className="leading-none">
              <span className="block font-display text-2xl tracking-brand text-text-primary">THE ROW</span>
              <span className="mt-1 block text-[9px] uppercase tracking-luxe text-brand-ink">Admin Panel</span>
            </span>
          </div>

          <h1 className="font-display text-3xl text-text-primary">Sign in</h1>
          <p className="mt-2 text-[13px] text-text-secondary">Use the credentials issued by your administrator.</p>

          <form onSubmit={submit} className="mt-8">
            <Alert onDismiss={() => setError('')}>{error}</Alert>

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="field-label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    className="field !pl-10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="field !pl-10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-primary mt-7 w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-text-secondary">
            Authorised personnel only. Activity is logged.
          </p>
        </div>
      </div>
    </div>
  )
}
