import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingPosition } from '@/types/tracking/overall-api'
import { getTrackingPositionAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function usePosition(params: APIRequestTrackingPosition, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.position(params),
    queryFn: () => getTrackingPositionAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
