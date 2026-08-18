import { useQuery } from '@tanstack/react-query'
import type { APIRequestMobileDailyCount } from '@/types/tracking/detail-api'
import { getTrackingMobileDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useMobileDailyCount(params: APIRequestMobileDailyCount, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.mobileDailyCount(scoped),
    queryFn: () => getTrackingMobileDailyCountAPI(scoped),
    enabled,
  })
}
