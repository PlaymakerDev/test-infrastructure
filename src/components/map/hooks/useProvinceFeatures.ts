"use client"
import { useEffect, useState } from 'react'
import bboxOf from '@turf/bbox'

/** One จังหวัด polygon + precomputed bbox — parsed from the same
 *  `public/data/th-provinces.geojson` that ThailandMaskLayer renders. */
export interface ProvinceFeature {
  /** 2-char road-code prefix, e.g. "ชม" — matches `PROVINCE_BY_CODE`. */
  code: string
  /** [minX, minY, maxX, maxY] — cheap reject before the polygon test. */
  bbox: [number, number, number, number]
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
}

// basePath ('/atlas' in prod, '' in dev) — same reasoning as useBureauFeatures:
// public/data assets need the prefix or nginx's catch-all serves HTML back.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ''
const PROVINCES_URL = `${BASE_PATH}/data/th-provinces.geojson`

let cache: ProvinceFeature[] | null = null
let inflight: Promise<ProvinceFeature[]> | null = null

async function loadOnce(): Promise<ProvinceFeature[]> {
  if (cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    // 'no-cache' = revalidate with the server every session (304 when
    // unchanged) — 'force-cache' pinned browsers to the first version they
    // ever saw, which is how stale boundary geometry survived the 2026-08-03
    // geojson regeneration (see useBureauFeatures.ts for the full story).
    const r = await fetch(PROVINCES_URL, { cache: 'no-cache' })
    if (!r.ok) throw new Error(`provinces fetch ${r.status}`)
    const gj = (await r.json()) as GeoJSON.FeatureCollection<
      GeoJSON.Polygon | GeoJSON.MultiPolygon,
      { code: string }
    >
    const parsed: ProvinceFeature[] = gj.features.map((f) => ({
      code: f.properties.code,
      bbox: bboxOf(f) as [number, number, number, number],
      feature: f,
    }))
    cache = parsed
    inflight = null
    return parsed
  })()
  return inflight
}

/** Shared client-side loader for the 77-จังหวัด geojson — mirrors
 *  `useBureauFeatures`. Used for point-in-polygon lookups (which จังหวัด is the
 *  viewport centre actually IN), which the previous nearest-centre distance
 *  match got wrong near boundaries. */
export const useProvinceFeatures = (): ProvinceFeature[] | null => {
  const [features, setFeatures] = useState<ProvinceFeature[] | null>(cache)
  useEffect(() => {
    if (features) return
    let cancelled = false
    loadOnce()
      .then((f) => { if (!cancelled) setFeatures(f) })
      .catch((err) => {
        console.error('[useProvinceFeatures] load failed:', err)
      })
    return () => { cancelled = true }
  }, [features])
  return features
}
