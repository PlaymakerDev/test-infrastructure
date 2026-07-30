import { useQuery } from '@tanstack/react-query'
import { getIncidentRandomOnlineAPI } from '@/services/routes/AnalyticService'
import { incidentKeys } from './queryKeys'
import { APIRequestIncidentRandomOnline } from '@/types/incident-detection/camera-api'

/** Random online cameras — overview left-rail live preview. */
export const useIncidentRandomOnline = (
  deptId: string | number | null | undefined,
  params?: APIRequestIncidentRandomOnline
) =>
  useQuery({
    queryKey: incidentKeys.cameras.randomOnline(deptId ?? '', { ...params }),
    queryFn: () => getIncidentRandomOnlineAPI(deptId!, { ...params }).then((r) => r.data),
    enabled: !!deptId,
  })
