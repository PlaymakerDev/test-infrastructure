import { useQuery } from '@tanstack/react-query'
import { getLightingRandomOnlineAPI } from '@/services/routes/LightingService'
import { isValidLightingDeptId, lightingKeys } from './queryKeys'

/** One random online device's detail — feeds the overall page's left panel
 *  (phase metrics, connection cards, diagram). */
export const useLightingRandomOnline = (deptId: string | number | null | undefined, roadId?: number | null) =>
  useQuery({
    queryKey: lightingKeys.randomOnline(deptId ?? '', roadId),
    queryFn: () => getLightingRandomOnlineAPI(Number(deptId), roadId ? { road_id: roadId } : {}).then((r) => r.data),
    enabled: isValidLightingDeptId(deptId),
  })
