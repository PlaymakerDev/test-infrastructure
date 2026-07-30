import { useQuery } from '@tanstack/react-query'
import { getCctvOverviewCentralListAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'
import { APIRequestCCTVOverviewCentralList } from '@/types/cctv/overview-api'

/** Bureau-aware nested list (bureau → sub-departments → solutions). No paging. */
export const useCctvOverviewCentralList = (
  deptId: string | number | null | undefined,
  params?: APIRequestCCTVOverviewCentralList,
) =>
  useQuery({
    queryKey: cctvKeys.overview.centralList(deptId ?? '', params),
    queryFn: () => getCctvOverviewCentralListAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
