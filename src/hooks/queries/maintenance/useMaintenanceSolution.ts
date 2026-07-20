import { useQuery } from '@tanstack/react-query'
import { getMaintenanceSolutionAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** Solution detail (name, warranty, online/offline counts, device list) —
 *  shared by the device-detail and repair-history screens. */
export const useMaintenanceSolution = (solutionId?: number) =>
  useQuery({
    queryKey: maintenanceKeys.solution(solutionId),
    queryFn: () => getMaintenanceSolutionAPI(solutionId!).then((r) => r.data),
    enabled: !!solutionId,
  })
