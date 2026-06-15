import { useQuery } from '@tanstack/react-query'
import { getTrafficGraphAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** All 3 bottom-row charts on Tab 1:
 *   • 24h traffic volume per phase (`traffic_pcu`)
 *   • Real-time efficiency per phase (`efficiency.graph`)
 *   • ET / time saved / CO2 saved (`efficiency.saving`) */
export const useTrafficGraph = (id: string | number | null | undefined) =>
  useQuery({
    queryKey: trafficSignalKeys.detail.graph(id ?? ''),
    queryFn: () => getTrafficGraphAPI(id!).then((r) => r.data),
    enabled: !!id,
  })
