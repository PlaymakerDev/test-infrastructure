import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingTotalStation } from '@/types/tracking/overall-api'
import { getTrackingTotalStationAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useTotalStation(params: APIRequestTrackingTotalStation, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.totalStation(params),
    queryFn: () => getTrackingTotalStationAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
