import { useQuery } from '@tanstack/react-query'
import { getCctvOverviewTotalsAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'

/** Camera + warranty totals for the overall page stat cards. */
export const useCctvOverviewTotals = (
  deptId: string | number | null | undefined
) =>
  useQuery({
    queryKey: cctvKeys.overview.totals(deptId ?? ''),
    queryFn: () => getCctvOverviewTotalsAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
