import { useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingMobileMaster } from '@/types/tracking/overall-api'
import { getTrackingMobileMasterAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useMobileMaster(params: APIRequestTrackingMobileMaster, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.mobileMaster(params),
    queryFn: () => getTrackingMobileMasterAPI(params),
    enabled,
  })
}
