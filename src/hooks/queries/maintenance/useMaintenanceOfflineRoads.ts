import { useQuery } from '@tanstack/react-query'
import { getMaintenanceOfflineRoadsAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** Roads with at least one offline device (สายทางดับทุกจุดติดตั้ง).
 *  `offlineSince` (YYYY-MM-DD) filters server-side to devices that went
 *  offline on or after that date. */
export const useMaintenanceOfflineRoads = (offlineSince?: string) =>
  useQuery({
    queryKey: maintenanceKeys.offlineRoads(offlineSince),
    queryFn: () => getMaintenanceOfflineRoadsAPI(offlineSince).then((r) => r.data),
  })
