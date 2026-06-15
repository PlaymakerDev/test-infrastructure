import { useQuery } from '@tanstack/react-query'
import { getTrafficSolutionCamerasAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** All cameras attached to the signal — feeds the Tab 1 camera grid. */
export const useTrafficSolutionCameras = (id: string | number | null | undefined) =>
  useQuery({
    queryKey: trafficSignalKeys.detail.cameras(id ?? ''),
    queryFn: () => getTrafficSolutionCamerasAPI(id!).then((r) => r.data),
    enabled: !!id,
  })
