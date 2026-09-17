"use client"

/** Shared fetch + parse cache for the static GeoJSON under `public/data/`.
 *
 *  Before this existed every consumer ran its own bare `fetch()`, so opening a
 *  single overall page (BaseMap + ThailandMaskLayer, on top of whatever
 *  `useProvinceFeatures` / `useBureauFeatures` had already loaded) downloaded
 *  and `JSON.parse`d the same ~2.8 MB of boundary GeoJSON two to three times —
 *  and did it all again on every remount. The parsed objects are ~9 MB of JS
 *  heap per copy, so the duplicates were the single biggest avoidable cost on
 *  the map surfaces.
 *
 *  Keyed by the RESOLVED URL string on purpose: callers keep computing their
 *  own URL exactly as they did before (BaseMap/ThailandMaskLayer read
 *  `NEXT_PUBLIC_BASE_PATH`, the feature hooks read `__NEXT_ROUTER_BASEPATH`).
 *  In every real deployment those resolve to the same prefix and therefore
 *  share one entry; if some environment ever made them differ, each simply
 *  gets its own entry — i.e. exactly today's behaviour, never a broken fetch.
 */

const cache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

/** Fetch + parse `url` once per session. Concurrent callers share one request;
 *  a rejected fetch is NOT memoised, so a later mount retries cleanly. */
export async function loadGeoJsonOnce<T>(url: string): Promise<T> {
  const hit = cache.get(url)
  if (hit !== undefined) return hit as T

  const pending = inflight.get(url)
  if (pending) return pending as Promise<T>

  const request = (async () => {
    // 'no-cache' = revalidate with the server every session (cheap 304 when
    // the file is unchanged). The default/'force-cache' pinned browsers to the
    // first version they ever saw, which is how stale boundary geometry
    // survived the 2026-08-03 geojson regeneration — see useBureauFeatures.ts
    // for the full story. The map above already dedupes within a session, so
    // revalidating costs one conditional request, not a re-download.
    const r = await fetch(url, { cache: 'no-cache' })
    if (!r.ok) throw new Error(`geojson fetch ${r.status}: ${url}`)
    const gj = (await r.json()) as unknown
    cache.set(url, gj)
    return gj
  })()

  inflight.set(url, request)
  try {
    return (await request) as T
  } finally {
    // Cleared on BOTH the success and the failure path. The per-hook loaders
    // this replaces only cleared after a success, so a single failed fetch
    // left a rejected promise memoised for the rest of the session and every
    // later mount re-threw it instead of trying again.
    inflight.delete(url)
  }
}
