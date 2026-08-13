// Fetch-everything helper for the export-'ทั้งหมด' flows.
//
// The backend caps `?limit=` at 100 (400 `{keys:["limit"],details:"max"}`
// above it — cap observed 2026-08-13). The old two-step fast path
// ("page 1 @100, then ONE refetch at limit=count") therefore 400s for any
// dataset larger than a single page (projects = ~348 rows today). This walks
// pages of 100 instead, which works at any size.

export const API_MAX_LIMIT = 100

interface PageEnvelope<T> {
  res_data?: T[] | null
  meta_data?: { count: number } | null
}

/** Walk every page of a list endpoint (100 rows at a time) until the
 *  server-reported total is reached. `fetchPage` gets (page, limit). Stops
 *  early if a page comes back empty so an inconsistent `count` can never
 *  loop forever. */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PageEnvelope<T> | undefined>,
): Promise<T[]> {
  const out: T[] = []
  const first = await fetchPage(1, API_MAX_LIMIT)
  out.push(...(first?.res_data ?? []))
  const count = first?.meta_data?.count ?? out.length
  let page = 1
  while (out.length < count) {
    page += 1
    const next = await fetchPage(page, API_MAX_LIMIT)
    const rows = next?.res_data ?? []
    if (rows.length === 0) break
    out.push(...rows)
  }
  return out
}
