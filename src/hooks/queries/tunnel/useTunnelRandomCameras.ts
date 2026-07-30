import { useQuery } from '@tanstack/react-query'
import { getTunnelRandomCamerasAPI } from '@/services/routes/TunnelService'
import { tunnelKeys } from './queryKeys'
import { APIRequestTunnelRandomCameras } from '@/types/tunnel/overview-api'

/** Random online cameras for the left-rail CCTV preview. Defaults to 3
 *  to match the design (3 stacked cards). */
export const useTunnelRandomCameras = (
  deptId: string | number | null | undefined,
  params?: APIRequestTunnelRandomCameras
) =>
  useQuery({
    queryKey: tunnelKeys.overview.randomCameras(deptId ?? '', { ...params }),
    queryFn: () =>
      getTunnelRandomCamerasAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
