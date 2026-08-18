import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingWeightInspection } from '@/types/tracking/overall-api'
import { getTrackingWeightInspectionAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useWeightInspection(params: APIRequestTrackingWeightInspection, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.weightInspection(scoped),
    queryFn: () => getTrackingWeightInspectionAPI(scoped),
    placeholderData: keepPreviousData,
    enabled,
  })
}
