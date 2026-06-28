import { useQuery } from '@tanstack/react-query'
import { getCctvCameraTotalsAPI } from '@/services/routes/CCTVService'
import type { APIRequestCCTVCameraTotals } from '@/types/cctv/camera-api'
import { cctvKeys } from './queryKeys'

/** Camera online/offline totals — scoped by `solution_id` / `road_code`. */
export const useCctvCameraTotals = (
  deptId: string | number | null | undefined,
  params: APIRequestCCTVCameraTotals = {}
) =>
  useQuery({
    queryKey: cctvKeys.cameras.totals(deptId ?? '', params),
    queryFn: () => getCctvCameraTotalsAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
