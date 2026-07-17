import { useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingCCTVList } from '@/types/tracking/overall-api'
import { getTrackingCCTVListAPI } from '@/services/routes/TrackingService'
import { trackingWimKeys } from '../data/queryKeys'

export function useCctvList(params: APIRequestTrackingCCTVList, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.cctvList(params),
    queryFn: () => getTrackingCCTVListAPI(params),
    enabled: enabled && !!params.station_id,
  })
}
