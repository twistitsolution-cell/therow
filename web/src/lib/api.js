const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(payload?.message ?? `Request failed (${response.status})`, response.status)
  }

  return payload
}

export const api = {
  /** Hydrates the whole site: slides, copy, rooms, amenities and settings. */
  site: (signal) => request('/api/public/site', { signal }),

  roomType: (slug, signal) => request(`/api/public/room-types/${encodeURIComponent(slug)}`, { signal }),

  availability: ({ checkIn, checkOut, adults = 1, children = 0, roomTypeId }, signal) => {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    })
    if (roomTypeId) params.set('roomTypeId', String(roomTypeId))
    return request(`/api/public/availability?${params}`, { signal })
  },

  createBooking: (payload) => request('/api/public/bookings', { method: 'POST', body: payload }),

  lookupBooking: (reference, signal) =>
    request(`/api/public/bookings/${encodeURIComponent(reference)}`, { signal }),

  sendContactMessage: (payload) => request('/api/public/contact', { method: 'POST', body: payload }),
}

export { ApiError }
