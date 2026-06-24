import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeReportSummaryAPI } from '@/services/routes/TrafficVolumeService'
import type {
  APIRequestTrafficVolumeReportSummary,
  CountingReportRow,
} from '@/types/traffic-volume/detail-api'
import { trafficVolumeKeys } from './queryKeys'

/** Report-mode rollup (daily / hour / month / year / vehicle_type) — drives
 *  the table on the รายงานการนับปริมาณจราจร tab. Disabled until both
 *  solution_id and a valid start/end date pair are present. */
export const useTrafficVolumeReportSummary = (
  params: Partial<APIRequestTrafficVolumeReportSummary>
) => {
  const enabled =
    !!params.solution_id &&
    !!params.start_date &&
    !!params.end_date &&
    !!params.report_type
  return useQuery<CountingReportRow[]>({
    queryKey: trafficVolumeKeys.detail.reportSummary({
      solution_id: params.solution_id ?? '',
      start_date: params.start_date ?? '',
      end_date: params.end_date ?? '',
      report_type: params.report_type ?? 'daily',
      camera_id: params.camera_id,
      page: params.page,
      limit: params.limit,
    }),
    queryFn: () =>
      getTrafficVolumeReportSummaryAPI({
        solution_id: params.solution_id!,
        start_date: params.start_date!,
        end_date: params.end_date!,
        report_type: params.report_type!,
        camera_id: params.camera_id,
        page: params.page,
        limit: params.limit,
      }).then((r) => r.data.res_data?.data ?? []),
    enabled,
  })
}
