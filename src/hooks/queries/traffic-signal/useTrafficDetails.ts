import { useQuery } from '@tanstack/react-query'
import { getTrafficDetailsAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** Main detail data — feeds the 4 InfoCards (mode / efficiency / PCU / peak).
 *  Backend returns an array; we expose the array as-is so callers can read [0]. */
export const useTrafficDetails = (id: string | number | null | undefined) =>
  useQuery({
    queryKey: trafficSignalKeys.detail.main(id ?? ''),
    queryFn: () => getTrafficDetailsAPI(id!).then((r) => r.data),
    enabled: !!id,
  })
