import { useQuery } from '@tanstack/react-query'
import { getIotStatusSummaryAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Aggregate iot-status counts powering the 4 stat cards on the alert overview. */
export const useIotStatusSummary = (
  deptId: string | number,
  params: { scope?: string } = {},
) =>
  useQuery({
    queryKey: incidentKeys.iotStatusSummary(deptId, params),
    queryFn: () => getIotStatusSummaryAPI(deptId, params).then((r) => r.data),
    enabled: deptId !== undefined && deptId !== null && String(deptId) !== '',
  })
