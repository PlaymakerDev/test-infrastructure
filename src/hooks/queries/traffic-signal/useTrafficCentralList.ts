import { useQuery } from '@tanstack/react-query'
import { getTrafficCentralListAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** Bureau-aware solution list — nested `bureau → sub_department → solutions`
 *  with per-row `project_name` and camera online/offline counts. Preferred
 *  over `useTrafficList` for the overall page table. */
export const useTrafficCentralList = (
  deptId: string | number | null | undefined
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.centralList(deptId ?? ''),
    queryFn: () => getTrafficCentralListAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
