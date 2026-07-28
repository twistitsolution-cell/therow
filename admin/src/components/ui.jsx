import { useEffect } from 'react'
import { AlertCircle, Check, Inbox, Loader2, X } from 'lucide-react'

/** Status pill. Tone maps to the fixed status roles, never to a chart series colour. */
const TONES = {
  neutral: 'border-line-strong text-text-secondary',
  good: 'border-state-success/40 bg-state-success-soft text-state-success',
  warning: 'border-state-warning/40 bg-state-warning-soft text-state-warning',
  serious: 'border-state-warning/40 bg-state-warning-soft text-state-warning',
  critical: 'border-state-danger/40 bg-state-danger-soft text-state-danger',
  gold: 'border-brand-bronze/55 bg-brand/12 text-brand-ink',
}

export function Badge({ tone = 'neutral', children, icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${TONES[tone] ?? TONES.neutral}`}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={2} />}
      {children}
    </span>
  )
}

export function PageTitle({ title, subtitle, actions }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13px] text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-[13px]">{label}…</span>
    </div>
  )
}

export function EmptyState({ title, message, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-line text-text-secondary">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="mt-5 font-display text-xl text-text-primary">{title}</p>
      {message && <p className="mt-2 max-w-sm text-[13px] text-text-secondary">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Alert({ tone = 'critical', children, onDismiss }) {
  if (!children) return null

  const Icon = tone === 'good' ? Check : AlertCircle
  const styles =
    tone === 'good'
      ? 'border-state-success/40 bg-state-success-soft text-state-success'
      : 'border-state-danger/40 bg-state-danger-soft text-state-danger'

  return (
    <div className={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-[13px] ${styles}`} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function Modal({ open, title, description, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-text-primary/45 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`card my-auto w-full ${widths[size]} shadow-luxury`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="font-display text-2xl text-text-primary">{title}</h2>
            {description && <p className="mt-1 text-[12px] text-text-secondary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-background-warm hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Thin wrapper that keeps every table in the panel scrolling horizontally inside its own
 * container rather than pushing the page sideways.
 */
export function TableShell({ children }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">{children}</table>
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose, busy }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-text-secondary">{message}</p>
    </Modal>
  )
}
