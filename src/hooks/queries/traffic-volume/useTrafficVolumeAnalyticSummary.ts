import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeAnalyticSummaryAPI } from '@/services/routes/TrafficVolumeService'
import type { APIRequestTrafficVolumeAnalyticSummary } from '@/types/traffic-volume/detail-api'
import { trafficVolumeKeys } from './queryKeys'

/** Daily analytic rollup — feeds the 4 stat cards on the วิเคราะห์ปริมาณจราจร
 *  tab (traffic_summary, traffic_analytic, vehicle_distribution, vehicle_density). */
export const useTrafficVolumeAnalyticSummary = (
  params: Partial<APIRequestTrafficVolumeAnalyticSummary>
) =>
  useQuery({
    queryKey: trafficVolumeKeys.detail.analyticSummary({
      solution_id: params.solution_id ?? '',
      date: params.date,
    }),
    queryFn: () =>
      getTrafficVolumeAnalyticSummaryAPI({
        solution_id: params.solution_id!,
        date: params.date,
      }).then((r) => r.data),
    enabled: !!params.solution_id,
  })
