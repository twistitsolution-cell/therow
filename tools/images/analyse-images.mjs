import sharp from 'sharp'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

const SRC = 'C:/Twist/Development/therowresidentialhotelandappartment/booking.com phto'

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))

const rows = []
for (const file of files) {
  const full = path.join(SRC, file)
  try {
    const image = sharp(full)
    const meta = await image.metadata()
    const stats = await image.stats()

    const [r, g, b] = stats.channels
    // Perceptual brightness on 0–255, and stddev as a proxy for tonal range/contrast.
    const brightness = 0.2126 * r.mean + 0.7152 * g.mean + 0.0722 * b.mean
    const contrast = (r.stdev + g.stdev + b.stdev) / 3

    // Rough saturation: mean spread between channels.
    const saturation = (Math.abs(r.mean - g.mean) + Math.abs(g.mean - b.mean) + Math.abs(r.mean - b.mean)) / 3

    rows.push({
      file,
      w: meta.width,
      h: meta.height,
      px: meta.width * meta.height,
      brightness: +brightness.toFixed(1),
      contrast: +contrast.toFixed(1),
      saturation: +saturation.toFixed(1),
      isSharp: stats.entropy ? +stats.entropy.toFixed(2) : null,
    })
  } catch (err) {
    rows.push({ file, error: err.message })
  }
}

rows.sort((a, b) => (b.px ?? 0) - (a.px ?? 0))

const verdict = (r) => {
  const bad = []
  if (r.w < 900) bad.push('LOW-RES')
  if (r.brightness > 195) bad.push('OVEREXPOSED')
  if (r.brightness < 70) bad.push('TOO-DARK')
  if (r.contrast < 30) bad.push('FLAT')
  if (r.isSharp !== null && r.isSharp < 6.6) bad.push('LOW-DETAIL')
  return bad.length ? bad.join(',') : 'ok'
}

console.log('file'.padEnd(26), 'size'.padEnd(11), 'bright'.padEnd(7), 'contr'.padEnd(6), 'sat'.padEnd(5), 'entropy'.padEnd(8), 'verdict')
for (const r of rows) {
  if (r.error) { console.log(r.file.padEnd(26), 'ERROR', r.error); continue }
  console.log(
    r.file.padEnd(26),
    `${r.w}x${r.h}`.padEnd(11),
    String(r.brightness).padEnd(7),
    String(r.contrast).padEnd(6),
    String(r.saturation).padEnd(5),
    String(r.isSharp).padEnd(8),
    verdict(r),
  )
}
