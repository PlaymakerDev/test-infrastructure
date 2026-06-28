import { useQuery } from '@tanstack/react-query'
import { getIncidentCamerasAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Cameras for ONE solution (camera names + geometry). Powers the License modal. */
export const useIncidentSolutionCameras = (
  deptId: string | number | null | undefined,
  solutionId: string | number | null | undefined
) =>
  useQuery({
    queryKey: incidentKeys.cameras.bySolution(deptId ?? '', solutionId ?? ''),
    queryFn: () => getIncidentCamerasAPI(deptId!, { solution_id: solutionId! }).then((r) => r.data),
    enabled: !!deptId && !!solutionId,
  })
