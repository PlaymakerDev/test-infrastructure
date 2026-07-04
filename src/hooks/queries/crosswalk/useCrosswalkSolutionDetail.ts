import { useQuery } from '@tanstack/react-query'
import { getCrosswalkSolutionDetailAPI } from '@/services/routes/CrosswalkService'
import { crosswalkKeys } from './queryKeys'

/** Solution-level admin metadata (`/manage/solution/details/{id}`). Drives
 *  the AnyDesk button on the detail title bar. */
export const useCrosswalkSolutionDetail = (
  id: string | number | null | undefined
) =>
  useQuery({
    queryKey: crosswalkKeys.detail.solutionDetail(id ?? ''),
    queryFn: () => getCrosswalkSolutionDetailAPI(id!).then((r) => r.data),
    enabled: !!id,
  })
