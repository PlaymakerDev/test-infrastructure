import { useQuery } from '@tanstack/react-query'
import type { APIRequestStationDailyCount } from '@/types/tracking/detail-api'
import { getTrackingStationDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useStationDailyCount(params: APIRequestStationDailyCount, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.stationDailyCount(params),
    queryFn: () => getTrackingStationDailyCountAPI(params),
    enabled: enabled && !!params.station_id,
  })
}
