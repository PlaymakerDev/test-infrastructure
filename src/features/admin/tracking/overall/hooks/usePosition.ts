import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingPosition } from '@/types/tracking/overall-api'
import { getTrackingPositionAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function usePosition(params: APIRequestTrackingPosition, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.position(scoped),
    queryFn: () => getTrackingPositionAPI(scoped),
    placeholderData: keepPreviousData,
    enabled,
  })
}
