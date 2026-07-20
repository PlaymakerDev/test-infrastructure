import { useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingSumStation } from '@/types/tracking/overall-api'
import { getTrackingSumStationAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useSumStation(params: APIRequestTrackingSumStation, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.sumStation(params),
    queryFn: () => getTrackingSumStationAPI(params),
    enabled,
  })
}
