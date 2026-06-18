import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getTrafficListAPI } from '@/services/routes/TrafficSignalService'
import type { APIRequestTrafficList } from '@/types/traffic-signal/overview-api'
import { trafficSignalKeys } from './queryKeys'

/** Paginated list of signals for the overview table. `keepPreviousData` makes
 *  page transitions feel instant — old rows stay visible until new data lands. */
export const useTrafficList = (
  deptId: string | number | null | undefined,
  params: APIRequestTrafficList
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.list(deptId ?? '', params),
    queryFn: () => getTrafficListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })
