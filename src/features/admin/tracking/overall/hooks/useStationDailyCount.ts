import { useQuery } from '@tanstack/react-query'
import type { APIRequestStationDailyCount } from '@/types/tracking/detail-api'
import { getTrackingStationDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useStationDailyCount(params: APIRequestStationDailyCount, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.stationDailyCount(params),
    queryFn: () => getTrackingStationDailyCountAPI(params),
    enabled,
  })
}
