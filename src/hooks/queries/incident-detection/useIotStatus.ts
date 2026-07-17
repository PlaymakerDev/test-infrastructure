import { useQuery } from '@tanstack/react-query'
import { getIotStatusAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Bureau → sub_department → roads → devices IoT status tree.
 *  `start_date`/`end_date` bound each device's noti_count to a date window. */
export const useIotStatus = (
  deptId: string | number,
  params: { scope?: string; start_date?: string; end_date?: string } = {},
) =>
  useQuery({
    queryKey: incidentKeys.iotStatus(deptId, params),
    queryFn: () => getIotStatusAPI(deptId, params).then((r) => r.data),
    enabled: deptId !== undefined && deptId !== null && String(deptId) !== '',
  })
