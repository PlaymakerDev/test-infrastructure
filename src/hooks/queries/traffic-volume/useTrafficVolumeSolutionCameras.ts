import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeSolutionCamerasAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from './queryKeys'

/** Per-solution camera list — drives both the CCTV grid and the detail map.
 *  Backend path: `/counting/departments/{deptId}/cameras?solution_id={id}`. */
export const useTrafficVolumeSolutionCameras = (
  deptId: string | number | null | undefined,
  solutionId: string | number | null | undefined
) =>
  useQuery({
    queryKey: trafficVolumeKeys.detail.cameras(deptId ?? '', solutionId ?? ''),
    queryFn: () =>
      getTrafficVolumeSolutionCamerasAPI(deptId!, {
        solution_id: solutionId!,
      }).then((r) => r.data),
    enabled: !!deptId && !!solutionId,
  })
