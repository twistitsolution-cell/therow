import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Chart tokens, validated against the light chart surface #FAF7F3.
 *
 * GOLD is the single-series mark. The brand golds (#C6A96B / #B08D57) sit at 2.1–2.9:1 on this
 * surface and #7E5F2C reads grey, so the mark is a saturated dark gold that clears the lightness
 * band, the chroma floor and 3:1 contrast.
 *
 * CATEGORICAL is the fixed slot order for identity encoding — assigned by position, never
 * cycled, never reordered by rank. It passes the lightness band, chroma floor, CVD separation
 * and the normal-vision floor. Four slots sit under 3:1 against this surface, so the relief rule
 * applies: every categorical bar carries a visible direct label (see HorizontalBars).
 */
const GOLD = '#96700F'
const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']

const GRID = 'rgba(46,46,46,0.08)'
const BASELINE = 'rgba(46,46,46,0.20)'
const MUTED = '#676767'
const SURFACE = '#FAF7F3'

export const categoricalColor = (index) => CATEGORICAL[index % CATEGORICAL.length]

/** Tracks the container width so the SVG can be drawn in real pixels — no stroke distortion. */
function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    setWidth(element.getBoundingClientRect().width)

    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

/** Rounds a max up to a clean tick value so the axis reads in round numbers. */
function niceMax(value) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalised = value / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
}

function Tooltip({ x, y, children, width }) {
  // Flip the tooltip to the left of the cursor when it would overflow the plot.
  const flip = x > width - 130
  return (
    <div
      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-line-strong bg-background/95 px-3 py-2 text-[11px] shadow-luxury backdrop-blur-sm"
      style={{ left: flip ? x - 12 : x + 12, top: y, transform: `translate(${flip ? '-100%' : '0'}, -50%)` }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vertical bars — magnitude over discrete periods. Single series.      */
/* ------------------------------------------------------------------ */

export function BarChart({ data, format = (v) => v, height = 240, label = 'Value' }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)

  const padding = { top: 16, right: 12, bottom: 30, left: 56 }
  const plotW = Math.max(0, width - padding.left - padding.right)
  const plotH = height - padding.top - padding.bottom

  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)

  // 2px surface gap between adjacent bars, and a sane cap so few bars do not become slabs.
  const slot = data.length ? plotW / data.length : 0
  const barW = Math.max(2, Math.min(slot - 2, 46))

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${label} by period`}>
          {ticks.map((tick) => {
            const y = padding.top + plotH - (tick / max) * plotH
            return (
              <g key={tick}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fill={MUTED} fontSize={10}>
                  {format(tick, true)}
                </text>
              </g>
            )
          })}

          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + plotH}
            y2={padding.top + plotH}
            stroke={BASELINE}
            strokeWidth={1}
          />

          {data.map((point, index) => {
            const barH = max > 0 ? (point.value / max) * plotH : 0
            const x = padding.left + index * slot + (slot - barW) / 2
            const y = padding.top + plotH - barH
            const active = hover === index

            return (
              <g key={point.label}>
                {/* Hit target spans the full slot so thin bars stay easy to hover. */}
                <rect
                  x={padding.left + index * slot}
                  y={padding.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(index)}
                  onMouseLeave={() => setHover(null)}
                />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(barH, point.value > 0 ? 2 : 0)}
                  rx={4}
                  fill={GOLD}
                  opacity={hover === null || active ? 1 : 0.45}
                  className="pointer-events-none transition-opacity"
                />
                {/* Only label every other tick when the axis is crowded. */}
                {(data.length <= 8 || index % 2 === 0) && (
                  <text
                    x={padding.left + index * slot + slot / 2}
                    y={height - 10}
                    textAnchor="middle"
                    fill={MUTED}
                    fontSize={10}
                  >
                    {point.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <Tooltip
          width={width}
          x={padding.left + hover * slot + slot / 2}
          y={padding.top + plotH - (max > 0 ? (data[hover].value / max) * plotH : 0)}
        >
          <span className="block font-medium text-text-primary">{data[hover].label}</span>
          <span className="mt-0.5 block text-text-secondary">
            {label}: <span className="text-brand-ink">{format(data[hover].value)}</span>
          </span>
          {data[hover].meta && <span className="mt-0.5 block text-text-secondary">{data[hover].meta}</span>}
        </Tooltip>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Line — a continuous measure over time. Single series, 2px stroke.    */
/* ------------------------------------------------------------------ */

export function LineChart({ data, format = (v) => v, height = 240, label = 'Value', maxOverride }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)

  const padding = { top: 16, right: 14, bottom: 30, left: 56 }
  const plotW = Math.max(0, width - padding.left - padding.right)
  const plotH = height - padding.top - padding.bottom

  const max = maxOverride ?? niceMax(Math.max(...data.map((d) => d.value), 0))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)

  const pointX = (index) => padding.left + (data.length <= 1 ? plotW / 2 : (index / (data.length - 1)) * plotW)
  const pointY = (value) => padding.top + plotH - (max > 0 ? (value / max) * plotH : 0)

  const linePath = data.map((point, index) => `${index === 0 ? 'M' : 'L'} ${pointX(index)} ${pointY(point.value)}`).join(' ')
  const areaPath = data.length
    ? `${linePath} L ${pointX(data.length - 1)} ${padding.top + plotH} L ${pointX(0)} ${padding.top + plotH} Z`
    : ''

  const onMove = (event) => {
    if (!data.length || plotW <= 0) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - bounds.left - padding.left) / plotW
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1)))))
  }

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label} over time`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.24" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => {
            const y = pointY(tick)
            return (
              <g key={tick}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fill={MUTED} fontSize={10}>
                  {format(tick, true)}
                </text>
              </g>
            )
          })}

          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + plotH}
            y2={padding.top + plotH}
            stroke={BASELINE}
            strokeWidth={1}
          />

          {areaPath && <path d={areaPath} fill="url(#line-fill)" />}
          <path d={linePath} fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {hover !== null && data[hover] && (
            <g className="pointer-events-none">
              <line
                x1={pointX(hover)}
                x2={pointX(hover)}
                y1={padding.top}
                y2={padding.top + plotH}
                stroke={BASELINE}
                strokeWidth={1}
              />
              {/* 2px surface ring keeps the marker legible where it overlaps the line. */}
              <circle cx={pointX(hover)} cy={pointY(data[hover].value)} r={5} fill={GOLD} stroke={SURFACE} strokeWidth={2} />
            </g>
          )}

          {data.map((point, index) => {
            const step = Math.max(1, Math.ceil(data.length / 7))
            if (index % step !== 0) return null
            return (
              <text key={point.label} x={pointX(index)} y={height - 10} textAnchor="middle" fill={MUTED} fontSize={10}>
                {point.label}
              </text>
            )
          })}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <Tooltip width={width} x={pointX(hover)} y={pointY(data[hover].value)}>
          <span className="block font-medium text-text-primary">{data[hover].label}</span>
          <span className="mt-0.5 block text-text-secondary">
            {label}: <span className="text-brand-ink">{format(data[hover].value)}</span>
          </span>
          {data[hover].meta && <span className="mt-0.5 block text-text-secondary">{data[hover].meta}</span>}
        </Tooltip>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Horizontal bars — ranked magnitude, or identity when `categorical`.  */
/* ------------------------------------------------------------------ */

export function HorizontalBars({ data, format = (v) => v, categorical = false }) {
  const max = Math.max(...data.map((d) => d.value), 0)

  return (
    <ul className="space-y-4">
      {data.map((point, index) => {
        const color = categorical ? categoricalColor(index) : GOLD
        const pct = max > 0 ? (point.value / max) * 100 : 0

        return (
          <li key={point.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                {categorical && (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                )}
                <span className="truncate text-[13px] text-text-secondary">{point.label}</span>
              </span>
              {/* Direct label on every row — identity and value never rely on colour alone. */}
              <span className="shrink-0 text-[13px] font-medium tabular-nums text-text-primary">{format(point.value)}</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-background-deep">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.max(pct, point.value > 0 ? 1.5 : 0)}%`, backgroundColor: color }}
              />
            </div>

            {point.meta && <p className="mt-1 text-[11px] text-text-secondary">{point.meta}</p>}
          </li>
        )
      })}
    </ul>
  )
}

/** Small helper so pages can render a legend consistent with the categorical slots. */
export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((item, index) => (
        <li key={item} className="flex items-center gap-2 text-[11px] text-text-secondary">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: categoricalColor(index) }}
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  )
}
