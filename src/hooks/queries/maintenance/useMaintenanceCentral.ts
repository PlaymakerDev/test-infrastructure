import { useQuery } from '@tanstack/react-query'
import { getMaintenanceCentralAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** สทช.→ขทช. tree with online/offline device+location counts for one
 *  solution type (1=CCTV, 6=Lighting, 7=VMS) — the จุดติดตั้งอุปกรณ์ tab's
 *  sidebar source (BE 2026-08-26). */
export const useMaintenanceCentral = (solutionTypeId: number) =>
  useQuery({
    queryKey: maintenanceKeys.central(solutionTypeId),
    queryFn: () => getMaintenanceCentralAPI(solutionTypeId).then((r) => r.data),
    // Auto-refresh — device online/offline states move on their own; 60s
    // matches the maintenance contractor-summary cadence (the app disables
    // refetch-on-focus globally, so without this the page never updates).
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
