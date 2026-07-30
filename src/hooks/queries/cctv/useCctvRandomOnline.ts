import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCctvRandomOnlineAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'
import { APIRequestCCTVRandomOnline } from '@/types/cctv/camera-api'

/** Random online cameras (fills with offline if not enough) — left-rail
 *  preview list on the overall page. */
export const useCctvRandomOnline = (
  deptId: string | number | null | undefined,
  params?: APIRequestCCTVRandomOnline,
  // limit = 3,
  // roadId?: string | number | null | undefined
) =>
  useQuery({
    queryKey: cctvKeys.cameras.randomOnline(deptId ?? '', { ...params }),
    queryFn: () => getCctvRandomOnlineAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })
