import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCrosswalkViolationListAPI } from '@/services/routes/CrosswalkService'
import type { APIRequestCrosswalkViolationList } from '@/types/crosswalk/detail-api'
import { crosswalkKeys } from './queryKeys'

/** Plain one-page violation list — server-side pagination for EVERY status:
 *  `crosswalk_type` (2=คน, 3=รถ) filters server-side (verified live
 *  2026-07-21). `keepPreviousData` keeps the previous page rendered while
 *  the next loads, matching antd Table's expected paging feel. */
export const useCrosswalkViolationList = (
  params: Partial<APIRequestCrosswalkViolationList>,
  options?: { enabled?: boolean }
) => {
  const enabled = (options?.enabled ?? true) && !!params.solution_id
  return useQuery({
    queryKey: [
      ...crosswalkKeys.detail.violationList({
        solution_id: params.solution_id ?? '',
        start_date: params.start_date,
        end_date: params.end_date,
        crosswalk_type: params.crosswalk_type,
        limit: params.limit,
      }),
      'page',
      params.page ?? 1,
    ],
    queryFn: async () => {
      const r = await getCrosswalkViolationListAPI({
        solution_id: params.solution_id!,
        start_date: params.start_date,
        end_date: params.end_date,
        crosswalk_type: params.crosswalk_type,
        limit: params.limit,
        page: params.page ?? 1,
      })
      return {
        rows: r.data.res_data ?? [],
        count: r.data.meta_data?.count ?? null,
        totalPages: r.data.meta_data?.total_pages ?? null,
      }
    },
    placeholderData: keepPreviousData,
    enabled,
  })
}
