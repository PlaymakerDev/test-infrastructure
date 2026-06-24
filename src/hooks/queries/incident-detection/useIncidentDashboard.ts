import { useQuery } from '@tanstack/react-query'
import { getIncidentDashboardAPI } from '@/services/routes/AnalyticService'
import type { IncidentDashboardType } from '@/types/incident-detection/details-api'
import { incidentKeys } from './queryKeys'

/** Bucketed event counts (daily/weekly/monthly/yearly). Powers the peak-hour
 *  stat card and the dashboard pickers. */
export const useIncidentDashboard = (
  deptId: string | number | null | undefined,
  type: IncidentDashboardType
) =>
  useQuery({
    queryKey: incidentKeys.details.dashboard(deptId ?? '', type),
    queryFn: () => getIncidentDashboardAPI(deptId!, type).then((r) => r.data),
    enabled: !!deptId,
  })
