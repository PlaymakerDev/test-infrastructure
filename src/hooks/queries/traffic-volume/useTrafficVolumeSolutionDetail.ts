import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeSolutionDetailAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from './queryKeys'

/** Solution-level admin metadata (anydesk, geometry_point) — drives the
 *  AnyDesk button on the detail title bar. Shared `/manage/solution/details/{id}`
 *  endpoint, also consumed by traffic-signal. */
export const useTrafficVolumeSolutionDetail = (
  id: string | number | null | undefined
) =>
  useQuery({
    queryKey: trafficVolumeKeys.detail.solutionDetail(id ?? ''),
    queryFn: () => getTrafficVolumeSolutionDetailAPI(id!).then((r) => r.data),
    enabled: !!id,
  })
