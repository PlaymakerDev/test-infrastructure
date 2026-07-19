import { useQuery } from '@tanstack/react-query'
import { getMaintenanceDetailAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** Bureau → department → road → project → location tree for one solution
 *  type (the repair-history Solution tab's drill-down). */
export const useMaintenanceDetail = (solutionTypeId?: number) =>
  useQuery({
    queryKey: maintenanceKeys.detail(solutionTypeId),
    queryFn: () => getMaintenanceDetailAPI(solutionTypeId!).then((r) => r.data),
    enabled: !!solutionTypeId,
  })
