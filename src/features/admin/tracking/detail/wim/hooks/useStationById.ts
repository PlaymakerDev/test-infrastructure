import { useQuery } from '@tanstack/react-query'
import { getTrackingStationByIDAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useStationById(id: string | number | undefined, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.stationById(id),
    queryFn: () => getTrackingStationByIDAPI(id as string | number),
    enabled: enabled && !!id,
  })
}
