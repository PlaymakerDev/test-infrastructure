import { useQuery } from '@tanstack/react-query'
import type { APIRequestWIMDaily } from '@/types/tracking/detail-api'
import { getTrackingWIMDailyAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useWimDaily(params: APIRequestWIMDaily, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.wimDaily(params),
    queryFn: () => getTrackingWIMDailyAPI(params),
    enabled: enabled && !!params.station_id,
  })
}
