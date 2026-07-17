import { useQuery } from '@tanstack/react-query'
import { postBridgeLightingShellyStatusAPI } from '@/services/routes/BridgeLightingService'
import { bridgeLightingDetailKeys } from '../data/queryKeys'

export const useBridgeLightingShellyStatus = (
  id: string | string[] | undefined,
  deptId: string,
  scope: string,
  wid: number | undefined,
  isWidReady: boolean,
) =>
  useQuery({
    queryKey: bridgeLightingDetailKeys.shellyStatusDetail(String(id ?? ''), scope),
    queryFn: () => postBridgeLightingShellyStatusAPI({ wid: String(wid) }),
    enabled: !!deptId && !!id && isWidReady,
  })
