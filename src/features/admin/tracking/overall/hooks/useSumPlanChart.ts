import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingViewSumPlanChart } from '@/types/tracking/overall-api'
import { getTrackingViewSumPlanChartAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useSumPlanChart(params: APIRequestTrackingViewSumPlanChart, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.sumPlanChart(scoped),
    queryFn: () => getTrackingViewSumPlanChartAPI(scoped),
    placeholderData: keepPreviousData,
    enabled,
  })
}
