import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingCCTVList } from '@/types/tracking/overall-api'
import { getTrackingCCTVListAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useCctvList(params: APIRequestTrackingCCTVList, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.cctvList(params),
    queryFn: () => getTrackingCCTVListAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
