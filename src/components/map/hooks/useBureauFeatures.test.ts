import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import bboxOf from '@turf/bbox'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { findBureauAt, isPointInBureau, type BureauFeature } from './useBureauFeatures'

// Equivalence guard for the shared point-in-bureau memo.
//
// `isPointInBureau` replaced two byte-identical inline ladders (ReactMap's
// `isTrustedCoord`, RegionSummaryLayer's `inBureau`). It memoises the answer,
// so the thing that must be proven is that memoisation changed only HOW OFTEN
// the polygon test runs, never WHAT it returns — including the bbox-reject
// short-circuit and the two distinct "nothing to test against" cases.
//
// `reference()` below is the original inline implementation, copied verbatim.
// Both are exercised against the real th-bureaus.geojson the app ships.

const bureaus = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/data/th-bureaus.geojson'), 'utf8'),
) as GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { stch: number; name: string; base_province: string; provinces: string[]; centroid: [number, number] }
>

const features: BureauFeature[] = bureaus.features.map((f) => ({
  stch: f.properties.stch,
  name: f.properties.name,
  baseProvince: f.properties.base_province,
  provinces: f.properties.provinces,
  centroid: f.properties.centroid,
  bbox: bboxOf(f) as [number, number, number, number],
  feature: f,
}))

/** The pre-refactor inline check, verbatim (ReactMap/RegionSummaryLayer both
 *  had this; they differed only in what they returned for the null cases). */
function reference(
  feats: BureauFeature[] | null,
  stch: number,
  lng: number,
  lat: number,
): boolean | null {
  if (!feats) return null
  const bf = feats.find((b) => b.stch === stch)
  if (!bf) return null
  const [minX, minY, maxX, maxY] = bf.bbox
  if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false
  return booleanPointInPolygon([lng, lat], bf.feature)
}

/** Deterministic PRNG so a failure is reproducible. */
function makeRng(seed: number) {
  let s = seed
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
}

describe('isPointInBureau', () => {
  it('matches the original inline check on points sampled inside each bureau bbox', () => {
    const rnd = makeRng(20260918)
    let checked = 0
    for (const f of features) {
      const [minX, minY, maxX, maxY] = f.bbox
      for (let i = 0; i < 300; i++) {
        const lng = minX + rnd() * (maxX - minX)
        const lat = minY + rnd() * (maxY - minY)
        expect(isPointInBureau(features, f.stch, lng, lat)).toBe(
          reference(features, f.stch, lng, lat),
        )
        checked++
      }
    }
    // Sanity: the sweep actually ran (a silently-empty loop would pass too).
    expect(checked).toBe(features.length * 300)
  })

  it('matches on the exact bbox corners and edges (short-circuit boundary)', () => {
    for (const f of features) {
      const [minX, minY, maxX, maxY] = f.bbox
      const probes: [number, number][] = [
        [minX, minY], [maxX, maxY], [minX, maxY], [maxX, minY],
        // Just outside on each axis — must take the `false` short-circuit.
        [minX - 1e-9, minY], [maxX + 1e-9, maxY],
        [minX, minY - 1e-9], [maxX, maxY + 1e-9],
      ]
      for (const [lng, lat] of probes) {
        expect(isPointInBureau(features, f.stch, lng, lat)).toBe(
          reference(features, f.stch, lng, lat),
        )
      }
    }
  })

  it('matches on real polygon vertices (points exactly ON the boundary)', () => {
    // Boundary semantics are where a reimplementation would most plausibly
    // drift, so feed the polygons their own vertices back.
    for (const f of features) {
      const geom = f.feature.geometry
      const rings = geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.map((p) => p[0])
      for (const ring of rings.slice(0, 3)) {
        for (const [lng, lat] of ring.slice(0, 40)) {
          expect(isPointInBureau(features, f.stch, lng, lat)).toBe(
            reference(features, f.stch, lng, lat),
          )
        }
      }
    }
  })

  it('matches for a stch that has no polygon, and when nothing is loaded', () => {
    // Both were `return null` in the reference; the callers map null to their
    // own default (ReactMap → "trust as-is", RegionSummaryLayer → null).
    expect(isPointInBureau(features, 999, 100.5, 13.75)).toBe(reference(features, 999, 100.5, 13.75))
    expect(isPointInBureau(features, 999, 100.5, 13.75)).toBeNull()
    expect(isPointInBureau(null, 1, 100.5, 13.75)).toBeNull()
  })

  it('returns a stable answer when the same point is asked repeatedly (memo hit)', () => {
    const f = features[0]
    const [minX, minY, maxX, maxY] = f.bbox
    const lng = (minX + maxX) / 2
    const lat = (minY + maxY) / 2
    const first = isPointInBureau(features, f.stch, lng, lat)
    for (let i = 0; i < 50; i++) {
      expect(isPointInBureau(features, f.stch, lng, lat)).toBe(first)
    }
    expect(first).toBe(reference(features, f.stch, lng, lat))
  })

  it('recomputes against a NEW feature set instead of serving the old memo (contains)', () => {
    const f = features[0]
    const [minX, minY, maxX, maxY] = f.bbox
    const lng = (minX + maxX) / 2
    const lat = (minY + maxY) / 2
    const before = isPointInBureau(features, f.stch, lng, lat)

    // Same stch, deliberately tiny polygon far away → the memo must not win.
    const swapped: BureauFeature[] = [{
      ...f,
      bbox: [0, 0, 1, 1],
      feature: {
        type: 'Feature',
        properties: f.feature.properties,
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
      } as BureauFeature['feature'],
    }]
    expect(isPointInBureau(swapped, f.stch, lng, lat)).toBe(false)
    expect(isPointInBureau(swapped, f.stch, 0.5, 0.5)).toBe(true)

    // ...and switching back restores the original answer.
    expect(isPointInBureau(features, f.stch, lng, lat)).toBe(before)
  })
})

/** The pre-refactor orphan-reclassification scan, verbatim. Order matters —
 *  `find` stops at the FIRST containing polygon. */
function referenceFindAt(
  feats: BureauFeature[] | null,
  lng: number,
  lat: number,
): BureauFeature | null {
  if (!feats) return null
  return (
    feats.find((b) => {
      const [minX, minY, maxX, maxY] = b.bbox
      if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false
      return booleanPointInPolygon([lng, lat], b.feature)
    }) ?? null
  )
}

describe('findBureauAt', () => {
  it('matches the original scan — same bureau, or null — across the country bbox', () => {
    // Sweep the whole Thailand envelope so the sample covers hits, sea/border
    // misses, and the overlapping-bbox cases where scan ORDER decides.
    const rnd = makeRng(781)
    let hits = 0
    for (let i = 0; i < 4000; i++) {
      const lng = 97.3 + rnd() * 8.3
      const lat = 5.6 + rnd() * 14.9
      const got = findBureauAt(features, lng, lat)
      const want = referenceFindAt(features, lng, lat)
      expect(got?.stch ?? null).toBe(want?.stch ?? null)
      if (want) hits++
    }
    // Guard against a degenerate sample that only ever missed.
    expect(hits).toBeGreaterThan(100)
  })

  it('matches on each bureau centroid (guaranteed-hit probes)', () => {
    for (const f of features) {
      const [lng, lat] = f.centroid
      expect(findBureauAt(features, lng, lat)?.stch ?? null).toBe(
        referenceFindAt(features, lng, lat)?.stch ?? null,
      )
    }
  })

  it('returns null when nothing is loaded, and is stable on repeat', () => {
    expect(findBureauAt(null, 100.5, 13.75)).toBeNull()
    const first = findBureauAt(features, 100.5, 13.75)
    for (let i = 0; i < 20; i++) expect(findBureauAt(features, 100.5, 13.75)).toBe(first)
  })

  it('recomputes against a NEW feature set instead of serving the old memo', () => {
    const probe: [number, number] = [100.5, 13.75]
    const before = findBureauAt(features, ...probe)
    const swapped: BureauFeature[] = [{
      ...features[0],
      stch: 4242,
      bbox: [0, 0, 1, 1],
      feature: {
        type: 'Feature',
        properties: features[0].feature.properties,
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
      } as BureauFeature['feature'],
    }]
    expect(findBureauAt(swapped, ...probe)).toBeNull()
    expect(findBureauAt(swapped, 0.5, 0.5)?.stch).toBe(4242)
    expect(findBureauAt(features, ...probe)?.stch ?? null).toBe(before?.stch ?? null)
  })
})
