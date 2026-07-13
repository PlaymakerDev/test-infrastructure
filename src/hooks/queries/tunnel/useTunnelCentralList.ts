import { useQuery } from '@tanstack/react-query'
import { getTunnelCentralListAPI } from '@/services/routes/TunnelService'
import type { APIRequestTunnelCentralList } from '@/types/tunnel/overview-api'
import { tunnelKeys } from './queryKeys'

// Shared param default so overall list + detail title use the same cache key
// (React Query keys include params — mismatched params ⇒ duplicate fetches).
export const TUNNEL_CENTRAL_LIST_DEFAULT_PARAMS: APIRequestTunnelCentralList = {
  page: 1,
  limit: 100,
}

export const useTunnelCentralList = (
  deptId: string | number | null | undefined,
  params: APIRequestTunnelCentralList = TUNNEL_CENTRAL_LIST_DEFAULT_PARAMS
) =>
  useQuery({
    queryKey: tunnelKeys.overview.centralList(deptId ?? '', params),
    queryFn: () =>
      getTunnelCentralListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
