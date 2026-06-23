import { useQuery } from '@tanstack/react-query'
import { getCctvOverviewDropdownsAPI } from '@/services/routes/CCTVService'
import type { APIRequestCCTVOverviewDropdowns } from '@/types/cctv/overview-api'
import { cctvKeys } from './queryKeys'

/** Filter dropdown values (road_code / contract_no) for the overall search. */
export const useCctvOverviewDropdowns = (
  deptId: string | number | null | undefined,
  params: APIRequestCCTVOverviewDropdowns = {}
) =>
  useQuery({
    queryKey: cctvKeys.overview.dropdowns(deptId ?? '', params),
    queryFn: () => getCctvOverviewDropdownsAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
