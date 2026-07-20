import { useQuery } from '@tanstack/react-query'
import { getMaintenanceCaseAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** One case's full detail by case number (the case screen). */
export const useMaintenanceCase = (caseNo?: string) =>
  useQuery({
    queryKey: maintenanceKeys.case(caseNo),
    queryFn: () => getMaintenanceCaseAPI(caseNo!).then((r) => r.data),
    enabled: !!caseNo,
  })
