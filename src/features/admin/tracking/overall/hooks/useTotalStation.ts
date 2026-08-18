import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingTotalStation } from '@/types/tracking/overall-api'
import { getTrackingTotalStationAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useTotalStation(params: APIRequestTrackingTotalStation, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.totalStation(scoped),
    queryFn: () => getTrackingTotalStationAPI(scoped),
    placeholderData: keepPreviousData,
    enabled,
  })
}
