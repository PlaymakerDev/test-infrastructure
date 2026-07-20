import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeCountHourAPI } from '@/services/routes/TrafficVolumeService'
import type { APIRequestTrafficVolumeCountHour } from '@/types/traffic-volume/detail-api'
import { trafficVolumeKeys } from './queryKeys'

/** Hourly counts + PCU breakdown for a solution. Drives the hourly line
 *  chart on the detail page (ภาพรวม tab). */
export const useTrafficVolumeCountHour = (
  params: Partial<APIRequestTrafficVolumeCountHour>
) =>
  useQuery({
    queryKey: trafficVolumeKeys.detail.countHour({
      solution_id: params.solution_id ?? '',
      date: params.date,
      camera_id: params.camera_id,
    }),
    queryFn: () =>
      getTrafficVolumeCountHourAPI({
        solution_id: params.solution_id!,
        date: params.date,
        camera_id: params.camera_id,
      }).then((r) => r.data),
    enabled: !!params.solution_id,
  })
