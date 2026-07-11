import { useQuery } from '@tanstack/react-query'
import { getTrackingWeightStationLogByIDAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useWeightStationLogByID(id: string | number | undefined, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.weightStationLogById(id),
    queryFn: () => getTrackingWeightStationLogByIDAPI(id as string | number),
    enabled: enabled && !!id,
  })
}
