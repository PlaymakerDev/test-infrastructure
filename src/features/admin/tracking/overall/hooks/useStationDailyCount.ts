import { useQuery } from '@tanstack/react-query'
import type { APIRequestStationDailyCount } from '@/types/tracking/detail-api'
import { getTrackingStationDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingOverallKeys } from '../data/queryKeys'
import { useTrackingDeptScope } from './useTrackingDeptScope'

export function useStationDailyCount(params: APIRequestStationDailyCount, enabled = true) {
  // Scope every request to `?dept_id=` when the URL carries one.
  const scoped = useTrackingDeptScope(params)
  return useQuery({
    queryKey: trackingOverallKeys.stationDailyCount(scoped),
    queryFn: () => getTrackingStationDailyCountAPI(scoped),
    enabled,
  })
}
