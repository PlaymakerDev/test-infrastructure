import { useQuery } from '@tanstack/react-query'
import { getCrosswalkTotalsAPI } from '@/services/routes/CrosswalkService'
import { crosswalkKeys } from './queryKeys'

/** Aggregated counters (solution + warranty) for the InfoCard stat cards. */
export const useCrosswalkTotals = (
  deptId: string | number | null | undefined
) =>
  useQuery({
    queryKey: crosswalkKeys.overview.totals(deptId ?? ''),
    queryFn: () => getCrosswalkTotalsAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
