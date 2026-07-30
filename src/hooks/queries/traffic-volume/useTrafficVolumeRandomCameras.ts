import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeRandomCamerasAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from './queryKeys'
import { APIRequestTrafficVolumeRandomCameras } from '@/types/traffic-volume/overview-api'

/** Random online cameras for the left-rail CCTV preview. Defaults to 3
 *  to match the design (3 stacked cards). */
export const useTrafficVolumeRandomCameras = (
  deptId: string | number | null | undefined,
  params?: APIRequestTrafficVolumeRandomCameras
) =>
  useQuery({
    queryKey: trafficVolumeKeys.overview.randomCameras(deptId ?? '', params),
    queryFn: () =>
      getTrafficVolumeRandomCamerasAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
