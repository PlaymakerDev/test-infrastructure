import { useQuery } from '@tanstack/react-query'
import { getTrackingTrafficAvgSpeedAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

/** Shared by OverallAvgSpeed and ChartTraffic — both read the same endpoint,
 *  so this hook's factory key lets TanStack Query dedupe the request instead
 *  of each component hand-writing its own ['tracking_avg_speed', id] key.
 *  The endpoint is WIM-only (`/masters/wim/traffic_avg_speed/:id`) — callers
 *  must pass `enabled: stationType === 'WIM'`. */
export function useTrafficAvgSpeed(id: string | number | undefined, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.trafficAvgSpeed(id),
    queryFn: () => getTrackingTrafficAvgSpeedAPI(id as string | number),
    enabled: enabled && !!id,
  })
}
