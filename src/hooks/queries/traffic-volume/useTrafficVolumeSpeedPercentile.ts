import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeSpeedPercentileAPI } from '@/services/routes/TrafficVolumeService'
import type { APIRequestTrafficVolumeSpeedPercentile } from '@/types/traffic-volume/detail-api'
import { trafficVolumeKeys } from './queryKeys'

/** Cumulative speed-distribution curve (CDF) — drives the 85th-percentile
 *  chart on the วิเคราะห์ปริมาณจราจร tab. */
export const useTrafficVolumeSpeedPercentile = (
  params: Partial<APIRequestTrafficVolumeSpeedPercentile>
) =>
  useQuery({
    queryKey: trafficVolumeKeys.detail.speedPercentile({
      solution_id: params.solution_id ?? '',
      date: params.date,
    }),
    queryFn: () =>
      getTrafficVolumeSpeedPercentileAPI({
        solution_id: params.solution_id!,
        date: params.date,
      }).then((r) => r.data),
    enabled: !!params.solution_id,
  })
