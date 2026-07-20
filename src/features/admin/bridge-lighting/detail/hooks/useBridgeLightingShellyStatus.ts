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
    // Idle cadence — real-time confirmation of a just-issued ON/OFF command
    // is layered on top by BridgeLightingStatus, which calls invalidateQueries
    // every 2 s while `pendingTarget != null`.
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  })
