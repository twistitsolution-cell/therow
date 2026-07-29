import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Loader2, Save } from 'lucide-react'
import { api, apiUnreachableMessage } from '../lib/api'
import { Alert, Modal, PageTitle, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'

/** Groups the flat key/value settings table into something readable. */
const GROUPS = [
  { prefix: 'site.', title: 'Property', hint: 'Names and taglines used across the website and emails.' },
  { prefix: 'contact.', title: 'Contact', hint: 'Shown in the header, footer, contact page and WhatsApp button.' },
  { prefix: 'booking.', title: 'Booking & tax', hint: 'Rates here feed directly into every quote the booking engine produces.' },
  { prefix: 'currency.', title: 'Currency', hint: 'ETB is the book currency. USD prices on the website are derived from this rate.' },
  { prefix: 'social.', title: 'Social', hint: 'Profile links.' },
]

export default function Settings() {
  const { can } = useAuth()
  const writable = can('settings.write')

  const [settings, setSettings] = useState([])
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await api.settings()
      setSettings(list)
      setDraft(Object.fromEntries(list.map((entry) => [entry.key, entry.value])))
    } catch (err) {
      setError(err.status === undefined ? apiUnreachableMessage() : err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await api.saveSettings(
        settings.map((entry) => ({ key: entry.key, value: draft[entry.key] ?? '', description: entry.description })),
      )
      setNotice('Settings saved. The website picks these up on its next load.')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading settings" />

  const grouped = GROUPS.map((group) => ({
    ...group,
    entries: settings.filter((entry) => entry.key.startsWith(group.prefix)),
  })).filter((group) => group.entries.length > 0)

  const ungrouped = settings.filter((entry) => !GROUPS.some((group) => entry.key.startsWith(group.prefix)))

  return (
    <>
      <PageTitle
        title="Settings"
        subtitle="Configuration the website and booking engine read at runtime"
        actions={
          <button type="button" className="btn-secondary" onClick={() => setPasswordOpen(true)}>
            <KeyRound className="h-4 w-4" />
            Change my password
          </button>
        }
      />

      <Alert onDismiss={() => setError('')}>{error}</Alert>
      <Alert tone="good" onDismiss={() => setNotice('')}>
        {notice}
      </Alert>

      <form onSubmit={save} className="space-y-4">
        {grouped.map((group) => (
          <section key={group.prefix} className="card p-6">
            <header className="mb-5">
              <h2 className="text-[13px] font-medium text-text-primary">{group.title}</h2>
              <p className="mt-0.5 text-[11px] text-text-secondary">{group.hint}</p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              {group.entries.map((entry) => (
                <div key={entry.key}>
                  <label htmlFor={entry.key} className="field-label">
                    {entry.key.split('.')[1].replace(/_/g, ' ')}
                  </label>
                  <input
                    id={entry.key}
                    className="field"
                    value={draft[entry.key] ?? ''}
                    disabled={!writable}
                    onChange={(event) => setDraft({ ...draft, [entry.key]: event.target.value })}
                  />
                  <p className="mt-1 text-[11px] text-text-secondary">{entry.description}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {ungrouped.length > 0 && (
          <section className="card p-6">
            <h2 className="mb-5 text-[13px] font-medium text-text-primary">Other</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {ungrouped.map((entry) => (
                <div key={entry.key}>
                  <label htmlFor={entry.key} className="field-label">
                    {entry.key}
                  </label>
                  <input
                    id={entry.key}
                    className="field"
                    value={draft[entry.key] ?? ''}
                    disabled={!writable}
                    onChange={(event) => setDraft({ ...draft, [entry.key]: event.target.value })}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {writable && (
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        )}
      </form>

      {passwordOpen && <PasswordDialog onClose={() => setPasswordOpen(false)} />}
    </>
  )
}

function PasswordDialog({ onClose }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (event) => {
    event.preventDefault()

    if (next !== confirm) {
      setError('The two new passwords do not match.')
      return
    }

    setBusy(true)
    setError('')

    try {
      await api.changePassword(current, next)
      setDone(true)
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
      size="sm"
      title="Change password"
      footer={
        done ? (
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="password-form" className="btn-primary" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Update
            </button>
          </>
        )
      }
    >
      <Alert onDismiss={() => setError('')}>{error}</Alert>

      {done ? (
        <p className="text-[13px] text-text-secondary">Your password has been updated.</p>
      ) : (
        <form id="password-form" onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="pw-current" className="field-label">
              Current password
            </label>
            <input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              className="field"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="pw-new" className="field-label">
              New password
            </label>
            <input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="field"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="field-label">
              Confirm new password
            </label>
            <input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="field"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </div>
        </form>
      )}
    </Modal>
  )
}
