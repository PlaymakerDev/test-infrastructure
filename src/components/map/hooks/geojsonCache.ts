"use client"

/** Shared fetch + parse cache for the static GeoJSON in `public/data/`.
 *  Every consumer used to fetch its own copy, so one overall page parsed the
 *  same ~2.8MB of boundary data 2-3 times (~9MB heap each) and again on every
 *  remount. Keyed by the resolved URL — callers build their URL exactly as
 *  before, matching strings share one entry. */

const cache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

/** Fetch + parse `url` once per session. Concurrent callers share one request;
 *  a failed fetch isn't memoised, so a later mount retries. */
export async function loadGeoJsonOnce<T>(url: string): Promise<T> {
  const hit = cache.get(url)
  if (hit !== undefined) return hit as T

  const pending = inflight.get(url)
  if (pending) return pending as Promise<T>

  const request = (async () => {
    // 'no-cache' = revalidate each session (304 when unchanged). The default
    // pinned browsers to the first version they saw, which is how stale
    // geometry survived the 2026-08-03 regeneration.
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
    // Cleared on failure too — the loaders this replaces only cleared on
    // success, so one failed fetch stuck a rejected promise here for good.
    inflight.delete(url)
  }
}
