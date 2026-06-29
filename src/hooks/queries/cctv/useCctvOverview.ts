import { useQuery } from '@tanstack/react-query'
import { getCctvOverviewAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'

/** Solution-level map markers + centroid for the CCTV overall page. */
export const useCctvOverview = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: cctvKeys.overview.map(deptId ?? ''),
    queryFn: () => getCctvOverviewAPI(deptId!).then((r) => r.data),
    enabled: !!deptId,
  })
