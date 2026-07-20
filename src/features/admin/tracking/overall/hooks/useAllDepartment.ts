import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingAllDepartment } from '@/types/tracking/overall-api'
import { getTrackingAllDepartmentAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

export function useAllDepartment(params: APIRequestTrackingAllDepartment, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.allDepartment(params),
    queryFn: () => getTrackingAllDepartmentAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
