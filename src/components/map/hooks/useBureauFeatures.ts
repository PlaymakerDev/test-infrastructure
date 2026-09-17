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
  // The raw fetch + JSON.parse now lives in the shared `loadGeoJsonOnce`
  // cache, so ThailandMaskLayer / BaseMap / this hook read one parsed copy
  // instead of three. The revalidation policy that keeps stale boundary
  // geometry from surviving a regeneration moved there with it (see the note
  // in geojsonCache.ts). This layer still memoises the DERIVED shape below —
  // the bbox precompute is what callers actually hold on to.
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
      // Cleared on failure too — the previous version only cleared after a
      // success, so one failed load stuck a rejected promise here for the
      // rest of the session.
      inflight = null
    }
  })()
  inflight = request
  return request
}

// ── Shared point-in-bureau memo ─────────────────────────────────────────────
// `ReactMap` (dashboard) and `RegionSummaryLayer` (10 overall pages) both ask
// the SAME question for the SAME nationwide device set: "does this coordinate
// sit inside the bureau it claims?" — each with its own local copy of the
// bbox-reject + booleanPointInPolygon ladder. At ~13.4k devices that is ~44 ms
// of blocking work per pass on a fast machine (2-5× that on office hardware),
// recomputed on every mount and repeated per component.
//
// The answer depends only on (bureau polygons, stch, lng, lat) and the
// polygons are loaded once per session, so it is safe to memoise across
// components and mounts. Same inputs → same booleanPointInPolygon call → same
// result; this changes only HOW OFTEN the test runs, never its outcome.

/** Index + result cache, rebuilt whenever the loaded feature set changes
 *  identity (in practice: once, when the geojson first resolves). */
let indexedFor: BureauFeature[] | null = null
let byStch = new Map<number, BureauFeature>()
const containsCache = new Map<string, boolean | null>()
// Bound the memo so a pathological session can't grow it without limit. The
// real device set is ~13.4k coordinates, so this ceiling is never reached in
// practice — it exists purely as a safety valve (clearing only costs a
// recompute, it cannot change an answer).
const CONTAINS_CACHE_MAX = 50_000

/** Is [lng, lat] inside the polygon of bureau `stch`?
 *
 *  `null` = nothing to test against (features not loaded yet, or that stch has
 *  no polygon) — callers decide what that means for them, exactly as they did
 *  when each owned a private copy of this check.
 *  `false` = outside (bbox reject or polygon miss). `true` = inside. */
export function isPointInBureau(
  features: BureauFeature[] | null,
  stch: number,
  lng: number,
  lat: number,
): boolean | null {
  if (!features) return null

  if (indexedFor !== features) {
    // `find()` returns the FIRST match, so build the index the same way —
    // first entry for a given stch wins — and drop memoised answers that were
    // computed against the previous polygons.
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
 *
 *  The orphan-stch reclassification in ReactMap and RegionSummaryLayer both
 *  ran this same `find()` — up to 18 bbox rejects plus a polygon test each —
 *  for every device whose stch isn't one of the 18 real bureaus (บทช., กรม-
 *  ทางหลวง, ด่านชั่ง). Memoised on the same terms as `isPointInBureau`:
 *  identical scan order, so the FIRST containing polygon still wins. */
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
