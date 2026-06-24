import { useQuery } from '@tanstack/react-query'
import { getIncidentRandomOnlineAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'

/** Random online cameras — overview left-rail live preview. */
export const useIncidentRandomOnline = (
  deptId: string | number | null | undefined,
  limit = 3
) =>
  useQuery({
    queryKey: incidentKeys.cameras.randomOnline(deptId ?? '', limit),
    queryFn: () => getIncidentRandomOnlineAPI(deptId!, limit).then((r) => r.data),
    enabled: !!deptId,
  })
