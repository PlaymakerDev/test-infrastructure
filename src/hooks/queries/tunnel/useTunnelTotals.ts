import { useQuery } from '@tanstack/react-query'
import { getTunnelTotalsAPI } from '@/services/routes/TunnelService'
import { tunnelKeys } from './queryKeys'
import { APIRequestTunnelTotals } from '@/types/tunnel/overview-api'

/** Aggregated counters (solution + warranty) for the InfoCard stat cards. */
export const useTunnelTotals = (
  deptId: string | number | null | undefined,
  params?: APIRequestTunnelTotals
) =>
  useQuery({
    queryKey: tunnelKeys.overview.totals(deptId ?? '', params),
    queryFn: () => getTunnelTotalsAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
