import { useQuery } from '@tanstack/react-query'
import { getTrackingCalibrationHistoryAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useCalibrationHistoryList(
  stationType: string | number | undefined,
  id: string | number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: trackingWimKeys.calibrationHistory(stationType, id),
    queryFn: () => getTrackingCalibrationHistoryAPI(stationType as string | number, id as string | number),
    enabled: enabled && !!stationType && !!id,
  })
}
