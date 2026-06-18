import { useQuery } from '@tanstack/react-query'
import { getTrafficCameraCentralListAPI } from '@/services/routes/TrafficSignalService'
import { trafficSignalKeys } from './queryKeys'

/** Bureau-aware camera list — nested `bureau → sub_department → solutions[]`
 *  with per-solution cameras + online/offline counts. Source for the detail
 *  page title bar (anydesk button will appear once BE adds that field). */
export const useTrafficCameraCentralList = (
  deptId: string | number | null | undefined
) =>
  useQuery({
    queryKey: trafficSignalKeys.overview.cameraCentralList(deptId ?? ''),
    queryFn: () => getTrafficCameraCentralListAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
