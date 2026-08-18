import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingDailySum } from '@/types/tracking/overall-api'
import { getTrackingDailySumAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useDailySum(params: APIRequestTrackingDailySum, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.dailySum(scoped),
    queryFn: () => getTrackingDailySumAPI(scoped),
    placeholderData: keepPreviousData,
    enabled,
  })
}
