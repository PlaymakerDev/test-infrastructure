import { useQuery } from '@tanstack/react-query'
import type { APIRequestMobileDailyCount } from '@/types/tracking/detail-api'
import { getTrackingMobileDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useMobileDailyCount(params: APIRequestMobileDailyCount, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.mobileDailyCount(params),
    queryFn: () => getTrackingMobileDailyCountAPI(params),
    enabled,
  })
}
