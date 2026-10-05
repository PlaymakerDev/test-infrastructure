import { useQuery } from '@tanstack/react-query'
import { getLPROverviewAPI } from '@/services/routes/NewLPRService'
import { lprKeys } from './queryKeys'

/** GET /lpr/departments/{id}/overview narrowed to ONE install point
 *  (`road_id` + `solution_id`, `scope=all`) — road code, install-point name,
 *  online flag and map centroid for the detail header.
 *
 *  Separate from `useLPROverview` on purpose: that one drives the overall map
 *  (dept-wide, keepPreviousData). Here `solution_id` is part of the key, so two
 *  points on the same road never share a cache entry. All three ids are
 *  required — an empty one would otherwise be sent as `0`. */
export const useLPRPointOverview = (
  deptId: string | number,
  roadId: string | number,
  solutionId: string | number,
) => {
  const enabled = !!deptId && !!roadId && !!solutionId
  return useQuery({
    queryKey: lprKeys.overview.list(String(deptId), {
      scope: 'all',
      road_id: Number(roadId),
      solution_id: Number(solutionId),
    }),
    queryFn: () =>
      getLPROverviewAPI(Number(deptId), {
        scope: 'all',
        road_id: Number(roadId),
        solution_id: Number(solutionId),
      }).then((r) => r.data),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
