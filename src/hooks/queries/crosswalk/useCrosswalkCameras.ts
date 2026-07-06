import { useQuery } from '@tanstack/react-query'
import { getCrosswalkCamerasAPI } from '@/services/routes/CrosswalkService'
import type { APIRequestCrosswalkCameras } from '@/types/crosswalk/detail-api'
import { crosswalkKeys } from './queryKeys'

/** Per-solution camera list — drives the DETAIL page's camera table + grid.
 *  Pass `solution_id` to narrow to a single solution. */
export const useCrosswalkCameras = (
  deptId: string | number | null | undefined,
  params: APIRequestCrosswalkCameras = {}
) =>
  useQuery({
    queryKey: crosswalkKeys.detail.cameras(deptId ?? '', params),
    queryFn: () =>
      getCrosswalkCamerasAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
