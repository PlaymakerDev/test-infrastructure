// Convention-based thumbnail resolver for media uploaded via
// /api-v2/upload/vms. The backend saves a JPEG q85 sibling at
// `<basename>.thumb.jpg` alongside the original for every image upload
// (see drr_its_service/upload/internal/dto/upload/service.go). Grid /
// composer render thumbs so a 200-tile page doesn't pull 100+ MB of
// full-resolution PNGs.

// Video / PDF uploads have no thumb — the .mp4 and .pdf suffixes get
// short-circuited here so callers can pass any media URL without
// branching. Callers should still fall back to the original url `onError`
// in case an older upload predates the backfill.
const NON_IMAGE_EXTS = new Set(['.mp4', '.mov', '.webm', '.pdf'])

export function getThumbUrl(url: string | null | undefined): string {
  if (!url) return ''
  const lower = url.toLowerCase()
  if (lower.endsWith('.thumb.jpg')) return url
  const lastDot = url.lastIndexOf('.')
  if (lastDot === -1) return url
  const ext = url.slice(lastDot).toLowerCase()
  if (NON_IMAGE_EXTS.has(ext)) return url
  return url.slice(0, lastDot) + '.thumb.jpg'
}
