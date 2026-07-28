export function formatEtb(amount, { compact = false } = {}) {
  const value = Number(amount) || 0

  if (compact && Math.abs(value) >= 1000) {
    const formatted = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
    return `ETB ${formatted}`
  }

  return `ETB ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`
}

export function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0)
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(date, days) {
  const d = new Date(date instanceof Date ? date.getTime() : new Date(date).getTime())
  d.setDate(d.getDate() + days)
  return d
}

/** Splits "CheckedIn" into "Checked In" for display without a lookup table per enum. */
export function humanise(value) {
  if (!value) return ''
  return String(value).replace(/([a-z])([A-Z])/g, '$1 $2')
}
