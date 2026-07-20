import { useQuery } from '@tanstack/react-query'
import { getBridgeLightingOverviewAPI } from '@/services/routes/BridgeLightingService'
import { bridgeLightingDetailKeys } from '../data/queryKeys'

export const useBridgeLightingDetailMap = (
  id: string | string[] | undefined,
  deptId: string,
  scope: string,
) =>
  useQuery({
    queryKey: bridgeLightingDetailKeys.mapDetail(String(id ?? ''), deptId, scope),
    queryFn: () => getBridgeLightingOverviewAPI(Number(deptId), { solution_id: Number(id) }),
    enabled: !!deptId && !!id,
  })
