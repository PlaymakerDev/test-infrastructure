import { useQuery } from '@tanstack/react-query'
import { getIncidentOverviewAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Solution-level map markers + centroid for the overall map.
 *  `deptId` may legitimately be `0` (statistics' "all departments" aggregate —
 *  paired with `scope='all'`), so the enabled guard checks for null/undefined
 *  rather than truthiness. */
export const useIncidentOverview = (deptId: string | number | null | undefined, scope?: string) =>
  useQuery({
    queryKey: incidentKeys.overview.map(deptId ?? '', scope),
    queryFn: () => getIncidentOverviewAPI(deptId!, { scope }).then((r) => r.data),
    enabled: deptId !== null && deptId !== undefined,
  })
