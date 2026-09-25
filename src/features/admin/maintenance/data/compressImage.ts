/** Client-side image compression for the maintenance uploads (2026-09-11
 *  redesign: up to 4 attachments per box, previewed in photo grids — a raw
 *  5–10 MB phone photo would make those grids crawl).
 *
 *  Images are downscaled to a max long edge and re-encoded as JPEG; anything
 *  that isn't a raster image (video, PDF, GIF) passes through untouched —
 *  browsers can't meaningfully recompress those. Failure of any step also
 *  falls back to the original file: compression is an optimization, never a
 *  gate. */

const MAX_EDGE = 1920
const JPEG_QUALITY = 0.8
// PNG screenshots stay PNG below this size (keeps text crisp); bigger ones
// are worth converting to JPEG despite the format change.
const COMPRESSIBLE = new Set(['image/jpeg', 'image/jpg', 'image/png'])
const SKIP_IF_SMALLER_THAN = 300 * 1024

export const compressImage = async (file: File): Promise<File> => {
  if (!COMPRESSIBLE.has(file.type) || file.size < SKIP_IF_SMALLER_THAN) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    // Only keep the result when it actually helped.
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.(png|jpe?g)$/i, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified })
  } catch {
    return file
  }
}
