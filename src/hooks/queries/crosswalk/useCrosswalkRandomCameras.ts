import { useQuery } from '@tanstack/react-query'
import { getCrosswalkRandomCamerasAPI } from '@/services/routes/CrosswalkService'
import { crosswalkKeys } from './queryKeys'

/** Random online cameras for the left-rail CCTV preview. Defaults to 3
 *  to match the design (3 stacked cards). */
export const useCrosswalkRandomCameras = (
  deptId: string | number | null | undefined,
  limit = 3
) =>
  useQuery({
    queryKey: crosswalkKeys.overview.randomCameras(deptId ?? '', limit),
    queryFn: () =>
      getCrosswalkRandomCamerasAPI(deptId!, { limit }).then((r) => r.data),
    enabled: !!deptId,
  })
