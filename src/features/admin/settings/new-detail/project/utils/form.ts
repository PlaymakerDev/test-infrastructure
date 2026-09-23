// Field helpers shared by the project-detail forms (ประเภทงาน and อุปกรณ์
// CCTV). Lifted out of FormCreateDevice when FormCreateCamera needed the same
// lat/lng + IP handling — copying them would have let the two drift.

/** Narrower than the solution endpoints' GeometryPoint (whose `type` is a
 *  plain string): the camera endpoints pin it to the literal 'Point'.
 *  Returning the narrow shape satisfies both, so one helper serves the
 *  ประเภทงาน form and the CCTV camera form. */
type GeoJSONPoint = { type: 'Point'; coordinates: [number, number] }

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  FormCreateITSUser's own helper. */
export const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const withResponse = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return (
      withResponse.response?.data?.message ??
      withResponse.message ??
      fallback
    )
  }
  return fallback
}

/** Latitude/longitude are entered as plain decimals (Thailand's coordinates
 *  are always positive) — strip anything that isn't a digit or dot, and
 *  collapse a second/third dot instead of leaving e.g. "12.34.56". */
export const sanitizeLatLng = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const [head, ...rest] = cleaned.split('.')
  return rest.length ? `${head}.${rest.join('')}` : head
}

/** Digits, optionally followed by a single "." and more digits — rejects a
 *  bare "." or "12." left over from mid-typing, still allowed while the
 *  field isn't submitted yet. */
export const LAT_LNG_PATTERN = /^\d+(\.\d+)?$/

/** IPv4 (used for both Local IP and the ZeroTier IP) — allow digits and
 *  dots while typing (unlike lat/lng, multiple dots are valid here, so no
 *  collapsing to a single one). */
export const sanitizeIP = (value: string) => value.replace(/[^0-9.]/g, '')

/** Strict IPv4: four 0–255 octets separated by dots. */
export const IP_PATTERN = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/

/** Chainage (กม.): kilometre marker, "+", and a three-digit metre offset —
 *  "0+500", "18+465".
 *
 *  Deliberately stricter than the backend's reader (utils.ParseSta), which
 *  has to stay tolerant of the 180 legacy values carrying suffixes like
 *  "4+800 RT". New input is held to the clean form; editing one of those
 *  older rows surfaces this message and the value gets corrected. */
export const STA_PATTERN = /^\d+\+\d{3}$/

/** Digits and a single "+" — the same shape as sanitizeLatLng, so a second
 *  "+" folds into the metre part instead of producing "1+2+3". */
export const sanitizeSta = (value: string) => {
  const cleaned = value.replace(/[^0-9+]/g, '')
  const [head, ...rest] = cleaned.split('+')
  return rest.length ? `${head}+${rest.join('')}` : head
}

/** Shared message so both forms word it identically. */
export const STA_FORMAT_MESSAGE = 'รูปแบบ กม. ไม่ถูกต้อง (เช่น 0+500)'

/** Backend reads longitude FIRST and rejects WKT strings — GeoJSON only.
 *  Shared by every create and update body on this page. */
export const toGeometryPoint = (longitude: string, latitude: string): GeoJSONPoint => ({
  coordinates: [Number(longitude), Number(latitude)],
  type: 'Point',
})
