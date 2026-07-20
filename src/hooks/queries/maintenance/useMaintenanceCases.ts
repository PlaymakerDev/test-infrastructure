import { useQuery } from '@tanstack/react-query'
import { getMaintenanceCasesAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** Case history rows for one solution (repair-history table). */
export const useMaintenanceCases = (solutionId?: number) =>
  useQuery({
    queryKey: maintenanceKeys.cases(solutionId),
    queryFn: () => getMaintenanceCasesAPI(solutionId!).then((r) => r.data),
    enabled: !!solutionId,
  })
