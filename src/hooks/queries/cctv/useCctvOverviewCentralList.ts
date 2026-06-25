import { useQuery } from '@tanstack/react-query'
import { getCctvOverviewCentralListAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'

/** Bureau-aware nested list (bureau → sub-departments → solutions). No paging. */
export const useCctvOverviewCentralList = (
  deptId: string | number | null | undefined
) =>
  useQuery({
    queryKey: cctvKeys.overview.centralList(deptId ?? ''),
    queryFn: () => getCctvOverviewCentralListAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
