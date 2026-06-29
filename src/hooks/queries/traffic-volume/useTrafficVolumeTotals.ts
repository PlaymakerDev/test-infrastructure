import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeTotalsAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from './queryKeys'

/** Aggregated counters (camera + warranty) for the InfoCard stat cards. */
export const useTrafficVolumeTotals = (
  deptId: string | number | null | undefined
) =>
  useQuery({
    queryKey: trafficVolumeKeys.overview.totals(deptId ?? ''),
    queryFn: () => getTrafficVolumeTotalsAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
