/**
 * Special offers.
 *
 * Held here rather than in the CMS because each one needs a matching rate rule in the booking
 * engine to be honoured — publishing an offer the engine cannot price would be worse than not
 * publishing it. `roomSlug` links the card to a real category so the CTA lands on a bookable page.
 */
export const offers = [
  {
    id: 'long-stay',
    eyebrow: 'Stay 7 nights or more',
    title: 'Long-stay residence rate',
    body: 'Weekly and monthly rates on every apartment and suite, with daily housekeeping and laundry included from the seventh night.',
    discount: 'Up to 25% off',
    image: '/images/apartment/salon-2.webp',
    roomSlug: 'apartment',
    terms: 'Minimum 7 nights. Subject to availability.',
  },
  {
    id: 'early-arrival',
    eyebrow: 'Book 30 days ahead',
    title: 'Advance purchase',
    body: 'Reserve a month in advance and lock the rate, with free cancellation up to 72 hours before arrival.',
    discount: '15% off',
    image: '/images/rooms/junior-suite-1.webp',
    roomSlug: 'junior-suite',
    terms: 'Book 30+ days ahead. Free cancellation to 72 hours.',
  },
  {
    id: 'airport',
    eyebrow: 'Arriving late',
    title: 'Airport transfer included',
    body: 'Five minutes from Bole International. Book any Standard or Twin room direct and the transfer is on us, at any hour.',
    discount: 'Free transfer',
    image: '/images/rooms/twin-1.webp',
    roomSlug: 'twin-room',
    terms: 'Direct bookings only. One transfer per stay.',
  },
]
