import { useQuery } from '@tanstack/react-query'
import { getCctvOverviewAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'
import { APIRequestCCTVOverview } from '@/types/cctv/overview-api'

/** Solution-level map markers + centroid for the CCTV overall page. */
export const useCctvOverview = (
  deptId: string | number | null | undefined,
  params?: APIRequestCCTVOverview
) =>
  useQuery({
    queryKey: cctvKeys.overview.map(deptId ?? '', params),
    queryFn: () => getCctvOverviewAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
