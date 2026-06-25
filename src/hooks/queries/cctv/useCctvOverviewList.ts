import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCctvOverviewListAPI } from '@/services/routes/CCTVService'
import type { APIRequestCCTVOverviewList } from '@/types/cctv/overview-api'
import { cctvKeys } from './queryKeys'

/** Paginated solution-level list for the overall table / card grid.
 *  `keepPreviousData` keeps old rows visible during page/filter transitions. */
export const useCctvOverviewList = (
  deptId: string | number | null | undefined,
  params: APIRequestCCTVOverviewList = {}
) =>
  useQuery({
    queryKey: cctvKeys.overview.list(deptId ?? '', params),
    queryFn: () => getCctvOverviewListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })
