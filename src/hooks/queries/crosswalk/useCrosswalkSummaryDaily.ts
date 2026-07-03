import { useQuery } from '@tanstack/react-query'
import { getCrosswalkSummaryDailyAPI } from '@/services/routes/CrosswalkService'
import type { APIRequestCrosswalkSummaryDaily } from '@/types/crosswalk/detail-api'
import { crosswalkKeys } from './queryKeys'

/** Daily summary for the detail page's InfoCard rail —
 *  `GET /crosswalk/solutions/{id}/details?start_date=YYYY-MM-DD`. */
export const useCrosswalkSummaryDaily = (
  params: APIRequestCrosswalkSummaryDaily
) =>
  useQuery({
    queryKey: crosswalkKeys.detail.summaryDaily(params),
    queryFn: () => getCrosswalkSummaryDailyAPI(params).then((r) => r.data),
    enabled: !!params.solution_id,
  })
