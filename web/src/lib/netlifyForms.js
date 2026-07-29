/**
 * Netlify Forms fallback.
 *
 * When the .NET API is unreachable — which is the normal state of a frontend-only Netlify
 * deploy — a booking or contact submission would otherwise hit the SPA redirect, get HTML back
 * and fail. The guest sees an error and the hotel receives nothing at all.
 *
 * These helpers post to Netlify's built-in form handler instead, so the enquiry is captured in
 * the Netlify dashboard and emailed to the property. It is a lead, not a confirmed reservation,
 * and the UI is explicit about that difference.
 *
 * Netlify detects forms by parsing the DEPLOYED HTML at build time, so `index.html` carries a
 * hidden copy of each form with matching field names. Renaming a field here without renaming it
 * there silently drops that value.
 */

const encode = (data) =>
  Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

async function submit(formName, fields) {
  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encode({ 'form-name': formName, ...fields }),
  })

  // Netlify answers 200 on success; a 404 means form detection did not pick this form up at
  // build time, which is a deploy problem rather than something the guest can retry past.
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? `Netlify did not register the "${formName}" form. Check the hidden copy in index.html and redeploy.`
        : `Enquiry could not be sent (${response.status}).`,
    )
  }
}

export const netlifyForms = {
  /** Captures a stay request when live availability is unavailable. */
  bookingEnquiry: (data) =>
    submit('booking-enquiry', {
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      phone: data.phone,
      country: data.country,
      'room-type': data.roomTypeName ?? 'Not specified',
      'check-in': data.checkIn,
      'check-out': data.checkOut,
      nights: data.nights,
      adults: data.adults,
      children: data.children,
      'payment-preference': data.payment,
      requests: data.requests,
    }),

  contact: (data) =>
    submit('contact', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
    }),
}

/** True when the failure means "no API here", as opposed to a real validation error from one. */
export const isApiUnreachable = (error) => error?.status === undefined
