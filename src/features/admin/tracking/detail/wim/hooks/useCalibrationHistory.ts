import { useQuery } from '@tanstack/react-query'
import { getTrackingCalibrationHistoryStatusAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useCalibrationHistory(
  stationTypeId: number | null | undefined,
  id: string | number | undefined
) {
  return useQuery({
    queryKey: trackingWimKeys.calibration(stationTypeId, id),
    queryFn: () => getTrackingCalibrationHistoryStatusAPI(stationTypeId as number, id as string | number),
    enabled: !!id && stationTypeId != null,
  })
}
