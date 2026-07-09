import { useQuery } from '@tanstack/react-query'
import { getTrackingPositionByIDAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function usePositionById(
  id: string | number | undefined,
  stationTypeId: number | null | undefined
) {
  const params = { station_id: id as string, StationType: String(stationTypeId) }

  return useQuery({
    queryKey: trackingWimKeys.positionById(params),
    queryFn: () => getTrackingPositionByIDAPI(params),
    enabled: !!id && stationTypeId != null,
  })
}
