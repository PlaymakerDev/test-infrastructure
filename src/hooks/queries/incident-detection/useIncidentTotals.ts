import { useQuery } from '@tanstack/react-query'
import { getIncidentTotalsAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Stat-card totals — camera online/offline + warranty active/expired. */
export const useIncidentTotals = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: incidentKeys.overview.totals(deptId ?? ''),
    queryFn: () => getIncidentTotalsAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
