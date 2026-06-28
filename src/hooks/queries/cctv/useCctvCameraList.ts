import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCctvCameraListAPI } from '@/services/routes/CCTVService'
import type { APIRequestCCTVCameraList } from '@/types/cctv/camera-api'
import { cctvKeys } from './queryKeys'

/** Paginated camera list for the search page table / grid. */
export const useCctvCameraList = (
  deptId: string | number | null | undefined,
  params: APIRequestCCTVCameraList = {}
) =>
  useQuery({
    queryKey: cctvKeys.cameras.list(deptId ?? '', params),
    queryFn: () => getCctvCameraListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })
