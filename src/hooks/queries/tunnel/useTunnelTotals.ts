import { useQuery } from '@tanstack/react-query'
import { getTunnelTotalsAPI } from '@/services/routes/TunnelService'
import { tunnelKeys } from './queryKeys'

/** Aggregated counters (solution + warranty) for the InfoCard stat cards. */
export const useTunnelTotals = (
  deptId: string | number | null | undefined
) =>
  useQuery({
    queryKey: tunnelKeys.overview.totals(deptId ?? ''),
    queryFn: () => getTunnelTotalsAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
