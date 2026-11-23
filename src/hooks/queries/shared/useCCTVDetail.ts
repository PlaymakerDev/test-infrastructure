import { useQuery } from '@tanstack/react-query'
import { getCCTVDetailAPI } from '@/services/routes/SharedService'

/** Cache key of `useCCTVDetail` — exported so writers (e.g. the camera edit
 *  mutation) can invalidate the exact entry. */
export const cctvDetailKey = (cameraId?: string | number) =>
  ['cctv-detail', String(cameraId ?? '')] as const

/** Camera detail (`/cctv/cameras/{id}`) — name/IP/online status/Public URL.
 *  Shared across features (maintenance case screen's ข้อมูลอุปกรณ์ card, the
 *  settings page's add/edit CCTV form). */
export const useCCTVDetail = (cameraId?: string | number) =>
  useQuery({
    queryKey: cctvDetailKey(cameraId),
    queryFn: () => getCCTVDetailAPI(cameraId!).then((r) => r.data),
    enabled: !!cameraId,
  })
