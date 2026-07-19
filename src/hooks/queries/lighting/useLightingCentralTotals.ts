import { useQuery } from '@tanstack/react-query'
import { getLightingCentralTotalsAPI } from '@/services/routes/LightingService'
import { isValidLightingDeptId, lightingKeys } from './queryKeys'

/** solution {total, online, offline} + warranty {active, expired} totals for
 *  the overall page's summary badges. */
export const useLightingCentralTotals = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: lightingKeys.centralTotals(deptId ?? ''),
    queryFn: () => getLightingCentralTotalsAPI(Number(deptId)).then((r) => r.data),
    enabled: isValidLightingDeptId(deptId),
  })
