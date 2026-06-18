import { useQuery } from '@tanstack/react-query'
import { getTrafficRandomCamerasAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** Random online cameras for the side panel CCTV preview. Defaults to 4. */
export const useTrafficRandomCameras = (
  deptId: string | number | null | undefined,
  limit = 4
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.randomCameras(deptId ?? '', limit),
    queryFn: () =>
      getTrafficRandomCamerasAPI(deptId!, { limit }).then((r) => r.data),
    enabled: !!deptId,
  })
