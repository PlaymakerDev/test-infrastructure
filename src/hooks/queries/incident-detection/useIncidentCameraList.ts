import { useQuery } from '@tanstack/react-query'
import { getIncidentCameraListAPI } from '@/services/routes/AnalyticService'
import type { APIRequestIncidentCameraList } from '@/types/incident-detection/camera-api'
import { incidentKeys } from './queryKeys'

/** Paginated per-camera detail (status, events) for one solution — detail Tab1. */
export const useIncidentCameraList = (
  deptId: string | number | null | undefined,
  params: APIRequestIncidentCameraList = {}
) =>
  useQuery({
    queryKey: incidentKeys.cameras.list(deptId ?? '', params),
    queryFn: () => getIncidentCameraListAPI(deptId!, params).then((r) => r.data),
    enabled: !!deptId && !!params.solution_id,
  })
