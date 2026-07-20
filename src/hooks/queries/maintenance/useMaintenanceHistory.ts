import { useQuery } from '@tanstack/react-query'
import { getMaintenanceHistoryAPI } from '@/services/routes/MaintenanceService'
import type { MaintenanceHistoryParams } from '@/types/maintenance'
import { maintenanceKeys } from './queryKeys'

/** Case history grouped by region. `enabled` lets tab-scoped consumers
 *  (the All-Repairs tab) defer the fetch until the tab is active. */
export const useMaintenanceHistory = (params?: MaintenanceHistoryParams, enabled = true) =>
  useQuery({
    queryKey: maintenanceKeys.history(params),
    queryFn: () => getMaintenanceHistoryAPI(params).then((r) => r.data),
    enabled,
  })
