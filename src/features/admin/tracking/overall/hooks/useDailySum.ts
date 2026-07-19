import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingDailySum } from '@/types/tracking/overall-api'
import { getTrackingDailySumAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useDailySum(params: APIRequestTrackingDailySum, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.dailySum(params),
    queryFn: () => getTrackingDailySumAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
