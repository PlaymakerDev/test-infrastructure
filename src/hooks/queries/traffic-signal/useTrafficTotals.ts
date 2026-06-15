import { useQuery } from '@tanstack/react-query'
import { getTrafficTotalsAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** Stats cards data — solution online/offline + warranty active/expired. */
export const useTrafficTotals = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.totals(deptId ?? ''),
    queryFn: () => getTrafficTotalsAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
