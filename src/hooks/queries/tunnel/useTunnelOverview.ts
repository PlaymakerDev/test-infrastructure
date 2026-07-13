import { useQuery } from '@tanstack/react-query'
import { getTunnelOverviewAPI } from '@/services/routes/TunnelService'
import type { APIRequestTunnelOverview } from '@/types/tunnel/overview-api'
import { tunnelKeys } from './queryKeys'

/** Map markers + centroid for the overall page map. Pass `solution_id` to
 *  narrow to a single solution (deep-link). */
export const useTunnelOverview = (
  deptId: string | number | null | undefined,
  params: APIRequestTunnelOverview = {}
) =>
  useQuery({
    queryKey: tunnelKeys.overview.map(deptId ?? '', params),
    queryFn: () =>
      getTunnelOverviewAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
