import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { APIRequestMobileDailyCount } from '@/types/tracking/detail-api'
import { getTrackingMobileDailyCountAPI } from '@/services/routes/TrackingDetailService'
import { trackingMobileKeys } from '../data/queryKeys'

/** Daily status count for a mobile station — defaults to today when no
 *  `dateRange` is given (OverallSection), or an explicit range (VehicleSection's
 *  FormSearchVehicle) so both tabs can share the same cache entry when their
 *  effective params match instead of firing separate requests. */
export function useMobileDailyCount(
  id: string | number | undefined,
  dateRange?: { start_date?: string; end_date?: string },
  enabled = true,
) {
  const params: APIRequestMobileDailyCount = {
    start_date: dateRange?.start_date ?? dayjs().format('YYYY-MM-DD'),
    end_date: dateRange?.end_date ?? dayjs().format('YYYY-MM-DD'),
    tid: String(id),
  }

  return useQuery({
    queryKey: trackingMobileKeys.dailyCount(params),
    queryFn: () => getTrackingMobileDailyCountAPI(params),
    enabled: enabled && !!id,
  })
}
