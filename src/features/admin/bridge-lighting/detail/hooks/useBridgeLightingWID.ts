import { useQuery } from '@tanstack/react-query'
import { getBridgeLightingWIDAPI } from '@/services/routes/BridgeLightingService'
import { bridgeLightingDetailKeys } from '../data/queryKeys'

export const useBridgeLightingWID = (
  id: string | string[] | undefined,
  deptId: string,
  scope: string,
) =>
  useQuery({
    queryKey: bridgeLightingDetailKeys.widDetail(String(id ?? ''), scope),
    queryFn: () => getBridgeLightingWIDAPI(String(id)),
    enabled: !!deptId && !!id,
  })
