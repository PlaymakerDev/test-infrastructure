import { useQuery } from '@tanstack/react-query'
import { getTunnelRandomCamerasAPI } from '@/services/routes/TunnelService'
import { tunnelKeys } from './queryKeys'

/** Random online cameras for the left-rail CCTV preview. Defaults to 3
 *  to match the design (3 stacked cards). */
export const useTunnelRandomCameras = (
  deptId: string | number | null | undefined,
  limit = 3
) =>
  useQuery({
    queryKey: tunnelKeys.overview.randomCameras(deptId ?? '', limit),
    queryFn: () =>
      getTunnelRandomCamerasAPI(deptId!, { limit }).then((r) => r.data),
    enabled: !!deptId,
  })
