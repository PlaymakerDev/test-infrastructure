import { useQuery } from '@tanstack/react-query'
import { getTrafficPhaseDetailsAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** Per-phase timing — feeds the Phase Timing card + Traffic Cycle donut.
 *  Refetches every 5s so the active phase + countdown stay in sync. */
export const useTrafficPhaseDetails = (id: string | number | null | undefined) =>
  useQuery({
    queryKey: trafficSignalKeys.detail.phaseDetails(id ?? ''),
    queryFn: () => getTrafficPhaseDetailsAPI(id!).then((r) => r.data),
    enabled: !!id,
    // Phase state changes second-by-second on the backend — poll moderately.
    refetchInterval: 5_000,
  })
