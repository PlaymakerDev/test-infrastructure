import { useQuery } from '@tanstack/react-query'
import { getIncidentCentralTotalsAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Bureau-scoped totals — counts match /overview/central/list (the table source),
 *  so the overview chips/cards agree with the table. */
export const useIncidentCentralTotals = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: incidentKeys.overview.centralTotals(deptId ?? ''),
    queryFn: () => getIncidentCentralTotalsAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
