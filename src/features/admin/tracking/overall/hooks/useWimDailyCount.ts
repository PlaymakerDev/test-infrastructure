import { useQuery } from '@tanstack/react-query'
import type { APIRequestWIMDailyCount } from '@/types/tracking/detail-api'
import { getTrackingWIMDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useWimDailyCount(params: APIRequestWIMDailyCount, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.wimDailyCount(params),
    queryFn: () => getTrackingWIMDailyCountAPI(params),
    enabled,
  })
}
