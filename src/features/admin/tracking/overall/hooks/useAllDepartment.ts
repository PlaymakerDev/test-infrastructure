import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { APIRequestTrackingAllDepartment } from '@/types/tracking/overall-api'
import { getTrackingAllDepartmentAPI } from '@/services/routes/TrackingService'
import { trackingOverallKeys } from '../data/queryKeys'

/** Deliberately NOT wrapped in `useTrackingDeptScope` — this is the department
 *  master list that feeds the หน่วยงาน dropdown, so scoping it to `?dept_id=`
 *  would leave the picker with a single option. Every other hook here is scoped. */
export function useAllDepartment(params: APIRequestTrackingAllDepartment, enabled = true) {
  return useQuery({
    queryKey: trackingOverallKeys.allDepartment(params),
    queryFn: () => getTrackingAllDepartmentAPI(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
