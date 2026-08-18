import { useQuery } from '@tanstack/react-query'
import type { APIRequestWIMDailyCount } from '@/types/tracking/detail-api'
import { getTrackingWIMDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useWimDailyCount(params: APIRequestWIMDailyCount, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.wimDailyCount(scoped),
    queryFn: () => getTrackingWIMDailyCountAPI(scoped),
    enabled,
  })
}
