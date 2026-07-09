import { useQuery } from '@tanstack/react-query'
import type { APIRequestStationDaily } from '@/types/tracking/detail-api'
import { getTrackingStationDailyAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useStationDaily(params: APIRequestStationDaily, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.stationDaily(params),
    queryFn: () => getTrackingStationDailyAPI(params),
    enabled: enabled && !!params.station_id,
  })
}
