import { useQuery } from '@tanstack/react-query'
import type { APIRequestWeightStationLog } from '@/types/tracking/detail-api'
import { getTrackingWeightStationLogAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useWeightStationLog(params: APIRequestWeightStationLog, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.weightStationLog(params),
    queryFn: () => getTrackingWeightStationLogAPI(params),
    enabled: enabled && !!params.station,
  })
}
