import { useQuery } from '@tanstack/react-query'
import { getTrafficSolutionDetailAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** Solution metadata — primarily for the AnyDesk button in the title bar.
 *  AnyDesk doesn't live in the traffic API, so this is a separate endpoint. */
export const useTrafficSolutionDetail = (id: string | number | null | undefined) =>
  useQuery({
    queryKey: trafficSignalKeys.detail.solutionDetail(id ?? ''),
    queryFn: () => getTrafficSolutionDetailAPI(id!).then((r) => r.data),
    enabled: !!id,
  })
