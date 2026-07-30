import { useQuery } from '@tanstack/react-query'
import { getTrafficOverviewAPI } from '@/services/routes/TrafficSignalService'
import type { APIRequestTrafficOverview } from '@/types/traffic-signal/overview-api'
import { trafficSignalKeys } from './queryKeys'

/** Map locations + centroid for the Traffic Signal overall page.
 *  Pass `solution_id` to narrow the map to a single signal (deep-link). */
export const useTrafficOverview = (
  deptId: string | number | null | undefined,
  params?: APIRequestTrafficOverview
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.map(deptId ?? '', params),
    queryFn: () => getTrafficOverviewAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
