import { useQuery } from '@tanstack/react-query'
import { getIncidentOverviewAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'
import { APIRequestIncidentOverview } from '@/types/incident-detection/overview-api'

/** Solution-level map markers + centroid for the overall map. */
export const useIncidentOverview = (
  deptId: string | number | null | undefined,
  params?: APIRequestIncidentOverview
) =>
  useQuery({
    queryKey: incidentKeys.overview.map(deptId ?? '', params),
    queryFn: () => getIncidentOverviewAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
