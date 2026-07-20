import { useQuery } from '@tanstack/react-query'
import { getLightingCentralListAPI } from '@/services/routes/LightingService'
import { isValidLightingDeptId, lightingKeys } from './queryKeys'

/** Bureau → sub-department → solutions[] tree for the overall page. */
export const useLightingCentralList = (deptId: string | number | null | undefined) =>
  useQuery({
    queryKey: lightingKeys.centralList(deptId ?? ''),
    queryFn: () => getLightingCentralListAPI(Number(deptId)).then((r) => r.data),
    enabled: isValidLightingDeptId(deptId),
  })
