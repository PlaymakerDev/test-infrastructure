import { useQuery } from '@tanstack/react-query'
import { getCrosswalkCentralListAPI } from '@/services/routes/CrosswalkService'
import type { APIRequestCrosswalkCentralList } from '@/types/crosswalk/overview-api'
import { crosswalkKeys } from './queryKeys'

/** Bureau-aware solution list — nested `bureau → sub_department → solutions`
 *  with per-row warranty status, camera online/offline counts, and
 *  crosswalk-device health. */
export const useCrosswalkCentralList = (
  deptId: string | number | null | undefined,
  params: APIRequestCrosswalkCentralList = {}
) =>
  useQuery({
    queryKey: crosswalkKeys.overview.centralList(deptId ?? '', params),
    queryFn: () =>
      getCrosswalkCentralListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
