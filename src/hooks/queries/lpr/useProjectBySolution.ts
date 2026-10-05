import { useQuery } from '@tanstack/react-query'
import { getProjectBySolutionIDAPI } from '@/services/routes/ProjectDetailService'
import { lprKeys } from './queryKeys'

/** GET /manage/project/solution/:solution_id — the project (contract, warranty
 *  window, …) an LPR install point belongs to. Backs the detail header's
 *  ⓘ project-info button + warranty pill. Slow-moving data, so no polling. */
export const useLPRProjectBySolution = (solutionId: string | number) =>
  useQuery({
    queryKey: lprKeys.project.bySolution(solutionId),
    queryFn: () => getProjectBySolutionIDAPI(solutionId).then((r) => r.data),
    enabled: !!solutionId,
    staleTime: 5 * 60_000,
  })
