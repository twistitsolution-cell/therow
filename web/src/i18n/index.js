/**
 * Minimal translation layer — no runtime dependency, no bundle cost.
 *
 * English is complete. Amharic covers navigation and the booking chrome so the switch is
 * genuinely usable today; any key missing from `am` falls back to `en` rather than rendering
 * a raw key. The Amharic strings below are a working first pass and should be reviewed by a
 * native speaker before the language is promoted in the header.
 */

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'am', label: 'አማርኛ', short: 'አማ' },
]

const en = {
  'nav.home': 'Home',
  'nav.about': 'About',
  'nav.rooms': 'Rooms & Apartments',
  // Short form for the desktop header, which runs out of room at 1024px with the full label.
  'nav.roomsShort': 'Rooms',
  'nav.services': 'Experiences',
  'nav.gallery': 'Gallery',
  'nav.contact': 'Contact',
  'nav.book': 'Book Now',

  'booking.checkIn': 'Check-in',
  'booking.checkOut': 'Check-out',
  'booking.adults': 'Adults',
  'booking.children': 'Children',
  'booking.guests': 'Guests',
  'booking.search': 'Check Availability',
  'booking.searching': 'Checking…',
  'booking.nights': 'nights',
  'booking.night': 'night',
  'booking.from': 'from',
  'booking.perNight': 'per night',
  'booking.available': 'available',
  'booking.soldOut': 'Fully booked',
  'booking.select': 'Select',
  'booking.selected': 'Selected',

  'common.viewDetails': 'View details',
  'common.readMore': 'Read more',
  'common.exploreAll': 'Explore all',
  'common.loading': 'Loading',
  'common.sqm': 'm²',
  'common.upTo': 'Up to',
  'common.callUs': 'Call us',
  'common.emailUs': 'Email us',
  'common.whatsapp': 'WhatsApp',
}

const am = {
  'nav.home': 'መነሻ',
  'nav.about': 'ስለ እኛ',
  'nav.rooms': 'ክፍሎችና አፓርታማዎች',
  'nav.roomsShort': 'ክፍሎች',
  'nav.services': 'አገልግሎቶች',
  'nav.gallery': 'ፎቶዎች',
  'nav.contact': 'አግኙን',
  'nav.book': 'አሁን ያስይዙ',

  'booking.checkIn': 'የመግቢያ ቀን',
  'booking.checkOut': 'የመውጫ ቀን',
  'booking.adults': 'አዋቂዎች',
  'booking.children': 'ልጆች',
  'booking.guests': 'እንግዶች',
  'booking.search': 'ክፍል ይፈልጉ',
  'booking.searching': 'በመፈለግ ላይ…',
  'booking.nights': 'ሌሊቶች',
  'booking.night': 'ሌሊት',
  'booking.available': 'ክፍት',
  'booking.select': 'ይምረጡ',

  'common.viewDetails': 'ዝርዝር ይመልከቱ',
  'common.callUs': 'ይደውሉልን',
  'common.emailUs': 'ኢሜይል ይላኩ',
}

const dictionaries = { en, am }

export function translate(language, key) {
  return dictionaries[language]?.[key] ?? en[key] ?? key
}
