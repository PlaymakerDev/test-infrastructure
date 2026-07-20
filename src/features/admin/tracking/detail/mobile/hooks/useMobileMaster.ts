import { useQuery } from '@tanstack/react-query'
import type { APIRequestMobileMaster } from '@/types/tracking/detail-api'
import { getTrackingMobileMasterAPI } from '@/services/routes/TrackingDetailService'
import { trackingMobileKeys } from '../data/queryKeys'

export function useMobileMaster(params: APIRequestMobileMaster, enabled = true) {
  return useQuery({
    queryKey: trackingMobileKeys.master(params),
    queryFn: () => getTrackingMobileMasterAPI(params),
    enabled,
  })
}
