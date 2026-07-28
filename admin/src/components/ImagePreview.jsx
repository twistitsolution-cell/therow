import { useEffect, useState } from 'react'
import { AlertCircle, ImageOff, Loader2 } from 'lucide-react'

/**
 * Live preview for an image URL typed or pasted into a form.
 *
 * Editors were previously publishing a path and only discovering it was wrong once the public
 * site rendered a broken tile. This resolves the URL as it is typed and reports the real state:
 * loading, the actual pixel dimensions, or a clear failure.
 */
export default function ImagePreview({ url, label = 'Preview', aspect = 'aspect-[16/10]' }) {
  const [state, setState] = useState('idle')
  const [dimensions, setDimensions] = useState(null)

  useEffect(() => {
    const trimmed = (url ?? '').trim()
    if (!trimmed) {
      setState('idle')
      setDimensions(null)
      return
    }

    setState('loading')
    setDimensions(null)

    const image = new Image()
    let cancelled = false

    image.onload = () => {
      if (cancelled) return
      setDimensions({ w: image.naturalWidth, h: image.naturalHeight })
      setState('ok')
    }
    image.onerror = () => {
      if (!cancelled) setState('error')
    }
    image.src = trimmed

    return () => {
      cancelled = true
    }
  }, [url])

  if (state === 'idle') return null

  // Flag anything too small to survive a full-width layout.
  const tooSmall = dimensions && dimensions.w < 900

  return (
    <div className="mt-2">
      <span className="mb-1.5 block text-[11px] font-medium text-text-secondary">{label}</span>

      <div className={`relative overflow-hidden rounded-xl border border-line bg-background-warm ${aspect}`}>
        {state === 'loading' && (
          <span className="absolute inset-0 grid place-items-center text-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        )}

        {state === 'error' && (
          <span className="absolute inset-0 grid place-content-center justify-items-center gap-2 px-4 text-center">
            <ImageOff className="h-6 w-6 text-state-danger" strokeWidth={1.5} />
            <span className="text-[12px] text-state-danger">That URL did not load</span>
            <span className="text-[11px] text-text-secondary">
              Check the path, or upload the file in Media and copy its URL.
            </span>
          </span>
        )}

        {state === 'ok' && <img src={url.trim()} alt="" className="h-full w-full object-cover" />}
      </div>

      {state === 'ok' && dimensions && (
        <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${tooSmall ? 'text-state-warning' : 'text-text-secondary'}`}>
          {tooSmall && <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
          {dimensions.w} × {dimensions.h}px
          {tooSmall && ' — below 900px wide, this will look soft on a large screen'}
        </p>
      )}
    </div>
  )
}
