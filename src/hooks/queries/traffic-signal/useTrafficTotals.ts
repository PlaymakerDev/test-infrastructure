import { useQuery } from '@tanstack/react-query'
import { getTrafficTotalsAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'
import { APIRequestTrafficTotals } from '@/types/traffic-signal/overview-api'

/** Stats cards data — solution online/offline + warranty active/expired. */
export const useTrafficTotals = (
  deptId: string | number | null | undefined,
  params?: APIRequestTrafficTotals
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.totals(deptId ?? '', { ...params }),
    queryFn: () => getTrafficTotalsAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
