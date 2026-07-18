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
    // Poll every 5s so the "สถานะการทำงาน" card auto-flips right after the
    // ON/OFF command lands on the shelly device — user report was that they
    // had to F5 to see the new state. Also drives the pending overlay in
    // BridgeLightingStatus, which watches the payload for a state flip.
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  })
