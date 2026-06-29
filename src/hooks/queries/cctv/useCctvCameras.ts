import { useQuery } from '@tanstack/react-query'
import { getCctvCamerasAPI } from '@/services/routes/CCTVService'
import type { APIRequestCCTVCameras } from '@/types/cctv/camera-api'
import { cctvKeys } from './queryKeys'

/** Camera-level map markers + centroid. Filter by `solution_id` / `road_code`
 *  to scope to a single solution (e.g. detail / search map). */
export const useCctvCameras = (
  deptId: string | number | null | undefined,
  params: APIRequestCCTVCameras = {}
) =>
  useQuery({
    queryKey: cctvKeys.cameras.map(deptId ?? '', params),
    queryFn: () => getCctvCamerasAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
