import { useQuery } from '@tanstack/react-query'
import { getTrafficVolumeTotalsAPI } from '@/services/routes/TrafficVolumeService'
import { trafficVolumeKeys } from './queryKeys'
import { APIRequestTrafficVolumeTotals } from '@/types/traffic-volume/overview-api'

/** Aggregated counters (camera + warranty) for the InfoCard stat cards. */
export const useTrafficVolumeTotals = (
  deptId: string | number | null | undefined,
  params?: APIRequestTrafficVolumeTotals
) =>
  useQuery({
    queryKey: trafficVolumeKeys.overview.totals(deptId ?? '', params),
    queryFn: () => getTrafficVolumeTotalsAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
