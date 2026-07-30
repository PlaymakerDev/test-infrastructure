import { useQuery } from '@tanstack/react-query'
import { getLightingCentralTotalsAPI } from '@/services/routes/LightingService'
import { isValidLightingDeptId, lightingKeys } from './queryKeys'

/** solution {total, online, offline} + warranty {active, expired} totals for
 *  the overall page's summary badges. */
export const useLightingCentralTotals = (deptId: string | number | null | undefined, roadId?: number | null) =>
  useQuery({
    queryKey: lightingKeys.centralTotals(deptId ?? '', roadId),
    queryFn: () => getLightingCentralTotalsAPI(Number(deptId), roadId ? { road_id: roadId } : {}).then((r) => r.data),
    enabled: isValidLightingDeptId(deptId),
  })
