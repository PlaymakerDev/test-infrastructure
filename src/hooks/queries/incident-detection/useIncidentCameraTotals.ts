import { useQuery } from '@tanstack/react-query'
import { getIncidentCameraTotalsAPI } from '@/services/routes/AnalyticService'
import type { APIRequestIncidentCameraTotals } from '@/types/incident-detection/camera-api'
import { incidentKeys } from './queryKeys'

/** Camera online/offline counts (filterable by solution_id). */
export const useIncidentCameraTotals = (
  deptId: string | number | null | undefined,
  params: APIRequestIncidentCameraTotals = {}
) =>
  useQuery({
    queryKey: incidentKeys.cameras.totals(deptId ?? '', params),
    queryFn: () => getIncidentCameraTotalsAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId,
  })
