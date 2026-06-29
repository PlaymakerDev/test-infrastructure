import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeOverviewAPI } from '@/services/routes/TrafficVolumeService'
import type { APIRequestTrafficVolumeOverview } from '@/types/traffic-volume/overview-api'
import { trafficVolumeKeys } from './queryKeys'

/** Map markers + centroid for the overall page map. Pass `solution_id` to
 *  narrow to a single solution (deep-link). */
export const useTrafficVolumeOverview = (
  deptId: string | number | null | undefined,
  params: APIRequestTrafficVolumeOverview = {}
) =>
  useQuery({
    queryKey: trafficVolumeKeys.overview.map(deptId ?? '', params),
    queryFn: () =>
      getTrafficVolumeOverviewAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
