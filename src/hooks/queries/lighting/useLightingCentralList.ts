import { useQuery } from '@tanstack/react-query'
import { getLightingCentralListAPI } from '@/services/routes/LightingService'
import { isValidLightingDeptId, lightingKeys } from './queryKeys'

/** Bureau → sub-department → solutions[] tree for the overall page.
 *
 * `scope` is normally inferred from the current URL. Detail pages reached
 * from a nationwide alert can explicitly request descendants so an IMEI from
 * the selected bureau is not lost when it belongs to a sub-department.
 */
export const useLightingCentralList = (
  deptId: string | number | null | undefined,
  roadId?: number | null,
  scope?: 'all',
) =>
  useQuery({
    queryKey: [...lightingKeys.centralList(deptId ?? '', roadId), scope ?? null],
    queryFn: () => getLightingCentralListAPI(Number(deptId), {
      ...(roadId ? { road_id: roadId } : {}),
      ...(scope ? { scope } : {}),
    }).then((r) => r.data),
    enabled: isValidLightingDeptId(deptId),
  })
