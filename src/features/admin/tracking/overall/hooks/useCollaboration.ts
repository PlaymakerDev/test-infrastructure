import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingCollaboration } from '@/types/tracking/overall-api'
import { getTrackingCollaborationAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useCollaboration(params: APIRequestTrackingCollaboration, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.collaboration(scoped),
    queryFn: () => getTrackingCollaborationAPI(scoped),
    placeholderData: keepPreviousData,
    enabled,
  })
}
