import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingCollaboration } from '@/types/tracking/overall-api'
import { getTrackingCollaborationAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useCollaboration(params: APIRequestTrackingCollaboration, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.collaboration(params),
    queryFn: () => getTrackingCollaborationAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
