import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeSummaryDailyAPI } from '@/services/routes/TrafficVolumeService'
import type { APIRequestTrafficVolumeSummaryDaily } from '@/types/traffic-volume/detail-api'
import { trafficVolumeKeys } from './queryKeys'

/** Aggregated daily numbers (total_count, total_pcu, avg_speed, aadt, …) —
 *  drives the right-rail InfoCards on the detail page (ภาพรวม tab). */
export const useTrafficVolumeSummaryDaily = (
  params: Partial<APIRequestTrafficVolumeSummaryDaily>
) =>
  useQuery({
    queryKey: trafficVolumeKeys.detail.summaryDaily({
      solution_id: params.solution_id ?? '',
      date: params.date,
    }),
    queryFn: () =>
      getTrafficVolumeSummaryDailyAPI({
        solution_id: params.solution_id!,
        date: params.date,
      }).then((r) => r.data),
    enabled: !!params.solution_id,
  })
