import { useQuery } from '@tanstack/react-query'
import { getCctvOverviewCentralTotalsAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'

/** Bureau-aggregated camera + warranty totals. */
export const useCctvOverviewCentralTotals = (
  deptId: string | number | null | undefined
) =>
  useQuery({
    queryKey: cctvKeys.overview.centralTotals(deptId ?? ''),
    queryFn: () => getCctvOverviewCentralTotalsAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
