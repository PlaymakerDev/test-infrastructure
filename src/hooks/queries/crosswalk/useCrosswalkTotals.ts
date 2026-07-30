import { useQuery } from '@tanstack/react-query'
import { getCrosswalkTotalsAPI } from '@/services/routes/CrosswalkService'
import { crosswalkKeys } from './queryKeys'
import { APIRequestCrosswalkTotals } from '@/types/crosswalk/overview-api'

/** Aggregated counters (solution + warranty) for the InfoCard stat cards. */
export const useCrosswalkTotals = (
  deptId: string | number | null | undefined,
  params?: APIRequestCrosswalkTotals
) =>
  useQuery({
    queryKey: crosswalkKeys.overview.totals(deptId ?? '', { ...params }),
    queryFn: () => getCrosswalkTotalsAPI(deptId!, params!).then((r) => r.data),
    enabled: !!deptId,
  })
