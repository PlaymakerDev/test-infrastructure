import { useQuery } from '@tanstack/react-query'
import { getIncidentOverviewAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Solution-level map markers + centroid for the overall map. */
export const useIncidentOverview = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: incidentKeys.overview.map(deptId ?? ''),
    queryFn: () => getIncidentOverviewAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
