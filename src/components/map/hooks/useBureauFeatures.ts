"use client"
import { useEffect, useState } from 'react'
import bboxOf from '@turf/bbox'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { loadGeoJsonOnce } from './geojsonCache'

/** One bureau polygon + precomputed centroid + bbox — matches the shape written
 *  by `tools/build_bureaus.mjs` into `public/data/th-bureaus.geojson`. */
export interface BureauFeature {
  stch: number
  name: string
  baseProvince: string
  /** Codes of the จังหวัด that were unioned to build this polygon. */
  provinces: string[]
  /** [lng, lat] — mid-point of the bureau, used to place the marker. */
  centroid: [number, number]
  /** [minX, minY, maxX, maxY] — pre-computed with @turf/bbox on load. */
  bbox: [number, number, number, number]
  /** Raw GeoJSON feature — kept as-is so the FE can hand it straight to
   *  Mapbox as a source and to `booleanPointInPolygon` for classification. */
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
}

// basePath ('/atlas' in prod, '' in dev). Static geojson files sit under
// public/data/, so the fetch URL must be prefixed just like other public
// assets — otherwise nginx's catch-all serves the login SPA back and the
// fetch returns HTML instead of JSON.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ''
const BUREAUS_URL = `${BASE_PATH}/data/th-bureaus.geojson`

let cache: BureauFeature[] | null = null
let inflight: Promise<BureauFeature[]> | null = null

async function loadOnce(): Promise<BureauFeature[]> {
  if (cache) return cache
  if (inflight) return inflight
  // Raw fetch + parse moved to the shared geojsonCache (one copy for
  // ThailandMaskLayer / BaseMap / this hook). This layer still memoises the
  // derived bbox shape below.
  const request = (async () => {
    try {
      const gj = await loadGeoJsonOnce<
        GeoJSON.FeatureCollection<
          GeoJSON.Polygon | GeoJSON.MultiPolygon,
          { stch: number; name: string; base_province: string; provinces: string[]; centroid: [number, number] }
        >
      >(BUREAUS_URL)
      const parsed: BureauFeature[] = gj.features.map((f) => ({
        stch: f.properties.stch,
        name: f.properties.name,
        baseProvince: f.properties.base_province,
        provinces: f.properties.provinces,
        centroid: f.properties.centroid,
        bbox: bboxOf(f) as [number, number, number, number],
        feature: f,
      }))
      cache = parsed
      return parsed
    } finally {
      // Cleared on failure too — the old version only cleared on success, so
      // one failed load stuck a rejected promise here for the session.
      inflight = null
    }
  })()
  inflight = request
  return request
}

// ── Shared point-in-bureau memo ─────────────────────────────────────────────
// ReactMap (dashboard) and RegionSummaryLayer (10 overall pages) ran identical
// copies of this test over the same ~13.4k devices — ~44ms of blocking work
// each, on every mount. The answer depends only on (polygons, stch, lng, lat)
// and the polygons load once per session, so memoising across components and
// mounts changes how OFTEN the test runs, never its result.

// Rebuilt when the feature set changes identity (in practice: once).
let indexedFor: BureauFeature[] | null = null
let byStch = new Map<number, BureauFeature>()
const containsCache = new Map<string, boolean | null>()
// Safety valve only — the real device set is ~13.4k coords, so this is never
// hit. Clearing costs a recompute, it can't change an answer.
const CONTAINS_CACHE_MAX = 50_000

/** Is [lng, lat] inside bureau `stch`?
 *  `null` = nothing to test against (not loaded, or no polygon for that stch);
 *  callers map it to their own default. `false` = outside. */
export function isPointInBureau(
  features: BureauFeature[] | null,
  stch: number,
  lng: number,
  lat: number,
): boolean | null {
  if (!features) return null

  if (indexedFor !== features) {
    // First entry per stch wins, matching the `find()` this replaced.
    const next = new Map<number, BureauFeature>()
    for (const f of features) if (!next.has(f.stch)) next.set(f.stch, f)
    byStch = next
    indexedFor = features
    containsCache.clear()
  }

  const key = `${stch}|${lng}|${lat}`
  const memo = containsCache.get(key)
  if (memo !== undefined) return memo

  const bf = byStch.get(stch)
  let result: boolean | null
  if (!bf) {
    result = null
  } else {
    const [minX, minY, maxX, maxY] = bf.bbox
    result =
      lng < minX || lng > maxX || lat < minY || lat > maxY
        ? false
        : booleanPointInPolygon([lng, lat], bf.feature)
  }

  if (containsCache.size >= CONTAINS_CACHE_MAX) containsCache.clear()
  containsCache.set(key, result)
  return result
}

/** Which bureau polygon contains [lng, lat]? `null` = none (or not loaded).
 *  Backs the orphan-stch reclassification in ReactMap and RegionSummaryLayer.
 *  Same scan order as the `find()` it replaces — first containing polygon
 *  wins — memoised on the same terms as `isPointInBureau`. */
export function findBureauAt(
  features: BureauFeature[] | null,
  lng: number,
  lat: number,
): BureauFeature | null {
  if (!features) return null

  if (indexedAtFor !== features) {
    indexedAtFor = features
    atCache.clear()
  }

  const key = `${lng}|${lat}`
  const memo = atCache.get(key)
  if (memo !== undefined) return memo

  const hit =
    features.find((b) => {
      const [minX, minY, maxX, maxY] = b.bbox
      if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false
      return booleanPointInPolygon([lng, lat], b.feature)
    }) ?? null

  if (atCache.size >= CONTAINS_CACHE_MAX) atCache.clear()
  atCache.set(key, hit)
  return hit
}

let indexedAtFor: BureauFeature[] | null = null
const atCache = new Map<string, BureauFeature | null>()

/** Shared client-side loader for the 18-bureau geojson. Component-agnostic —
 *  every consumer (BureauMaskLayer, ReactMap aggregator, future
 *  BureauClusterMarker) reads from the same in-memory cache. */
export const useBureauFeatures = (): BureauFeature[] | null => {
  const [features, setFeatures] = useState<BureauFeature[] | null>(cache)
  useEffect(() => {
    if (features) return
    let cancelled = false
    loadOnce()
      .then((f) => { if (!cancelled) setFeatures(f) })
      .catch((err) => {
        console.error('[useBureauFeatures] load failed:', err)
      })
    return () => { cancelled = true }
  }, [features])
  return features
}
