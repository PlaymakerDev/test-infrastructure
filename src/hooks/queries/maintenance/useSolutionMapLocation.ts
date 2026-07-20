import { useQuery } from '@tanstack/react-query'
import { getSolutionMapLocationAPI } from '@/services/routes/MaintenanceService'
import { maintenanceKeys } from './queryKeys'

/** Coordinates for one solution via its feature's own overview endpoint
 *  (`/{prefix}/departments/{id}/overview?solution_id=`) — the maintenance
 *  solution endpoint itself carries no coordinates. Disabled until all
 *  three identifiers are known (prefix/departmentId come from URL context
 *  created by the repair-history tree). */
export const useSolutionMapLocation = (
  prefix?: string,
  departmentId?: number,
  solutionId?: number,
) =>
  useQuery({
    queryKey: maintenanceKeys.mapLocation(prefix, departmentId, solutionId),
    queryFn: () => getSolutionMapLocationAPI(prefix!, departmentId!, solutionId!).then((r) => r.data),
    enabled:
      !!prefix &&
      departmentId !== undefined &&
      Number.isFinite(departmentId) &&
      !!solutionId,
  })
