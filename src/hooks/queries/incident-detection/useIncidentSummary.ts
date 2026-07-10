import { useQuery } from '@tanstack/react-query'
import { getIncidentSummaryAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Aggregate incident counts powering the 4 stat cards. */
export const useIncidentSummary = (
  deptId: string | number,
  params: { scope?: string; since?: string; until?: string } = {},
) =>
  useQuery({
    queryKey: incidentKeys.incidentsSummary(deptId, params),
    queryFn: () => getIncidentSummaryAPI(deptId, params).then((r) => r.data),
    enabled: deptId !== undefined && deptId !== null && String(deptId) !== '',
  })
