import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingViewSumPlanChart } from '@/types/tracking/overall-api'
import { getTrackingViewSumPlanChartAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useSumPlanChart(params: APIRequestTrackingViewSumPlanChart, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.sumPlanChart(params),
    queryFn: () => getTrackingViewSumPlanChartAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
