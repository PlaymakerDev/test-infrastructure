import { useQuery } from '@tanstack/react-query'
import { getVMSCrossingStatusHistoryAPI } from '@/services/routes/ControlVMSService'
import { controlVmsKeys } from '../data/queryKeys'

export function useVMSCrossingHistory(
  crossingMasterIndex?: string,
  opts?: { enabled?: boolean; refetchIntervalMs?: number; limit?: number }
) {
  const enabled = (opts?.enabled ?? true) && !!crossingMasterIndex
  return useQuery({
    queryKey: controlVmsKeys.historyByCrossing(crossingMasterIndex),
    queryFn: () =>
      getVMSCrossingStatusHistoryAPI(crossingMasterIndex as string, {
        limit: opts?.limit ?? 200,
      }),
    enabled,
    refetchInterval: opts?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: false,
    staleTime: 2_000,
  })
}
