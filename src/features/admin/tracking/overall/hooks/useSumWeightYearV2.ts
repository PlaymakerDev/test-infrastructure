import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingSumWeightYearV2 } from '@/types/tracking/overall-api'
import { getTrackingSumWeightYearV2API } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useSumWeightYearV2(params: APIRequestTrackingSumWeightYearV2, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.sumWeightYearV2(scoped),
    queryFn: () => getTrackingSumWeightYearV2API(scoped),
    placeholderData: keepPreviousData,
    enabled,
  })
}
