import sharp from 'sharp'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const SRC = 'C:/Twist/Development/therowresidentialhotelandappartment/booking.com phto'
// Verified frames from the property's Expedia listing at 2000x1333 — genuinely higher
// resolution than the local folder, so these are downscaled rather than upscaled.
const SRC_EXPEDIA = 'C:/Twist/Development/therowresidentialhotelandappartment/assets/expedia'
const SRC_RESTAURANT = 'C:/Twist/Development/therowresidentialhotelandappartment/booking.com phto/Lanovel'
const OUT = 'C:/Twist/Development/therowresidentialhotelandappartment/web/public/images'

/**
 * Curated manifest. Every entry was picked after measuring brightness, contrast, entropy and
 * resolution across the whole source folder.
 *
 * DELIBERATELY EXCLUDED:
 *   477799537.jpg  brightness 33, entropy 5.8 — the night signage reads as a black rectangle
 *   the building.jpg 141x101, apt room.jpg / Apt salon.jpg 243x174, 2023-08-16.jpg / booking.jpg
 *                  243x304 — far below anything usable on screen
 *   480438230.jpg  512x768 — superseded by 4324.webp, which is the same subject at 674x1020
 *   1343.webp      contrast 22, entropy 5.9 — flat and detail-free
 *   r66.webp       brightness 52 — underexposed
 *   bbb.webp / bathroom.webp  680x453 duplicates of better 1024px frames
 *   every "(1)" file — byte-identical duplicates
 */
const MANIFEST = [
  // ---- Expedia originals: 2000px wide, the only true-resolution heroes we have ----------
  { src: 'entrance-dusk.jpg', from: 'expedia', out: 'hero/entrance.webp', w: 1800, role: 'hero' },
  { src: 'king-room.jpg', from: 'expedia', out: 'hero/king-suite.webp', w: 1800, role: 'hero' },
  { src: 'suite-salon.jpg', from: 'expedia', out: 'hero/salon.webp', w: 1800, role: 'hero' },
  { src: 'entrance-dusk.jpg', from: 'expedia', out: 'feature/entrance.webp', w: 1400, role: 'feature' },
  { src: 'king-room.jpg', from: 'expedia', out: 'rooms/king-hi.webp', w: 1400, role: 'room' },
  { src: 'suite-salon.jpg', from: 'expedia', out: 'apartment/salon-hi.webp', w: 1400, role: 'room' },

  // ---- hero: full-bleed, needs the widest output -------------------------
  { src: '477799555.jpg', out: 'hero/lobby.webp', w: 1600, role: 'hero' },
  { src: 'Apt salon (2).jpg', out: 'hero/apartment.webp', w: 1600, role: 'hero' },
  { src: 'Junior suit.jpg', out: 'hero/suite.webp', w: 1600, role: 'hero' },
  { src: '480434023.jpg', out: 'hero/king.webp', w: 1600, role: 'hero' },

  // ---- feature / page headers -------------------------------------------
  { src: '243.webp', out: 'feature/bathroom.webp', w: 1600, role: 'feature' }, // highest-res source
  { src: '477799478.jpg', out: 'feature/reception.webp', w: 1400, role: 'feature' },
  { src: '1324.webp', out: 'feature/lounge.webp', w: 1200, role: 'feature' },
  { src: 'r22.webp', out: 'feature/meeting.webp', w: 1200, role: 'feature' },
  { src: 'r4.webp', out: 'feature/corridor.webp', w: 1200, role: 'feature' },
  { src: 'r3.webp', out: 'feature/balcony.webp', w: 1200, role: 'feature' },
  { src: '4324.webp', out: 'feature/facade.webp', w: 900, role: 'feature' },
  { src: 'r7.webp', out: 'feature/facade-tall.webp', w: 900, role: 'feature' },

  // ---- La Nouvelle: the restaurant / boulangerie -------------------------
  // 800x500 sources, so they are capped at 1200 rather than pushed to hero width. All three
  // room shots are warmly lit and genuinely dark; they are lifted but not flattened, because
  // an evening boulangerie should still read as an evening boulangerie.
  { src: 'Restaurant3.jpg', from: 'restaurant', out: 'feature/restaurant.webp', w: 1200, role: 'feature' },
  { src: 'Restaurant4.jpg', from: 'restaurant', out: 'feature/restaurant-food.webp', w: 1200, role: 'room' },
  { src: 'Restaurant1.jpg', from: 'restaurant', out: 'gallery/restaurant-a.webp', w: 1000, role: 'room' },
  { src: 'Restaurant2.jpg', from: 'restaurant', out: 'gallery/restaurant-b.webp', w: 1000, role: 'room' },

  // ---- rooms: card carousels --------------------------------------------
  { src: 'standard.jpg', out: 'rooms/standard-1.webp', w: 1200, role: 'room' },
  { src: '480195126.jpg', out: 'rooms/standard-2.webp', w: 1200, role: 'room' },
  { src: '111.webp', out: 'rooms/standard-3.webp', w: 1100, role: 'room' },
  { src: '480195130.jpg', out: 'rooms/standard-4.webp', w: 1200, role: 'room' },

  { src: 'Twin Bed room.jpg', out: 'rooms/twin-1.webp', w: 1200, role: 'room' },
  { src: '480433076.jpg', out: 'rooms/twin-2.webp', w: 1200, role: 'room' },
  { src: '480433164.jpg', out: 'rooms/twin-3.webp', w: 1200, role: 'room' },
  { src: '480433122.jpg', out: 'rooms/twin-4.webp', w: 1200, role: 'room' },

  { src: '480195116.jpg', out: 'rooms/family-1.webp', w: 1200, role: 'room' },
  { src: '480195133.jpg', out: 'rooms/family-2.webp', w: 1200, role: 'room' },
  { src: 'r11.webp', out: 'rooms/family-3.webp', w: 1100, role: 'room' },

  { src: 'Junior suit.jpg', out: 'rooms/junior-suite-1.webp', w: 1200, role: 'room' },
  { src: 'juinor suit salon.jpg', out: 'rooms/junior-suite-2.webp', w: 1200, role: 'room' },
  { src: '480436993.jpg', out: 'rooms/junior-suite-3.webp', w: 1200, role: 'room' },
  { src: '480436905.jpg', out: 'rooms/junior-suite-4.webp', w: 1200, role: 'room' },
  { src: '480436936.jpg', out: 'rooms/junior-suite-5.webp', w: 1200, role: 'room' },

  { src: 'Apt salon (2).jpg', out: 'apartment/salon-1.webp', w: 1200, role: 'room' },
  { src: '480433963.jpg', out: 'apartment/salon-2.webp', w: 1200, role: 'room' },
  { src: '480437054.jpg', out: 'apartment/salon-3.webp', w: 1200, role: 'room' },
  { src: '480437081.jpg', out: 'apartment/kitchen-1.webp', w: 1200, role: 'room' },
  { src: 'apt kitchen.jpg', out: 'apartment/kitchen-2.webp', w: 1200, role: 'room' },
  { src: 'Apt Kitchen (2).jpg', out: 'apartment/kitchen-3.webp', w: 1200, role: 'room' },

  // ---- bathrooms ---------------------------------------------------------
  { src: '243.webp', out: 'bath/bath-1.webp', w: 1200, role: 'room' },
  { src: 'bathroom.jpg', out: 'bath/bath-2.webp', w: 1200, role: 'room' },
  { src: '477799524.jpg', out: 'bath/bath-3.webp', w: 1200, role: 'room' },

  // ---- gallery extras ----------------------------------------------------
  { src: '480195118.jpg', out: 'gallery/room-a.webp', w: 1100, role: 'room' },
  { src: '480195120.jpg', out: 'gallery/room-b.webp', w: 1100, role: 'room' },
  { src: '480436924.jpg', out: 'gallery/room-c.webp', w: 1100, role: 'room' },
  { src: 'r111.webp', out: 'gallery/room-d.webp', w: 1000, role: 'room' },
  { src: 'r1.webp', out: 'gallery/room-e.webp', w: 1000, role: 'room' },
  { src: 'r44.webp', out: 'gallery/room-f.webp', w: 1000, role: 'room' },
  { src: 'r55.webp', out: 'gallery/room-g.webp', w: 1000, role: 'room' },
  { src: 'r5.webp', out: 'gallery/kitchen-a.webp', w: 1000, role: 'room' },
]

/**
 * Corrective grade driven by the measured statistics of each frame rather than a blanket filter:
 * lift the underexposed, pull back the hot ones, restore tonal range where it is flat, and add a
 * light unsharp mask to recover the detail lost to upscaling.
 */
async function grade(pipeline, stats, role) {
  const [r, g, b] = stats.channels
  const brightness = 0.2126 * r.mean + 0.7152 * g.mean + 0.0722 * b.mean
  const contrast = (r.stdev + g.stdev + b.stdev) / 3

  // Exposure is driven by modulate(), NOT gamma(). sharp's gamma() converts *from* the given
  // encoding to 2.2, so any value below 2.2 darkens the frame — the opposite of what is wanted.
  //
  // Target band is roughly 115–165. Hero and feature frames sit under a dark overlay, so an
  // underexposed original would disappear entirely once the scrim is applied.
  const target = role === 'hero' || role === 'feature' ? 140 : 132
  let exposure = 1
  if (brightness < target) {
    exposure = Math.min(1.28, target / brightness) // never lift more than ~28%, which would flatten
  } else if (brightness > 172) {
    exposure = Math.max(0.9, 168 / brightness)
  }

  // Widen tonal range only where the frame is genuinely flat, and re-anchor the black point.
  if (contrast < 42) pipeline = pipeline.linear(1.12, -12)
  else if (contrast < 48) pipeline = pipeline.linear(1.07, -7)
  else if (contrast < 54) pipeline = pipeline.linear(1.03, -3)

  pipeline = pipeline.modulate({ saturation: 1.12, brightness: exposure })

  // Unsharp mask — modest, so upscaled frames do not show halos.
  pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 2.0 })

  return pipeline
}

// Windows can throw ENOTEMPTY here when a file handle is still settling, and a failed clean
// should never abort the build — the manifest is authoritative and overwrites in place.
try {
  await rm(path.join(OUT, 'feature'), { recursive: true, force: true, maxRetries: 3, retryDelay: 120 })
} catch (err) {
  console.warn(`could not clear feature/ (${err.code}) — continuing, files are overwritten in place`)
}
for (const dir of ['hero', 'feature', 'rooms', 'apartment', 'bath', 'gallery', 'brand']) {
  await mkdir(path.join(OUT, dir), { recursive: true })
}

let total = 0
let bytes = 0
for (const item of MANIFEST) {
  const roots = { expedia: SRC_EXPEDIA, restaurant: SRC_RESTAURANT }
  const from = path.join(roots[item.from] ?? SRC, item.src)
  const to = path.join(OUT, item.out)

  const base = sharp(from)
  const meta = await base.metadata()
  const stats = await base.stats()

  let pipeline = sharp(from).resize({
    width: item.w,
    withoutEnlargement: false,
    kernel: sharp.kernel.lanczos3,
    fit: 'inside',
  })

  pipeline = await grade(pipeline, stats, item.role)

  const info = await pipeline.webp({ quality: item.role === 'hero' ? 84 : 82, effort: 5 }).toFile(to)

  total += 1
  bytes += info.size
  console.log(
    `${item.out.padEnd(32)} ${String(meta.width).padStart(4)}px -> ${String(info.width).padStart(4)}px  ${(info.size / 1024).toFixed(0)}KB`,
  )
}

// The logo is a flat mark — resize only, no grade (a saturation boost would tint the wordmark).
const logo = await sharp(path.join(SRC, 'therow.jpeg'))
  .resize({ width: 256, kernel: sharp.kernel.lanczos3 })
  .webp({ quality: 90 })
  .toFile(path.join(OUT, 'brand/logo.webp'))
console.log(`brand/logo.webp                   447px ->  ${logo.width}px  ${(logo.size / 1024).toFixed(0)}KB`)

console.log(`\n${total + 1} images written, ${(bytes / 1024 / 1024).toFixed(2)} MB total`)
