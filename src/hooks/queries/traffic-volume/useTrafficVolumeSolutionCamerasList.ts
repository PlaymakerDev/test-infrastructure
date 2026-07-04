import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeSolutionCamerasListAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from './queryKeys'

/** Default `limit` — sized well above any realistic per-solution camera
 *  count so the grid renders every camera in a single request without
 *  needing pagination controls. Backend supports page+limit if a larger
 *  set ever ships. */
const DEFAULT_LIMIT = 100

/** Richer per-solution camera list — drives the CCTV grid + table on the
 *  detail page. Backend path:
 *  `/counting/departments/{deptId}/cameras/list?solution_id={id}&page=1&limit=100`.
 *
 *  Response envelope is `{ res_data: CountingCameraListItem[] }`; rows carry
 *  `ip_address` and `status.is_online` inline (no per-camera follow-up fetch
 *  needed). Kept separate from `useTrafficVolumeSolutionCameras` because the
 *  older endpoint additionally returns `centroid` + `geometry_point`, which
 *  the map/report tabs still consume. */
export const useTrafficVolumeSolutionCamerasList = (
  deptId: string | number | null | undefined,
  solutionId: string | number | null | undefined,
  opts: { page?: number; limit?: number } = {}
) => {
  const page = opts.page ?? 1
  const limit = opts.limit ?? DEFAULT_LIMIT
  return useQuery({
    queryKey: trafficVolumeKeys.detail.cameraList(
      deptId ?? '',
      solutionId ?? '',
      page,
      limit
    ),
    queryFn: () =>
      getTrafficVolumeSolutionCamerasListAPI(deptId!, {
        solution_id: solutionId!,
        page,
        limit,
      }).then((r) => r.data),
    enabled: !!deptId && !!solutionId,
  })
}
