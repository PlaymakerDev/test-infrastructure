import { useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingSumWim } from '@/types/tracking/overall-api'
import { getTrackingSumWIMAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useSumWim(params: APIRequestTrackingSumWim, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.sumWim(params),
    queryFn: () => getTrackingSumWIMAPI(params),
    enabled,
  })
}
