import { useQuery } from '@tanstack/react-query'
import { getMaintenanceWarrantySummaryAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** Two records — in-warranty (true) and out-of-warranty (false) — with
 *  project/device/case counts (งานในค้ำ / งานหมดค้ำ cards). */
export const useMaintenanceWarrantySummary = () =>
  useQuery({
    queryKey: maintenanceKeys.warrantySummary(),
    queryFn: () => getMaintenanceWarrantySummaryAPI().then((r) => r.data),
  })
