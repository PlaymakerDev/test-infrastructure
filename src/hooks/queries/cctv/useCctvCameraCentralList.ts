import { useQuery } from '@tanstack/react-query'
import { getCctvCameraCentralListAPI } from '@/services/routes/CCTVService'
import { cctvKeys } from './queryKeys'

/** Cameras for ONE road, grouped by project/solution_location/solution, with
 *  an aggregate metadata block. Powers the CCTV search page. */
export const useCctvCameraCentralList = (
  roadId: string | number | null | undefined
) =>
  useQuery({
    queryKey: cctvKeys.cameraCentralByRoad(roadId ?? ''),
    queryFn: () => getCctvCameraCentralListAPI(roadId!).then((r) => r.data),
    enabled: !!roadId,
  })
