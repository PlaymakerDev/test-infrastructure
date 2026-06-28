import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeRandomCamerasAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from './queryKeys'

/** Random online cameras for the left-rail CCTV preview. Defaults to 3
 *  to match the design (3 stacked cards). */
export const useTrafficVolumeRandomCameras = (
  deptId: string | number | null | undefined,
  limit = 3
) =>
  useQuery({
    queryKey: trafficVolumeKeys.overview.randomCameras(deptId ?? '', limit),
    queryFn: () =>
      getTrafficVolumeRandomCamerasAPI(deptId!, { limit }).then((r) => r.data),
    enabled: !!deptId,
  })
