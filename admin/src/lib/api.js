const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'therow.admin.token'

const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)

/**
 * One explanation for "the API did not answer", written for wherever the panel is running.
 *
 * On a developer's machine that means the process is not started. On a deployed host it almost
 * always means no API has been pointed at yet — telling that user to check port 5080 sends them
 * looking for something that was never going to be there.
 */
export function apiUnreachableMessage() {
  if (isLocal) {
    return 'Cannot reach the API. Check that TheRow.API is running on http://localhost:5080.'
  }

  if (!BASE) {
    return (
      'This deployment has no API configured, so the admin panel cannot sign in or load data. ' +
      'Host TheRow.API, then set VITE_API_BASE_URL on the site and redeploy.'
    )
  }

  return (
    `Cannot reach the API at ${BASE}. It may be down, or this site's address may be missing from ` +
    'its allowed CORS origins.'
  )
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Fires when the API rejects our token, so AuthContext can drop the session. */
const unauthorizedListeners = new Set()
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

async function request(path, { method = 'GET', body, formData, signal } = {}) {
  const token = tokenStore.get()
  const headers = {}

  if (token) headers.Authorization = `Bearer ${token}`
  // Let the browser set the multipart boundary itself — never override it.
  if (body && !formData) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: formData ?? (body ? JSON.stringify(body) : undefined),
    signal,
  })

  if (response.status === 401) {
    tokenStore.clear()
    unauthorizedListeners.forEach((listener) => listener())
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) throw new ApiError(payload?.message ?? `Request failed (${response.status})`, response.status)
  return payload
}

const qs = (params) => {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const string = search.toString()
  return string ? `?${string}` : ''
}

export const api = {
  // ---- auth ----
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),

  // ---- dashboard & reports ----
  dashboard: () => request('/api/reports/dashboard'),
  reports: (from, to) => request(`/api/reports${qs({ from, to })}`),

  // ---- bookings ----
  bookings: (filter) => request(`/api/bookings${qs(filter)}`),
  booking: (id) => request(`/api/bookings/${id}`),
  createBooking: (body) => request('/api/bookings', { method: 'POST', body }),
  updateBookingStatus: (id, status, reason) =>
    request(`/api/bookings/${id}/status`, { method: 'PUT', body: { status, reason } }),
  assignRoom: (id, roomId) => request(`/api/bookings/${id}/room`, { method: 'PUT', body: { roomId } }),
  recordPayment: (id, body) => request(`/api/bookings/${id}/payments`, { method: 'POST', body }),

  // ---- inventory ----
  roomTypes: () => request('/api/room-types'),
  createRoomType: (body) => request('/api/room-types', { method: 'POST', body }),
  updateRoomType: (id, body) => request(`/api/room-types/${id}`, { method: 'PUT', body }),
  deleteRoomType: (id) => request(`/api/room-types/${id}`, { method: 'DELETE' }),

  rooms: (filter) => request(`/api/rooms${qs(filter)}`),
  assignableRooms: (bookingId) => request(`/api/rooms/assignable${qs({ bookingId })}`),
  createRoom: (body) => request('/api/rooms', { method: 'POST', body }),
  updateRoom: (id, body) => request(`/api/rooms/${id}`, { method: 'PUT', body }),
  deleteRoom: (id) => request(`/api/rooms/${id}`, { method: 'DELETE' }),

  amenities: () => request('/api/amenities'),
  createAmenity: (body) => request('/api/amenities', { method: 'POST', body }),
  updateAmenity: (id, body) => request(`/api/amenities/${id}`, { method: 'PUT', body }),
  deleteAmenity: (id) => request(`/api/amenities/${id}`, { method: 'DELETE' }),

  // ---- CMS ----
  heroSlides: () => request('/api/content/hero-slides'),
  createHeroSlide: (body) => request('/api/content/hero-slides', { method: 'POST', body }),
  updateHeroSlide: (id, body) => request(`/api/content/hero-slides/${id}`, { method: 'PUT', body }),
  deleteHeroSlide: (id) => request(`/api/content/hero-slides/${id}`, { method: 'DELETE' }),

  testimonials: () => request('/api/content/testimonials'),
  createTestimonial: (body) => request('/api/content/testimonials', { method: 'POST', body }),
  updateTestimonial: (id, body) => request(`/api/content/testimonials/${id}`, { method: 'PUT', body }),
  deleteTestimonial: (id) => request(`/api/content/testimonials/${id}`, { method: 'DELETE' }),

  blocks: (pageKey) => request(`/api/content/blocks${qs({ pageKey })}`),
  saveBlock: (body) => request('/api/content/blocks', { method: 'PUT', body }),

  settings: () => request('/api/content/settings'),
  saveSettings: (body) => request('/api/content/settings', { method: 'PUT', body }),

  messages: () => request('/api/content/messages'),
  markMessageRead: (id) => request(`/api/content/messages/${id}/read`, { method: 'PUT' }),
  deleteMessage: (id) => request(`/api/content/messages/${id}`, { method: 'DELETE' }),

  // ---- media ----
  media: (folder) => request(`/api/media${qs({ folder })}`),
  mediaFolders: () => request('/api/media/folders'),
  uploadMedia: (files, folder) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    form.append('folder', folder)
    return request('/api/media/upload', { method: 'POST', formData: form })
  },
  updateMedia: (id, altText) => request(`/api/media/${id}`, { method: 'PUT', body: { id, altText } }),
  deleteMedia: (id) => request(`/api/media/${id}`, { method: 'DELETE' }),

  // ---- users & roles ----
  users: () => request('/api/users'),
  createUser: (body) => request('/api/users', { method: 'POST', body }),
  updateUser: (id, body) => request(`/api/users/${id}`, { method: 'PUT', body }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  roles: () => request('/api/roles'),
  permissions: () => request('/api/roles/permissions'),
  createRole: (body) => request('/api/roles', { method: 'POST', body }),
  updateRole: (id, body) => request(`/api/roles/${id}`, { method: 'PUT', body }),
  deleteRole: (id) => request(`/api/roles/${id}`, { method: 'DELETE' }),
}

export { ApiError }
