import { useQuery } from '@tanstack/react-query'
import { getTrackingMobileMasterDepartmentByTIDAPI } from '@/services/routes/TrackingDetailService'
import { trackingMobileKeys } from '../data/queryKeys'

export function useMobileMasterDepartmentByTID(id: string | number | undefined, enabled = true) {
  return useQuery({
    queryKey: trackingMobileKeys.departmentByTID(id),
    queryFn: () => getTrackingMobileMasterDepartmentByTIDAPI(id as string | number),
    enabled: enabled && !!id,
  })
}
