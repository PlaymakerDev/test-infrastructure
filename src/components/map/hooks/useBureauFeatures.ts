"use client"
import { useEffect, useState } from 'react'
import bboxOf from '@turf/bbox'

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
  inflight = (async () => {
    // 'no-cache' = always revalidate with the server (cheap 304 when the file
    // hasn't changed). Was 'force-cache', which pinned the browser to whatever
    // version it saw first — after the 2026-08-03 regeneration of
    // th-bureaus.geojson (304KB low-res → 945KB, rebuilt from the new
    // th-provinces) stale caches kept drawing the OLD bureau outline against
    // the NEW province lines, so the cyan/yellow boundaries no longer matched.
    // The module-level `cache` above already dedupes within a session.
    const r = await fetch(BUREAUS_URL, { cache: 'no-cache' })
    if (!r.ok) throw new Error(`bureaus fetch ${r.status}`)
    const gj = (await r.json()) as GeoJSON.FeatureCollection<
      GeoJSON.Polygon | GeoJSON.MultiPolygon,
      { stch: number; name: string; base_province: string; provinces: string[]; centroid: [number, number] }
    >
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
    inflight = null
    return parsed
  })()
  return inflight
}

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
