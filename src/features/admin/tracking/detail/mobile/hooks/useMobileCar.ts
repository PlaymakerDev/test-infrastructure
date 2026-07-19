import { useQuery } from '@tanstack/react-query'
import type { APIRequestMobileCar } from '@/types/tracking/detail-api'
import { getTrackingMobileCarAPI } from '@/services/routes/TrackingDetailService'
import { trackingMobileKeys } from '../data/queryKeys'

export function useMobileCar(params: APIRequestMobileCar, enabled = true) {
  return useQuery({
    queryKey: trackingMobileKeys.car(params),
    queryFn: () => getTrackingMobileCarAPI(params),
    enabled: enabled && !!params.tid,
  })
}
