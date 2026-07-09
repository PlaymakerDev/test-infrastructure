import { useQuery } from '@tanstack/react-query'
import type { APIRequestPCU } from '@/types/tracking/detail-api'
import { getTrackingPCUAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function usePCU(params: APIRequestPCU, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.pcu(params),
    queryFn: () => getTrackingPCUAPI(params),
    enabled: enabled && !!params.station_id,
  })
}
