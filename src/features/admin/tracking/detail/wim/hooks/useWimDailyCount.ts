import { useQuery } from '@tanstack/react-query'
import type { APIRequestWIMDailyCount } from '@/types/tracking/detail-api'
import { getTrackingWIMDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useWimDailyCount(params: APIRequestWIMDailyCount, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.wimDailyCount(params),
    queryFn: () => getTrackingWIMDailyCountAPI(params),
    enabled: enabled && !!params.station_id,
  })
}
