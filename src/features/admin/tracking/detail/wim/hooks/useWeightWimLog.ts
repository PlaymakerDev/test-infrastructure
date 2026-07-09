import { useQuery } from '@tanstack/react-query'
import type { APIRequestWeightWIMLog } from '@/types/tracking/detail-api'
import { getTrackingWeightWIMLogAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useWeightWimLog(params: APIRequestWeightWIMLog, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.weightWimLog(params),
    queryFn: () => getTrackingWeightWIMLogAPI(params),
    enabled: enabled && !!params.station,
  })
}
