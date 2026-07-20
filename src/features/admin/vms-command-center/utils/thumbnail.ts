// Convention-based thumbnail resolver for media uploaded via
// /api-v2/upload/vms. The backend saves a JPEG q85 sibling at
// `<basename>.thumb.jpg` alongside the original for every image upload
// (see drr_its_service/upload/internal/dto/upload/service.go). Grid /
// composer render thumbs so a 200-tile page doesn't pull 100+ MB of
// full-resolution PNGs.

// Extensions that have NO thumbnail representation. PDFs don't get a
// preview generated; return the original url unchanged so callers can
// render a fallback badge. Videos (.mp4/.webm/.mov) DO get a thumbnail
// now — backend ffmpeg-extracts frame at t=1s and writes .thumb.jpg —
// so they're intentionally NOT in this set.
const NON_THUMBNAILABLE_EXTS = new Set(['.pdf'])

export function getThumbUrl(url: string | null | undefined): string {
  if (!url) return ''
  const lower = url.toLowerCase()
  if (lower.endsWith('.thumb.jpg')) return url
  const lastDot = url.lastIndexOf('.')
  if (lastDot === -1) return url
  const ext = url.slice(lastDot).toLowerCase()
  if (NON_THUMBNAILABLE_EXTS.has(ext)) return url
  return url.slice(0, lastDot) + '.thumb.jpg'
}

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
}
