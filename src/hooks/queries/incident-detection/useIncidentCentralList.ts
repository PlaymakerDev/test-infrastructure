import { useQuery } from '@tanstack/react-query'
import { getIncidentCentralListAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Bureau-aware nested list (bureau → sub-departments → solutions). No paging.
 *  Source for the overall table (grouped by แขวง). `deptId` may legitimately be
 *  `0` (statistics' "all departments" aggregate, paired with `scope='all'`),
 *  so the enabled guard checks for null/undefined rather than truthiness.
 *  `dateRange` bounds each item's `noti_count` (also part of the backend's
 *  15-min Redis cache key) — omit for the default today-00:00→now window. */
export const useIncidentCentralList = (
  deptId: string | number | null | undefined,
  scope?: string,
  dateRange?: { start_date?: string; end_date?: string },
) =>
  useQuery({
    queryKey: incidentKeys.overview.centralList(deptId ?? '', scope, dateRange),
    queryFn: () => getIncidentCentralListAPI(deptId!, { scope, ...dateRange }).then((r) => r.data),
    enabled: deptId !== null && deptId !== undefined,
  })
