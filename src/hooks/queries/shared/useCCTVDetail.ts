import { useQuery } from '@tanstack/react-query'
import { getCCTVDetailAPI } from '@/services/routes/SharedService'

/** Camera detail (`/cctv/cameras/{id}`) — name/IP/online status. Shared
 *  across features (maintenance case screen's ข้อมูลอุปกรณ์ card). */
export const useCCTVDetail = (cameraId?: string | number) =>
  useQuery({
    queryKey: ['cctv-detail', String(cameraId ?? '')] as const,
    queryFn: () => getCCTVDetailAPI(cameraId!).then((r) => r.data),
    enabled: !!cameraId,
  })
