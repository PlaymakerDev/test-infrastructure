import { useQuery } from '@tanstack/react-query'
import type { APIRequestLast7Days } from '@/types/tracking/detail-api'
import { getTrackingLast7DaysAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useLast7Days(params: APIRequestLast7Days, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.last7Days(params),
    queryFn: () => getTrackingLast7DaysAPI(params),
    enabled: enabled && !!params.station_id,
  })
}
