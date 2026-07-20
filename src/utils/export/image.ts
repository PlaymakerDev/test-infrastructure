/** Fetch a remote image and normalize it for PDF embedding.
 *
 *  @react-pdf decodes only JPEG/PNG — cameras may serve WebP — so the image
 *  is re-encoded to JPEG through a canvas, downscaled to `maxWidth` to keep
 *  report size sane. Returns null on ANY failure (missing URL, CORS, decode)
 *  so callers can degrade to a photo-less layout instead of failing the
 *  whole export.
 */

export interface FetchedImage {
  dataUrl: string
  width: number
  height: number
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Cross-origin image hosts (wts.drr.go.th etc.) don't send CORS headers —
 *  <img> renders them but fetch() can't read the bytes. Route those through
 *  the app's own session-guarded proxy (same-origin). Same-origin/relative
 *  URLs skip the proxy. */
function fetchableUrl(url: string): string {
  try {
    const u = new URL(url, window.location.origin)
    if (u.origin === window.location.origin) return url
    return `${BASE_PATH}/api/export/image-proxy?url=${encodeURIComponent(u.toString())}`
  } catch {
    return url
  }
}

export async function fetchImageAsDataUrl(url: string, maxWidth = 640): Promise<FetchedImage | null> {
  if (!url) return null
  try {
    const res = await fetch(fetchableUrl(url))
    if (!res.ok) return null
    const blob = await res.blob()
    const bmp = await createImageBitmap(blob)
    const scale = Math.min(1, maxWidth / bmp.width)
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.82), width: w, height: h }
  } catch {
    return null
  }
}
