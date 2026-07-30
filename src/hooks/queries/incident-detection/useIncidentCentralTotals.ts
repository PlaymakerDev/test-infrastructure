import { useQuery } from '@tanstack/react-query'
import { getIncidentCentralTotalsAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'
import { APIRequestIncidentTotals } from '@/types/incident-detection/overview-api'

/** Bureau-scoped totals — counts match /overview/central/list (the table source),
 *  so the overview chips/cards agree with the table. */
export const useIncidentCentralTotals = (
  deptId: string | number | null | undefined,
  params?: APIRequestIncidentTotals
) =>
  useQuery({
    queryKey: incidentKeys.overview.centralTotals(deptId ?? '', { ...params }),
    queryFn: () => getIncidentCentralTotalsAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
