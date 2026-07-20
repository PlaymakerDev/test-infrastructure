import { useQuery } from '@tanstack/react-query'
import { getIotStatusSummaryAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Aggregate iot-status counts powering the 4 stat cards on the alert overview.
 *  `start_date`/`end_date` bound the notification counts to a date window
 *  (also part of the backend's Redis cache key) — omit for the default
 *  today-00:00→now window. */
export const useIotStatusSummary = (
  deptId: string | number,
  params: { scope?: string; start_date?: string; end_date?: string } = {},
) =>
  useQuery({
    queryKey: incidentKeys.iotStatusSummary(deptId, params),
    queryFn: () => getIotStatusSummaryAPI(deptId, params).then((r) => r.data),
    enabled: deptId !== undefined && deptId !== null && String(deptId) !== '',
  })
