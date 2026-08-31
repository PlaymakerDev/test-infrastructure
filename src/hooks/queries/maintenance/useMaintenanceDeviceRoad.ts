import { useQuery } from '@tanstack/react-query'
import { getMaintenanceDeviceRoadAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** Devices grouped by road for one department + solution type (1=CCTV,
 *  6=Lighting, 7=VMS) — the จุดติดตั้งอุปกรณ์ tab's table source
 *  (BE 2026-08-27). Disabled until a department is selected. */
export const useMaintenanceDeviceRoad = (
  departmentId: number | null,
  solutionTypeId: number,
) =>
  useQuery({
    queryKey: maintenanceKeys.deviceRoad(departmentId ?? -1, solutionTypeId),
    queryFn: () => getMaintenanceDeviceRoadAPI(departmentId!, solutionTypeId).then((r) => r.data),
    enabled: departmentId != null,
    // Auto-refresh — device online/offline states move on their own; 60s
    // matches the maintenance contractor-summary cadence (the app disables
    // refetch-on-focus globally, so without this the page never updates).
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
