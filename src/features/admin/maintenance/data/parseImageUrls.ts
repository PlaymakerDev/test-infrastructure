/** before_image/after_image come back as a JSON-stringified array in a string
 *  field (or the literal text "null", or ""). Never a real array or null. */
export const parseImageUrls = (raw: string | null | undefined): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string' && u.length > 0) : []
  } catch {
    return []
  }
}
