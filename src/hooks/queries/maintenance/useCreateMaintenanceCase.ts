import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMaintenanceCaseAPI } from '@/services/routes/MaintenanceService'
import type { CreateCaseRequest } from '@/types/maintenance'
import { maintenanceKeys } from './queryKeys'

/** Opens a case for a device. Invalidates every read a new case shows up in
 *  (solution/cases/history plus overview case counters). */
export const useCreateMaintenanceCase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCaseRequest) => createMaintenanceCaseAPI(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'solution'] })
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'cases'] })
      queryClient.invalidateQueries({ queryKey: [...maintenanceKeys.all, 'history'] })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.warrantySummary() })
    },
  })
}
