import { useQuery } from '@tanstack/react-query'
import { getTrackingWeightWIMLogByIDAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useWeightWimLogByID(
  id: string | number | undefined,
  stationTypeId: number | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: trackingWimKeys.weightWimLogById(id, stationTypeId),
    queryFn: () => getTrackingWeightWIMLogByIDAPI(id as string | number, { station_type: String(stationTypeId) }),
    enabled: enabled && !!id,
  })
}
