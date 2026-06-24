import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeAnalyticGraphAPI } from '@/services/routes/TrafficVolumeService'
import type { APIRequestTrafficVolumeAnalyticGraph } from '@/types/traffic-volume/detail-api'
import { trafficVolumeKeys } from './queryKeys'

/** Hourly volume + 3h moving-average reference — drives the
 *  วิเคราะห์รูปแบบการจราจร line chart on the วิเคราะห์ปริมาณจราจร tab. */
export const useTrafficVolumeAnalyticGraph = (
  params: Partial<APIRequestTrafficVolumeAnalyticGraph>
) =>
  useQuery({
    queryKey: trafficVolumeKeys.detail.analyticGraph({
      solution_id: params.solution_id ?? '',
      date: params.date,
    }),
    queryFn: () =>
      getTrafficVolumeAnalyticGraphAPI({
        solution_id: params.solution_id!,
        date: params.date,
      }).then((r) => r.data),
    enabled: !!params.solution_id,
  })
