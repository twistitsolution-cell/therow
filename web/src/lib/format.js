/**
 * Rates are stored in ETB. USD is a display convenience derived from the exchange rate the
 * admin sets in Settings, so the two currencies can never drift apart in the database.
 */
export function convert(amountEtb, currency, etbPerUsd) {
  if (currency === 'USD') {
    const rate = Number(etbPerUsd) > 0 ? Number(etbPerUsd) : 1
    return amountEtb / rate
  }
  return amountEtb
}

export function formatMoney(amountEtb, currency = 'ETB', etbPerUsd = 1, { decimals } = {}) {
  const value = convert(Number(amountEtb) || 0, currency, etbPerUsd)

  // ETB amounts run to five figures, where decimals are noise; USD reads better with cents.
  const fractionDigits = decimals ?? (currency === 'USD' ? 0 : 0)

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)

  return currency === 'USD' ? `$${formatted}` : `ETB ${formatted}`
}

/** yyyy-MM-dd in local time. `toISOString` would shift the date for anyone east of UTC. */
export function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function addDays(date, days) {
  const d = new Date(date instanceof Date ? date.getTime() : new Date(date).getTime())
  d.setDate(d.getDate() + days)
  return d
}

export function nightsBetween(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  const diff = Math.round((end - start) / 86_400_000)
  return Number.isFinite(diff) && diff > 0 ? diff : 0
}

export function formatLongDate(value) {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function formatShortDate(value) {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date)
}
