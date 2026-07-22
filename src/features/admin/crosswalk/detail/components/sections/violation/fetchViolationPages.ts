import { getCrosswalkViolationListAPI } from '@/services/routes/CrosswalkService'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'

// The violations backend hard-caps `limit` at 100/request (larger values 400)
// — a wide range (สปข.2001 measured at 110k rows unbounded) therefore spans
// many pages. The export's ทั้งหมด scope pulls them IN PARALLEL batches so a
// 15k-row month loads in seconds instead of minutes of serial walking.
// (Server-side คน/รถ filtering DOES exist: pass `crosswalk_type` 2=คน 3=รถ —
// mind the param name, the old `crossing_type` spelling is silently ignored.)
export const BACKEND_PAGE_SIZE = 100
/** Concurrent page requests — polite to the backend, ~8× the serial speed. */
export const FETCH_CONCURRENCY = 8

export interface ViolationRangeParams {
  solution_id: string | number
  start_date?: string
  end_date?: string
  /** Server-side violation-type filter: 2=คนฝ่าฝืน, 3=รถฝ่าฝืน. */
  crosswalk_type?: number
}

export interface ViolationRangeResult {
  rows: CrosswalkViolationRow[]
  /** Server-reported TRUE total for the range (meta_data.count). */
  count: number
  /** False when `cap` stopped the fetch before the last page. */
  fetchedAll: boolean
}

/** Run `fn` over `items` with at most `limit` in flight (order preserved). */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return out
}

/** Fetch up to `cap` rows of the date range: page 1 first (for the meta
 *  envelope), then every remaining page in parallel batches. Rows come back
 *  in API order (newest first). */
export async function fetchViolationPages(
  params: ViolationRangeParams,
  cap: number,
): Promise<ViolationRangeResult> {
  const baseParams = {
    solution_id: params.solution_id,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    crosswalk_type: params.crosswalk_type,
    limit: BACKEND_PAGE_SIZE,
  }
  const first = await getCrosswalkViolationListAPI({ ...baseParams, page: 1 })
  const count = first.data.meta_data?.count ?? first.data.res_data?.length ?? 0
  const totalPages = first.data.meta_data?.total_pages ?? 1
  const wantPages = Math.min(totalPages, Math.ceil(Math.min(count, cap) / BACKEND_PAGE_SIZE))
  const restPageNos = Array.from({ length: Math.max(0, wantPages - 1) }, (_, i) => i + 2)
  const restPages = await mapWithConcurrency(restPageNos, FETCH_CONCURRENCY, async (pageNo) => {
    const r = await getCrosswalkViolationListAPI({ ...baseParams, page: pageNo })
    return r.data.res_data ?? []
  })
  return {
    rows: [first.data.res_data ?? [], ...restPages].flat().slice(0, cap),
    count,
    fetchedAll: wantPages >= totalPages,
  }
}
