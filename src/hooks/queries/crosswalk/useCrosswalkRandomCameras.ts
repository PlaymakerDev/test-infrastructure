import { useQuery } from '@tanstack/react-query'
import { getCrosswalkRandomCamerasAPI } from '@/services/routes/CrosswalkService'
import { crosswalkKeys } from './queryKeys'
import { APIRequestCrosswalkRandomCameras } from '@/types/crosswalk/overview-api'

/** Random online cameras for the left-rail CCTV preview. Defaults to 3
 *  to match the design (3 stacked cards). */
export const useCrosswalkRandomCameras = (
  deptId: string | number | null | undefined,
  params?: APIRequestCrosswalkRandomCameras
) =>
  useQuery({
    queryKey: crosswalkKeys.overview.randomCameras(deptId ?? '', { ...params }),
    queryFn: () =>
      getCrosswalkRandomCamerasAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
