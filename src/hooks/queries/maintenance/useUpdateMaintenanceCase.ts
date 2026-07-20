import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateMaintenanceCaseAPI } from '@/services/routes/MaintenanceService'
import type { UpdateCaseRequest } from '@/types/maintenance'
import { maintenanceKeys } from './queryKeys'

/** Saves a case's repair record. Invalidates the case itself (so the form
 *  reseeds from fresh data), solution rows, history tables and overview case
 *  counters whose open/in-progress/closed totals may have changed. */
export const useUpdateMaintenanceCase = (caseNo: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateCaseRequest) => updateMaintenanceCaseAPI(caseNo, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.case(caseNo) })
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'solution'] })
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'cases'] })
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'history'] })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.warrantySummary() })
    },
  })
}
