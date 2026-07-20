import { useQuery } from '@tanstack/react-query'
import { getCCTVRoadAPI } from '@/services/routes/SharedService'

/** Camera → road lookup (`/cctv/{id}` — distinct from `/cctv/cameras/{id}`,
 *  this one carries road_code). */
export const useCCTVRoad = (cameraId?: string | number) =>
  useQuery({
    queryKey: ['cctv-road', String(cameraId ?? '')] as const,
    queryFn: () => getCCTVRoadAPI(cameraId!).then((r) => r.data),
    enabled: !!cameraId,
  })
