import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingCCTVList } from '@/types/tracking/overall-api'
import { getTrackingCCTVListAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useCctvList(params: APIRequestTrackingCCTVList, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.cctvList(scoped),
    queryFn: () => getTrackingCCTVListAPI(scoped),
    placeholderData: keepPreviousData,
    enabled,
  })
}
