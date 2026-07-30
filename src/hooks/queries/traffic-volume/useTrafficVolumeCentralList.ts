import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeCentralListAPI } from '@/services/routes/TrafficVolumeService'
import type { APIRequestTrafficVolumeCentralList } from '@/types/traffic-volume/overview-api'
import { trafficVolumeKeys } from './queryKeys'

/** Bureau-aware solution list — nested `bureau → sub_department → solutions`
 *  with per-row warranty status and camera online counts. */
export const useTrafficVolumeCentralList = (
  deptId: string | number | null | undefined,
  params: APIRequestTrafficVolumeCentralList
) =>
  useQuery({
    queryKey: trafficVolumeKeys.overview.centralList(deptId ?? '', params),
    queryFn: () =>
      getTrafficVolumeCentralListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
