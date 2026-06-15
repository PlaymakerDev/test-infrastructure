import { useQuery } from '@tanstack/react-query'
import { getTrafficCameraDropdownsAPI } from '@/services/routes/TrafficSignalService'
import type { APIRequestTrafficCameraDropdowns } from '@/types/traffic-signal/overview-api'
import { trafficSignalKeys } from './queryKeys'

/** Camera filter dropdowns (road_code, solution_name, camera_type). */
export const useTrafficCameraDropdowns = (
  deptId: string | number | null | undefined,
  params: APIRequestTrafficCameraDropdowns = {}
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.cameraDropdowns(deptId ?? '', params),
    queryFn: () =>
      getTrafficCameraDropdownsAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
