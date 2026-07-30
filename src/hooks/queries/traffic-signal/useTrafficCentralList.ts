import { useQuery } from '@tanstack/react-query'
import { getTrafficCentralListAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'
import { APIRequestTrafficCentralList } from '@/types/traffic-signal/overview-api'

/** Bureau-aware solution list — nested `bureau → sub_department → solutions`
 *  with per-row `project_name` and camera online/offline counts. Preferred
 *  over `useTrafficList` for the overall page table. */
export const useTrafficCentralList = (
  deptId: string | number | null | undefined,
  params?: APIRequestTrafficCentralList
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.centralList(deptId ?? '', { ...params }),
    queryFn: () => getTrafficCentralListAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
