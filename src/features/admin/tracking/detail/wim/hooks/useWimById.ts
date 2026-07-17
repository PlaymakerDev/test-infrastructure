import { useQuery } from '@tanstack/react-query'
import { getTrackingWIMByIDAPI } from '@/services/routes/TrackingDetailService'
import { trackingWimKeys } from '../data/queryKeys'

export function useWimById(id: string | number | undefined, enabled = true) {
  return useQuery({
    queryKey: trackingWimKeys.wimById(id),
    queryFn: () => getTrackingWIMByIDAPI(id as string | number),
    enabled: enabled && !!id,
  })
}
