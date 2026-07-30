import { useQuery } from '@tanstack/react-query'
import { getCctvOverviewCentralTotalsAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'
import { APIRequestCCTVOverviewCentralTotals } from '@/types/cctv/overview-api'

/** Bureau-aggregated camera + warranty totals. */
export const useCctvOverviewCentralTotals = (
  deptId: string | number | null | undefined,
  params?: APIRequestCCTVOverviewCentralTotals
) =>
  useQuery({
    queryKey: cctvKeys.overview.centralTotals(deptId ?? '', params),
    queryFn: () => getCctvOverviewCentralTotalsAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
