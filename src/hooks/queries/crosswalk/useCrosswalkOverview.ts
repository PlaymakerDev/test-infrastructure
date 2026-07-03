import { useQuery } from '@tanstack/react-query'
import { getCrosswalkOverviewAPI } from '@/services/routes/CrosswalkService'
import type { APIRequestCrosswalkOverview } from '@/types/crosswalk/overview-api'
import { crosswalkKeys } from './queryKeys'

/** Map markers + centroid for the overall page map. Pass `solution_id` to
 *  narrow to a single solution (deep-link). */
export const useCrosswalkOverview = (
  deptId: string | number | null | undefined,
  params: APIRequestCrosswalkOverview = {}
) =>
  useQuery({
    queryKey: crosswalkKeys.overview.map(deptId ?? '', params),
    queryFn: () =>
      getCrosswalkOverviewAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
