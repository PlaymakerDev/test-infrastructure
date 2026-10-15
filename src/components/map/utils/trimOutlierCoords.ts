/** Great-circle distance in km between two [lng, lat] points. */
const distanceKm = ([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number => {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

const median = (values: number[]): number => {
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Never drop a point closer than this to the cluster's median — keeps a
 *  tight cluster (one ขทช., a few km wide) from shedding legit edge points. */
const MIN_RADIUS_KM = 100
/** A point counts as an outlier past this many median distances. Points spread
 *  evenly along a road sit within ~2× the median, so 5× leaves wide margin. */
const RADIUS_FACTOR = 5

/**
 * Drop coordinates that sit far away from where the rest of the set clusters.
 *
 * Some solutions carry a placeholder / mistyped `geometry_point` (cf. the
 * [1,1] batch noted in RegionSummaryLayer). One such point makes a bureau's
 * overall map frame the whole country instead of the bureau — 2026-10-16:
 * traffic-volume / incident-detection at dept_id=59 opened country-wide while
 * cctv on the same dept framed สทช.12.
 *
 * Distances are measured from the coordinate-wise median, which a minority of
 * bad points can't drag. A nationwide set (scope=all) has a large median
 * distance, so its threshold grows with it and nothing legit is dropped.
 * Fewer than 3 points can't tell signal from outlier → returned unchanged.
 */
export const trimOutlierCoords = (coords: [number, number][]): [number, number][] => {
  if (coords.length < 3) return coords

  const center: [number, number] = [median(coords.map((c) => c[0])), median(coords.map((c) => c[1]))]
  const dists = coords.map((c) => distanceKm(center, c))
  const radius = Math.max(MIN_RADIUS_KM, RADIUS_FACTOR * median(dists))

  const kept = coords.filter((_, i) => dists[i] <= radius)
  // Defensive — with the median as center at least half the set is kept, but
  // never hand an empty set back to a caller that expects something to frame.
  return kept.length > 0 ? kept : coords
}
