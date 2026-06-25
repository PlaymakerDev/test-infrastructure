import { useQuery } from '@tanstack/react-query'
import { getIncidentCentralListAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Bureau-aware nested list (bureau → sub-departments → solutions). No paging.
 *  Source for the overall table (grouped by แขวง). */
export const useIncidentCentralList = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: incidentKeys.overview.centralList(deptId ?? ''),
    queryFn: () => getIncidentCentralListAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
