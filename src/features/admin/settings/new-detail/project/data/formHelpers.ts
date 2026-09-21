import type { GeometryPoint } from '@/types/manage/solution-api'

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

/** Backend reads longitude FIRST and rejects WKT strings — GeoJSON only.
 *  Shared by the solution and camera create/update bodies. */
export const toGeometryPoint = (longitude: string, latitude: string): GeometryPoint => ({
  coordinates: [Number(longitude), Number(latitude)],
  type: 'Point',
})
