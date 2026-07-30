import { useQuery } from '@tanstack/react-query'
import { getTrafficRandomCamerasAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'
import { APIRequestTrafficRandomCameras } from '@/types/traffic-signal/overview-api'

/** Random online cameras for the side panel CCTV preview. Defaults to 4. */
export const useTrafficRandomCameras = (
  deptId: string | number | null | undefined,
  params?: APIRequestTrafficRandomCameras
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.randomCameras(deptId ?? '', { ...params }),
    queryFn: () =>
      getTrafficRandomCamerasAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
