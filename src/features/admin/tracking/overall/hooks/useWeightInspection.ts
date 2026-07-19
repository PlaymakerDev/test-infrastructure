import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingWeightInspection } from '@/types/tracking/overall-api'
import { getTrackingWeightInspectionAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useWeightInspection(params: APIRequestTrackingWeightInspection, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.weightInspection(params),
    queryFn: () => getTrackingWeightInspectionAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
