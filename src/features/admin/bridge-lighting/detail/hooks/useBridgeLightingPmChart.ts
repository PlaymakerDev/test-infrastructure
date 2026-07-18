import { useQuery } from '@tanstack/react-query'
import { postBridgeLightingPmChartAPI } from '@/services/routes/BridgeLightingService'
import { bridgeLightingDetailKeys } from '../data/queryKeys'

export const useBridgeLightingPmChart = (
  id: string | string[] | undefined,
  deptId: string,
  scope: string,
  wid: number | undefined,
  isWidReady: boolean,
) =>
  useQuery({
    queryKey: bridgeLightingDetailKeys.pmChartDetail(String(id ?? ''), scope),
    queryFn: () => postBridgeLightingPmChartAPI({ wid: String(wid) }),
    enabled: !!deptId && !!id && isWidReady,
  })
