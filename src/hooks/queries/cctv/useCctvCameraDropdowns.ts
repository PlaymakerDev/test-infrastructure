import { useQuery } from '@tanstack/react-query'
import { getCctvCameraDropdownsAPI } from '@/services/routes/CCTVService'
import type { APIRequestCCTVCameraDropdowns } from '@/types/cctv/camera-api'
import { cctvKeys } from './queryKeys'

/** Filter dropdown values (road_code / status_name / warranty_name) for the
 *  camera search. */
export const useCctvCameraDropdowns = (
  deptId: string | number | null | undefined,
  params: APIRequestCCTVCameraDropdowns = {}
) =>
  useQuery({
    queryKey: cctvKeys.cameras.dropdowns(deptId ?? '', params),
    queryFn: () => getCctvCameraDropdownsAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
