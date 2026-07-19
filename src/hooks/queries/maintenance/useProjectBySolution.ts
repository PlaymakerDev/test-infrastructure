import { useQuery } from '@tanstack/react-query'
import { getProjectBySolutionAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** Resolves a solution to its owning project, so the ⓘ Project-Info modal
 *  works from the route id alone, including direct URL visits. */
export const useProjectBySolution = (solutionId?: number) =>
  useQuery({
    queryKey: maintenanceKeys.projectBySolution(solutionId),
    queryFn: () => getProjectBySolutionAPI(solutionId!).then((r) => r.data),
    enabled: !!solutionId,
  })
