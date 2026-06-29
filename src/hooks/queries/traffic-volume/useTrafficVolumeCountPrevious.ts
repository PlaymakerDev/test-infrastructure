import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeCountPreviousAPI } from '@/services/routes/TrafficVolumeService'
import type { APIRequestTrafficVolumeCountPrevious } from '@/types/traffic-volume/detail-api'
import { trafficVolumeKeys } from './queryKeys'

/** Daily totals for the last N days. Drives the 7-day comparison bar chart
 *  on the detail page (ภาพรวม tab). */
export const useTrafficVolumeCountPrevious = (
  params: Partial<APIRequestTrafficVolumeCountPrevious>
) =>
  useQuery({
    queryKey: trafficVolumeKeys.detail.countPrevious({
      solution_id: params.solution_id ?? '',
      last: params.last,
    }),
    queryFn: () =>
      getTrafficVolumeCountPreviousAPI({
        solution_id: params.solution_id!,
        last: params.last,
      }).then((r) => r.data),
    enabled: !!params.solution_id,
  })
