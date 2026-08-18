import { useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingSumWim } from '@/types/tracking/overall-api'
import { getTrackingSumWIMAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useSumWim(params: APIRequestTrackingSumWim, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.sumWim(scoped),
    queryFn: () => getTrackingSumWIMAPI(scoped),
    enabled,
  })
}
