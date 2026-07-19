import { useQuery } from '@tanstack/react-query'
import { getMaintenanceSummaryAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** location_count/device_count per solution type (CCTV, Counting, …). */
export const useMaintenanceSummary = (solutionTypeId?: number) =>
  useQuery({
    queryKey: maintenanceKeys.summary(solutionTypeId),
    queryFn: () => getMaintenanceSummaryAPI(solutionTypeId).then((r) => r.data),
  })
