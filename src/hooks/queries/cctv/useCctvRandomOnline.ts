import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCctvRandomOnlineAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'

/** Random online cameras (fills with offline if not enough) — left-rail
 *  preview list on the overall page. */
export const useCctvRandomOnline = (
  deptId: string | number | null | undefined,
  limit = 3
) =>
  useQuery({
    queryKey: cctvKeys.cameras.randomOnline(deptId ?? '', limit),
    queryFn: () => getCctvRandomOnlineAPI(deptId!, limit).then((r) => r.data),
    enabled: !!deptId,
    placeholderData: keepPreviousData,
  })
