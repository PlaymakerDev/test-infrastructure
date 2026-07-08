import { useQuery } from '@tanstack/react-query'
import { getCrosswalkCentralListAPI } from '@/services/routes/CrosswalkService'
import type { APIRequestCrosswalkCentralList } from '@/types/crosswalk/overview-api'
import { crosswalkKeys } from './queryKeys'

// Shared param default so overall list + detail title use the same cache key
// (React Query keys include params — mismatched params ⇒ duplicate fetches).
export const CROSSWALK_CENTRAL_LIST_DEFAULT_PARAMS: APIRequestCrosswalkCentralList = {
  page: 1,
  limit: 100,
}

export const useCrosswalkCentralList = (
  deptId: string | number | null | undefined,
  params: APIRequestCrosswalkCentralList = CROSSWALK_CENTRAL_LIST_DEFAULT_PARAMS
) =>
  useQuery({
    queryKey: crosswalkKeys.overview.centralList(deptId ?? '', params),
    queryFn: () =>
      getCrosswalkCentralListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
