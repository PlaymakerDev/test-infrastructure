import { useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingMobileMaster } from '@/types/tracking/overall-api'
import { getTrackingMobileMasterAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useMobileMaster(params: APIRequestTrackingMobileMaster, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.mobileMaster(scoped),
    queryFn: () => getTrackingMobileMasterAPI(scoped),
    enabled,
  })
}
