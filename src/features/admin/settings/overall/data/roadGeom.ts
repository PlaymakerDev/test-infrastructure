const inThailand = (lng: number, lat: number) =>
  lng >= 96 && lng <= 107 && lat >= 4 && lat <= 22

/** Usable [lng, lat] inside Thailand, or null. The PMMS payload doesn't promise
 *  an axis order, and Thai latitudes (5–21) can never be a Thai longitude
 *  (97–106), so a swapped [lat, lng] point is recognised and flipped back.
 *  Strict on purpose: Mapbox THROWS on a latitude outside ±90, and one stray
 *  point would stretch the framing to the whole country. Same rule as
 *  `toLngLat` in `lpr/detail/.../new-overall/ContentMap.tsx`. */
const toLngLat = (p: unknown): [number, number] | null => {
  if (!Array.isArray(p) || p.length < 2) return null
  const [a, b] = p
  if (typeof a !== 'number' || typeof b !== 'number') return null
  if (inThailand(a, b)) return [a, b]
  if (inThailand(b, a)) return [b, a]
  return null
}

/** `PMMSRoadData.geom` → the usable [lng, lat] points, in road order. Both the
 *  road-modal map and its Latitude/Longitude text read this, so they can't
 *  disagree about where the route starts and ends. */
export const toRouteCoords = (geom?: number[][] | null): [number, number][] =>
  (geom ?? []).map(toLngLat).filter((c): c is [number, number] => c !== null)
