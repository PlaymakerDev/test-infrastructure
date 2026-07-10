import { useQuery } from '@tanstack/react-query'
import { getIncidentCentralListAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Bureau-aware nested list (bureau → sub-departments → solutions). No paging.
 *  Source for the overall table (grouped by แขวง). `deptId` may legitimately be
 *  `0` (statistics' "all departments" aggregate, paired with `scope='all'`),
 *  so the enabled guard checks for null/undefined rather than truthiness. */
export const useIncidentCentralList = (deptId: string | number | null | undefined, scope?: string) =>
  useQuery({
    queryKey: incidentKeys.overview.centralList(deptId ?? '', scope),
    queryFn: () => getIncidentCentralListAPI(deptId!, { scope }).then((r) => r.data),
    enabled: deptId !== null && deptId !== undefined,
  })
