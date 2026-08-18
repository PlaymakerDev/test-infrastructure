import { useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingSumStation } from '@/types/tracking/overall-api'
import { getTrackingSumStationAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useSumStation(params: APIRequestTrackingSumStation, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.sumStation(scoped),
    queryFn: () => getTrackingSumStationAPI(scoped),
    enabled,
  })
}
