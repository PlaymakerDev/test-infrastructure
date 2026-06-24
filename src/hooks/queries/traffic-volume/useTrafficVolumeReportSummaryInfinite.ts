import { useInfiniteQuery } from '@tanstack/react-query'
import { getTrafficVolumeReportSummaryAPI } from '@/services/routes/TrafficVolumeService'
import type {
  APIRequestTrafficVolumeReportSummary,
  CountingReportRow,
  CountingVehicleTypeAPISummary,
} from '@/types/traffic-volume/detail-api'
import { trafficVolumeKeys } from './queryKeys'

/** What a single page returns: the row list plus the optional summary
 *  envelope (present only on `report_type=vehicle_type`). */
export interface ReportSummaryPage {
  data: CountingReportRow[]
  summary?: CountingVehicleTypeAPISummary
}

/** Backend's effective default page size — empirically 10 from the Postman
 *  test the user verified. We can't rely on a `total` field so we use this
 *  to decide when a page is "short" and we've reached the end. */
const BACKEND_PAGE_SIZE = 10

/** Infinite-paginated variant of the report summary endpoint. Walks
 *  successive `page` values until the backend returns an empty / short
 *  page, then exposes the concatenated rows. Used by the hour view where
 *  the table groups rows per camera and needs the full dataset to do so
 *  meaningfully — without this, single-page fetches would split camera
 *  groups arbitrarily across pages. */
export const useTrafficVolumeReportSummaryInfinite = (
  params: Omit<Partial<APIRequestTrafficVolumeReportSummary>, 'page'>
) => {
  const enabled =
    !!params.solution_id &&
    !!params.start_date &&
    !!params.end_date &&
    !!params.report_type
  return useInfiniteQuery<ReportSummaryPage>({
    // Reuse the regular cache key minus `page` (it's owned by the
    // infinite query) plus an "infinite" tag so the two variants don't
    // collide in the cache.
    queryKey: [
      ...trafficVolumeKeys.detail.reportSummary({
        solution_id: params.solution_id ?? '',
        start_date: params.start_date ?? '',
        end_date: params.end_date ?? '',
        report_type: params.report_type ?? 'daily',
        camera_id: params.camera_id,
        limit: params.limit,
      }),
      'infinite',
    ],
    queryFn: async ({ pageParam }): Promise<ReportSummaryPage> => {
      const r = await getTrafficVolumeReportSummaryAPI({
        solution_id: params.solution_id!,
        start_date: params.start_date!,
        end_date: params.end_date!,
        report_type: params.report_type!,
        camera_id: params.camera_id,
        limit: params.limit,
        page: pageParam as number,
      })
      return {
        data: r.data.res_data?.data ?? [],
        summary: r.data.res_data?.summary,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // Defensive — backend may surface `null` instead of an empty array
      // when there's nothing to return.
      const rows = lastPage?.data ?? []
      // Empty page → definitely no more data.
      if (rows.length === 0) return undefined
      // Short page (fewer than backend page size) → almost certainly last.
      if (rows.length < BACKEND_PAGE_SIZE) return undefined
      return (lastPageParam as number) + 1
    },
    enabled,
  })
}
