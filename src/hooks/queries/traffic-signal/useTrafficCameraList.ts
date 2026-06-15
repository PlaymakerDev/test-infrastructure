import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getTrafficCameraListAPI } from '@/services/routes/TrafficSignalService'
import type { APIRequestTrafficCameraList } from '@/types/traffic-signal/overview-api'
import { trafficSignalKeys } from './queryKeys'

/** Camera grid view (paginated, supports multiple filters). */
export const useTrafficCameraList = (
  deptId: string | number | null | undefined,
  params: APIRequestTrafficCameraList
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.cameraList(deptId ?? '', params),
    queryFn: () => getTrafficCameraListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })
