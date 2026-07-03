import { useInfiniteQuery } from '@tanstack/react-query'
import { getCrosswalkViolationListAPI } from '@/services/routes/CrosswalkService'
import type {
  APIRequestCrosswalkViolationList,
  CrosswalkViolationRow,
} from '@/types/crosswalk/detail-api'
import { crosswalkKeys } from './queryKeys'

/** Infinite-paginated variant of the violation list. Walks successive `page`
 *  values until `meta_data.total_pages` is reached (falling back to the
 *  "short page" heuristic if the envelope is missing). Used by the violation
 *  table so the client-side status filter and pagination reflect the full
 *  dataset for a date range — the non-infinite hook only exposes one page
 *  at a time and truncates when the range has more than one page. */
export interface ViolationListPage {
  rows: CrosswalkViolationRow[]
  totalPages: number | null
}

export const useCrosswalkViolationListInfinite = (
  params: Omit<Partial<APIRequestCrosswalkViolationList>, 'page'>
) => {
  const enabled = !!params.solution_id
  return useInfiniteQuery<ViolationListPage>({
    queryKey: [
      ...crosswalkKeys.detail.violationList({
        solution_id: params.solution_id ?? '',
        start_date: params.start_date,
        end_date: params.end_date,
        crossing_type: params.crossing_type,
        search: params.search,
        field: params.field,
        sort: params.sort,
        limit: params.limit,
      }),
      'infinite',
    ],
    queryFn: async ({ pageParam }): Promise<ViolationListPage> => {
      const r = await getCrosswalkViolationListAPI({
        solution_id: params.solution_id!,
        start_date: params.start_date,
        end_date: params.end_date,
        crossing_type: params.crossing_type,
        search: params.search,
        field: params.field,
        sort: params.sort,
        limit: params.limit,
        page: pageParam as number,
      })
      return {
        rows: r.data.res_data ?? [],
        totalPages: r.data.meta_data?.total_pages ?? null,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      const current = lastPageParam as number
      // Authoritative — backend tells us how many pages exist.
      if (lastPage.totalPages != null) {
        return current < lastPage.totalPages ? current + 1 : undefined
      }
      // Fallback heuristic — empty or short page means we're done.
      const backendLimit = params.limit ?? 10
      if (lastPage.rows.length === 0) return undefined
      if (lastPage.rows.length < backendLimit) return undefined
      return current + 1
    },
    enabled,
  })
}
