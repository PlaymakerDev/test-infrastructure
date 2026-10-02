import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getLPROverviewAPI } from '@/services/routes/NewLPRService'
import type { APIRequestLPROverview } from '@/types/lpr/new-lpr-api'
import { lprKeys } from './queryKeys'

/** GET /lpr/departments/{id}/overview — install-point locations (+ camera
 *  online/offline counts) and the map centroid for one department. Drives the
 *  overall map. `placeholderData` keeps the previous markers on screen while a
 *  dept / scope switch refetches. */
export const useLPROverview = (
  deptId: string | number | undefined,
  params: APIRequestLPROverview = {},
) =>
  useQuery({
    queryKey: lprKeys.overview.list(String(deptId ?? ''), params),
    queryFn: () => getLPROverviewAPI(Number(deptId), params).then((r) => r.data),
    enabled: deptId != null && deptId !== '',
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
