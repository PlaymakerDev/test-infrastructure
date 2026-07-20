import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingSumWeightYearV2 } from '@/types/tracking/overall-api'
import { getTrackingSumWeightYearV2API } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useSumWeightYearV2(params: APIRequestTrackingSumWeightYearV2, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.sumWeightYearV2(params),
    queryFn: () => getTrackingSumWeightYearV2API(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
